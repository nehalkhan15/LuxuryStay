const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceType: { 
    type: String, 
    enum: ['Room Service', 'Laundry', 'Transportation', 'Wake-up Call', 'Other'], 
    required: true 
  },
  description: { type: String, required: true },
  cost: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

serviceRequestSchema.index({ guest: 1, createdAt: -1 });
serviceRequestSchema.index({ booking: 1, status: 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
