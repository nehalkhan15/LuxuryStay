const express = require('express');
const router = express.Router();
const Promotion = require('../models/Promotion');
const { authenticate, authorize } = require('../middleware/auth');

// Get all active promotions (Public / Authenticated)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.all !== 'true') {
      filter.isActive = true;
    }
    const promotions = await Promotion.find(filter).sort({ priority: 1, createdAt: -1 });
    res.json(promotions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Promotion (Admin only)
router.post('/', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { title, badge, subtitle, description, eventDate, time, imageUrl, actionText, actionLink, priority, isActive } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const promotion = await Promotion.create({
      title,
      badge: badge || 'LuxuryStay Special',
      subtitle: subtitle || '',
      description,
      eventDate: eventDate || '',
      time: time || '',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      actionText: actionText || 'Learn More',
      actionLink: actionLink || '',
      priority: priority || 1,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(promotion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Promotion (Admin only)
router.put('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });
    res.json(promotion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Promotion (Admin only)
router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });
    res.json({ message: 'Promotion deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
