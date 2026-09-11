const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  basePrice: { type: Number, required: true },
  capacity: { type: Number, required: true, default: 2 },
  amenities: [{ type: String }],
  imageUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RoomType', roomTypeSchema);
