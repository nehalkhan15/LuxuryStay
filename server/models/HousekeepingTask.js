const mongoose = require('mongoose');

const housekeepingTaskSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed'], 
    default: 'Pending' 
  },
  priority: { type: String, enum: ['Normal', 'High', 'Urgent'], default: 'Normal' },
  notes: { type: String, default: '' },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HousekeepingTask', housekeepingTaskSchema);
