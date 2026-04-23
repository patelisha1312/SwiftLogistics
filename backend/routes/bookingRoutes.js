const express = require('express');
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getAllBookings,
  trackPackage,
  updateBookingStatus
} = require('../controllers/bookingController');

const authMiddleware = require('../middleware/authMiddleware');
const Booking = require('../models/bookingModel');

router.get('/track/:bookingId', trackPackage); 

router.post('/', authMiddleware, createBooking);
router.get('/', authMiddleware, getMyBookings);
router.get('/all', authMiddleware, getAllBookings);
router.get('/user-orders/:userId', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.params.userId
    }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching orders" });
  }
});

router.put('/status/:bookingId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    res.json({ msg: 'Booking status updated', booking });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});
router.put("/update-status/:id", async (req, res) => {
  const Booking = require("../models/bookingModel");

  const { status } = req.body;

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json(booking);
});
module.exports = router;