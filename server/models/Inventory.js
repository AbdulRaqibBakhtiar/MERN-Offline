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
    name: { type: String, required: true },
    brand: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    imagePath: { type: String, default: "" },
    category: { type: String, default: "tools" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },

    // 🚀 NEW SIMULATED COMMERCIAL FIELDS
    description: { type: String, default: "Professional-grade industrial hardware tool designed for structural precision and heavy-duty deployment." },
    condition: { type: String, default: "Brand New / Factory Sealed" },
    warranty: { type: String, default: "1-Year Manufacturer Warranty Protection Included" },
    specifications: {
        dimensions: { type: String, default: "Standard Size" },
        weight: { type: String, default: "Lightweight Ergonomic Composition" },
        powerSource: { type: String, default: "Cordless / Lithium-Ion Battery System" }
    },
    
    // 🚀 NEW INTERACTIVE COMPONENT: Real database comment array tracker
    reviews: [reviewSchema],
    averageRating: { type: Number, default: 5 }
});

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
