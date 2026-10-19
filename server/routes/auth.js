// server/routes/auth.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

// 🚀 Imports your dynamic profile controllers cleanly from authController.js
const { registerUser, loginUser, updateUserProfile } = require('../controllers/authController');
const passwordRecovery = require('../controllers/passwordRecoveryController');

// Configure dynamic profile avatar storage locations
const profileDiskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/profiles/');
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `avatar-${Date.now()}${extension}`);
    }
});

const uploadAvatar = multer({ 
    storage: profileDiskStorage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: (req, file, cb) => {
        const allowed = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
        const extension = path.extname(file.originalname).toLowerCase();
        if (allowed[extension] === file.mimetype) return cb(null, true);
        return cb(new Error('Avatar must be a JPEG, PNG, or WebP image.'));
    }
});

// Map public access entry operational endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/password/forgot', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), passwordRecovery.requestPasswordReset);
router.post('/password/reset', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), passwordRecovery.resetPassword);

// 🚀 Map multi-part form data uploads for profile avatars safely using the inline protector
router.put('/profile/update', protect, uploadAvatar.single('avatarImage'), updateUserProfile);

module.exports = router;
