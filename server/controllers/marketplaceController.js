const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const User = require('../models/Users');
const MarketplaceOrder = require('../models/MarketplaceOrder');
const ProductConversation = require('../models/ProductConversation');
const socketManager = require('../config/socket');

const broadcastConversationMessage = (conversation, message) => {
  socketManager.getIO().to(`user:${conversation.vendor}`).to(`user:${conversation.customer}`).emit('product_conversation_message', {
    conversationId: String(conversation._id),
    productId: String(conversation.product),
    message
  });
};

const validId = id => mongoose.Types.ObjectId.isValid(id);

exports.listMarketplaceVendors = async (req, res) => {
  try {
    const vendors = await Inventory.aggregate([
      { $match: { createdBy: { $type: 'objectId' } } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: '$createdBy',
        listingCount: { $sum: 1 },
        featuredProduct: { $first: { _id: '$_id', name: '$name', imagePath: '$imagePath' } }
      } },
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(String(req.user.id)) } } },
      { $lookup: { from: User.collection.name, localField: '_id', foreignField: '_id', as: 'seller' } },
      { $unwind: '$seller' },
      { $project: {
        _id: 1,
        username: '$seller.username',
        firstName: '$seller.firstName',
        lastName: '$seller.lastName',
        profileImage: '$seller.profileImage',
        listingCount: 1,
        featuredProduct: 1
      } },
      { $sort: { username: 1 } }
    ]);
    return res.json(vendors);
  } catch (error) {
    console.error('Marketplace vendor list failed:', error);
    return res.status(500).json({ error: 'Could not load marketplace sellers.' });
  }
};

exports.createOrder = async (req, res) => {
  const quantity = Number(req.body.quantity);
  const paymentMethod = req.body.paymentMethod || 'cash_on_delivery';
  const deliveryMethod = req.body.deliveryMethod || 'delivery';
  const deliveryAddress = typeof req.body.deliveryAddress === 'string' ? req.body.deliveryAddress.trim() : '';
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
    return res.status(400).json({ error: 'Enter a valid order quantity.' });
  }
  if (!['cash_on_delivery', 'card_to_seller', 'bank_transfer'].includes(paymentMethod)) return res.status(400).json({ error: 'Choose a supported payment preference.' });
  if (!['delivery', 'pickup'].includes(deliveryMethod)) return res.status(400).json({ error: 'Choose delivery or seller pickup.' });
  if (deliveryAddress.length > 500 || (deliveryMethod === 'delivery' && !deliveryAddress)) return res.status(400).json({ error: 'Enter a delivery address or choose seller pickup.' });
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid product ID.' });
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Product not found.' });
    if (!item.createdBy) return res.status(409).json({ error: 'This listing is not linked to a seller account. An administrator must assign it to a seller before it can be ordered.' });
    if (String(item.createdBy) === String(req.user.id)) return res.status(400).json({ error: 'You cannot order your own listing.' });
    if (!Number.isFinite(Number(item.price)) || Number(item.price) < 0) return res.status(409).json({ error: 'This listing has an invalid price and cannot be ordered.' });
    const buyer = await User.findById(req.user.id).select('_id');
    if (!buyer) return res.status(401).json({ error: 'Your account could not be verified.' });
    const reserved = await Inventory.updateOne({ _id: item._id, quantity: { $gte: quantity } }, { $inc: { quantity: -quantity } });
    if (!reserved.modifiedCount) return res.status(409).json({ error: 'There is not enough stock for that quantity.' });
    let order;
    try {
      order = await MarketplaceOrder.create({
        orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}-${require('crypto').randomBytes(3).toString('hex').toUpperCase()}`,
        product: item._id,
        buyer: buyer._id,
        vendor: item.createdBy,
        productSnapshot: { name: item.name, brand: item.brand, unitPrice: item.price },
        quantity,
        total: Number((item.price * quantity).toFixed(2)),
        paymentMethod,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : '',
        statusHistory: [{ status: 'pending', updatedBy: buyer._id, note: 'Order request sent' }]
      });
    } catch (createError) {
      await Inventory.updateOne({ _id: item._id }, { $inc: { quantity } });
      throw createError;
    }
    return res.status(201).json({ order: { _id: order._id, orderNumber: order.orderNumber, status: order.status, quantity, total: order.total } });
  } catch (error) {
    console.error('Order creation failed:', error);
    return res.status(500).json({
      error: 'Could not place the order. Please try again.',
      ...(process.env.NODE_ENV !== 'production' ? { detail: error.message } : {})
    });
  }
};

exports.listSellingOrders = async (req, res) => {
  try {
    const orders = await MarketplaceOrder.find({ vendor: req.user.id, hiddenBy: { $ne: req.user.id } }).sort({ createdAt: -1 }).populate('buyer', 'username');
    return res.json(orders);
  } catch (error) {
    console.error('Seller order list failed:', error);
    return res.status(500).json({ error: 'Could not load orders for your listings.' });
  }
};

exports.listBuyingOrders = async (req, res) => {
  try {
    const orders = await MarketplaceOrder.find({ buyer: req.user.id, hiddenBy: { $ne: req.user.id } })
      .sort({ createdAt: -1 })
      .populate('vendor', 'username');
    return res.json(orders);
  } catch (error) {
    console.error('Buyer order list failed:', error);
    return res.status(500).json({ error: 'Could not load your order history.' });
  }
};

exports.updateSellingOrder = async (req, res) => {
  const { status } = req.body;
  if (!validId(req.params.orderId)) return res.status(400).json({ error: 'Invalid order ID.' });
  const trackingCarrier = typeof req.body.trackingCarrier === 'string' ? req.body.trackingCarrier.trim().slice(0, 100) : '';
  const trackingNumber = typeof req.body.trackingNumber === 'string' ? req.body.trackingNumber.trim().slice(0, 120) : '';
  if (status !== undefined && !['accepted', 'processing', 'packed', 'ready_for_pickup', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid order status.' });
  try {
    const order = await MarketplaceOrder.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const isVendor = req.user.role === 'admin' || String(order.vendor) === String(req.user.id);
    if (req.body.checkpoint || req.body.completeCheckpointId) {
      if (!isVendor) return res.status(403).json({ error: 'Only the seller can manage order checkpoints.' });
      if (order.status === 'cancelled' || ['delivered', 'fulfilled'].includes(order.status)) return res.status(409).json({ error: 'Tracking is closed for this order.' });
      if (req.body.checkpoint) {
        const label = typeof req.body.checkpoint.label === 'string' ? req.body.checkpoint.label.trim() : '';
        const note = typeof req.body.checkpoint.note === 'string' ? req.body.checkpoint.note.trim() : '';
        if (!label || label.length > 80 || note.length > 300) return res.status(400).json({ error: 'Checkpoint titles must be 1–80 characters and notes up to 300 characters.' });
        if ((order.checkpoints || []).length >= 20) return res.status(409).json({ error: 'This order already has the maximum of 20 custom checkpoints.' });
        order.checkpoints.push({ label, note, createdBy: req.user.id });
      } else {
        if (!validId(req.body.completeCheckpointId)) return res.status(400).json({ error: 'Invalid checkpoint ID.' });
        const checkpoint = order.checkpoints.id(req.body.completeCheckpointId);
        if (!checkpoint) return res.status(404).json({ error: 'Checkpoint not found.' });
        if (checkpoint.completedAt) return res.status(409).json({ error: 'This checkpoint is already complete.' });
        checkpoint.completedAt = new Date();
        checkpoint.completedBy = req.user.id;
      }
      await order.save();
      await order.populate('buyer vendor', 'username');
      return res.json({ order });
    }
    if (status === undefined) return res.status(400).json({ error: 'Choose an order update or checkpoint.' });
    const isBuyer = String(order.buyer) === String(req.user.id);
    const isBuyerConfirmingDelivery = isBuyer && status === 'delivered';
    const isBuyerCancelling = isBuyer && status === 'cancelled';
    if (!isVendor && !isBuyerConfirmingDelivery && !isBuyerCancelling) return res.status(403).json({ error: 'Only the seller or this order’s buyer can update it.' });
    let allowedNextStatus = false;
    if (isBuyerConfirmingDelivery) {
      allowedNextStatus = ['shipped', 'out_for_delivery', 'ready_for_pickup'].includes(order.status);
    } else if (isBuyerCancelling) {
      allowedNextStatus = ['pending', 'accepted'].includes(order.status);
    } else {
      switch (order.status) {
        case 'pending': allowedNextStatus = ['accepted', 'cancelled'].includes(status); break;
        case 'accepted': allowedNextStatus = ['processing', 'cancelled'].includes(status); break;
        case 'processing': allowedNextStatus = ['packed', 'cancelled'].includes(status); break;
        case 'packed': allowedNextStatus = order.deliveryMethod === 'pickup'
          ? ['ready_for_pickup', 'cancelled'].includes(status)
          : ['shipped', 'cancelled'].includes(status); break;
        case 'ready_for_pickup': allowedNextStatus = status === 'delivered'; break;
        case 'shipped': allowedNextStatus = ['out_for_delivery', 'delivered'].includes(status); break;
        case 'out_for_delivery': allowedNextStatus = status === 'delivered'; break;
        default: allowedNextStatus = false;
      }
    }
    if (!allowedNextStatus) return res.status(409).json({ error: 'This order cannot move to that status.' });
    if (['shipped', 'out_for_delivery'].includes(status) && !isBuyerConfirmingDelivery && !order.trackingCarrier && !order.trackingNumber && !trackingCarrier && !trackingNumber) {
      return res.status(400).json({ error: 'Add a carrier or tracking number before marking this order shipped.' });
    }
    const previousStatus = order.status;
    const set = { status };
    if (trackingCarrier) set.trackingCarrier = trackingCarrier;
    if (trackingNumber) set.trackingNumber = trackingNumber;
    const trackingNote = ['shipped', 'out_for_delivery'].includes(status)
      ? [trackingCarrier, trackingNumber && `Tracking ${trackingNumber}`].filter(Boolean).join(' · ')
      : '';
    const updatedOrder = await MarketplaceOrder.findOneAndUpdate(
      { _id: order._id, status: previousStatus },
      { $set: set, $push: { statusHistory: { status, updatedBy: req.user.id, note: trackingNote } } },
      { new: true }
    ).populate('buyer vendor', 'username');
    if (!updatedOrder) return res.status(409).json({ error: 'This order has already been updated.' });
    if (status === 'cancelled' && ['pending', 'accepted', 'processing', 'packed'].includes(previousStatus)) {
      await Inventory.updateOne({ _id: order.product }, { $inc: { quantity: order.quantity } });
    }
    return res.json({ order: updatedOrder });
  } catch (error) {
    console.error('Seller order update failed:', error);
    return res.status(500).json({ error: 'Could not update this order.' });
  }
};

exports.deleteMarketplaceOrder = async (req, res) => {
  if (!validId(req.params.orderId)) return res.status(400).json({ error: 'Invalid order ID.' });
  try {
    const order = await MarketplaceOrder.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const isParty = req.user.role === 'admin' || [order.buyer, order.vendor].some(id => String(id) === String(req.user.id));
    if (!isParty) return res.status(403).json({ error: 'You cannot remove this order.' });
    if (!['delivered', 'fulfilled', 'cancelled'].includes(order.status)) {
      return res.status(409).json({ error: 'Only completed or cancelled orders can be removed from history.' });
    }
    const result = await MarketplaceOrder.updateOne({ _id: order._id, status: order.status, hiddenBy: { $ne: req.user.id } }, { $addToSet: { hiddenBy: req.user.id } });
    if (!result.modifiedCount) return res.status(409).json({ error: 'This order changed while you were removing it. Refresh and try again.' });
    return res.json({ message: 'Order removed from your history.', orderId: String(order._id) });
  } catch (error) {
    console.error('Marketplace order removal failed:', error);
    return res.status(500).json({ error: 'Could not remove this order.' });
  }
};

const getConversation = async (req, res) => {
  if (!validId(req.params.id)) return { error: { status: 400, message: 'Invalid product ID.' } };
  const item = await Inventory.findById(req.params.id).select('createdBy name');
  if (!item) return { error: { status: 404, message: 'Product not found.' } };
  if (String(item.createdBy) === String(req.user.id)) return { error: { status: 400, message: 'This is your listing.' } };
  let conversation = await ProductConversation.findOne({ product: item._id, vendor: item.createdBy, customer: req.user.id });
  if (!conversation) {
    try {
      conversation = await ProductConversation.create({ product: item._id, vendor: item.createdBy, customer: req.user.id, messages: [] });
    } catch (error) {
      if (error.code !== 11000) throw error;
      conversation = await ProductConversation.findOne({ product: item._id, vendor: item.createdBy, customer: req.user.id });
    }
  }
  return { item, conversation };
};

exports.getProductConversation = async (req, res) => {
  try {
    const result = await getConversation(req, res);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    const vendor = await User.findById(result.item.createdBy).select('username profileImage');
    return res.json({ conversationId: result.conversation._id, product: { _id: result.item._id, name: result.item.name }, vendor, messages: result.conversation.messages });
  } catch (error) {
    console.error('Conversation fetch failed:', error);
    return res.status(500).json({ error: 'Could not load this conversation.' });
  }
};

exports.sendProductMessage = async (req, res) => {
  const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
  if (!text || text.length > 2000) return res.status(400).json({ error: 'Message must be between 1 and 2000 characters.' });
  try {
    const result = await getConversation(req, res);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    const user = await User.findById(req.user.id).select('username');
    const message = { sender: user._id, senderName: user.username, text, createdAt: new Date() };
    result.conversation.messages.push(message);
    await result.conversation.save();
    const savedMessage = result.conversation.messages[result.conversation.messages.length - 1];
    broadcastConversationMessage(result.conversation, savedMessage);
    return res.status(201).json({ conversationId: result.conversation._id, message: savedMessage });
  } catch (error) {
    console.error('Message send failed:', error);
    return res.status(500).json({ error: 'Could not send your message.' });
  }
};

exports.listMyConversations = async (req, res) => {
  try {
    const conversations = await ProductConversation.find({ $or: [{ vendor: req.user.id }, { customer: req.user.id }] })
      .sort({ updatedAt: -1 })
      .populate('product', 'name imagePath')
      .populate('vendor', 'username firstName lastName profileImage')
      .populate('customer', 'username firstName lastName profileImage');
    return res.json(conversations);
  } catch (error) {
    console.error('Conversation list failed:', error);
    return res.status(500).json({ error: 'Could not load your conversations.' });
  }
};

exports.getConversationById = async (req, res) => {
  if (!validId(req.params.conversationId)) return res.status(400).json({ error: 'Invalid conversation ID.' });
  try {
    const conversation = await ProductConversation.findById(req.params.conversationId)
      .populate('product', 'name').populate('vendor', 'username').populate('customer', 'username');
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    if (![String(conversation.vendor._id), String(conversation.customer._id)].includes(String(req.user.id))) return res.status(403).json({ error: 'You are not part of this conversation.' });
    return res.json({ product: conversation.product, vendor: conversation.vendor, customer: conversation.customer, messages: conversation.messages });
  } catch (error) {
    console.error('Conversation load failed:', error);
    return res.status(500).json({ error: 'Could not load this conversation.' });
  }
};

exports.sendConversationMessage = async (req, res) => {
  const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
  if (!text || text.length > 2000) return res.status(400).json({ error: 'Message must be between 1 and 2000 characters.' });
  if (!validId(req.params.conversationId)) return res.status(400).json({ error: 'Invalid conversation ID.' });
  try {
    const conversation = await ProductConversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    if (![String(conversation.vendor), String(conversation.customer)].includes(String(req.user.id))) return res.status(403).json({ error: 'You are not part of this conversation.' });
    const user = await User.findById(req.user.id).select('username');
    conversation.messages.push({ sender: user._id, senderName: user.username, text });
    await conversation.save();
    const savedMessage = conversation.messages[conversation.messages.length - 1];
    broadcastConversationMessage(conversation, savedMessage);
    return res.status(201).json({ conversationId: conversation._id, message: savedMessage });
  } catch (error) {
    console.error('Conversation reply failed:', error);
    return res.status(500).json({ error: 'Could not send your message.' });
  }
};
