const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  hotelName: { type: String, default: 'LuxuryStay Grand Hotel & Resort' },
  tagline: { type: String, default: 'The Pinnacle of Coastal Luxury & Hospitality' },
  hotelAddress: { type: String, default: '100 Ocean Drive, Suite 500, Paradise Bay' },
  hotelEmail: { type: String, default: 'concierge@luxurystay.com' },
  hotelPhone: { type: String, default: '+1 (800) 555-LUXURY' },
  taxRate: { type: Number, default: 12 }, // Percentage
  currency: { type: String, default: 'USD ($)' },
  checkInTime: { type: String, default: '14:00' },
  checkOutTime: { type: String, default: '11:00' },
  cancellationPolicy: { type: String, default: 'Free cancellation up to 24 hours before check-in date.' },
  wifiPassword: { type: String, default: 'LUXURY_GUEST_2026' },
  breakfastHours: { type: String, default: '06:30 AM - 10:30 AM' },
  welcomeMessage: { type: String, default: 'Welcome to an unforgettable luxury experience tailored specifically for you.' },
  logoUrl: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Setting', settingSchema);
