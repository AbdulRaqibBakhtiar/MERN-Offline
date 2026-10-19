const mongoose = require('mongoose');

const marketplaceOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  productSnapshot: {
    name: { type: String, required: true },
    brand: { type: String, default: '' },
    unitPrice: { type: Number, required: true }
  },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['cash_on_delivery', 'card_to_seller', 'bank_transfer'], default: 'cash_on_delivery' },
  deliveryMethod: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
  deliveryAddress: { type: String, default: '', maxlength: 500 },
  status: { type: String, enum: ['pending', 'accepted', 'processing', 'packed', 'ready_for_pickup', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'fulfilled'], default: 'pending', index: true },
  trackingCarrier: { type: String, default: '', maxlength: 100 },
  trackingNumber: { type: String, default: '', maxlength: 120 },
  statusHistory: [{
    status: { type: String, enum: ['pending', 'accepted', 'processing', 'packed', 'ready_for_pickup', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'fulfilled'], required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '', maxlength: 300 },
    createdAt: { type: Date, default: Date.now }
  }],
  checkpoints: [{
    label: { type: String, required: true, trim: true, maxlength: 80 },
    note: { type: String, default: '', trim: true, maxlength: 300 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  }],
  hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.models.MarketplaceOrder || mongoose.model('MarketplaceOrder', marketplaceOrderSchema);
