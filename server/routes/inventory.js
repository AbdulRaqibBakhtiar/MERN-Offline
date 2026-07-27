// server/routes/inventory.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// 🚀 Destructure all controller methods perfectly (including your brand new wishlist methods!)
const { 
  getItems, 
  addItem, 
  updateItem, 
  deleteItem, 
  getItemById, 
  addProductReview,
  getWishlist,     // 👈 Mounted
  toggleWishlist   // 👈 Mounted
} = require('../controllers/inventoryController');

// Built-in Authentication Middleware Guard
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
    req.user = decoded;
    next();
  } catch (err) {
    console.error('⚠️ Token Validation Fault:', err.message);
    return res.status(401).json({ error: 'Invalid or expired authentication signature token.' });
  }
};

// Configure disk engine storage for product uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/products/');
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
// LIVE API ENDPOINTS ROUTING MOUNT (WITH REAL-TIME BROADCAST HOOKS)
// =========================================================================
const socketManager = require('../config/socket'); // 🚀 IMPORT THE SOCKET INSTANCE MODULE

// 🚀 CRITICAL PLACEMENT: Wishlist endpoints must sit ABOVE /:id so Express resolves them cleanly first
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/toggle', protect, toggleWishlist);

// 1. Bulk Catalog Retrieval
router.get('/', protect, getItems);

// 2. Individual Item Retrieval Pipeline
router.get('/:id', protect, getItemById);

// 3. New Entry Submission Engine
router.post('/', protect, upload.single('productImage'), async (req, res, next) => {
  try {
    // Intercept the controller execution to emit events when an item is added
    res.on('finish', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        socketManager.getIO().emit('inventory_updated');
      }
    });
    addItem(req, res, next);
  } catch (err) { next(err); }
});

// 4. Live Operational Asset Update Node
router.put('/:id', protect, upload.single('productImage'), async (req, res, next) => {
  try {
    res.on('finish', () => {
      if (res.statusCode === 200) {
        socketManager.getIO().emit('inventory_updated');
      }
    });
    updateItem(req, res, next);
  } catch (err) { next(err); }
});

// 5. Destructive Purge Actions
router.delete('/:id', protect, async (req, res, next) => {
  try {
    res.on('finish', () => {
      if (res.statusCode === 200) {
        socketManager.getIO().emit('inventory_updated');
      }
    });
    deleteItem(req, res, next);
  } catch (err) { next(err); }
});

// 6. Interactive Customer Star Feedback System
router.post('/:itemId/review', protect, async (req, res, next) => {
  try {
    res.on('finish', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        socketManager.getIO().emit('inventory_updated');
      }
    });
    addProductReview(req, res, next);
  } catch (err) { next(err); }
});

module.exports = router;
