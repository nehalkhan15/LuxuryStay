const express = require('express');
const router = express.Router();
const HousekeepingReport = require('../models/HousekeepingReport');
const Room = require('../models/Room');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/housekeeping-reports
// Admin and Manager can view ALL reports. Housekeeping can view reports. Receptionist/Guest are rejected (403).
router.get('/', authenticate, authorize('Admin', 'Manager', 'Housekeeping'), async (req, res) => {
  try {
    const { status, reportType, roomId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (reportType) filter.reportType = reportType;
    if (roomId) filter.roomId = roomId;

    // Housekeeping can view their own reports or all open reports
    if (req.user.role === 'Housekeeping') {
      filter.$or = [{ reportedBy: req.user._id }, { status: { $in: ['Open', 'In Progress'] } }];
    }

    const reports = await HousekeepingReport.find(filter)
      .populate({
        path: 'roomId',
        populate: { path: 'roomType' }
      })
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/housekeeping-reports/:id
router.get('/:id', authenticate, authorize('Admin', 'Manager', 'Housekeeping'), async (req, res) => {
  try {
    const report = await HousekeepingReport.findById(req.params.id)
      .populate({
        path: 'roomId',
        populate: { path: 'roomType' }
      })
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role');

    if (!report) {
      return res.status(404).json({ message: 'Housekeeping report not found.' });
    }

    if (req.user.role === 'Housekeeping' && report.reportedBy.toString() !== req.user._id.toString() && !['Open', 'In Progress'].includes(report.status)) {
      return res.status(403).json({ message: 'Housekeeping staff can only view their own or open reports.' });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/housekeeping-reports
// Housekeeping, Admin, Manager can create reports
router.post('/', authenticate, authorize('Housekeeping', 'Admin', 'Manager'), async (req, res) => {
  try {
    const { roomId, reportType, notes } = req.body;

    if (!roomId || !reportType || !notes) {
      return res.status(400).json({ message: 'Room, reportType, and notes are required.' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const report = await HousekeepingReport.create({
      roomId,
      reportedBy: req.user._id,
      reportType,
      notes: notes.trim(),
      status: 'Open'
    });

    // If Damaged or Maintenance Issue, optionally log a maintenance request
    if (reportType === 'Maintenance Issue' || reportType === 'Damaged') {
      await MaintenanceRequest.create({
        room: roomId,
        reportedBy: req.user._id,
        problemDescription: `[Housekeeping Alert - ${reportType}] ${notes.trim()}`,
        priority: 'High',
        status: 'Pending'
      });
    }

    // Notify Admin and Manager
    await Notification.create([
      {
        targetRole: 'Admin',
        title: `Housekeeping Report: Room ${room.roomNumber}`,
        message: `${reportType} reported for Room ${room.roomNumber}: "${notes.trim()}". Reported by ${req.user.name}.`,
        type: 'warning'
      },
      {
        targetRole: 'Manager',
        title: `Housekeeping Report: Room ${room.roomNumber}`,
        message: `${reportType} reported for Room ${room.roomNumber}: "${notes.trim()}". Reported by ${req.user.name}.`,
        type: 'warning'
      }
    ]);

    const populated = await HousekeepingReport.findById(report._id)
      .populate({
        path: 'roomId',
        populate: { path: 'roomType' }
      })
      .populate('reportedBy', 'name email role');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign a report to active operational staff (Admin or Manager).
router.patch('/:id/assign', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ message: 'assignedTo is required.' });

    const assignee = await User.findOne({
      _id: assignedTo,
      isActive: true,
      role: { $in: ['Admin', 'Manager', 'Housekeeping', 'Maintenance'] }
    }).select('name email role');
    if (!assignee) return res.status(400).json({ message: 'Select an active operational employee.' });

    const report = await HousekeepingReport.findByIdAndUpdate(
      req.params.id,
      { assignedTo: assignee._id },
      { new: true, runValidators: true }
    )
      .populate({ path: 'roomId', populate: { path: 'roomType' } })
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role');

    if (!report) return res.status(404).json({ message: 'Housekeeping report not found.' });
    res.json({ message: 'Housekeeping report assigned.', report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/housekeeping-reports/:id/resolve
// Admin and Manager can resolve reports
router.patch('/:id/resolve', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { resolution } = req.body;
    const report = await HousekeepingReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Housekeeping report not found.' });
    }

    report.status = 'Resolved';
    report.resolution = resolution || 'Resolved by management.';
    report.resolvedBy = req.user._id;
    await report.save();

    const populated = await HousekeepingReport.findById(report._id)
      .populate({
        path: 'roomId',
        populate: { path: 'roomType' }
      })
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role');

    res.json({ message: 'Housekeeping report resolved.', report: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/housekeeping-reports/:id/status
// Update report status (In Progress, Resolved, Open)
router.patch('/:id/status', authenticate, authorize('Admin', 'Manager', 'Housekeeping'), async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const report = await HousekeepingReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Housekeeping report not found.' });
    }

    if (req.user.role === 'Housekeeping' && report.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Housekeeping staff can update only their own reports.' });
    }

    if (status) report.status = status;
    if (resolution) report.resolution = resolution;
    if (status === 'Resolved' && req.user.role !== 'Housekeeping') {
      report.resolvedBy = req.user._id;
    }

    await report.save();

    const populated = await HousekeepingReport.findById(report._id)
      .populate({
        path: 'roomId',
        populate: { path: 'roomType' }
      })
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role');

    res.json({ message: 'Housekeeping report status updated.', report: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
