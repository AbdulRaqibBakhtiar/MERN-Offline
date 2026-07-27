const mongoose = require("mongoose");

// 1. ISOLATE SUB-DOCUMENT LAYER WITH EXPLICIT AUTO-ID DEACTIVATION
const ReactionSubSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  username: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// 2. DEFINE SYSTEM MAIN SCHEMATICS
const chatMessageSchema = new mongoose.Schema({
  room: { type: String, default: "global_workspace" },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: { type: String, required: true },
  senderAvatar: { type: String, default: null },
  message: { type: String, default: "" },
  type: { type: String, default: "text" },
  attachment: { type: String, default: null },
  attachmentType: { type: String, default: null },
  
  // 🚀 NEW: INJECT PARENT MESSAGE REPLY CONTEXT DATA LAYER
  replyTo: {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage", default: null },
    message: { type: String, default: null },
    senderName: { type: String, default: null }
  },

  // INJECT EXPLICIT COMPREHENSIVE REACTION MATRIX
  reactions: [ReactionSubSchema],
  delivered: { type: Boolean, default: false },
  readBy: [{ userId: mongoose.Schema.Types.ObjectId, readAt: Date }]
}, { timestamps: true });

// Check if the model already exists to prevent compilation error blocks on rebuilds
module.exports = mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);
