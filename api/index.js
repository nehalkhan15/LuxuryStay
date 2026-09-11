const mongoose = require('mongoose');
const app = require('../server/server');
const { connectDB } = require('../server/server');

let dbPromise = null;

module.exports = async (req, res) => {
  try {
    // Reuse an existing healthy connection.
    if (mongoose.connection.readyState !== 1) {
      // Previous connection attempt may have failed.
      // Clear it so Vercel can retry.
      dbPromise = null;
    }

    if (!dbPromise) {
      dbPromise = connectDB().catch((error) => {
        dbPromise = null;
        throw error;
      });
    }

    await dbPromise;

    return app(req, res);
  } catch (error) {
    dbPromise = null;

    console.error('Vercel API startup error:', error);

    return res.status(500).json({
      message: 'Server initialization failed',
      error: process.env.NODE_ENV === 'development'
        ? error.message
        : undefined
    });
  }
};