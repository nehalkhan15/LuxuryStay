const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured in the server environment.');
}

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required. No token provided.'
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        message: 'Invalid authentication token.'
      });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'User not found or account deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token.'
    });
  }
};

// General role authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Unauthorized.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied.'
      });
    }

    next();
  };
};

// ADMIN ONLY
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Unauthorized.'
    });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      message: 'Access denied. Only administrators can perform this action.'
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  authorizeAdmin,
  JWT_SECRET
};