const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

// Register (Guest self-registration only)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || '',
      role: 'Guest'
    });

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      redirectUrl: '/user/profile',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login for all supported user roles
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Determine target redirect path based on user role
    let redirectUrl = '/guest/portal';
    if (user.role === 'Admin') redirectUrl = '/admin/dashboard';
    else if (user.role === 'Manager') redirectUrl = '/manager/dashboard';
    else if (user.role === 'Receptionist') redirectUrl = '/reception/dashboard';
    else if (user.role === 'Housekeeping') redirectUrl = '/housekeeping/dashboard';
    else if (user.role === 'Guest') redirectUrl = '/guest/portal';

    res.json({
      token,
      redirectUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isAdmin: user.role === 'Admin'
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Current User Profile
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      isAdmin: req.user.role === 'Admin'
    }
  });
});

// Update Profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (name) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    if (password) {
      req.user.password = await bcrypt.hash(password, 10);
    }
    await req.user.save();
    res.json({ message: 'Profile updated successfully', user: req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
