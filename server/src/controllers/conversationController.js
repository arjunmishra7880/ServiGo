const prisma = require('../prisma');

async function getConversations(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let conversations;

    if (userRole === 'provider') {
      const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId }
      });

      if (!providerProfile) {
        return res.status(404).json({ error: 'Provider profile not found' });
      }

      conversations = await prisma.conversation.findMany({
        where: { providerId: providerProfile.id },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true }
          },
          provider: {
            select: { id: true, businessName: true, user: { select: { id: true, name: true } } }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, content: true, senderId: true, read: true, createdAt: true }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });
    } else {
      conversations = await prisma.conversation.findMany({
        where: { customerId: userId },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true }
          },
          provider: {
            select: { id: true, businessName: true, user: { select: { id: true, name: true } } }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, content: true, senderId: true, read: true, createdAt: true }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });
    }

    const formatted = conversations.map(c => ({
      id: c.id,
      customer: c.customer,
      provider: c.provider,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unreadCount: c.messages.filter(m => !m.read && m.senderId !== userId).length,
      latestMessage: c.messages[0] || null
    }));

    res.json({ conversations: formatted });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

async function getOrCreateConversation(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { providerId } = req.body;

    if (!providerId) {
      return res.status(400).json({ error: 'Provider ID required' });
    }

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { id: parseInt(providerId) },
      include: { user: true }
    });

    if (!providerProfile) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    if (userRole === 'provider' && providerProfile.userId === userId) {
      return res.status(400).json({ error: 'Cannot start conversation with yourself' });
    }

    let conversation;

    if (userRole === 'customer') {
      conversation = await prisma.conversation.findUnique({
        where: {
          customerId_providerId: {
            customerId: userId,
            providerId: providerProfile.id
          }
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            customerId: userId,
            providerId: providerProfile.id
          }
        });
      }
    } else {
      conversation = await prisma.conversation.findUnique({
        where: {
          customerId_providerId: {
            customerId: providerProfile.userId,
            providerId: providerProfile.id
          }
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            customerId: providerProfile.userId,
            providerId: providerProfile.id
          }
        });
      }
    }

    const fullConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        provider: { select: { id: true, businessName: true, user: { select: { id: true, name: true } } } }
      }
    });

    res.json({ conversation: fullConversation });
  } catch (err) {
    console.error('Get or create conversation error:', err);
    res.status(500).json({ error: 'Failed to get or create conversation' });
  }
}

async function getMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(conversationId) }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isCustomer = conversation.customerId === userId;
    const isProvider = conversation.providerId === (await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true }
    }))?.id;

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: parseInt(conversationId) },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

async function markAsRead(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await prisma.message.updateMany({
      where: {
        conversationId: parseInt(conversationId),
        senderId: { not: userId },
        read: false
      },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
}

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  markAsRead
};