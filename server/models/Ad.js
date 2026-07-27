// server/models/Ad.js
const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
    label: { type: String, default: "SPONSORED LINKS" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    imagePath: { type: String }
}, {
    timestamps: true // Tracks exactly when ad campaigns were initialized or modified
});

const Ad = mongoose.models.Ad || mongoose.model('Ad', AdSchema);
module.exports = Ad;
