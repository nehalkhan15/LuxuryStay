const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const { authenticate, authorize } = require('../middleware/auth');

// --- ROOM TYPES ---
// Get all room types (Public / All Roles)
router.get('/types', async (req, res) => {
  try {
    const types = await RoomType.find().sort({ basePrice: 1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Room Type (Admin)
router.post('/types', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { name, description, basePrice, capacity, amenities, imageUrl } = req.body;
    const roomType = await RoomType.create({ name, description, basePrice, capacity, amenities, imageUrl });
    res.status(201).json(roomType);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Edit Room Type (Admin)
router.put('/types/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const type = await RoomType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(type);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Room Type (Admin)
router.delete('/types/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    await RoomType.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room type deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- ROOMS ---
// Get all rooms (with filters: status, roomType)
router.get('/', async (req, res) => {
  try {
    const { status, roomType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (roomType) filter.roomType = roomType;

    const rooms = await Room.find(filter).populate('roomType').sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single room by ID
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('roomType');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add Room (Admin)
router.post('/', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { roomNumber, roomType, floor, pricePerNight, notes } = req.body;
    const existing = await Room.findOne({ roomNumber });
    if (existing) {
      return res.status(400).json({ message: `Room ${roomNumber} already exists.` });
    }

    const room = await Room.create({ roomNumber, roomType, floor, pricePerNight, notes });
    const populated = await room.populate('roomType');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Room Details / Pricing (Admin / Manager)
router.put('/:id', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('roomType');
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Room Status (Admin, Manager, Receptionist, Housekeeping, Maintenance)
router.patch('/:id/status', authenticate, authorize('Admin', 'Manager', 'Receptionist', 'Housekeeping'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['Available', 'Reserved', 'Occupied', 'Cleaning', 'Under Maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid room status' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.status = status;
    if (notes !== undefined) room.notes = notes;
    await room.save();

    res.json({ message: 'Room status updated', room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Room (Admin)
router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
