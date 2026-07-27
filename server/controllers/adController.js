// server/controllers/adController.js
const fs = require('fs');
const path = require('path');
const Ad = require('../models/Ad');

// @desc    Get all active ad banners
// @route   GET /content/ads/active
exports.getActiveAds = async (req, res) => {
    try {
        const banners = await Ad.find().sort({ createdAt: -1 });
        res.status(200).json(banners);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Create a new ad campaign slot
// @route   POST /content/ads
exports.createAdCampaign = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'Headline titles and descriptors are required.' });
        }

        const freshAd = new Ad({
            title,
            description,
            imagePath: req.file ? `/public/uploads/ads/${req.file.filename}` : ''
        });

        await freshAd.save();
        res.status(201).json(freshAd);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Update text attributes or replace promotional graphics on an existing ad slot
// @route   PUT /content/ads/:id
exports.updateAdCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        let updateData = { title, description };

        if (req.file) {
            const oldAd = await Ad.findById(id);
            if (oldAd && oldAd.imagePath) {
                const absoluteOldPath = path.join(__dirname, '..', '..', oldAd.imagePath.replace(/^\//, ''));
                fs.unlink(absoluteOldPath, (err) => {
                    if (err) console.error('⚠️ Could not clear old campaign file off disk:', err.message);
                });
            }
            updateData.imagePath = `/public/uploads/ads/${req.file.filename}`;
        }

        const updatedAd = await Ad.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedAd) {
            return res.status(404).json({ error: "Target campaign document not found." });
        }
        res.status(200).json(updatedAd);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Erase ad records from MongoDB collections and clean files off server disk media
// @route   DELETE /content/ads/:id
exports.deleteAdCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const targetAd = await Ad.findById(id);

        if (!targetAd) {
            return res.status(404).json({ error: "Target campaign asset metadata context missing." });
        }

        if (targetAd.imagePath) {
            const absoluteFilePath = path.join(__dirname, '..', '..', targetAd.imagePath.replace(/^\//, ''));
            fs.unlink(absoluteFilePath, (err) => {
                if (err) console.error('⚠️ File erasure fault on disk media:', err.message);
            });
        }

        await Ad.findByIdAndDelete(id);
        res.status(200).json({ message: "Advertisement record dropped successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
