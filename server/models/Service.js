const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ['Dining', 'Beverages', 'Spa & Wellness', 'Transportation', 'Laundry', 'Concierge', 'Other'], 
    default: 'Dining',
    required: true 
  },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  icon: { type: String, default: 'Utensils' },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
