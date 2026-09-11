# LuxuryStay Hospitality — Victoria Edition
**Enterprise Full-Stack MERN Hotel Management System (HMS)**

---

## 1. Executive Summary & Vision

**LuxuryStay Hospitality — Victoria Edition** is a database-driven, secure Hotel Management System architected with the **MERN** stack (MongoDB, Express.js, React, Node.js). Engineered to luxury hospitality standards, the system orchestrates the entire guest and hotel operational lifecycle—from public suite discovery, double-booking prevention, fast check-in, real-time room occupancy matrix, automatic post-checkout housekeeping turnovers, damaged item reporting, to folio settlement and executive analytics.

### Victoria Luxury Design System
- **Midnight Obsidian Canvas**: `#001219`
- **Sovereign Gold**: `#D4AF37` (primary metallic accents, badges, and headers)
- **Deep Victoria Teal**: `#0A2F35`
- **Typography**: Playfair Display / Serif headings paired with clean modern monospace numerals and geometric body text.

---

## 2. Multi-Tier Role-Based Access Control (RBAC)

The system enforces strict role-based authorization across **6 distinct roles**. Each user receives an authorized JWT signed by the Express backend.

| Role | Workspace Scope | Permissions & Boundary Limits |
| :--- | :--- | :--- |
| **Admin** | Full Command Console | Complete hotel authority: Staff user CRUD (`/api/staff`), room category pricing, physical unit inventory, hotel policies, tax configuration, housekeeping report resolution, guest VIP assignment. |
| **Manager** | Executive Hub | Operational and financial oversight: Revenue analytics, live booking oversight, room matrix, housekeeping turnover inspection, resolving damage/incident reports. **Strictly forbidden (HTTP 403) from staff account management.** |
| **Receptionist** | Front Desk & Concierge | Front-desk operations: Guest arrivals queue, check-in, check-out, walk-in reservations, billing folio generation, and in-room service dispatch. **Strictly forbidden from staff management and guest-tier administration.** |
| **Housekeeping** | Sanitization Console | Turnover work queue: Live cleaning task queue, mark rooms cleaned (`Available`), room status matrix, **filing official Housekeeping Reports** (`Damaged`, `Needs Cleaning`, `Missing Item`, `Maintenance Issue`). |
| **Maintenance** | Engineering Workspace | View assigned maintenance requests, update assigned work orders, record repair notes, and restore rooms after completion. **Cannot manage staff.** |
| **Guest** | Sovereign Patron Portal | Guest self-service: Live suite search with date-conflict checks, instant reservation confirmation, viewing personal booking records, in-room service orders, resort amenity guide, live folios, and post-stay feedback. **Cross-guest data is strictly isolated.** |

---

## 3. Persistent Database Architecture (Zero Mock Data)

The system connects exclusively to a persistent **MongoDB** instance (`mongodb://127.0.0.1:27017/luxurystay`). All in-memory fallbacks have been removed. If MongoDB is unreachable, the API middleware returns `503 Service Unavailable` with a clear status message.

### Core Mongoose Models & Schemas

1. **`User`**: Core authentication and profile identity.
   - Fields: `name`, `email` (unique), `password` (hashed with bcrypt), `role` (`Admin`, `Manager`, `Receptionist`, `Housekeeping`, `Guest`), `guestType` (`NORMAL` vs `VIP`), `phone`, `isActive`.
2. **`RoomType`**: Suite category catalog.
   - Fields: `name`, `description`, `basePrice`, `capacity`, `amenities` (array), `imageUrl`.
3. **`Room`**: Physical units inventory.
   - Fields: `roomNumber` (unique), `roomType` (ref `RoomType`), `floor`, `pricePerNight`, `status` (`Available`, `Occupied`, `Cleaning`, `Under Maintenance`, `Reserved`), `notes`.
   - **Initial seeded units**: Rooms `101`, `102`, and `103`; existing operational rooms are preserved by the idempotent seed.
4. **`Booking`**: Reservation record.
   - Fields: `bookingId` (unique human-readable reference), `guest` (ref `User`), `room` (ref `Room`), `checkInDate`, `checkOutDate`, `numberOfGuests`, `status` (`Confirmed`, `Checked-In`, `Checked-Out`, `Cancelled`), `totalAmount`, `specialRequests`.
   - **Double-booking protection**: Overlapping check-in/check-out queries prevent conflicting bookings.
5. **`HousekeepingReport`**: Official operational incident and turnover log.
   - Fields: `roomId` (ref `Room`), `reportedBy` (ref `User`), `assignedTo` (ref `User`), `reportType` (`Needs Cleaning`, `Cleaning Completed`, `Damaged`, `Missing Item`, `Maintenance Issue`, `Room Not Ready`, `Other`), `notes`, `status` (`Open`, `In Progress`, `Resolved`), `resolution`, `resolvedBy` (ref `User`), timestamps.
6. **`HousekeepingTask`**: Sanitization work order automatically dispatched upon guest check-out.
   - Fields: `room` (ref `Room`), `assignedTo` (ref `User`), `taskType`, `priority`, `status` (`Pending`, `In Progress`, `Completed`), `notes`.
7. **`Invoice`**: Financial billing folio.
   - Fields: `invoiceNumber` (unique), `booking` (ref `Booking`), `guest` (ref `User`), `roomTotal`, `servicesTotal`, `taxAmount`, `grandTotal`, `paymentStatus` (`Unpaid`, `Paid`, `Partially Paid`), `paymentMethod`.
8. **`ServiceItem` & `ServiceOrder`**: Concierge, artisan dining, and in-room dining services.
9. **`MaintenanceRequest`**: Facility repair work orders.
10. **`Feedback`**: Guest ratings, reviews, and sentiment scores.
11. **`HotelSetting`**: Hotel branding, policy times, currency, and tax rate configuration.

---

## 4. Default Seed Accounts (For Testing & Documentation Only)

> **IMPORTANT SECURITY POLICY**:
> In accordance with zero-credential leak standards, **no hardcoded accounts, autofill buttons, or 1-click role logins exist in the client interface**. The login fields start completely empty. Users must type credentials manually.

| Role | Email Address | Password | Account Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@hotel.com` | `Password123` | Primary Hotel Administrator |
| **Manager** | `manager@hotel.com` | `Password123` | Operations and Analytics |
| **Receptionist** | `receptionist@hotel.com` | `Password123` | Front Desk |
| **Housekeeping** | `housekeeping@hotel.com` | `Password123` | Housekeeping Operations |
| **Maintenance** | `maintenance@hotel.com` | `Password123` | Engineering Operations |
| **Guest (VIP)** | `guest@hotel.com` | `Password123` | VIP guest |
| **Guest (Normal)** | `normalguest@hotel.com` | `Password123` | Normal guest |

---

## 5. End-to-End Operational Workflows

### 1. Reservation & Double-Booking Guard
- Guest or Receptionist submits booking with `checkInDate` and `checkOutDate`.
- Express controller checks if an existing booking with status `Confirmed` or `Checked-In` overlaps on the same physical room:
  ```javascript
  checkInDate < existing.checkOutDate && checkOutDate > existing.checkInDate
  ```
- If a conflict exists, returns `HTTP 400 Bad Request` with an explanatory message.
- If clear, creates booking with a unique reference (`LSB-XXXXXX`).

### 2. Check-In & Room Matrix Transition
- Receptionist clicks **Check In Guest** on the Arrivals Queue.
- Booking status updates to `Checked-In`.
- Room status updates immediately to `Occupied` across the matrix.

### 3. Check-Out, Auto-Housekeeping Dispatch & Folio Settlement
- Receptionist clicks **Check Out & Bill**.
- Booking status updates to `Checked-Out`.
- Room status transitions to `Cleaning`.
- An automatic `HousekeepingTask` is created for Room turnover.
- Digital invoice folio is calculated (Room Nights $\times$ Rate $+$ In-Room Services $+$ 12% Tax).
- Receptionist or Guest settles the folio via Credit Card / Cash (`paymentStatus` set to `Paid`).

### 4. Housekeeping Inspection & Turnover
- Housekeeping logs in, views the pending turnover task, cleans the suite, and clicks **Mark Cleaned & Ready**.
- Housekeeping task marks `Completed`.
- Room status returns to `Available` on the Matrix and public booking engine.

### 5. Housekeeping Incident Reporting
- Housekeeper observes a damaged item or defect and clicks **File Housekeeping Report**.
- Selects Room, Classification (`Damaged`, `Missing Item`, etc.), and enters notes.
- Saved permanently to MongoDB collection `housekeepingreports`.
- Admin and Manager view the report on their dashboards, take action, and submit a resolution note (`Resolved`).

---

## 6. Project Directory Structure

```
luxurystay-hms/
├── package.json               # Root workspace metadata
├── README.md                  # Comprehensive architectural guide
├── client/                    # React 18 + Vite + Tailwind CSS Frontend
│   ├── index.html             # Victoria LuxuryStay themed template
│   ├── package.json           # Frontend dependencies (lucide-react, react-router-dom)
│   ├── vite.config.js         # Vite configuration with /api proxy to port 5000
│   └── src/
│       ├── App.jsx            # Route mappings & Layout
│       ├── context/
│       │   └── AuthContext.jsx # Auth state, JWT storage, guestType sync
│       ├── components/
│       │   ├── Navbar.jsx     # Victoria obsidian & gold header
│       │   ├── Sidebar.jsx    # Role-filtered navigation links
│       │   └── InvoiceModal.jsx # Folio display and payment dialog
│       └── pages/
│           ├── LandingPage.jsx         # Public luxury hero & live room search
│           ├── Login.jsx               # Manual secure login form
│           ├── Register.jsx            # Guest registration
│           ├── AdminDashboard.jsx      # Admin Command & Staff Administration
│           ├── ManagerDashboard.jsx    # Executive Analytics & Reports
│           ├── ReceptionistDashboard.jsx # Front Desk & VIP Directory
│           ├── HousekeepingDashboard.jsx # Cleaning Work Queue & Reports Log
│           └── GuestDashboard.jsx      # VIP Patron Portal & In-Room Services
└── server/                    # Node.js + Express.js + Mongoose Backend
    ├── package.json           # Backend dependencies (mongoose, express, bcryptjs, jsonwebtoken)
    ├── .env                   # Environment variables (PORT, MONGO_URI, JWT_SECRET)
    ├── server.js              # Express app, persistent DB connection, route bindings
    ├── seed.js                # Idempotent database seeder (exactly 3 rooms: 101, 102, 103)
    ├── verify_system.js       # End-to-end automated verification script
    ├── middleware/
    │   ├── auth.js            # JWT bearer token verification
    │   └── roles.js           # Multi-role RBAC authorization guard
    ├── models/
    │   ├── User.js
    │   ├── Room.js
    │   ├── RoomType.js
    │   ├── Booking.js
    │   ├── Invoice.js
    │   ├── HousekeepingTask.js
    │   ├── HousekeepingReport.js
    │   ├── MaintenanceRequest.js
    │   ├── ServiceItem.js
    │   ├── ServiceOrder.js
    │   ├── Feedback.js
    │   ├── Promotion.js
    │   ├── Amenity.js
    │   └── HotelSetting.js
    └── routes/
        ├── auth.js
        ├── staff.js           # Strict Admin-only staff CRUD & account control
        ├── users.js           # User profiles & VIP toggle
        ├── rooms.js
        ├── bookings.js        # Double-booking check, check-in, check-out
        ├── housekeepingReports.js # Housekeeping incident reporting & resolution
        ├── housekeeping.js    # Sanitization tasks
        ├── invoices.js
        ├── services.js
        ├── maintenance.js
        ├── feedback.js
        ├── promotions.js
        ├── amenities.js
        ├── reports.js
        └── settings.js
```

---

## 7. Setup & Execution Instructions

### Prerequisites
- **Node.js**: v18.0.0 or later
- **MongoDB**: Local Community Server running at `mongodb://127.0.0.1:27017`

### 1. Install Dependencies
```bash
# In server directory
cd server
npm install

# In client directory
cd ../client
npm install
```

### 2. Configure Environment Variables
Verify `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/luxurystay
MONGODB_URI=mongodb://127.0.0.1:27017/luxurystay
JWT_SECRET=luxurystay_victoria_jwt_secret_key_2025_secure
```

### 3. Seed Database Idempotently
```bash
cd server
npm run seed
```
*Note: The seed script uses controlled create-or-update operations, repairs the seven core accounts, removes obsolete secondary-admin records, and preserves existing operational rooms and collections. Re-running `npm run seed` does not wipe application data or create duplicates.*

### 4. Run Automated System Verification
```bash
cd server
npm run verify
```
This tests authentication for all 5 roles, 403 Forbidden enforcement on staff management, double booking prevention, housekeeping report lifecycle, check-in/out transitions, and data privacy isolation.

### 5. Launch the Application
Start the Backend Server:
```bash
cd server
npm start
# Server listens on http://localhost:5000
```

Start the Frontend Dev Server:
```bash
cd client
npm run dev
# Client is accessible at http://localhost:3000
```

### 6. Operations, Backup & Synchronization

The server logs startup, MongoDB connection failures, and request/database errors without logging passwords or JWT secrets. The health endpoint is available at `GET /api/health`; API requests return `503` when the persistent MongoDB connection is unavailable.

Mongoose initializes indexes for room/date availability, user and guest ownership, invoices, services, housekeeping, maintenance, notifications, and feedback when the models load. Operational dashboards refresh their MongoDB-backed data every 30 seconds, with manual refresh actions available on workflow screens. This provides practical synchronization for local/demo deployments without assuming MongoDB replica-set Change Streams or introducing an in-memory data layer.

Create a local MongoDB backup with:

```bash
mongodump --uri="mongodb://127.0.0.1:27017/luxurystay" --out="./backups/luxurystay-$(Get-Date -Format yyyyMMdd-HHmmss)"
```

Restore a backup with:

```bash
mongorestore --uri="mongodb://127.0.0.1:27017/luxurystay" ./backups/<backup-folder>/luxurystay
```

For hosted deployments, schedule `mongodump` or the provider's managed backup service and keep credentials outside the repository.

---

## 8. API Reference Summary

| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns signed JWT |
| `POST` | `/api/auth/register` | Public | Registers a new Guest patron account |
| `GET` | `/api/auth/me` | Authenticated | Fetches current user profile and guestType |
| `GET` | `/api/staff` | **Admin Only** | Lists all staff accounts (Manager receives 403) |
| `POST` | `/api/staff` | **Admin Only** | Creates staff account with assigned role |
| `PATCH` | `/api/staff/:id/status` | **Admin Only** | Deactivates or activates staff member |
| `PATCH` | `/api/staff/:id/password`| **Admin Only** | Resets staff member password |
| `DELETE`| `/api/staff/:id` | **Admin Only** | Deletes staff member account |
| `PATCH` | `/api/users/:id/guest-type`| **Admin Only** | Assigns `VIP` or `NORMAL` guest tier |
| `GET` | `/api/rooms` | Public | Lists all rooms with populated room types |
| `GET` | `/api/bookings/check-availability` | Public | Returns available rooms for a date range |
| `POST` | `/api/bookings` | Guest, Receptionist, Admin | Creates booking with double-booking check |
| `PATCH` | `/api/bookings/:id/check-in` | Receptionist, Admin | Check-in guest, assigns room to `Occupied` |
| `PATCH` | `/api/bookings/:id/check-out` | Receptionist, Admin | Check-out guest, room to `Cleaning`, auto task |
| `GET` | `/api/housekeeping-reports` | Admin, Manager, Housekeeping | Lists reports (Receptionist/Guest receive 403) |
| `POST` | `/api/housekeeping-reports` | Housekeeping, Admin, Manager | Submits room damage or turnover report |
| `PATCH` | `/api/housekeeping-reports/:id/resolve` | Admin, Manager | Resolves report with corrective action note |
| `POST` | `/api/invoices/generate/:bookingId` | Receptionist, Admin | Compiles night rate, tax, and room services |
| `PATCH` | `/api/invoices/:id/pay` | Guest (owner), Receptionist, Admin | Marks invoice as settled/paid |
