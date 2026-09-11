const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Invoice = require('../models/Invoice');
const HousekeepingTask = require('../models/HousekeepingTask');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// Check Availability
router.get('/check-availability', async (req, res) => {
  try {
    const { checkInDate, checkOutDate, roomType } = req.query;
    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ message: 'checkInDate and checkOutDate are required.' });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Find conflicting bookings
    const bookedRoomIds = await Booking.distinct('room', {
      status: { $in: ['Confirmed', 'Checked-In'] },
      $or: [
        { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }
      ]
    });

    const roomQuery = {
      _id: { $nin: bookedRoomIds },
      status: { $nin: ['Under Maintenance'] }
    };
    if (roomType) {
      roomQuery.roomType = roomType;
    }

    const availableRooms = await Room.find(roomQuery).populate('roomType');
    res.json(availableRooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all bookings (Filtered for Admin/Manager/Receptionist or Guest own bookings)
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'Guest') {
      filter.guest = req.user._id;
    } else if (req.query.guestId) {
      filter.guest = req.query.guestId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate('guest', 'name email phone guestType role')
      .populate({
        path: 'room',
        populate: { path: 'roomType' }
      })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single booking by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('guest', 'name email phone guestType role createdAt')
      .populate({ path: 'room', populate: { path: 'roomType' } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Enforce guest data isolation
    if (req.user.role === 'Guest' && booking.guest?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only view your own reservations.' });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Reservation with Strict Double Booking Prevention & Validation
router.post('/', authenticate, async (req, res) => {
  try {
    const { guestId, roomId, checkInDate, checkOutDate, numberOfGuests, specialRequests } = req.body;

    if (!roomId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: 'Room ID, check-in date, and check-out date are required.' });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({ message: 'Invalid check-in or check-out date format.' });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({ message: 'Check-out date must be strictly after check-in date.' });
    }

    const guestRef = req.user.role === 'Guest' ? req.user._id : (guestId || req.user._id);
    const guest = await User.findOne({ _id: guestRef, role: 'Guest', isActive: true });
    if (!guest) return res.status(400).json({ message: 'A valid active guest account is required.' });

    const room = await Room.findById(roomId).populate('roomType');
    if (!room) return res.status(404).json({ message: 'Selected room not found.' });

    if (room.roomType?.capacity && Number(numberOfGuests || 1) > room.roomType.capacity) {
      return res.status(400).json({ message: `This room accommodates up to ${room.roomType.capacity} guests.` });
    }

    if (room.status === 'Under Maintenance') {
      return res.status(400).json({ message: 'This suite is currently undergoing maintenance and cannot be reserved.' });
    }

    // STRICT OVERLAP CHECK: Prevent Double Bookings
    const conflictingBooking = await Booking.findOne({
      room: roomId,
      status: { $in: ['Confirmed', 'Checked-In'] },
      $or: [
        { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({
        message: `Suite ${room.roomNumber} is already reserved for the requested dates (${conflictingBooking.checkInDate.toISOString().split('T')[0]} to ${conflictingBooking.checkOutDate.toISOString().split('T')[0]}). Please choose alternative dates or a different suite.`
      });
    }

    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const roomCharges = room.pricePerNight * diffDays;

    // Fetch live tax rate setting from MongoDB
    const setting = await Setting.findOne() || { taxRate: 12 };
    const taxRate = setting.taxRate || 12;
    const taxAmount = Math.round(((roomCharges * taxRate) / 100) * 100) / 100;
    const grandTotal = roomCharges + taxAmount;

    const bookingId = 'BK-' + Math.floor(100000 + Math.random() * 900000);

    const booking = await Booking.create({
      bookingId,
      guest: guestRef,
      room: roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: numberOfGuests || 1,
      totalAmount: grandTotal,
      specialRequests: specialRequests || '',
      status: 'Confirmed'
    });

    // Update room status if available
    if (room.status === 'Available') {
      room.status = 'Reserved';
      await room.save();
    }

    // Automatically create linked Pending Invoice
    const invoiceNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    await Invoice.create({
      invoiceNumber,
      booking: booking._id,
      guest: guestRef,
      roomCharges,
      serviceCharges: 0,
      subtotal: roomCharges,
      taxRate,
      taxAmount,
      discount: 0,
      grandTotal,
      paymentStatus: 'Pending'
    });

    // Dispatch Database-backed Notification
    await Notification.create({
      targetRole: 'Receptionist',
      title: 'New Reservation Confirmed',
      message: `Reservation ${bookingId} confirmed for Room ${room.roomNumber} (${diffDays} nights).`,
      type: 'info'
    });

    const populated = await booking.populate(['guest', { path: 'room', populate: { path: 'roomType' } }]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check-In Guest (Receptionist/Admin/Manager)
router.patch('/:id/check-in', authenticate, authorize('Admin', 'Manager', 'Receptionist'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status === 'Checked-In') {
      return res.status(400).json({ message: 'Guest is already checked in.' });
    }
    if (booking.status === 'Checked-Out' || booking.status === 'Cancelled') {
      return res.status(400).json({ message: `Cannot check in a ${booking.status.toLowerCase()} reservation.` });
    }

    booking.status = 'Checked-In';
    await booking.save();

    // Update room status to Occupied
    const room = await Room.findById(booking.room);
    if (!room) return res.status(409).json({ message: 'The booking room is no longer available.' });
    if (room.status === 'Under Maintenance' || room.status === 'Cleaning') {
      return res.status(400).json({ message: 'This room is not eligible for check-in.' });
    }
    if (room) {
      room.status = 'Occupied';
      await room.save();
    }

    // Create Notification
    await Notification.create({
      targetRole: 'Admin',
      title: 'Guest Arrival Check-In',
      message: `Booking ${booking.bookingId} checked in to Room ${room?.roomNumber || ''}. Room is now Occupied.`,
      type: 'success'
    });

    res.json({ message: 'Guest checked in successfully', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check-Out Guest (Receptionist/Admin/Manager)
router.patch('/:id/check-out', authenticate, authorize('Admin', 'Manager', 'Receptionist'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'Checked-In') {
      return res.status(400).json({ message: 'Only checked-in reservations can be checked out.' });
    }

    booking.status = 'Checked-Out';
    await booking.save();

    // Update room status to Cleaning & create Housekeeping task automatically
    const room = await Room.findById(booking.room);
    if (room) {
      room.status = 'Cleaning';
      await room.save();

      await HousekeepingTask.create({
        room: room._id,
        status: 'Pending',
        priority: 'High',
        notes: `Post Check-out deep cleaning & turnover for Suite ${room.roomNumber}.`
      });
    }

    // Create Notification for Housekeeping
    await Notification.create({
      targetRole: 'Housekeeping',
      title: 'Post Check-Out Turnover',
      message: `Suite ${room?.roomNumber || ''} has checked out. Turnover & sanitization scheduled.`,
      type: 'warning'
    });

    res.json({ message: 'Guest checked out successfully. Suite moved to Cleaning and task dispatched to Housekeeping.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Modify / Cancel Booking
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (req.user.role === 'Guest' && booking.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'Checked-In') {
      return res.status(400).json({ message: 'Active in-stay reservations must be checked out rather than cancelled.' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Reset room status if reserved
    const room = await Room.findById(booking.room);
    if (room && room.status === 'Reserved') {
      room.status = 'Available';
      await room.save();
    }

    // Create Notification
    await Notification.create({
      targetRole: 'Receptionist',
      title: 'Reservation Cancelled',
      message: `Booking ${booking.bookingId} was cancelled. Room ${room?.roomNumber || ''} returned to available inventory.`,
      type: 'info'
    });

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
