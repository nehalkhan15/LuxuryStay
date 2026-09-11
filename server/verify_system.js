const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = require('./server');

let server;
let baseUrl;
let createdBookingId;
let createdReportId;
let createdInvoiceId;
let createdFeedbackId;
let createdTaskId;

// Helper fetch wrapper for Node http testing
async function apiRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const status = response.status;
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }
  return { status, data };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
  }
}

async function runVerification() {
  console.log('=================================================================');
  console.log('  LUXURYSTAY HMS — VICTORIA EDITION SYSTEM VERIFICATION');
  console.log('=================================================================\n');

  // 1. Start ephemeral HTTP server
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[TEST SERVER] Ephemeral test server active on ${baseUrl}`);
      resolve();
    });
  });

  // Wait for MongoDB to be connected
  if (mongoose.connection.readyState !== 1) {
    console.log('Waiting for MongoDB persistent connection...');
    await new Promise((resolve) => {
      mongoose.connection.once('open', resolve);
    });
  }
  console.log('Persistent MongoDB connected (readyState = 1).\n');

  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: SEEDED INVENTORY (EXACTLY 3 ROOMS & 3 ROOM TYPES)
    // -------------------------------------------------------------
    console.log('>>> TEST SUITE 1: Seeded Inventory & Catalog Standards');
    const Room = require('./models/Room');
    const RoomType = require('./models/RoomType');
    const User = require('./models/User');

    const roomsInDb = await Room.find().sort({ roomNumber: 1 });
    assert(roomsInDb.length >= 3, `Expected at least the 3 initial rooms in DB, found: ${roomsInDb.length}`);
    const roomNumbers = roomsInDb.map(r => r.roomNumber);
    assert(roomNumbers.includes('101') && roomNumbers.includes('102') && roomNumbers.includes('103'),
      `Rooms must be 101, 102, 103. Found: ${roomNumbers.join(', ')}`);

    const roomTypesInDb = await RoomType.find();
    assert(roomTypesInDb.length >= 3, `Expected at least 3 initial room types in DB, found: ${roomTypesInDb.length}`);

    // -------------------------------------------------------------
    // TEST SUITE 2: AUTHENTICATION FOR ALL 5 SYSTEM ROLES
    // -------------------------------------------------------------
    console.log('\n>>> TEST SUITE 2: Multi-Role Authentication');
    const credentials = [
      { role: 'Admin', email: 'admin@hotel.com', pass: 'Password123' },
      { role: 'Manager', email: 'manager@hotel.com', pass: 'Password123' },
      { role: 'Receptionist', email: 'receptionist@hotel.com', pass: 'Password123' },
      { role: 'Housekeeping', email: 'housekeeping@hotel.com', pass: 'Password123' },
      { role: 'Maintenance', email: 'maintenance@hotel.com', pass: 'Password123' },
      { role: 'Guest (VIP)', email: 'guest@hotel.com', pass: 'Password123' },
      { role: 'Guest (Normal)', email: 'normalguest@hotel.com', pass: 'Password123' }
    ];

    const tokens = {};
    for (const cred of credentials) {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: cred.email, password: cred.pass }
      });
      const ok = res.status === 200 && res.data?.token;
      assert(ok, `Login successful for role [${cred.role}] (${cred.email})`);
      if (ok) {
        tokens[cred.email] = res.data.token;
      }
    }

    const adminToken = tokens['admin@hotel.com'];
    const managerToken = tokens['manager@hotel.com'];
    const receptionistToken = tokens['receptionist@hotel.com'];
    const housekeepingToken = tokens['housekeeping@hotel.com'];
    const maintenanceToken = tokens['maintenance@hotel.com'];
    const vipGuestToken = tokens['guest@hotel.com'];
    const normalGuestToken = tokens['normalguest@hotel.com'];

    const wrongPasswordRes = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@hotel.com', password: 'WrongPassword' }
    });
    assert(wrongPasswordRes.status === 401,
      `Wrong password is rejected: HTTP ${wrongPasswordRes.status}`);

    const missingUserRes = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'missing-user@hotel.com', password: 'Password123' }
    });
    assert(missingUserRes.status === 401,
      `Nonexistent user is rejected: HTTP ${missingUserRes.status}`);

    // -------------------------------------------------------------
    // TEST SUITE 3: STRICT ADMIN-ONLY STAFF MANAGEMENT & RBAC ENFORCEMENT
    // -------------------------------------------------------------
    console.log('\n>>> TEST SUITE 3: Staff Management & RBAC Protection (HTTP 403 Forbidden)');

    // 3A: Admin GET /api/staff -> 200 OK
    const adminStaffRes = await apiRequest('/api/staff', { token: adminToken });
    assert(adminStaffRes.status === 200 && Array.isArray(adminStaffRes.data),
      `Admin can list staff (/api/staff): HTTP ${adminStaffRes.status} with ${adminStaffRes.data?.length} staff members`);

    // 3B: Non-Admin roles attempting GET /api/staff -> 403 Forbidden
    const managerStaffGet = await apiRequest('/api/staff', { token: managerToken });
    assert(managerStaffGet.status === 403,
      `Manager blocked from GET /api/staff: HTTP ${managerStaffGet.status} (Expected 403)`);

    const receptionistStaffGet = await apiRequest('/api/staff', { token: receptionistToken });
    assert(receptionistStaffGet.status === 403,
      `Receptionist blocked from GET /api/staff: HTTP ${receptionistStaffGet.status} (Expected 403)`);

    const housekeepingStaffGet = await apiRequest('/api/staff', { token: housekeepingToken });
    assert(housekeepingStaffGet.status === 403,
      `Housekeeping blocked from GET /api/staff: HTTP ${housekeepingStaffGet.status} (Expected 403)`);

    const guestStaffGet = await apiRequest('/api/staff', { token: vipGuestToken });
    assert(guestStaffGet.status === 403,
      `Guest blocked from GET /api/staff: HTTP ${guestStaffGet.status} (Expected 403)`);

    const maintenanceStaffGet = await apiRequest('/api/staff', { token: maintenanceToken });
    assert(maintenanceStaffGet.status === 403,
      `Maintenance blocked from GET /api/staff: HTTP ${maintenanceStaffGet.status} (Expected 403)`);

    // 3C: Manager attempting POST /api/staff -> 403 Forbidden
    const managerCreateStaff = await apiRequest('/api/staff', {
      method: 'POST',
      token: managerToken,
      body: { name: 'Illegal User', email: 'illegal@hotel.com', password: 'password123', role: 'Receptionist' }
    });
    assert(managerCreateStaff.status === 403,
      `Manager blocked from POST /api/staff: HTTP ${managerCreateStaff.status} (Expected 403)`);

    // 3D: Admin creating a new staff account -> 201 Created
    const testStaffEmail = `staff_verify_${Date.now()}@hotel.com`;
    const adminCreateStaff = await apiRequest('/api/staff', {
      method: 'POST',
      token: adminToken,
      body: { name: 'Test Clerk', email: testStaffEmail, password: 'password123', role: 'Receptionist', phone: '555-0199' }
    });
    assert(adminCreateStaff.status === 201 && adminCreateStaff.data?.staff?.email === testStaffEmail,
      `Admin successfully created new staff via POST /api/staff: HTTP ${adminCreateStaff.status}`);
    const createdStaffId = adminCreateStaff.data?.staff?._id;

    // 3E: Admin toggling staff account status (Deactivate / Activate)
    if (createdStaffId) {
      const toggleRes = await apiRequest(`/api/staff/${createdStaffId}/status`, {
        method: 'PATCH',
        token: adminToken
      });
      assert(toggleRes.status === 200 && toggleRes.data?.staff?.isActive === false,
        `Admin toggled staff status to Deactivated: HTTP ${toggleRes.status}`);

      const inactiveLoginRes = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: testStaffEmail, password: 'password123' }
      });
      assert(inactiveLoginRes.status === 403,
        `Deactivated staff cannot log in: HTTP ${inactiveLoginRes.status}`);

      // Clean up test staff
      await apiRequest(`/api/staff/${createdStaffId}`, { method: 'DELETE', token: adminToken });
    }

    // -------------------------------------------------------------
    // TEST SUITE 4: HOUSEKEEPING REPORTS MODEL & LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n>>> TEST SUITE 4: Housekeeping Reports Architecture');

    // 4A: Housekeeping files report -> 201 Created
    const room102 = roomsInDb.find(r => r.roomNumber === '102') || roomsInDb[1];
    const reportRes = await apiRequest('/api/housekeeping-reports', {
      method: 'POST',
      token: housekeepingToken,
      body: {
        roomId: room102._id,
        reportType: 'Damaged',
        notes: 'Verified crack on bedside brass reading lamp fixture.'
      }
    });
    assert(reportRes.status === 201 && reportRes.data?.reportType === 'Damaged',
      `Housekeeping created report via POST /api/housekeeping-reports: HTTP ${reportRes.status}`);
    createdReportId = reportRes.data?._id;
    const reportId = createdReportId;

    const maintenanceUser = await User.findOne({ email: 'maintenance@hotel.com' });
    const assignRes = await apiRequest(`/api/housekeeping-reports/${reportId}/assign`, {
      method: 'PATCH',
      token: managerToken,
      body: { assignedTo: maintenanceUser._id }
    });
    assert(assignRes.status === 200 && assignRes.data?.report?.assignedTo?.email === 'maintenance@hotel.com',
      `Manager assigned report to Maintenance employee: HTTP ${assignRes.status}`);

    // 4B: Admin retrieves reports -> 200 OK
    const adminReportsRes = await apiRequest('/api/housekeeping-reports', { token: adminToken });
    assert(adminReportsRes.status === 200 && Array.isArray(adminReportsRes.data),
      `Admin can view all housekeeping reports: HTTP ${adminReportsRes.status} (${adminReportsRes.data?.length} reports)`);

    // 4C: Manager resolves the report
    if (reportId) {
      const resolveRes = await apiRequest(`/api/housekeeping-reports/${reportId}/resolve`, {
        method: 'PATCH',
        token: managerToken,
        body: { resolution: 'Replaced with spare artisan brass lamp from storeroom.' }
      });
      assert(resolveRes.status === 200 && resolveRes.data?.report?.status === 'Resolved',
        `Manager resolved housekeeping report: HTTP ${resolveRes.status} (Status: ${resolveRes.data?.report?.status})`);
    }

    // 4D: Receptionist blocked from GET /api/housekeeping-reports -> 403 Forbidden
    const receptReportRes = await apiRequest('/api/housekeeping-reports', { token: receptionistToken });
    assert(receptReportRes.status === 403,
      `Receptionist blocked from /api/housekeeping-reports: HTTP ${receptReportRes.status} (Expected 403)`);

    const maintenanceRequestsRes = await apiRequest('/api/maintenance', { token: maintenanceToken });
    assert(maintenanceRequestsRes.status === 200 && Array.isArray(maintenanceRequestsRes.data),
      `Maintenance can view assigned maintenance requests: HTTP ${maintenanceRequestsRes.status}`);

    // -------------------------------------------------------------
    // TEST SUITE 5: DOUBLE BOOKING PREVENTION & DATE OVERLAP
    // -------------------------------------------------------------
    console.log('\n>>> TEST SUITE 5: Double Booking Prevention & Integrity');
    const room103 = roomsInDb.find(r => r.roomNumber === '103') || roomsInDb[2];

    const todayStr = new Date().toISOString().split('T')[0];
    const in3DaysStr = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
    const in5DaysStr = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];

    // First Booking
    const bookRes1 = await apiRequest('/api/bookings', {
      method: 'POST',
      token: vipGuestToken,
      body: {
        roomId: room103._id,
        checkInDate: todayStr,
        checkOutDate: in3DaysStr,
        numberOfGuests: 2
      }
    });
    assert(bookRes1.status === 201, `Initial booking created for Room 103: HTTP ${bookRes1.status}`);
    createdBookingId = bookRes1.data?._id;

    const catalogRes = await apiRequest('/api/services/catalog');
    const catalogItem = Array.isArray(catalogRes.data) ? catalogRes.data[0] : null;
    const serviceRes = await apiRequest('/api/services', {
      method: 'POST',
      token: vipGuestToken,
      body: { bookingId: createdBookingId, serviceId: catalogItem?._id }
    });
    assert(!!catalogItem && serviceRes.status === 201 && serviceRes.data?.cost === catalogItem.price,
      `Guest service order uses catalog pricing: HTTP ${serviceRes.status}`);

    const crossServiceRes = await apiRequest('/api/services', {
      method: 'POST',
      token: normalGuestToken,
      body: { bookingId: createdBookingId, serviceId: catalogItem?._id }
    });
    assert(crossServiceRes.status === 403,
      `Guest cannot order service against another guest booking: HTTP ${crossServiceRes.status}`);

    const ServiceRequest = require('./models/ServiceRequest');
    await ServiceRequest.deleteOne({ _id: serviceRes.data?._id });

    // Conflicting Overlapping Booking on Same Room
    const overlapRes = await apiRequest('/api/bookings', {
      method: 'POST',
      token: normalGuestToken,
      body: {
        roomId: room103._id,
        checkInDate: todayStr,
        checkOutDate: in5DaysStr,
        numberOfGuests: 2
      }
    });
    assert(overlapRes.status === 400,
      `Double booking correctly rejected with HTTP 400: "${overlapRes.data?.message}"`);

    // -------------------------------------------------------------
    // TEST SUITE 6: OPERATIONAL LIFECYCLE (CHECK-IN -> CHECK-OUT -> CLEANING)
    // -------------------------------------------------------------
    console.log('\n>>> TEST SUITE 6: Operational Lifecycle & Automatic Housekeeping Task');

    if (createdBookingId) {
      // Check-In
      const checkInRes = await apiRequest(`/api/bookings/${createdBookingId}/check-in`, {
        method: 'PATCH',
        token: receptionistToken
      });
      assert(checkInRes.status === 200 && checkInRes.data?.booking?.status === 'Checked-In',
        `Guest checked in: Booking status is "${checkInRes.data?.booking?.status}"`);

      // Verify room is Occupied
      const roomAfterCheckIn = await Room.findById(room103._id);
      assert(roomAfterCheckIn.status === 'Occupied',
        `Room 103 state transitioned to Occupied (Found: "${roomAfterCheckIn.status}")`);

      // Check-Out
      const checkOutRes = await apiRequest(`/api/bookings/${createdBookingId}/check-out`, {
        method: 'PATCH',
        token: receptionistToken
      });
      assert(checkOutRes.status === 200 && checkOutRes.data?.booking?.status === 'Checked-Out',
        `Guest checked out: Booking status is "${checkOutRes.data?.booking?.status}"`);

      // Verify room is Cleaning
      const roomAfterCheckOut = await Room.findById(room103._id);
      assert(roomAfterCheckOut.status === 'Cleaning',
        `Room 103 state transitioned to Cleaning (Found: "${roomAfterCheckOut.status}")`);

      // Verify Housekeeping task was automatically dispatched
      const HousekeepingTask = require('./models/HousekeepingTask');
      const autoTask = await HousekeepingTask.findOne({ room: room103._id, status: 'Pending' });
      createdTaskId = autoTask?._id;
      assert(!!autoTask, `Housekeeping cleaning task automatically generated for Room 103 turnover`);

      // Housekeeping completes task -> Room returns to Available
      if (autoTask) {
        const completeTaskRes = await apiRequest(`/api/housekeeping/${autoTask._id}/complete`, {
          method: 'PATCH',
          token: housekeepingToken
        });
        assert(completeTaskRes.status === 200, `Housekeeper completed turnover task`);

        const roomAfterClean = await Room.findById(room103._id);
        assert(roomAfterClean.status === 'Available',
          `Room 103 state transitioned to Available (Found: "${roomAfterClean.status}")`);
      }
    }

    // -------------------------------------------------------------
    // TEST SUITE 7: VIP VS NORMAL GUEST CLASSIFICATION
    // -------------------------------------------------------------
    console.log('\n>>> TEST SUITE 7: VIP vs NORMAL Guest Classification');
    const normalGuest = await User.findOne({ email: 'normalguest@hotel.com' });
    assert(normalGuest.guestType === 'NORMAL', `Initial state for normalguest is NORMAL`);

    // Only Admin can change guest classification
    const upgradeRes = await apiRequest(`/api/users/${normalGuest._id}/guest-type`, {
      method: 'PATCH',
      token: adminToken,
      body: { guestType: 'VIP' }
    });
    assert(upgradeRes.status === 200 && upgradeRes.data?.user?.guestType === 'VIP',
      `Admin elevated guest to VIP: HTTP ${upgradeRes.status} (guestType: ${upgradeRes.data?.user?.guestType})`);

    // Revert back to NORMAL
    await apiRequest(`/api/users/${normalGuest._id}/guest-type`, {
      method: 'PATCH',
      token: adminToken,
      body: { guestType: 'NORMAL' }
    });

    // -------------------------------------------------------------
    // TEST SUITE 8: GUEST DATA PRIVACY & ISOLATION
    // -------------------------------------------------------------
    console.log('\n>>> TEST SUITE 8: Guest Data Privacy & Cross-Account Isolation');
    // Normal Guest attempting to fetch VIP Guest's booking by ID
    if (createdBookingId) {
      const unauthorizedBookingAccess = await apiRequest(`/api/bookings/${createdBookingId}`, {
        token: normalGuestToken
      });
      assert(unauthorizedBookingAccess.status === 403,
        `Guest isolated from viewing another guest's booking: HTTP ${unauthorizedBookingAccess.status} (Expected 403)`);
    }

    // Invoice generation and isolation check
    if (createdBookingId) {
      const invRes = await apiRequest(`/api/invoices/generate/${createdBookingId}`, {
        method: 'POST',
        token: receptionistToken
      });
      createdInvoiceId = invRes.data?._id;
      const invoiceId = createdInvoiceId;

      if (invoiceId) {
        // Normal Guest attempting to pay or view VIP Guest's invoice
        const unauthorizedPayAccess = await apiRequest(`/api/invoices/${invoiceId}/pay`, {
          method: 'PATCH',
          token: normalGuestToken,
          body: { paymentMethod: 'Credit Card' }
        });
        assert(unauthorizedPayAccess.status === 403,
          `Guest isolated from settling another guest's invoice: HTTP ${unauthorizedPayAccess.status} (Expected 403)`);
      }
    }

    // -------------------------------------------------------------
    // TEST SUITE 9: OWNERSHIP, WORKFLOW AUTHORIZATION & SECRET PRIVACY
    // -------------------------------------------------------------
    console.log('\n>>> TEST SUITE 9: Ownership, Workflow Authorization & Secret Privacy');

    const settingsRes = await apiRequest('/api/settings');
    assert(settingsRes.status === 200 && !Object.prototype.hasOwnProperty.call(settingsRes.data || {}, 'wifiPassword'),
      'Public settings do not expose the hotel Wi-Fi password');

    const feedbackRes = await apiRequest('/api/feedback', {
      method: 'POST',
      token: vipGuestToken,
      body: { bookingId: createdBookingId, rating: 5, comments: 'Verification feedback.' }
    });
    createdFeedbackId = feedbackRes.data?._id;
    assert(feedbackRes.status === 201,
      `Guest can submit feedback for an owned checked-out booking: HTTP ${feedbackRes.status}`);

    const crossFeedbackRes = await apiRequest('/api/feedback', {
      method: 'POST',
      token: normalGuestToken,
      body: { bookingId: createdBookingId, rating: 1, comments: 'Unauthorized feedback.' }
    });
    assert(crossFeedbackRes.status === 403,
      `Guest cannot submit feedback for another guest booking: HTTP ${crossFeedbackRes.status}`);

    const MaintenanceRequest = require('./models/MaintenanceRequest');
    const guestMaintenanceRes = await apiRequest('/api/maintenance', {
      method: 'POST',
      token: vipGuestToken,
      body: { roomId: room103._id, problemDescription: 'Unauthorized maintenance request.' }
    });
    assert(guestMaintenanceRes.status === 403,
      `Guest cannot create maintenance requests: HTTP ${guestMaintenanceRes.status}`);

    const adminNotifications = await apiRequest('/api/notifications', { token: adminToken });
    const adminOnlyNotification = adminNotifications.data?.find(notification => notification.targetRole === 'Admin');
    if (adminOnlyNotification) {
      const notificationReadRes = await apiRequest(`/api/notifications/${adminOnlyNotification._id}/read`, {
        method: 'PATCH',
        token: normalGuestToken
      });
      assert(notificationReadRes.status === 404,
        `Guest cannot mark an Admin notification as read: HTTP ${notificationReadRes.status}`);
    }

    await MaintenanceRequest.deleteMany({ problemDescription: 'Unauthorized maintenance request.' });

    // -------------------------------------------------------------
    // FINAL SUMMARY
    // -------------------------------------------------------------
    console.log('\n=================================================================');
    console.log(`  VERIFICATION RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log('=================================================================\n');

    if (passedTests === totalTests) {
      console.log('ALL SYSTEM CHECKS PASSED PERFECTLY. SYSTEM IS FULLY REINFORCED & COMPLIANT.');
    } else {
      console.error(`SOME CHECKS FAILED: ${totalTests - passedTests} failures detected.`);
    }

  } catch (err) {
    console.error('Unhandled Verification Error:', err);
  } finally {
    const cleanupModels = [
      ['HousekeepingReport', createdReportId],
      ['Invoice', createdInvoiceId],
      ['Feedback', createdFeedbackId],
      ['HousekeepingTask', createdTaskId],
      ['Booking', createdBookingId]
    ];
    for (const [modelName, documentId] of cleanupModels) {
      if (documentId) {
        const Model = require(`./models/${modelName}`);
        await Model.deleteOne({ _id: documentId });
      }
    }

    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit(passedTests === totalTests ? 0 : 1);
  }
}

runVerification();
