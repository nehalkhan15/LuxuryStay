const mongoose = require('mongoose');
const app = require('../server/server');
const { connectDB } = require('../server/server');

let dbPromise = null;

async function ensureDatabase() {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If a connection attempt is already running, wait for it.
  if (mongoose.connection.readyState === 2 && dbPromise) {
    await dbPromise;
    return;
  }

  // Start a new connection attempt.
  if (!dbPromise) {
    dbPromise = connectDB()
      .then(() => {
        if (mongoose.connection.readyState !== 1) {
          throw new Error('MongoDB connection was not established.');
        }

        return true;
      })
      .catch((error) => {
        dbPromise = null;
        throw error;
      });
  }

  await dbPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureDatabase();

    // Final safety check before Express handles the request.
    if (mongoose.connection.readyState !== 1) {
      dbPromise = null;

      return res.status(503).json({
        message: 'MongoDB connection is unavailable.',
        status: 'DATABASE_ERROR'
      });
    }

    return app(req, res);
  } catch (error) {
    dbPromise = null;

    console.error('Vercel MongoDB/API error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      readyState: mongoose.connection.readyState
    });

    return res.status(503).json({
      message: 'Database service unavailable.',
      status: 'DATABASE_ERROR'
    });
  }
};