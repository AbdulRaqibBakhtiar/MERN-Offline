// server/controllers/newsController.js
const fs = require('fs');
const path = require('path');
const News = require('../models/News');

// @desc    Get all news items populated with creator profiles
// @route   GET /content/news/latest
exports.getNewsFeed = async (req, res) => {
    try {
        const items = await News.find()
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 }); 
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Create a new article entry (Secured Profile Tracking)
// @route   POST /content/news
exports.createNewsArticle = async (req, res) => {
    try {
        const { title, summary, fullText } = req.body;
        if (!title || !summary) {
            return res.status(400).json({ error: 'Title and Summary fields are required descriptor metrics.' });
        }

        const freshNews = new News({
            title,
            summary,
            fullText,
            imagePath: req.file ? `/public/uploads/news/${req.file.filename}` : '',
            createdBy: req.user.id 
        });

        await freshNews.save();
        res.status(201).json(freshNews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Update text entries or change banner pictures for an existing post
// @route   PUT /content/news/:id
exports.updateNewsArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, summary, fullText } = req.body;

        let updateData = { title, summary, fullText };

        if (req.file) {
            const oldArticle = await News.findById(id);
            if (oldArticle && oldArticle.imagePath) {
                const absoluteOldPath = path.join(__dirname, '..', '..', oldArticle.imagePath.replace(/^\//, ''));
                fs.unlink(absoluteOldPath, (err) => {
                    if (err) console.error('⚠️ Could not clear old picture file off disk:', err.message);
                });
            }
            updateData.imagePath = `/public/uploads/news/${req.file.filename}`;
        }

        const updatedNews = await News.findByIdAndUpdate(id, updateData, { new: true }).populate('createdBy', 'username');
        if (!updatedNews) {
            return res.status(404).json({ error: "Target announcement document not found." });
        }
        res.status(200).json(updatedNews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Erase database collection indices and remove associated binary image tracks off storage
// @route   DELETE /content/news/:id
exports.deleteNewsArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const targetPost = await News.findById(id);

        if (!targetPost) {
            return res.status(404).json({ error: "Target news article dataset context missing." });
        }

        if (targetPost.imagePath) {
            const absoluteFilePath = path.join(__dirname, '..', '..', targetPost.imagePath.replace(/^\//, ''));
            fs.unlink(absoluteFilePath, (err) => {
                if (err) console.error('⚠️ File erasure fault on disk media:', err.message);
            });
        }

        await News.findByIdAndDelete(id);
        res.status(200).json({ message: "News entry registry dropped successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 🚀 NEW: Add a comment to an article document
// @route   POST /content/news/:id/comments
exports.addNewsComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: "Comment text cannot be empty strings." });
        }

        const username = req.user.username || "System Node";

        const updatedPost = await News.findByIdAndUpdate(
            id,
            { $push: { comments: { user: username, text: text } } },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ error: "Target article not found." });
        }

        res.status(201).json(updatedPost.comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
