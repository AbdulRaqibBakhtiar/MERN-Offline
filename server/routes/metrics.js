// server/routes/metrics.js
const express = require('express');
const router = express.Router();
const MetricSnapshot = require('../models/MetricSnapshot');
const Inventory = require('../models/Inventory');
const User = require('../models/Users');
const socketManager = require('../config/socket');
const { protect, requireAdmin } = require('../middleware/auth');

// 📸 CREATE NEW METRIC SNAPSHOT RECORD IN DATABASE
router.post('/snapshot', protect, requireAdmin, async (req, res) => {
  try {
    const items = await Inventory.find();
    const totalItems = items.length;
    const totalInventoryValue = items.reduce(
      (sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 
      0
    );
    const lowStockCount = items.filter(item => Number(item.quantity) < 10).length;
    const outOfStockCount = items.filter(item => Number(item.quantity) === 0).length;

    const snapshot = await MetricSnapshot.create({ 
      totalItems, 
      totalInventoryValue, 
      lowStockCount, 
      outOfStockCount 
    });

    // 📡 Broadcast live telemetry triggers to update client metrics grids instantly
    try {
      const administrators = await User.find({ role: 'admin' }).select('_id').lean();
      administrators.forEach(admin => socketManager.getIO().to(`user:${admin._id}`).emit('metrics_updated', snapshot));
      socketManager.getIO().emit('inventory_updated');
    } catch (ioErr) {
      console.error("ℹ️ Socket emission postponed: ", ioErr.message);
    }

    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📡 FETCH SNAPSHOT HISTORICAL DATA STREAM (Sorted Chronologically)
router.get('/history', protect, requireAdmin, async (req, res) => {
  try {
    const data = await MetricSnapshot.find().sort({ date: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
