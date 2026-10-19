const mongoose = require('mongoose');

const productConversationSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true, maxlength: 80 },
    text: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

productConversationSchema.index({ product: 1, vendor: 1, customer: 1 }, { unique: true });
module.exports = mongoose.models.ProductConversation || mongoose.model('ProductConversation', productConversationSchema);
