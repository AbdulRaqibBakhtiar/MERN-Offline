// server/routes/auth.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// 🚀 Imports your dynamic profile controllers cleanly from authController.js
const { registerUser, loginUser, updateUserProfile } = require('../controllers/authController');

// 🚀 FIXED: Inline Authentication Middleware Guard (Bypasses missing external authGuard files)
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
        req.user = decoded; // Securely binds the user identity context onto your request object
        next();
    } catch (err) {
        console.error('⚠️ Token Validation Fault:', err.message);
        return res.status(401).json({ error: 'Invalid or expired authentication signature token.' });
    }
};

// Configure dynamic profile avatar storage locations
const profileDiskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/profiles/');
    },
    filename: (req, file, cb) => {
        cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadAvatar = multer({ 
    storage: profileDiskStorage,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB Upload limit safeguard
});

// Map public access entry operational endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);

// 🚀 Map multi-part form data uploads for profile avatars safely using the inline protector
router.put('/profile/update', protect, uploadAvatar.single('avatarImage'), updateUserProfile);

module.exports = router;
