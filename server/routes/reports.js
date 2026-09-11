const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Feedback = require('../models/Feedback');
const ServiceRequest = require('../models/ServiceRequest');
const { authenticate, authorize } = require('../middleware/auth');

// Get Dashboard Analytics & Reports (Admin & Manager)
router.get('/analytics', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const availableRooms = await Room.countDocuments({ status: 'Available' });
    const occupiedRooms = await Room.countDocuments({ status: 'Occupied' });
    const cleaningRooms = await Room.countDocuments({ status: 'Cleaning' });
    const maintenanceRooms = await Room.countDocuments({ status: 'Under Maintenance' });
    const reservedRooms = await Room.countDocuments({ status: 'Reserved' });

    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: 'Confirmed' });
    const checkedInBookings = await Booking.countDocuments({ status: 'Checked-In' });
    const checkedOutBookings = await Booking.countDocuments({ status: 'Checked-Out' });
    const cancelledBookings = await Booking.countDocuments({ status: 'Cancelled' });

    // Revenue calculations from database invoices
    const paidInvoices = await Invoice.find({ paymentStatus: 'Paid' });
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const roomRevenuePaid = paidInvoices.reduce((sum, inv) => sum + (inv.roomCharges || 0), 0);
    const serviceRevenuePaid = paidInvoices.reduce((sum, inv) => sum + (inv.serviceCharges || 0), 0);
    const taxCollected = paidInvoices.reduce((sum, inv) => sum + (inv.taxAmount || 0), 0);

    const pendingInvoices = await Invoice.find({ paymentStatus: 'Pending' });
    const pendingRevenue = pendingInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    // Completed service requests breakdown
    const completedServices = await ServiceRequest.find({ status: 'Completed' });
    const serviceBreakdown = {
      dining: 0,
      laundry: 0,
      transportation: 0,
      other: 0
    };
    completedServices.forEach(s => {
      if (s.serviceType === 'Room Service') serviceBreakdown.dining += (s.cost || 0);
      else if (s.serviceType === 'Laundry') serviceBreakdown.laundry += (s.cost || 0);
      else if (s.serviceType === 'Transportation') serviceBreakdown.transportation += (s.cost || 0);
      else serviceBreakdown.other += (s.cost || 0);
    });

    // Guest Satisfaction Rating
    const feedbacks = await Feedback.find();
    const avgRating = feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : 5.0;

    // Occupancy Rate Percentage
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

    // Calculate revenue breakdown percentages
    const totalRevCalculated = totalRevenue || (roomRevenuePaid + serviceRevenuePaid) || 1;
    const roomPct = totalRevenue > 0 ? Math.round((roomRevenuePaid / totalRevCalculated) * 100) : 75;
    const servicePct = totalRevenue > 0 ? Math.round((serviceRevenuePaid / totalRevCalculated) * 100) : 25;

    res.json({
      rooms: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
        cleaning: cleaningRooms,
        maintenance: maintenanceRooms,
        reserved: reservedRooms
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        checkedIn: checkedInBookings,
        checkedOut: checkedOutBookings,
        cancelled: cancelledBookings
      },
      revenue: {
        totalPaid: totalRevenue,
        totalPending: pendingRevenue,
        roomRevenuePaid,
        serviceRevenuePaid,
        taxCollected,
        roomPercentage: roomPct,
        servicePercentage: servicePct,
        serviceBreakdown
      },
      occupancyRate: Number(occupancyRate),
      guestSatisfaction: Number(avgRating),
      totalReviews: feedbacks.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
