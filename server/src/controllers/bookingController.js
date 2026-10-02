const prisma = require('../prisma');

async function createBooking(req, res) {
  try {
    const { serviceId, bookingDate, address, notes } = req.body;

    if (!serviceId || !bookingDate || !address) {
      return res.status(400).json({ error: 'Service, booking date, and service address are required.' });
    }

    const service = await prisma.service.findUnique({
      where: { id: parseInt(serviceId, 10) }
    });

    if (!service) {
      return res.status(404).json({ error: 'Selected service does not exist.' });
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: req.user.id,
        serviceId: service.id,
        bookingDate: new Date(bookingDate),
        address,
        notes: notes || '',
        totalAmount: service.price,
        status: 'pending'
      },
      include: {
        service: {
          include: {
            category: true,
            provider: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Booking request placed successfully!',
      booking
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