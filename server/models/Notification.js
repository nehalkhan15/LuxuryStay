const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  targetRole: { type: String, enum: ['All', 'Admin', 'Manager', 'Receptionist', 'Housekeeping', 'Guest'], default: 'All' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'danger'], default: 'info' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ targetRole: 1, createdAt: -1 });
notificationSchema.index({ targetUser: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
