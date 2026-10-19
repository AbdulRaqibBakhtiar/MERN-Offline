const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, requireAdmin } = require('../middleware/auth');
const Software = require('../models/Software');

// Configure disk engine storage for software upload pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/software/');
  },
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedTypes = { '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
    if (allowedTypes[extension] === file.mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
  }
});
// =========================================================================
// LIVE API ENDPOINTS ROUTING MOUNT (CLEANED & PROTECTED)
// =========================================================================

// 1. New Software Entry Submission Engine
// =========================================================================
// LIVE API ENDPOINTS ROUTING MOUNT (CLEANED & PROTECTED)
// =========================================================================

// 1. New Software Entry Submission Engine
router.post('/', protect, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      // 🎯 FIXED PATH: Omit the duplicate leading folder to mount correctly with static route rules
      data.image = `/uploads/software/${req.file.filename}`;
    }
    const newApp = new Software(data);
    await newApp.save();
    res.status(201).json(newApp);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
});

// 2. Live Operational Software Asset Update Node
router.put('/:id', protect, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      // 🎯 FIXED PATH: Omit the duplicate leading folder to mount correctly with static route rules
      data.image = `/uploads/software/${req.file.filename}`;
    }
    const updated = await Software.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(updated);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
});

// 3. Bulk Marketplace Catalog Retrieval
router.get('/', async (req, res) => {
  try {
    const apps = await Software.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// 4. Destructive Software Purge Actions
router.delete('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const targetId = req.params.id; // Correct parameter indexing key extraction
    await Software.findByIdAndDelete(targetId);
    res.json({ success: true, message: "Asset node severed successfully." });
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
});

module.exports = router;
