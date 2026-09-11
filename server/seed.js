const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const RoomType = require('./models/RoomType');
const Room = require('./models/Room');
const Setting = require('./models/Setting');
const Notification = require('./models/Notification');
const Service = require('./models/Service');
const Promotion = require('./models/Promotion');
const Amenity = require('./models/Amenity');
const Booking = require('./models/Booking');
const Invoice = require('./models/Invoice');
const ServiceRequest = require('./models/ServiceRequest');
const HousekeepingTask = require('./models/HousekeepingTask');
const HousekeepingReport = require('./models/HousekeepingReport');
const MaintenanceRequest = require('./models/MaintenanceRequest');
const Feedback = require('./models/Feedback');

/*
|--------------------------------------------------------------------------
| VICTORIA LUXURYSTAY HMS - DATABASE SEED
|--------------------------------------------------------------------------
|
| Core roles:
|   Admin
|   Manager
|   Receptionist
|   Housekeeping
|   Maintenance
|   Guest
|
| Guest types:
|   VIP
|   NORMAL
|
| Important:
| - Only ONE Admin is seeded.
| - Maintenance is a supported staff role and workflow.
| - Only 3 rooms are initially seeded.
| - Passwords are stored as bcrypt hashes.
| - No passwords are returned to the frontend.
| - Seed is idempotent and does NOT delete the entire database.
|
|--------------------------------------------------------------------------
*/

const DEFAULT_PASSWORD = 'Password123';

async function seedData() {
  console.log('');
  console.log('======================================================');
  console.log(' Victoria LuxuryStay HMS - Database Seed');
  console.log('======================================================');

  /*
  |--------------------------------------------------------------------------
  | 1. HASH DEFAULT PASSWORD
  |--------------------------------------------------------------------------
  */

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  /*
  |--------------------------------------------------------------------------
  | 2. CREATE / UPDATE ADMIN
  |--------------------------------------------------------------------------
  |
  | There must be exactly one seeded Admin.
  |
  */

  let admin = await User.findOne({
    email: 'admin@hotel.com'
  });

  if (!admin) {
    admin = await User.create({
      name: 'Victoria Hotel Administrator',
      email: 'admin@hotel.com',
      password: hashedPassword,
      role: 'Admin',
      phone: '+1 (555) 0101',
      isActive: true
    });

    console.log('✓ Admin account created');
  } else {
    admin.role = 'Admin';
    admin.password = hashedPassword;
    admin.isActive = true;
    await admin.save();

    console.log('✓ Admin account already exists');
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE OLD SECONDARY ADMIN
  |--------------------------------------------------------------------------
  |
  | The old seed created admin1@hotel.com as a second Admin.
  | This project now requires a single Admin account.
  |
  */

  await User.deleteOne({
    email: 'admin1@hotel.com'
  });

  await User.deleteOne({
    email: 'admin2@hotel.com'
  });

  /*
  |--------------------------------------------------------------------------
  | 3. CREATE / UPDATE MANAGER
  |--------------------------------------------------------------------------
  */

  let manager = await User.findOne({
    email: 'manager@hotel.com'
  });

  if (!manager) {
    manager = await User.create({
      name: 'General Manager',
      email: 'manager@hotel.com',
      password: hashedPassword,
      role: 'Manager',
      phone: '+1 (555) 0103',
      isActive: true
    });

    console.log('✓ Manager account created');
  } else {
    manager.role = 'Manager';
    manager.password = hashedPassword;
    manager.isActive = true;
    await manager.save();

    console.log('✓ Manager account already exists');
  }

  /*
  |--------------------------------------------------------------------------
  | 4. CREATE / UPDATE RECEPTIONIST
  |--------------------------------------------------------------------------
  */

  let receptionist = await User.findOne({
    email: 'receptionist@hotel.com'
  });

  if (!receptionist) {
    receptionist = await User.create({
      name: 'Front Desk Receptionist',
      email: 'receptionist@hotel.com',
      password: hashedPassword,
      role: 'Receptionist',
      phone: '+1 (555) 0104',
      isActive: true
    });

    console.log('✓ Receptionist account created');
  } else {
    receptionist.role = 'Receptionist';
    receptionist.password = hashedPassword;
    receptionist.isActive = true;
    await receptionist.save();

    console.log('✓ Receptionist account already exists');
  }

  /*
  |--------------------------------------------------------------------------
  | 5. CREATE / UPDATE HOUSEKEEPING
  |--------------------------------------------------------------------------
  */

  let housekeeping = await User.findOne({
    email: 'housekeeping@hotel.com'
  });

  if (!housekeeping) {
    housekeeping = await User.create({
      name: 'Housekeeping Supervisor',
      email: 'housekeeping@hotel.com',
      password: hashedPassword,
      role: 'Housekeeping',
      phone: '+1 (555) 0105',
      isActive: true
    });

    console.log('✓ Housekeeping account created');
  } else {
    housekeeping.role = 'Housekeeping';
    housekeeping.password = hashedPassword;
    housekeeping.isActive = true;
    await housekeeping.save();

    console.log('✓ Housekeeping account already exists');
  }

  /*
  |--------------------------------------------------------------------------
  | 6. CREATE / UPDATE MAINTENANCE
  |--------------------------------------------------------------------------
  */

  let maintenance = await User.findOne({ email: 'maintenance@hotel.com' });

  if (!maintenance) {
    maintenance = await User.create({
      name: 'Maintenance Engineer',
      email: 'maintenance@hotel.com',
      password: hashedPassword,
      role: 'Maintenance',
      phone: '+1 (555) 0108',
      isActive: true
    });
    console.log('✓ Maintenance account created');
  } else {
    maintenance.role = 'Maintenance';
    maintenance.password = hashedPassword;
    maintenance.isActive = true;
    await maintenance.save();
    console.log('✓ Maintenance account already exists');
  }

  /*
  |--------------------------------------------------------------------------
  | 7. CREATE / UPDATE VIP GUEST
  |--------------------------------------------------------------------------
  */

  let vipGuest = await User.findOne({
    email: 'guest@hotel.com'
  });

  if (!vipGuest) {
    vipGuest = await User.create({
      name: 'Julian Vance',
      email: 'guest@hotel.com',
      password: hashedPassword,
      role: 'Guest',
      guestType: 'VIP',
      phone: '+1 (555) 0106',
      isActive: true
    });

    console.log('✓ VIP guest created');
  } else {
    vipGuest.role = 'Guest';
    vipGuest.password = hashedPassword;
    vipGuest.guestType = 'VIP';
    vipGuest.isActive = true;
    await vipGuest.save();

    console.log('✓ VIP guest already exists');
  }

  /*
  |--------------------------------------------------------------------------
  | 8. CREATE / UPDATE NORMAL GUEST
  |--------------------------------------------------------------------------
  */

  let normalGuest = await User.findOne({
    email: 'normalguest@hotel.com'
  });

  if (!normalGuest) {
    normalGuest = await User.create({
      name: 'Sophia Bennett',
      email: 'normalguest@hotel.com',
      password: hashedPassword,
      role: 'Guest',
      guestType: 'NORMAL',
      phone: '+1 (555) 0107',
      isActive: true
    });

    console.log('✓ Normal guest created');
  } else {
    normalGuest.role = 'Guest';
    normalGuest.password = hashedPassword;
    normalGuest.guestType = 'NORMAL';
    normalGuest.isActive = true;
    await normalGuest.save();

    console.log('✓ Normal guest already exists');
  }

  /*
  |--------------------------------------------------------------------------
  | 9. ROOM TYPES
  |--------------------------------------------------------------------------
  */

  const roomTypes = [
    {
      name: 'Deluxe Ocean King Suite',
      description:
        'Elegant king suite with ocean views, private terrace and premium bathroom.',
      basePrice: 280,
      capacity: 2,
      amenities: [
        'Ocean View',
        'Private Terrace',
        'King Bed',
        'Premium Bathroom',
        'Smart TV'
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Executive Oceanfront Suite',
      description:
        'Spacious executive suite with oceanfront views, separate sitting area and premium amenities.',
      basePrice: 520,
      capacity: 3,
      amenities: [
        'Oceanfront View',
        'Living Area',
        'King Bed',
        'Premium Bathroom',
        'Mini Bar'
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Royal Presidential Penthouse Villa',
      description:
        'Luxury penthouse accommodation with panoramic views and premium private facilities.',
      basePrice: 850,
      capacity: 4,
      amenities: [
        'Panoramic View',
        'Private Pool',
        'Private Lounge',
        'Luxury Bathroom',
        'Premium Dining'
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  const createdRoomTypes = {};

  for (const data of roomTypes) {
    let roomType = await RoomType.findOne({
      name: data.name
    });

    if (!roomType) {
      roomType = await RoomType.create(data);
      console.log(`✓ Room type created: ${data.name}`);
    }

    createdRoomTypes[data.name] = roomType;
  }

  /*
  |--------------------------------------------------------------------------
  | 10. EXACTLY THREE INITIAL ROOMS
  |--------------------------------------------------------------------------
  |
  | These are ONLY initial demo rooms.
  |
  | Future rooms must be created through Admin functionality
  | and stored in MongoDB.
  |
  */

  const initialRooms = [
    {
      roomNumber: '101',
      roomType: createdRoomTypes['Deluxe Ocean King Suite']._id,
      floor: 1,
      pricePerNight: 280,
      status: 'Occupied',
      notes: 'Currently occupied by VIP guest.'
    },
    {
      roomNumber: '102',
      roomType: createdRoomTypes['Executive Oceanfront Suite']._id,
      floor: 1,
      pricePerNight: 520,
      status: 'Available',
      notes: 'Cleaned and ready for arrival.'
    },
    {
      roomNumber: '103',
      roomType: createdRoomTypes['Royal Presidential Penthouse Villa']._id,
      floor: 1,
      pricePerNight: 850,
      status: 'Cleaning',
      notes: 'Housekeeping turnover in progress.'
    }
  ];

  const rooms = {};

  for (const data of initialRooms) {
    let room = await Room.findOne({
      roomNumber: data.roomNumber
    });

    if (!room) {
      room = await Room.create(data);
      console.log(`✓ Initial room created: ${data.roomNumber}`);
    } else {
      /*
       * Do not overwrite operational room status if the room
       * already exists and may have been modified by staff.
       */
      room.roomType = data.roomType;
      room.floor = data.floor;
      room.pricePerNight = data.pricePerNight;

      if (!room.status) {
        room.status = data.status;
      }

      if (!room.notes) {
        room.notes = data.notes;
      }

      await room.save();
    }

    rooms[data.roomNumber] = room;
  }

  console.log('✓ Initial room inventory verified: 101, 102, 103');

  /*
  |--------------------------------------------------------------------------
  | 11. HOTEL SETTINGS
  |--------------------------------------------------------------------------
  */

  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({
      hotelName: 'Victoria LuxuryStay Grand Resort & Ocean Suites',
      tagline: 'A Sanctuary of Coastal Splendor & Refined Elegance',
      hotelAddress: '100 Ocean Promenade, Sovereign Bay, CA 90210',
      hotelEmail: 'concierge@luxurystay-victoria.com',
      hotelPhone: '+1 (800) 555-LUXURY',
      taxRate: 12,
      currency: 'USD ($)',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy:
        'Complimentary cancellation up to 48 hours prior to arrival date.',
      wifiPassword: 'VICTORIA_SANCTUARY_2026',
      breakfastHours: '06:30 AM - 11:00 AM',
      welcomeMessage:
        'Welcome to Victoria LuxuryStay. Your personal sanctuary of uncompromising luxury and timeless elegance.'
    });

    console.log('✓ Hotel settings created');
  }

  /*
  |--------------------------------------------------------------------------
  | 12. SERVICES
  |--------------------------------------------------------------------------
  */

  const services = [
    {
      name: 'Premium In-Room Dining',
      category: 'Dining',
      price: 185,
      description:
        'Premium in-room dining experience prepared by the hotel kitchen.',
      imageUrl:
        'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
      isAvailable: true
    },
    {
      name: 'Sommelier Wine Service',
      category: 'Beverages',
      price: 120,
      description:
        'Curated wine selection served by the hotel service team.',
      imageUrl:
        'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
      isAvailable: true
    },
    {
      name: 'Deep Sea Mineral Massage',
      category: 'Spa & Wellness',
      price: 210,
      description:
        'Relaxing 60-minute mineral stone massage treatment.',
      imageUrl:
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80',
      isAvailable: true
    },
    {
      name: 'Airport Transfer',
      category: 'Transportation',
      price: 250,
      description:
        'Private luxury airport transfer service.',
      imageUrl:
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
      isAvailable: true
    }
  ];

  for (const serviceData of services) {
    const existingService = await Service.findOne({
      name: serviceData.name
    });

    if (!existingService) {
      await Service.create(serviceData);
      console.log(`✓ Service created: ${serviceData.name}`);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | 13. SAMPLE BOOKING FOR VIP GUEST
  |--------------------------------------------------------------------------
  */

  let booking1 = await Booking.findOne({
    bookingId: 'BK-918204'
  });

  const today = new Date();

  const checkIn = new Date(today);
  checkIn.setHours(15, 0, 0, 0);

  const checkOut = new Date(today);
  checkOut.setDate(checkOut.getDate() + 3);
  checkOut.setHours(11, 0, 0, 0);

  if (!booking1) {
    booking1 = await Booking.create({
      bookingId: 'BK-918204',
      guest: vipGuest._id,
      room: rooms['101']._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: 2,
      totalAmount: 940.8,
      status: 'Checked-In',
      specialRequests:
        'Ocean view terrace and late checkout.'
    });

    console.log('✓ Sample VIP booking created');
  }

  /*
  |--------------------------------------------------------------------------
  | 14. SAMPLE INVOICE
  |--------------------------------------------------------------------------
  */

  let invoice = await Invoice.findOne({
    invoiceNumber: 'INV-720194'
  });

  if (!invoice) {
    await Invoice.create({
      invoiceNumber: 'INV-720194',
      booking: booking1._id,
      guest: vipGuest._id,
      roomCharges: 840,
      serviceCharges: 0,
      subtotal: 840,
      taxRate: 12,
      taxAmount: 100.8,
      discount: 0,
      grandTotal: 940.8,
      paymentStatus: 'Paid',
      paymentMethod: 'Card',
      paidAt: new Date()
    });

    console.log('✓ Sample invoice created');
  }

  /*
  |--------------------------------------------------------------------------
  | 15. HOUSEKEEPING TASK
  |--------------------------------------------------------------------------
  */

  let housekeepingTask = await HousekeepingTask.findOne({
    room: rooms['103']._id
  });

  if (!housekeepingTask) {
    await HousekeepingTask.create({
      room: rooms['103']._id,
      assignedTo: housekeeping._id,
      status: 'In Progress',
      priority: 'High',
      notes:
        'Post-checkout turnover, deep cleaning and linen replacement.'
    });

    console.log('✓ Housekeeping task created');
  }

  /*
  |--------------------------------------------------------------------------
  | 16. HOUSEKEEPING REPORT - ROOM 103
  |--------------------------------------------------------------------------
  */

  let report103 = await HousekeepingReport.findOne({
    roomId: rooms['103']._id,
    reportedBy: housekeeping._id,
    reportType: 'Needs Cleaning'
  });

  if (!report103) {
    await HousekeepingReport.create({
      roomId: rooms['103']._id,
      reportedBy: housekeeping._id,
      reportType: 'Needs Cleaning',
      notes:
        'Turnover cleaning in progress. Fresh towels and room supplies replenished.',
      status: 'In Progress',
      resolution: ''
    });

    console.log('✓ Housekeeping report created for room 103');
  }

  /*
  |--------------------------------------------------------------------------
  | 17. HOUSEKEEPING REPORT - ROOM 102
  |--------------------------------------------------------------------------
  */

  let report102 = await HousekeepingReport.findOne({
    roomId: rooms['102']._id,
    reportedBy: housekeeping._id,
    reportType: 'Cleaning Completed'
  });

  if (!report102) {
    await HousekeepingReport.create({
      roomId: rooms['102']._id,
      reportedBy: housekeeping._id,
      reportType: 'Cleaning Completed',
      notes:
        'Room completely cleaned, sanitized and inspected.',
      status: 'Resolved',
      resolution:
        'Inspected and certified by Housekeeping Supervisor.',
      resolvedBy: manager._id
    });

    console.log('✓ Housekeeping report created for room 102');
  }

  /*
  |--------------------------------------------------------------------------
  | 18. MAINTENANCE REQUEST
  |--------------------------------------------------------------------------
  |
  | Maintenance is a request/workflow, not a login role.
  |
  */

  let maintenanceRequest = await MaintenanceRequest.findOne({
    room: rooms['103']._id,
    problemDescription:
      'Balcony ambient lantern dimmer sensor calibration.'
  });

  if (!maintenanceRequest) {
    await MaintenanceRequest.create({
      room: rooms['103']._id,
      reportedBy: housekeeping._id,
      assignedTo: maintenance._id,
      problemDescription:
        'Balcony ambient lantern dimmer sensor calibration.',
      priority: 'Medium',
      status: 'Pending',
      repairNotes: 'Maintenance request submitted to administration.'
    });

    console.log('✓ Maintenance request created');
  } else {
    maintenanceRequest.assignedTo = maintenance._id;
    await maintenanceRequest.save();
  }

  /*
  |--------------------------------------------------------------------------
  | 19. FEEDBACK
  |--------------------------------------------------------------------------
  */

  let feedback = await Feedback.findOne({
    booking: booking1._id
  });

  if (!feedback) {
    await Feedback.create({
      booking: booking1._id,
      guest: vipGuest._id,
      rating: 5,
      comments:
        'Excellent hospitality and attention to detail.',
      response:
        'Thank you for your valuable feedback. We are delighted to host you.'
    });

    console.log('✓ Sample guest feedback created');
  }

  /*
  |--------------------------------------------------------------------------
  | 20. NOTIFICATIONS
  |--------------------------------------------------------------------------
  */

  const notificationExists = await Notification.findOne({
    title: 'Victoria LuxuryStay HMS Live'
  });

  if (!notificationExists) {
    await Notification.create({
      targetRole: 'All',
      title: 'Victoria LuxuryStay HMS Live',
      message:
        'MongoDB database is connected and the hotel management system is operational.',
      type: 'info'
    });
  }

  const vipNotificationExists = await Notification.findOne({
    title: 'VIP Patron Arrival'
  });

  if (!vipNotificationExists) {
    await Notification.create({
      targetRole: 'Admin',
      title: 'VIP Patron Arrival',
      message:
        'A VIP guest is currently checked in to room 101.',
      type: 'success'
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 21. FINAL VERIFICATION
  |--------------------------------------------------------------------------
  */

  const userCount = await User.countDocuments();

  const adminCount = await User.countDocuments({
    role: 'Admin'
  });

  const managerCount = await User.countDocuments({
    role: 'Manager'
  });

  const receptionistCount = await User.countDocuments({
    role: 'Receptionist'
  });

  const housekeepingCount = await User.countDocuments({
    role: 'Housekeeping'
  });

  const guestCount = await User.countDocuments({
    role: 'Guest'
  });

  const roomCount = await Room.countDocuments();

  console.log('');
  console.log('======================================================');
  console.log(' DATABASE SEED VERIFICATION');
  console.log('======================================================');

  console.log(`Users:          ${userCount}`);
  console.log(`Admins:         ${adminCount}`);
  console.log(`Managers:       ${managerCount}`);
  console.log(`Receptionists:  ${receptionistCount}`);
  console.log(`Housekeeping:   ${housekeepingCount}`);
  console.log(`Guests:         ${guestCount}`);
  console.log(`Rooms:          ${roomCount}`);

  console.log('');

  if (adminCount !== 1) {
    console.warn(
      `WARNING: Expected exactly 1 Admin, found ${adminCount}.`
    );
  }

  if (roomCount < 3) {
    console.warn(
      `WARNING: Expected at least 3 initial rooms, found ${roomCount}.`
    );
  }

  console.log('======================================================');
  console.log(' Seed completed successfully.');
  console.log('======================================================');
  console.log('');
}

/*
|--------------------------------------------------------------------------
| STANDALONE EXECUTION
|--------------------------------------------------------------------------
*/

if (require.main === module) {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('');
    console.error('❌ MONGO_URI / MONGODB_URI is not configured.');
    console.error(
      'Please add your MongoDB connection string to the backend .env file.'
    );
    console.error('');
    process.exit(1);
  }

  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log('✓ Connected to MongoDB');

      await seedData();

      await mongoose.disconnect();

      console.log('✓ Disconnected from MongoDB');
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('');
      console.error('❌ Database Seed Error');
      console.error(error);
      console.error('');

      try {
        await mongoose.disconnect();
      } catch (_) {
        // Ignore disconnect errors
      }

      process.exit(1);
    });
}

module.exports = seedData;