const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// All staff endpoints are strictly Admin-only. Non-admins receive 403 Forbidden.
router.use(authenticate);
router.use(authorizeAdmin);

// GET /api/staff - List all staff accounts
router.get('/', async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: ['Manager', 'Receptionist', 'Housekeeping', 'Maintenance'] }
    })
    .select('-password')
    .sort({ createdAt: -1 });

    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/staff/:id - Single staff member
router.get('/:id', async (req, res) => {
  try {
    const staff = await User.findById(req.params.id).select('-password');
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/staff - Admin creates a staff member
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    const allowedRoles = ['Manager', 'Receptionist', 'Housekeeping', 'Maintenance'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid staff role. Allowed: ${allowedRoles.join(', ')}` });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email address already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const staff = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      phone: phone || '',
      isActive: true
    });

    const safeStaff = staff.toObject();
    delete safeStaff.password;

    res.status(201).json({ message: 'Staff account created successfully', staff: safeStaff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/staff/:id - Admin updates staff details or role
router.put('/:id', async (req, res) => {
  try {
    const { name, role, phone, isActive, email } = req.body;
    const staff = await User.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    if (name) staff.name = name.trim();
    if (phone !== undefined) staff.phone = phone.trim();
    if (isActive !== undefined) staff.isActive = isActive;
    if (email) {
      const emailLower = email.toLowerCase().trim();
      if (emailLower !== staff.email) {
        const existing = await User.findOne({ email: emailLower });
        if (existing) {
          return res.status(400).json({ message: 'Email is already in use by another account.' });
        }
        staff.email = emailLower;
      }
    }

    if (role) {
      const allowedRoles = ['Manager', 'Receptionist', 'Housekeeping', 'Maintenance'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: `Invalid staff role. Allowed: ${allowedRoles.join(', ')}` });
      }
      staff.role = role;
    }

    await staff.save();

    const safeStaff = staff.toObject();
    delete safeStaff.password;

    res.json({ message: 'Staff details updated successfully', staff: safeStaff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/staff/:id - Admin deletes a staff member
router.delete('/:id', async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own active administrator account.' });
    }

    const staff = await User.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    res.json({ message: `Staff member ${staff.name} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/staff/:id/status - Admin activates/deactivates staff
router.patch('/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const staff = await User.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    if (isActive !== undefined) {
      staff.isActive = isActive;
    } else {
      staff.isActive = !staff.isActive;
    }

    await staff.save();

    const safeStaff = staff.toObject();
    delete safeStaff.password;

    res.json({ message: `Staff account ${staff.isActive ? 'activated' : 'deactivated'}.`, staff: safeStaff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/staff/:id/password - Admin resets/changes staff password
router.patch('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const staff = await User.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    staff.password = await bcrypt.hash(password, 10);
    await staff.save();

    res.json({ message: `Password for ${staff.name} reset successfully.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
