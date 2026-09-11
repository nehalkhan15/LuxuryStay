const express = require('express');
const router = express.Router();
const HousekeepingTask = require('../models/HousekeepingTask');
const Room = require('../models/Room');
const { authenticate, authorize } = require('../middleware/auth');

// Get all housekeeping tasks
router.get('/', authenticate, authorize('Admin', 'Manager', 'Housekeeping', 'Receptionist'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const tasks = await HousekeepingTask.find(filter)
      .populate({ path: 'room', populate: { path: 'roomType' } })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create task manually (Manager/Admin/Housekeeping lead)
router.post('/', authenticate, authorize('Admin', 'Manager', 'Housekeeping', 'Receptionist'), async (req, res) => {
  try {
    const { roomId, priority, notes, assignedTo } = req.body;
    const task = await HousekeepingTask.create({
      room: roomId,
      priority: priority || 'Normal',
      notes: notes || '',
      assignedTo: assignedTo || req.user._id,
      status: 'Pending'
    });

    const room = await Room.findById(roomId);
    if (room) {
      room.status = 'Cleaning';
      await room.save();
    }

    const populated = await task.populate(['room', 'assignedTo']);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start cleaning task (In Progress)
router.patch('/:id/start', authenticate, authorize('Admin', 'Manager', 'Housekeeping'), async (req, res) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Housekeeping task not found' });

    task.status = 'In Progress';
    if (!task.assignedTo) task.assignedTo = req.user._id;
    await task.save();

    res.json({ message: 'Cleaning started', task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Complete cleaning task & set room status to Available
router.patch('/:id/complete', authenticate, authorize('Admin', 'Manager', 'Housekeeping'), async (req, res) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Housekeeping task not found' });

    task.status = 'Completed';
    task.completedAt = new Date();
    await task.save();

    // Mark room as Available
    const room = await Room.findById(task.room);
    if (room) {
      room.status = 'Available';
      await room.save();
    }

    res.json({ message: 'Cleaning completed. Room is now Available.', task, room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
