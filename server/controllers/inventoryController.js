// C:\Users\abdul\VS Projects\MERN-Offline\server\controllers\inventoryController.js
// 🚀 BACKEND COMPILER UNIFICATION PACK (UPDATED FOR DIRECTORY AND KEY SCHEMA MATCHING)

const Inventory = require('../models/Inventory');
const mongoose = require('mongoose');

const uploadedProductMedia = req => {
  const files = [
    ...(req.files?.productImage || []),
    ...(req.files?.productMedia || []),
    ...(req.file ? [req.file] : [])
  ];
  return files.map(file => ({
    url: `/uploads/products/${file.filename}`,
    type: file.mimetype?.startsWith('video/') ? 'video' : 'image',
    mimeType: file.mimetype || '',
    filename: file.filename
  }));
};

// 1. Bulk Catalog Retrieval (router.get('/', ...))
exports.getItems = async (req, res) => {
  try {
    const items = await Inventory.find().populate('createdBy', 'username firstName lastName profileImage');
    return res.status(200).json({ data: items });
  } catch (err) {
    console.error("Backend Controller Fetch Error:", err);
    return res.status(500).json({ error: "Server fault retrieving inventory records." });
  }
};

// 2. Individual Item Retrieval Pipeline (router.get('/:id', ...))
exports.getItemById = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }, { new: true }).populate('createdBy', 'username firstName lastName profileImage');
    if (!item) {
      return res.status(404).json({ error: "Inventory record not found." });
    }
    return res.status(200).json(item);
  } catch (err) {
    console.error("Backend Controller Fetch ID Error:", err);
    return res.status(500).json({ error: "Server fault parsing record ID." });
  }
};

exports.claimOrphanedItem = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid product ID.' });
  }
  try {
    const claimed = await Inventory.findOneAndUpdate(
      { _id: req.params.id, $or: [{ createdBy: null }, { createdBy: { $exists: false } }] },
      { $set: { createdBy: req.user.id } },
      { new: true }
    ).populate('createdBy', 'username firstName lastName profileImage');
    if (claimed) return res.status(200).json(claimed);
    const existing = await Inventory.findById(req.params.id).select('_id createdBy');
    if (!existing) return res.status(404).json({ error: 'Product not found.' });
    return res.status(409).json({ error: 'This listing is already linked to a seller account.' });
  } catch (err) {
    console.error('Orphaned listing claim failed:', err);
    return res.status(500).json({ error: 'Could not link this listing to your account.' });
  }
};

// 3. New Entry Submission Engine (router.post('/', ...))
exports.addItem = async (req, res) => {
  try {
    const { name, brand, quantity, price, category, description } = req.body;
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    if (!String(name || '').trim() || String(name).trim().length > 120 || !String(brand || '').trim() || String(brand).trim().length > 80 || !Number.isInteger(parsedQuantity) || parsedQuantity < 0 || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Enter a product name, brand, non-negative whole stock quantity, and valid price.' });
    }

    // 🚀 FIXED: Path maps explicitly to public static products directories to avoid 404 breaks
    const media = uploadedProductMedia(req);
    const imagePath = media.find(item => item.type === 'image')?.url || "";

    const newItem = new Inventory({
      name,
      brand,
      quantity: parsedQuantity,
      price: parsedPrice,
      category: category || "tools",
      description: String(description || '').trim().slice(0, 5000),
      imagePath,
      media,
      createdBy: req.user.id
    });

    await newItem.save();
    return res.status(201).json(newItem);
  } catch (err) {
    console.error("Backend Controller Add Item Error:", err);
    return res.status(500).json({ error: "Server fault saving new catalog entry." });
  }
};

// 4. Live Operational Asset Update Node (router.put('/:id', ...))
// 4. Live Operational Asset Update Node (router.put('/:id', ...))
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Destructure all fields from the request body
    const {
      name, brand, quantity, price, category,
      description, condition, warranty, specifications
    } = req.body;

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    const allowedCategories = ['tools', 'hardware', 'machinery'];
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 120 ||
        typeof brand !== 'string' || !brand.trim() || brand.trim().length > 80 ||
        !Number.isInteger(parsedQuantity) || parsedQuantity < 0 ||
        !Number.isFinite(parsedPrice) || parsedPrice < 0 ||
        !allowedCategories.includes(String(category || 'tools'))) {
      return res.status(400).json({ error: 'Enter a valid name, brand, category, non-negative whole stock quantity, and price.' });
    }

    // Build the primary update packet with standard types
    const updatePacket = {
      name,
      brand,
      quantity: parsedQuantity,
      price: parsedPrice,
      category: category || "tools",
      description: description || "",
      condition: condition || "",
      warranty: warranty || ""
    };

    // 🚀 FIXED: Removed the duplicated variable declaration trap!
    if (specifications) {
      // Clean parsing attempt for either JSON strings or object maps
      let parsedSpecs = {};
      try {
        parsedSpecs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
      } catch (e) {
        parsedSpecs = specifications || {};
      }

      // Carefully extract form-data spec maps from your React Frontend
      updatePacket.specifications = {
        dimensions: req.body['specifications[dimensions]'] || parsedSpecs.dimensions || "Standard Size",
        weight: req.body['specifications[weight]'] || parsedSpecs.weight || "Standard Weight",
        powerSource: req.body['specifications[powerSource]'] || parsedSpecs.powerSource || "N/A"
      };
    }

    // Synchronize image path if a new file asset is uploaded
    const newMedia = uploadedProductMedia(req);
    let retainedMedia = [];
    if (req.body.keepMedia) {
      try {
        const parsed = JSON.parse(req.body.keepMedia);
        if (Array.isArray(parsed)) retainedMedia = parsed.filter(item => item?.url && ['image', 'video'].includes(item.type));
      } catch (error) {
        return res.status(400).json({ error: 'Invalid retained media list.' });
      }
    } else {
      const current = await Inventory.findById(id).select('media imagePath');
      retainedMedia = current?.media?.length
        ? current.media
        : (current?.imagePath ? [{ url: current.imagePath, type: 'image', mimeType: 'image/*' }] : []);
    }
    updatePacket.media = [...retainedMedia, ...newMedia];
    updatePacket.imagePath = updatePacket.media.find(item => item.type === 'image')?.url || '';

    // Keep model validation enabled so malformed form data cannot bypass schema rules.
    const existingItem = await Inventory.findById(id);
    if (!existingItem) return res.status(404).json({ error: "Product not found." });
    if (req.user.role !== 'admin' && String(existingItem.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ error: "You can only edit your own listings." });
    }
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      updatePacket,
      {
        returnDocument: 'after',
        runValidators: true
      }
    ).populate('createdBy', 'username firstName lastName profileImage');

    if (!updatedItem) {
      return res.status(404).json({ error: "Inventory target asset un-traceable during save pipeline." });
    }

    return res.status(200).json(updatedItem);

  } catch (err) {
    console.error("Backend Controller Update Error:", err);
    return res.status(500).json({ error: "Server fault updating item entry details." });
  }
};



// 5. Destructive Purge Actions (router.delete('/:id', ...))
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findById(id);
    if (!item) return res.status(404).json({ error: "Product not found." });
    if (req.user.role !== 'admin' && String(item.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ error: "You can only remove your own listings." });
    }
    await Inventory.findByIdAndDelete(id);
    return res.status(200).json({ message: "Product record removed successfully." });
  } catch (err) {
    console.error("Backend Controller Delete Error:", err);
    return res.status(500).json({ error: "Server fault eliminating data record entries." });
  }
};

// 6. Interactive Customer Star Feedback System (router.post('/:id/review', ...))
// 6. Interactive Customer Star Feedback System (router.post('/:itemId/review', ...))
exports.addProductReview = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { rating, comment } = req.body;

    const activeUserId = req.user ? (req.user._id || req.user.id) : null;
    const activeUsername = req.user ? req.user.username : "Anonymous";

    if (!activeUserId) {
      return res.status(401).json({ error: "Authentication state invalid. User identification missing." });
    }

    const numericRating = Number(rating);
    const cleanComment = typeof comment === 'string' ? comment.trim() : '';
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: "Choose a rating from 1 to 5 stars." });
    }
    if (!cleanComment || cleanComment.length > 2000) {
      return res.status(400).json({ error: "Write a review between 1 and 2000 characters." });
    }
    const currentItem = await Inventory.findById(itemId);
    if (!currentItem) {
      return res.status(404).json({ error: "Product asset target untraceable." });
    }
    if (String(currentItem.createdBy) === String(activeUserId)) {
      return res.status(403).json({ error: "You cannot review your own listing." });
    }
    if (currentItem.reviews?.some(review => String(review.userId) === String(activeUserId))) {
      return res.status(409).json({ error: "You have already reviewed this listing." });
    }

    const newReview = {
      userId: activeUserId,
      username: activeUsername,
      rating: numericRating,
      comment: cleanComment,
      createdAt: new Date()
    };

    // Recompute from the stored array to keep averages consistent with the visible reviews.
    const temporaryReviewsArray = [...(currentItem.reviews || []), newReview];
    const totalScore = temporaryReviewsArray.reduce((acc, curr) => acc + curr.rating, 0);
    const newAverageRating = totalScore / temporaryReviewsArray.length;

    // Match on non-reviewer to prevent duplicate reviews from racing requests.
    const updatedDoc = await Inventory.findOneAndUpdate(
      { _id: itemId, createdBy: { $ne: activeUserId }, 'reviews.userId': { $ne: activeUserId } },
      { $push: { reviews: newReview }, $set: { averageRating: newAverageRating } },
      { new: true, runValidators: false }
    ).populate('createdBy', 'username firstName lastName profileImage');
    if (!updatedDoc) return res.status(409).json({ error: "This listing has already been reviewed by your account." });

    return res.status(201).json(updatedDoc);

  } catch (err) {
    console.error("🔴 ATOMIC CONTROLLER PIPELINE FAILURE:", err);
    return res.status(500).json({
      error: `Server fault append review array schemas. details: ${err.message}`
    });
  }
};

// =========================================================================
// 🚀 ADD THESE WISHLIST CONTROLLER METHODS AT THE VERY BOTTOM OF YOUR FILE
// =========================================================================
const User = require('../models/Users'); // 👈 Ensure this points to your exact User model file location

// A. Fetch the active user's bookmarked wishlist items
exports.getWishlist = async (req, res) => {
  try {
    // Queries the database and automatically populates the referenced items
    const userWithWishlist = await User.findById(req.user.id).populate({
      path: 'wishlist',
      populate: { path: 'createdBy', select: 'username' }
    });

    if (!userWithWishlist) {
      return res.status(404).json({ error: "User account footprint untraceable." });
    }

    return res.status(200).json(userWithWishlist.wishlist || []);
  } catch (err) {
    console.error("Backend Wishlist Fetch Error:", err);
    return res.status(500).json({ error: "Server error parsing user bookmarks array." });
  }
};

// B. Toggle item inclusion inside your user model wishlist collection
exports.toggleWishlist = async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: "Required product ID parameter missing." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Account database profile untraceable." });
    }

    // Initialize array safely if it doesn't exist on older documents
    if (!user.wishlist) user.wishlist = [];

    const itemIndex = user.wishlist.findIndex(savedId => String(savedId) === String(itemId));

    if (itemIndex > -1) {
      // Item exists, pull it out to remove the bookmark
      user.wishlist.splice(itemIndex, 1);
      await Inventory.updateOne({ _id: itemId, saveCount: { $gt: 0 } }, { $inc: { saveCount: -1 } });
    } else {
      // Fresh bookmark selection, push it onto your user document list array
      user.wishlist.push(itemId);
      await Inventory.updateOne({ _id: itemId }, { $inc: { saveCount: 1 } });
    }

    await user.save();

    // Re-populate the item properties before returning to ensure frontend sync matches automatically
    const updatedUser = await User.findById(req.user.id).populate({
      path: 'wishlist',
      populate: { path: 'createdBy', select: 'username' }
    });

    return res.status(200).json(updatedUser.wishlist || []);
  } catch (err) {
    console.error("Backend Wishlist Toggle Error:", err);
    return res.status(500).json({ error: "Server lifecycle fault modifying catalog bookmarks." });
  }
};
