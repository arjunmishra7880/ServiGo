const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('./prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authenticate socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { providerProfile: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (${socket.user.role})`);

    // Join user to their personal room for notifications
    socket.join(`user:${socket.user.id}`);

    // Join provider to their provider room
    if (socket.user.role === 'provider' && socket.user.providerProfile) {
      socket.join(`provider:${socket.user.providerProfile.id}`);
    }

    // Join conversation room
    socket.on('join:conversation', async (conversationId) => {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { customer: true, provider: true }
        });

        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Check if user is part of this conversation
        const isCustomer = conversation.customerId === socket.user.id;
        const isProvider = conversation.providerId === socket.user.providerProfile?.id;

        if (!isCustomer && !isProvider) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        socket.join(`conversation:${conversationId}`);
        socket.emit('joined:conversation', { conversationId });
      } catch (err) {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Leave conversation room
    socket.on('leave:conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send message
    socket.on('send:message', async (data) => {
      try {
        const { conversationId, content } = data;

        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { customer: true, provider: true }
        });

        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        const isCustomer = conversation.customerId === socket.user.id;
        const isProvider = conversation.providerId === socket.user.providerProfile?.id;

        if (!isCustomer && !isProvider) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: socket.user.id,
            content
          },
          include: {
            sender: {
              select: { id: true, name: true, role: true }
            }
          }
        });

        // Update conversation last message
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessage: content,
            lastMessageAt: new Date()
          }
        });

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('new:message', {
          message: {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            senderName: message.sender.name,
            senderRole: message.sender.role,
            content: message.content,
            read: message.read,
            createdAt: message.createdAt
          }
        });

        // Notify the other user if they're not in the conversation room
        const otherUserId = isCustomer ? conversation.provider.userId : conversation.customerId;
        io.to(`user:${otherUserId}`).emit('conversation:updated', {
          conversationId,
          lastMessage: content,
          lastMessageAt: new Date()
        });

      } catch (err) {
        console.error('Send message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark:read', async (conversationId) => {
      try {
        await prisma.message.updateMany({
          where: {
            conversationId,
            senderId: { not: socket.user.id },
            read: false
          },
          data: { read: true }
        });

        io.to(`conversation:${conversationId}`).emit('messages:read', {
          conversationId,
          readBy: socket.user.id
        });
      } catch (err) {
        console.error('Mark read error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  return io;
}

module.exports = { setupSocket };