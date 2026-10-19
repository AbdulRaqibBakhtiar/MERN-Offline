// models/Inventory.js
const mongoose = require('mongoose');

// Sub-schema to store interactive 5-star comments
const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const inventorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 120 },
    brand: { type: String, required: true, trim: true, maxlength: 80 },
    quantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
    price: { type: Number, required: true, min: 0 },
    imagePath: { type: String, default: "" },
    media: [{
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], required: true },
        mimeType: { type: String, default: '' },
        filename: { type: String, default: '' }
    }],
    category: { type: String, default: "tools" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },

    // 🚀 NEW SIMULATED COMMERCIAL FIELDS
    description: { type: String, default: "", maxlength: 5000 },
    condition: { type: String, default: "New", maxlength: 80 },
    warranty: { type: String, default: "", maxlength: 240 },
    specifications: {
        dimensions: { type: String, default: "Standard Size" },
        weight: { type: String, default: "Lightweight Ergonomic Composition" },
        powerSource: { type: String, default: "Cordless / Lithium-Ion Battery System" }
    },
    
    // 🚀 NEW INTERACTIVE COMPONENT: Real database comment array tracker
    reviews: [reviewSchema],
    averageRating: { type: Number, default: 5 },
    viewCount: { type: Number, default: 0, min: 0 },
    saveCount: { type: Number, default: 0, min: 0 }
});

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
