// server/routes/content.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');

// Import modular controller handlers
const { getNewsFeed, createNewsArticle, updateNewsArticle, deleteNewsArticle, addNewsComment } = require('../controllers/newsController');
const { getActiveAds, createAdCampaign, updateAdCampaign, deleteAdCampaign } = require('../controllers/adController');

const protect = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ error: 'Access denied. Token session required.' });
    
    const token = authHeader.split(' ')[1];
    try {
        const secretKey = process.env.JWT_SECRET || 'your_fallback_jwt_secret';
        req.user = jwt.verify(token, secretKey);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Session authorization failed or token signature expired.' });
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.path.includes('news') ? 'public/uploads/news/' : 'public/uploads/ads/';
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// A. SECURITY AUTHENTICATED CHANNELS: HOME TIMELINE NEWS FEED POSTS
router.get('/news/latest', getNewsFeed);
router.post('/news', protect, upload.single('image'), createNewsArticle);
router.put('/news/:id', protect, upload.single('image'), updateNewsArticle);
router.delete('/news/:id', protect, deleteNewsArticle);

// 🚀 NEW: DYNAMIC COMMENT SUBMISSION ROUTE
router.post('/news/:id/comments', protect, addNewsComment);

// B. SECURITY AUTHENTICATED CHANNELS: SPONSORED LINKS AD BANNER CAMPAIGNS
router.get('/ads/active', getActiveAds);
router.post('/ads', protect, upload.single('image'), createAdCampaign);
router.put('/ads/:id', protect, upload.single('image'), updateAdCampaign);
router.delete('/ads/:id', protect, deleteAdCampaign);
// C. DYNAMIC DISCUSSION FEEDS
router.post('/news/:id/comments', protect, addNewsComment);

// 🚀 NEW: Authenticated Moderator route to remove an individual comment
router.delete('/news/:newsId/comments/:commentId', protect, async (req, res) => {
    try {
        const { newsId, commentId } = req.params;
        const News = require('../models/News');

        // Remove the specific comment object out of the sub-document comments array
        const updatedPost = await News.findByIdAndUpdate(
            newsId,
            { $pull: { comments: { _id: commentId } } },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ error: "Target article context missing." });
        }

        // Return the fresh comments list back to your React app
        res.status(200).json(updatedPost.comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
