const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors());
app.use(express.json());

// ============================================================================
// DATABASE CONNECTION
// MongoDB Atlas is the persistent source of truth.
// ============================================================================

async function connectDB() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      'MONGO_URI or MONGODB_URI is not configured in the server environment.'
    );
  }

  // If already connected, don't create another connection.
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  console.log('Connecting to MongoDB Atlas/persistent MongoDB...');

  try {
    await mongoose.connect(mongoUri, {
      // MongoDB server selection timeout
      serverSelectionTimeoutMS: 15000,

      // Initial connection timeout
      connectTimeoutMS: 15000,

      // Socket inactivity timeout
      socketTimeoutMS: 45000,

      // Force IPv4 to avoid IPv6 networking problems
      family: 4,

      // Keep connections reusable between Vercel invocations
      maxPoolSize: 10,
      minPoolSize: 0,

      // Don't buffer database operations while disconnected
      bufferCommands: false
    });

    console.log(
      'MongoDB connected successfully as persistent source of truth.'
    );

    return true;
  } catch (error) {
    console.error('');
    console.error('==============================================');
    console.error('MONGODB CONNECTION FAILED');
    console.error('==============================================');
    console.error('Error:', error.message);
    console.error('Name:', error.name);
    console.error('Code:', error.code);
    console.error('ReadyState:', mongoose.connection.readyState);

    if (
      error.message.includes('queryTxt') ||
      error.message.includes('ETIMEOUT') ||
      error.message.includes('ENOTFOUND')
    ) {
      console.error('');
      console.error('MongoDB Atlas DNS/SRV lookup failed.');
      console.error('');
      console.error('Possible causes:');
      console.error('1. Internet/DNS problem');
      console.error('2. ISP blocking MongoDB Atlas DNS');
      console.error('3. Incorrect MongoDB Atlas connection string');
      console.error('4. MongoDB Atlas cluster/network issue');
      console.error('');
    }

    throw error;
  }
}

// ============================================================================
// DATABASE HEALTH MIDDLEWARE
// ============================================================================

app.use('/api', (req, res, next) => {
  // Health endpoint handles its own database check.
  if (req.path === '/health') {
    return next();
  }

  // api/index.js should already have established the connection.
  // This is only a final safety check.
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        'Database service unavailable. Persistent MongoDB connection is required.',
      status: 'DATABASE_ERROR'
    });
  }

  next();
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/services', require('./routes/services'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/amenities', require('./routes/amenities'));
app.use('/api/housekeeping', require('./routes/housekeeping'));

app.use(
  '/api/housekeeping-reports',
  require('./routes/housekeepingReports')
);

app.use(
  '/api/housekeeping/reports',
  require('./routes/housekeepingReports')
);

app.use(
  '/api/housekeepingReports',
  require('./routes/housekeepingReports')
);

app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/tasks', require('./routes/tasks'));

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'ERROR',
        system: 'LuxuryStay HMS Backend',
        database: 'disconnected',
        readyState: mongoose.connection.readyState,
        message: 'MongoDB is not connected'
      });
    }

    // Actually verify MongoDB responds.
    await mongoose.connection.db.admin().ping();

    return res.status(200).json({
      status: 'OK',
      system: 'LuxuryStay HMS Backend',
      database: 'connected',
      readyState: mongoose.connection.readyState,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Health check MongoDB error:', error);

    return res.status(503).json({
      status: 'ERROR',
      system: 'LuxuryStay HMS Backend',
      database: 'error',
      readyState: mongoose.connection.readyState,
      message: error.message
    });
  }
});

// ============================================================================
// SERVE FRONTEND STATIC BUILD
// ============================================================================

const clientBuildPath = path.join(__dirname, '../client/dist');

app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      message: 'API endpoint not found'
    });
  }

  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res
        .status(200)
        .send('LuxuryStay HMS Backend Server is Running!');
    }
  });
});

// ============================================================================
// LOCAL SERVER STARTUP
// ============================================================================

async function startServer() {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log('');
      console.log(
        `MongoDB connection attempt ${attempt}/${MAX_RETRIES}...`
      );

      await connectDB();

      console.log('');
      console.log('==============================================');
      console.log('LuxuryStay HMS');
      console.log('MongoDB: CONNECTED');
      console.log(`Server: http://localhost:${PORT}`);
      console.log('==============================================');
      console.log('');

      app.listen(PORT, () => {
        console.log(
          `LuxuryStay HMS Server running on port ${PORT}`
        );
      });

      return;
    } catch (error) {
      console.error(
        `MongoDB attempt ${attempt} failed.`
      );

      if (attempt < MAX_RETRIES) {
        console.log(
          `Retrying in ${RETRY_DELAY / 1000} seconds...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY)
        );
      }
    }
  }

  console.error('');
  console.error('==============================================');
  console.error('CRITICAL: Failed to start LuxuryStay HMS.');
  console.error('MongoDB connection failed.');
  console.error('==============================================');
  console.error('');

  try {
    await mongoose.disconnect();
  } catch (_) {
    // Ignore disconnect errors
  }

  process.exit(1);
}

// ============================================================================
// START APPLICATION
// ============================================================================

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.connectDB = connectDB;