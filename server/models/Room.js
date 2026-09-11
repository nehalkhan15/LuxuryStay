const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  roomType: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  floor: { type: Number, required: true, default: 1 },
  pricePerNight: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Available', 'Reserved', 'Occupied', 'Cleaning', 'Under Maintenance'], 
    default: 'Available' 
  },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
