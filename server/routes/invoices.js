const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const ServiceRequest = require('../models/ServiceRequest');
const Setting = require('../models/Setting');
const { authenticate, authorize } = require('../middleware/auth');

// Get all invoices (Admin/Manager/Receptionist, or Guest own invoices)
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'Guest') {
      filter.guest = req.user._id;
    }

    const invoices = await Invoice.find(filter)
      .populate('guest', 'name email phone')
      .populate({
        path: 'booking',
        populate: { path: 'room', populate: { path: 'roomType' } }
      })
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single invoice by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('guest', 'name email phone guestType')
      .populate({ path: 'booking', populate: { path: 'room', populate: { path: 'roomType' } } });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Enforce guest isolation
    if (req.user.role === 'Guest' && invoice.guest?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only view your own invoices.' });
    }

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate Invoice for a Booking
router.post('/generate/:bookingId', authenticate, authorize('Admin', 'Manager', 'Receptionist'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Check if invoice already exists
    let existingInvoice = await Invoice.findOne({ booking: booking._id });
    
    // Calculate room charges
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const diffDays = Math.ceil(Math.abs(checkOut - checkIn) / (1000 * 60 * 60 * 24)) || 1;
    const roomCharges = booking.room.pricePerNight * diffDays;

    // Calculate completed service charges
    const services = await ServiceRequest.find({ booking: booking._id, status: 'Completed' });
    const serviceCharges = services.reduce((sum, s) => sum + (s.cost || 0), 0);

    // Fetch tax rate setting
    const setting = await Setting.findOne() || { taxRate: 12 };
    const taxRate = setting.taxRate || 12;

    const discount = Number(req.body.discount || 0);
    if (!Number.isFinite(discount) || discount < 0) {
      return res.status(400).json({ message: 'Discount must be a non-negative number.' });
    }
    const subtotal = roomCharges + serviceCharges;
    const taxAmount = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + taxAmount - discount;
    if (grandTotal < 0) {
      return res.status(400).json({ message: 'Discount cannot exceed the invoice subtotal and tax.' });
    }

    if (existingInvoice) {
      existingInvoice.roomCharges = roomCharges;
      existingInvoice.serviceCharges = serviceCharges;
      existingInvoice.subtotal = subtotal;
      existingInvoice.taxRate = taxRate;
      existingInvoice.taxAmount = taxAmount;
      existingInvoice.discount = discount;
      existingInvoice.grandTotal = grandTotal;
      await existingInvoice.save();
      return res.json(existingInvoice);
    }

    const invoiceNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    const invoice = await Invoice.create({
      invoiceNumber,
      booking: booking._id,
      guest: booking.guest,
      roomCharges,
      serviceCharges,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      grandTotal,
      paymentStatus: 'Pending'
    });

    const populated = await invoice.populate(['guest', { path: 'booking', populate: { path: 'room' } }]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark Invoice as Paid
router.patch('/:id/pay', authenticate, authorize('Admin', 'Manager', 'Receptionist', 'Guest'), async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Enforce data isolation: Guests can only pay their own invoices
    if (req.user.role === 'Guest' && invoice.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only settle your own invoices.' });
    }

    invoice.paymentStatus = 'Paid';
    invoice.paymentMethod = paymentMethod || 'Credit Card';
    invoice.paidAt = new Date();
    await invoice.save();

    res.json({ message: 'Invoice marked as Paid', invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
