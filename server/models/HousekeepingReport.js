const mongoose = require('mongoose');

const housekeepingReportSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportType: {
    type: String,
    enum: [
      'Needs Cleaning',
      'Cleaning Completed',
      'Damaged',
      'Missing Item',
      'Maintenance Issue',
      'Room Not Ready',
      'Other'
    ],
    required: true
  },
  notes: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved'],
    default: 'Open'
  },
  resolution: {
    type: String,
    default: '',
    trim: true
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

housekeepingReportSchema.index({ roomId: 1, status: 1, createdAt: -1 });
housekeepingReportSchema.index({ reportedBy: 1, createdAt: -1 });
housekeepingReportSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('HousekeepingReport', housekeepingReportSchema);
