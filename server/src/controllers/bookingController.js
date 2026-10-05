const prisma = require('../prisma');
const { getIO } = require('../socket');

async function createBooking(req, res) {
  try {
    const { serviceId, bookingDate, address, notes } = req.body;

    if (!serviceId || !bookingDate || !address) {
      return res.status(400).json({ error: 'Service, booking date, and service address are required.' });
    }

    const service = await prisma.service.findUnique({
      where: { id: parseInt(serviceId, 10) },
      include: {
        category: true,
        provider: {
          include: {
            user: true
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Selected service does not exist.' });
    }

    const customerId = req.user?.id || req.user?.userId;
    if (!customerId) {
      return res.status(401).json({ error: 'User authentication required.' });
    }

    const booking = await prisma.booking.create({
      data: {
        customerId,
        serviceId: service.id,
        bookingDate: new Date(bookingDate),
        address,
        notes: notes || '',
        totalAmount: service.price,
        status: 'pending'
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        service: {
          include: {
            category: true,
            provider: {
              include: {
                user: { select: { id: true, name: true, phone: true } }
              }
            }
          }
        }
      }
    });

    // ── Find or Create Conversation between customer and provider ──
    const bookingMsgContent = `🛎️ New Booking Request!\n• Service: ${service.title}\n• Date: ${new Date(bookingDate).toLocaleString()}\n• Address: ${address}\n• Total: ₹${service.price}${notes ? `\n• Notes: ${notes}` : ''}`;
    let conversation = null;
    let bookingMessage = null;

    try {
      conversation = await prisma.conversation.findUnique({
        where: {
          customerId_providerId: {
            customerId,
            providerId: service.providerId
          }
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            customerId,
            providerId: service.providerId,
            lastMessage: bookingMsgContent,
            lastMessageAt: new Date()
          }
        });
      }

      bookingMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: customerId,
          content: bookingMsgContent
        },
        include: {
          sender: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: bookingMsgContent,
          lastMessageAt: new Date()
        }
      });
    } catch (chatErr) {
      console.error('Auto conversation message creation error:', chatErr);
    }

    // ── Real-Time Socket Emission to Provider & Customer ──
    try {
      const io = req.app?.get('io') || getIO();
      if (io) {
        const payload = {
          booking,
          bookingId: booking.id,
          serviceTitle: service.title,
          categoryName: service.category?.name || '',
          customerName: req.user.name,
          customerPhone: req.user.phone || '',
          bookingDate: booking.bookingDate,
          address: booking.address,
          totalAmount: booking.totalAmount,
          notes: booking.notes,
          conversationId: conversation?.id,
          message: bookingMessage
        };

        // Notify provider's rooms
        io.to(`provider:${service.providerId}`).emit('new:booking', payload);
        if (service.provider?.userId) {
          io.to(`user:${service.provider.userId}`).emit('new:booking', payload);
        }

        // Notify active conversation room
        if (conversation && bookingMessage) {
          io.to(`conversation:${conversation.id}`).emit('new:message', {
            message: {
              id: bookingMessage.id,
              conversationId: bookingMessage.conversationId,
              senderId: bookingMessage.senderId,
              senderName: bookingMessage.sender.name,
              senderRole: bookingMessage.sender.role,
              content: bookingMessage.content,
              read: bookingMessage.read,
              createdAt: bookingMessage.createdAt
            }
          });

          if (service.provider?.userId) {
            io.to(`user:${service.provider.userId}`).emit('conversation:updated', {
              conversationId: conversation.id,
              lastMessage: bookingMsgContent,
              lastMessageAt: new Date()
            });
          }

          io.to(`user:${req.user.id}`).emit('conversation:updated', {
            conversationId: conversation.id,
            lastMessage: bookingMsgContent,
            lastMessageAt: new Date()
          });
        }
      }
    } catch (sockErr) {
      console.error('Socket emission error on new booking:', sockErr);
    }

    res.status(201).json({
      message: 'Booking request placed successfully!',
      booking,
      conversationId: conversation?.id
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking.' });
  }
}

async function getMyBookings(req, res) {
  try {
    const { role, id } = req.user;

    let where = {};
    if (role === 'customer') {
      where = { customerId: id };
    } else if (role === 'provider') {
      where = {
        service: {
          provider: {
            userId: id
          }
        }
      };
    } else if (role === 'admin') {
      where = {}; // Admin sees all bookings
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        service: {
          include: {
            category: true,
            provider: {
              include: {
                user: { select: { name: true, phone: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
}

async function updateBookingStatus(req, res) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const validStatuses = ['pending', 'accepted', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid booking status.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: {
          include: { provider: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Permission check
    const isCustomer = booking.customerId === req.user.id;
    const isProvider = booking.service.provider.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to update this booking.' });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status }
    });

    res.json({
      message: `Booking status updated to ${status}`,
      booking: updated
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status.' });
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  updateBookingStatus
};