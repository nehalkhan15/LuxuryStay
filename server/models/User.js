const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  name: { type: String, required: true, trim: true },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: [
      'Admin',
      'Manager',
      'Receptionist',
      'Housekeeping',
      'Maintenance',
      'Guest'
    ],
    default: 'Guest'
  },

  guestType: {
    type: String,
    enum: ['NORMAL', 'VIP'],
    default: 'NORMAL'
  },

  phone: { type: String, default: '' },

  avatar: { type: String, default: '' },

  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

userSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model('User', userSchema);