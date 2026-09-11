const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  problemDescription: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Emergency'], 
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed'], 
    default: 'Pending' 
  },
  repairNotes: { type: String, default: '' },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

maintenanceRequestSchema.index({ room: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
