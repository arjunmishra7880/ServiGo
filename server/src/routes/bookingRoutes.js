const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, updateBookingStatus } = require('../controllers/bookingController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, createBooking);
router.get('/my', authenticateToken, getMyBookings);
router.patch('/:id/status', authenticateToken, updateBookingStatus);

module.exports = router;