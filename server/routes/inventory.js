// server/routes/inventory.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, requireAdmin } = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const mongoose = require('mongoose');

// 🚀 Destructure all controller methods perfectly (including your brand new wishlist methods!)
const { 
  getItems, 
  addItem, 
  updateItem, 
  deleteItem, 
  getItemById, 
  addProductReview,
  getWishlist,     // 👈 Mounted
  toggleWishlist,  // 👈 Mounted
  claimOrphanedItem
} = require('../controllers/inventoryController');

// Configure disk engine storage for product uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/products/');
  },
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 25, files: 10 },
  fileFilter: (req, file, cb) => {
    const allowed = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime'
    };
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowed[extension] === file.mimetype) return cb(null, true);
    cb(new Error('Only image and video files can be uploaded.'));
  }
});
const uploadProductMedia = upload.fields([
  { name: 'productImage', maxCount: 1 },
  { name: 'productMedia', maxCount: 10 }
]);

const requireListingOwnerOrAdmin = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid listing ID.' });
  try {
    const item = await Inventory.findById(req.params.id).select('createdBy').lean();
    if (!item) return res.status(404).json({ error: 'Product not found.' });
    if (req.user.role !== 'admin' && String(item.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ error: 'You can only edit your own listings.' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

// =========================================================================
// LIVE API ENDPOINTS ROUTING MOUNT (WITH REAL-TIME BROADCAST HOOKS)
// =========================================================================
const socketManager = require('../config/socket'); // 🚀 IMPORT THE SOCKET INSTANCE MODULE

// 🚀 CRITICAL PLACEMENT: Wishlist endpoints must sit ABOVE /:id so Express resolves them cleanly first
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/toggle', protect, toggleWishlist);
router.post('/:id/claim', protect, requireAdmin, async (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode === 200) socketManager.getIO().emit('inventory_updated');
  });
  return claimOrphanedItem(req, res, next);
});

// 1. Bulk Catalog Retrieval
router.get('/', protect, getItems);

// Orders and product-specific seller conversations
const { createOrder, getProductConversation, sendProductMessage, listMyConversations, listMarketplaceVendors, getConversationById, sendConversationMessage, listSellingOrders, listBuyingOrders, updateSellingOrder, deleteMarketplaceOrder } = require('../controllers/marketplaceController');
const broadcastInventoryAfterSuccess = (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode === 200 || res.statusCode === 201) socketManager.getIO().emit('inventory_updated');
  });
  next();
};
router.get('/orders/selling', protect, listSellingOrders);
router.get('/orders/buying', protect, listBuyingOrders);
router.patch('/orders/:orderId', protect, broadcastInventoryAfterSuccess, updateSellingOrder);
router.delete('/orders/:orderId', protect, broadcastInventoryAfterSuccess, deleteMarketplaceOrder);
router.get('/vendors', protect, listMarketplaceVendors);
router.get('/conversations', protect, listMyConversations);
router.get('/conversations/:conversationId', protect, getConversationById);
router.post('/conversations/:conversationId/messages', protect, sendConversationMessage);
router.post('/:id/orders', protect, broadcastInventoryAfterSuccess, createOrder);
router.get('/:id/conversation', protect, getProductConversation);
router.post('/:id/conversation', protect, sendProductMessage);

// 2. Individual Item Retrieval Pipeline
router.get('/:id', protect, getItemById);

// 3. New Entry Submission Engine
router.post('/', protect, uploadProductMedia, async (req, res, next) => {
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
router.put('/:id', protect, requireListingOwnerOrAdmin, uploadProductMedia, async (req, res, next) => {
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
