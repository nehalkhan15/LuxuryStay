const express = require('express');
const router = express.Router();
const Amenity = require('../models/Amenity');
const { authenticate, authorize } = require('../middleware/auth');

// Get all active amenities (Public / Authenticated)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.all !== 'true') {
      filter.isActive = true;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const amenities = await Amenity.find(filter).sort({ category: 1, createdAt: -1 });
    res.json(amenities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Amenity (Admin only)
router.post('/', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { title, description, category, imageUrl, openingHours, location, isActive } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const amenity = await Amenity.create({
      title,
      description,
      category: category || 'Dining & Bar',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
      openingHours: openingHours || '07:00 AM - 11:00 PM',
      location: location || 'Main Resort Tower',
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(amenity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Amenity (Admin only)
router.put('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!amenity) return res.status(404).json({ message: 'Amenity not found' });
    res.json(amenity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Amenity (Admin only)
router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndDelete(req.params.id);
    if (!amenity) return res.status(404).json({ message: 'Amenity not found' });
    res.json({ message: 'Amenity deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
