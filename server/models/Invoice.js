const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomCharges: { type: Number, required: true },
  serviceCharges: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 10 }, // percentage
  taxAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  paymentMethod: { type: String, default: 'Credit Card' },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

invoiceSchema.index({ guest: 1, createdAt: -1 });
invoiceSchema.index({ booking: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
