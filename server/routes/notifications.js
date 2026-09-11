const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

// Get Notifications for active user / role
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { targetRole: 'All' },
        { targetRole: req.user.role },
        { targetUser: req.user._id }
      ]
    }).sort({ createdAt: -1 }).limit(20);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate({
      _id: req.params.id,
      $or: [
        { targetRole: 'All' },
        { targetRole: req.user.role },
        { targetUser: req.user._id }
      ]
    }, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
