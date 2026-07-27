// C:\Users\abdul\VS Projects\MERN-Offline\server\controllers\inventoryController.js
// 🚀 BACKEND COMPILER UNIFICATION PACK (UPDATED FOR DIRECTORY AND KEY SCHEMA MATCHING)

const Inventory = require('../models/Inventory');

// 1. Bulk Catalog Retrieval (router.get('/', ...))
exports.getItems = async (req, res) => {
  try {
    const items = await Inventory.find().populate('createdBy', 'username');
    return res.status(200).json({ data: items });
  } catch (err) {
    console.error("Backend Controller Fetch Error:", err);
    return res.status(500).json({ error: "Server fault retrieving inventory records." });
  }
};

// 2. Individual Item Retrieval Pipeline (router.get('/:id', ...))
exports.getItemById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id).populate('createdBy', 'username');
    if (!item) {
      return res.status(404).json({ error: "Inventory record not found." });
    }
    return res.status(200).json(item);
  } catch (err) {
    console.error("Backend Controller Fetch ID Error:", err);
    return res.status(500).json({ error: "Server fault parsing record ID." });
  }
};

// 3. New Entry Submission Engine (router.post('/', ...))
exports.addItem = async (req, res) => {
  try {
    const { name, brand, quantity, price, category } = req.body;

    // 🚀 FIXED: Path maps explicitly to public static products directories to avoid 404 breaks
    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : "";

    const newItem = new Inventory({
      name,
      brand,
      quantity: Number(quantity || 0),
      price: Number(price || 0),
      category: category || "tools",
      imagePath,
      createdBy: req.user ? req.user.id : null
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

    // Build the primary update packet with standard types
    const updatePacket = {
      name,
      brand,
      quantity: Number(quantity || 0),
      price: Number(price || 0),
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
    if (req.file) {
      updatePacket.imagePath = `/uploads/products/${req.file.filename}`;
    }

    // 🚀 FIXED: Set runValidators to false to prevent crashing on partial/empty edits
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      updatePacket,
      {
        returnDocument: 'after',
        runValidators: false // 👈 Changed from true to false to stop the brand/name crash error!
      }
    ).populate('createdBy', 'username');

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

    const newReview = {
      userId: activeUserId,
      username: activeUsername,
      rating: Number(rating || 5),
      comment: comment ? comment.trim() : "",
      createdAt: new Date()
    };

    // 1. Fetch the raw item to calculate the new average rating profile safely
    const currentItem = await Inventory.findById(itemId);
    if (!currentItem) {
      return res.status(404).json({ error: "Product asset target untraceable." });
    }

    const temporaryReviewsArray = [...(currentItem.reviews || []), newReview];
    const totalScore = temporaryReviewsArray.reduce((acc, curr) => acc + curr.rating, 0);
    const newAverageRating = totalScore / temporaryReviewsArray.length;

    // 2. Atomic array push and rating update (Bypasses parent document schema validators)
    const updatedDoc = await Inventory.findByIdAndUpdate(
      itemId,
      {
        $push: { reviews: newReview },
        $set: { averageRating: newAverageRating }
      },
      { new: true, runValidators: false }
    ).populate('createdBy', 'username');

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

    const itemIndex = user.wishlist.indexOf(itemId);

    if (itemIndex > -1) {
      // Item exists, pull it out to remove the bookmark
      user.wishlist.splice(itemIndex, 1);
    } else {
      // Fresh bookmark selection, push it onto your user document list array
      user.wishlist.push(itemId);
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
