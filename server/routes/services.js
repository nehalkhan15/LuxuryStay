const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const { authenticate, authorize } = require('../middleware/auth');

// --- SERVICE CATALOG MANAGEMENT (Admin & Public View) ---

// Get active catalog items (Public / Authenticated)
router.get('/catalog', async (req, res) => {
  try {
    const filter = {};
    if (req.query.all !== 'true') {
      filter.isAvailable = true;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const items = await Service.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new service item in catalog (Admin only)
router.post('/catalog', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { name, category, price, description, imageUrl, icon, isAvailable } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Name and price are required.' });
    }

    const item = await Service.create({
      name,
      category: category || 'Dining',
      price: Number(price),
      description: description || '',
      imageUrl: imageUrl || '',
      icon: icon || 'Utensils',
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update service item in catalog (Admin only)
router.put('/catalog/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const item = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Service item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete service item from catalog (Admin only)
router.delete('/catalog/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const item = await Service.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Service item not found' });
    res.json({ message: 'Service item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- SERVICE REQUEST ORDERS ---

// Get all service orders
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'Guest') {
      filter.guest = req.user._id;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const services = await ServiceRequest.find(filter)
      .populate('guest', 'name email phone')
      .populate({
        path: 'booking',
        populate: { path: 'room', populate: { path: 'roomType' } }
      })
      .populate('assignedTo', 'name role')
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Request a Service (Guest or Receptionist/Admin/Manager)
router.post('/', authenticate, async (req, res) => {
  try {
    const { bookingId, serviceId, serviceType, description, cost } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (req.user.role === 'Guest' && booking.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only order services for your own booking.' });
    }
    if (req.user.role === 'Guest' && !['Confirmed', 'Checked-In'].includes(booking.status)) {
      return res.status(400).json({ message: 'Services can only be ordered for an active booking.' });
    }

    let calculatedCost = 0;
    let finalServiceType = serviceType || 'Room Service';
    let finalDescription = description || '';

    // If serviceId passed from dynamic catalog, lookup catalog item
    if (serviceId) {
      const catalogItem = await Service.findById(serviceId);
      if (!catalogItem || !catalogItem.isAvailable) {
        return res.status(400).json({ message: 'The selected service is not available.' });
      }
      if (catalogItem) {
        calculatedCost = catalogItem.price;
        finalServiceType = catalogItem.category === 'Dining' || catalogItem.category === 'Beverages' ? 'Room Service' : catalogItem.category === 'Laundry' ? 'Laundry' : catalogItem.category === 'Transportation' ? 'Transportation' : 'Other';
        if (!finalDescription) {
          finalDescription = `${catalogItem.name} (${catalogItem.category})`;
        }
      }
    } else if (req.user.role === 'Guest') {
      return res.status(400).json({ message: 'Guests must select an available catalog service.' });
    } else if (cost !== undefined && cost !== null) {
      calculatedCost = Number(cost);
    }

    const serviceRequest = await ServiceRequest.create({
      booking: booking._id,
      guest: booking.guest,
      serviceType: finalServiceType,
      description: finalDescription || 'Guest Room Service Order',
      cost: calculatedCost,
      status: 'Pending'
    });

    const populated = await serviceRequest.populate(['guest', { path: 'booking', populate: { path: 'room', populate: { path: 'roomType' } } }]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Service Request Status (Staff)
router.patch('/:id/status', authenticate, authorize('Admin', 'Manager', 'Receptionist', 'Housekeeping'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid service request status.' });
    }
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    if (!serviceRequest) return res.status(404).json({ message: 'Service request not found' });

    if (status) serviceRequest.status = status;
    if (!serviceRequest.assignedTo) serviceRequest.assignedTo = req.user._id;

    await serviceRequest.save();
    res.json({ message: 'Service request updated', serviceRequest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
