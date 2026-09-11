const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },

  description: { type: String, default: '', trim: true },

  category: {
    type: String,
    enum: ['Housekeeping', 'Maintenance', 'Front Desk', 'General'],
    default: 'General'
  },

  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },

  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },

  dueDate: { type: Date },

  completedAt: { type: Date },

  notes: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now }
});

taskSchema.index({ status: 1, assignedTo: 1 });
taskSchema.index({ assignedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
