const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const Software = require('../models/Software');

// 🎯 FIX: Inline Authentication Middleware Guard from your working routes
const protect = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token configuration error. Expected format: Bearer <token>' });
  }
  const token = parts[1];
  try {
    const secretKey = process.env.JWT_SECRET || 'your_fallback_jwt_secret';
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; // Mounts user info cleanly onto the request object
    next();
  } catch (err) {
    console.error('⚠️ Token Validation Fault:', err.message);
    return res.status(401).json({ error: 'Invalid or expired authentication signature token.' });
  }
};

// Configure disk engine storage for software upload pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/software/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
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
router.post('/', protect, upload.single('image'), async (req, res) => {
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
router.put('/:id', protect, upload.single('image'), async (req, res) => {
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
router.delete('/:id', protect, async (req, res) => {
  try {
    const targetId = req.params.id; // Correct parameter indexing key extraction
    await Software.findByIdAndDelete(targetId);
    res.json({ success: true, message: "Asset node severed successfully." });
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
});

module.exports = router;
