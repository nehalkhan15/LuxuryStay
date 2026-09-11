const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================================================
// GET /api/tasks - List tasks
// Manager/Admin see all; staff see only their assigned tasks
// ============================================================================
router.get('/', authenticate, authorize('Admin', 'Manager', 'Receptionist', 'Housekeeping', 'Maintenance'), async (req, res) => {
  try {
    let filter = {};

    // Staff members only see tasks assigned to them
    if (!['Admin', 'Manager'].includes(req.user.role)) {
      filter.assignedTo = req.user._id;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate({ path: 'room', populate: { path: 'roomType' } })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================================
// GET /api/tasks/:id - Single task
// ============================================================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate({ path: 'room', populate: { path: 'roomType' } });

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================================
// POST /api/tasks - Manager/Admin creates and assigns a task
// ============================================================================
router.post('/', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { title, description, category, priority, assignedTo, room, dueDate, notes } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required.' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || '',
      category: category || 'General',
      priority: priority || 'Normal',
      status: 'Pending',
      assignedTo: assignedTo || null,
      assignedBy: req.user._id,
      room: room || null,
      dueDate: dueDate || null,
      notes: notes || ''
    });

    // Create notification for the assigned staff member
    if (assignedTo) {
      await Notification.create({
        targetUser: assignedTo,
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${title.trim()}"`,
        type: 'info'
      });
    }

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate({ path: 'room', populate: { path: 'roomType' } });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================================
// PUT /api/tasks/:id - Update task details (Manager/Admin)
// ============================================================================
router.put('/:id', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const { title, description, category, priority, assignedTo, room, dueDate, notes, status } = req.body;

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (category) task.category = category;
    if (priority) task.priority = priority;
    if (room !== undefined) task.room = room || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (notes !== undefined) task.notes = notes;
    if (status) task.status = status;

    // Track reassignment
    const previousAssignee = task.assignedTo?.toString();
    if (assignedTo !== undefined) {
      task.assignedTo = assignedTo || null;

      // Notify newly assigned staff
      if (assignedTo && assignedTo !== previousAssignee) {
        await Notification.create({
          targetUser: assignedTo,
          title: 'Task Reassigned to You',
          message: `You have been assigned the task: "${task.title}"`,
          type: 'info'
        });
      }
    }

    if (status === 'Completed') {
      task.completedAt = new Date();
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate({ path: 'room', populate: { path: 'roomType' } });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================================
// PATCH /api/tasks/:id/assign - Reassign task to a staff member
// ============================================================================
router.patch('/:id/assign', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    task.assignedTo = assignedTo || null;
    await task.save();

    if (assignedTo) {
      await Notification.create({
        targetUser: assignedTo,
        title: 'Task Assigned',
        message: `You have been assigned: "${task.title}"`,
        type: 'info'
      });
    }

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate({ path: 'room', populate: { path: 'roomType' } });

    res.json({ message: 'Task reassigned successfully.', task: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================================
// PATCH /api/tasks/:id/status - Update task status (staff can update own tasks)
// ============================================================================
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Staff can only update tasks assigned to them
    if (!['Admin', 'Manager'].includes(req.user.role)) {
      if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update tasks assigned to you.' });
      }
    }

    task.status = status;
    if (status === 'Completed') {
      task.completedAt = new Date();
    }
    await task.save();

    // Notify manager when task is completed
    if (status === 'Completed' && task.assignedBy) {
      await Notification.create({
        targetUser: task.assignedBy,
        title: 'Task Completed',
        message: `Task "${task.title}" has been marked as completed by ${req.user.name}.`,
        type: 'success'
      });
    }

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate({ path: 'room', populate: { path: 'roomType' } });

    res.json({ message: `Task status updated to ${status}.`, task: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================================
// DELETE /api/tasks/:id - Delete a task (Manager/Admin)
// ============================================================================
router.delete('/:id', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    res.json({ message: `Task "${task.title}" deleted successfully.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
