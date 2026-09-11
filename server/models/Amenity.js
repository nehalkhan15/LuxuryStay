const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Dining & Bar', 'Wellness & Spa', 'Fitness & Sports', 'Leisure & Pool', 'Business & Events', 'Other'], 
    default: 'Dining & Bar' 
  },
  imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80' },
  openingHours: { type: String, default: '07:00 AM - 11:00 PM' },
  location: { type: String, default: 'Main Resort Tower' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Amenity', amenitySchema);
