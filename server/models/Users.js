// server/models/Users.js - FINAL COMPREHENSIVE FIX

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tokenVersion: { type: Number, default: 0, select: false },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  role: { type: String, enum: ['user', 'author', 'editor', 'admin'], default: 'user' },
  
  // Commercial user profiles attributes mapping structures
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  phoneNumber: { type: String, default: "" },
  profileImage: { type: String, default: "" },
  preferredPaymentMethod: { type: String, enum: ['cash_on_delivery', 'card_to_seller', 'bank_transfer'], default: 'cash_on_delivery' },
  
  // Address specifications metrics layout node
  shippingAddress: {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "" }
  },

  // 🚀 FIXED: ADD THIS MISSING RELATIONSHIP ARRAY LAYER TO TRACK MONGODB BOOKMARKS
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory' // Maps directly back to your Inventory collection model
  }],

  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
