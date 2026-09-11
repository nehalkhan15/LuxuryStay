const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// Get all users (Admin/Manager/Receptionist)
router.get('/', authenticate, authorize('Admin', 'Manager', 'Receptionist'), async (req, res) => {
  try {
    const { role, staff } = req.query;
    const filter = {};
    if (staff === 'true') {
      filter.role = { $in: ['Admin', 'Manager', 'Receptionist', 'Housekeeping', 'Maintenance'] };
    } else if (role) {
      filter.role = role;
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.user.role === 'Guest' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Guests can only view their own profile.' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create user (Admin creating staff)
router.post('/', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const allowedRoles = ['Manager', 'Receptionist', 'Housekeeping', 'Maintenance', 'Guest'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid user role. Allowed: ${allowedRoles.join(', ')}` });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      phone: phone || ''
    });

    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(201).json({ message: 'User created successfully', user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user details, role, or guestType (Admin)
router.put('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { name, role, phone, isActive, password, guestType } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (name) user.name = name.trim();
    if (role) {
      const allowedRoles = ['Manager', 'Receptionist', 'Housekeeping', 'Maintenance', 'Guest'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: `Invalid user role. Allowed: ${allowedRoles.join(', ')}` });
      }
      user.role = role;
    }
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (guestType && ['NORMAL', 'VIP'].includes(guestType)) {
      user.guestType = guestType;
    }
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    const safeUser = user.toObject();
    delete safeUser.password;
    res.json({ message: 'User updated successfully', user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update guest VIP status (Admin, Manager, Receptionist)
router.patch('/:id/guest-type', authenticate, authorize('Admin', 'Manager', 'Receptionist'), async (req, res) => {
  try {
    const { guestType } = req.body;
    if (!['NORMAL', 'VIP'].includes(guestType)) {
      return res.status(400).json({ message: 'guestType must be either NORMAL or VIP.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Guest not found.' });
    if (user.role !== 'Guest') {
      return res.status(400).json({ message: 'Guest type can only be changed for Guest accounts.' });
    }

    user.guestType = guestType;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    res.json({ message: `Guest category updated to ${guestType}.`, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Deactivate / Activate user (Admin)
router.patch('/:id/toggle-active', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.isActive = !user.isActive;
    await user.save();
    const safeUser = user.toObject();
    delete safeUser.password;
    res.json({ message: `User account ${user.isActive ? 'activated' : 'deactivated'}.`, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own administrator account.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ message: `User ${user.name} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
