const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { authenticate, authorize } = require('../middleware/auth');

// Get Hotel Settings
router.get('/', async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({});
    }
    setting = setting.toObject();
    delete setting.wifiPassword;
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Settings (Admin only)
router.put('/', authenticate, authorize('Admin'), async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting(req.body);
    } else {
      Object.assign(setting, req.body);
      setting.updatedAt = new Date();
    }
    await setting.save();
    const safeSetting = setting.toObject();
    delete safeSetting.wifiPassword;
    res.json({ message: 'Settings updated successfully', setting: safeSetting });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
