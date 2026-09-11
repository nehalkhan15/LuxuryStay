const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  badge: { type: String, default: 'LuxuryStay Special' },
  subtitle: { type: String, default: '' },
  description: { type: String, required: true },
  eventDate: { type: String, default: '' },
  time: { type: String, default: '' },
  imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80' },
  actionText: { type: String, default: 'Learn More' },
  actionLink: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Promotion', promotionSchema);
