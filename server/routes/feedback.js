const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');
const { authenticate, authorize } = require('../middleware/auth');

// Public testimonials expose no private guest contact data.
router.get('/', async (req, res) => {
  try {
    const feedbackList = await Feedback.find()
      .select('rating comments response createdAt booking guest')
      .populate('guest', 'name avatar')
      .populate({ path: 'booking', populate: { path: 'room' } })
      .sort({ createdAt: -1 });

    res.json(feedbackList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit Feedback (Guest)
router.post('/', authenticate, async (req, res) => {
  try {
    const { bookingId, rating, comments } = req.body;
    if (req.user.role !== 'Guest') {
      return res.status(403).json({ message: 'Only guests can submit feedback.' });
    }

    if (!bookingId || !rating || !comments?.trim()) {
      return res.status(400).json({ message: 'Rating and comments are required.' });
    }

    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: 'Rating must be an integer from 1 to 5.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review your own bookings.' });
    }
    if (booking.status !== 'Checked-Out') {
      return res.status(400).json({ message: 'Feedback can be submitted after checkout.' });
    }

    const existingFeedback = await Feedback.findOne({ booking: booking._id, guest: req.user._id });
    if (existingFeedback) {
      return res.status(409).json({ message: 'Feedback has already been submitted for this booking.' });
    }

    const feedback = await Feedback.create({
      booking: booking._id,
      guest: req.user._id,
      rating: Number(rating),
      comments: comments.trim()
    });

    const populated = await feedback.populate('guest', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manager Response to Feedback
router.patch('/:id/respond', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { response } = req.body;
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    feedback.response = response;
    await feedback.save();
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
