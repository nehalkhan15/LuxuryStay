const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  numberOfGuests: { type: Number, default: 1 },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled'], 
    default: 'Confirmed' 
  },
  specialRequests: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

bookingSchema.index({ room: 1, status: 1, checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ guest: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
