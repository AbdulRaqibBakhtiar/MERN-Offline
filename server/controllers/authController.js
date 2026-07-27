// ==========================================
// AUTH CONTROLLER - PART 1 OF 2
// ==========================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users'); 
const fs = require('fs');
const path = require('path');

const registerUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phoneNumber } = req.body;
    if (!username || !email || !password) {
      console.error("❌ Registration Rejected: Core parameters missing.");
      return res.status(400).json({ error: 'Please provide a username, email address, and password.' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ error: 'Username is already taken.' });

    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ error: 'An account with this email already exists.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username, email, password: hashedPassword,
      firstName: firstName || "", lastName: lastName || "", phoneNumber: phoneNumber || ""
    });

    await newUser.save();
    console.log("✅ User created successfully in MongoDB!");
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('❌ Registration Engine Error:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error during registration.' });
  }
};
// ==========================================
// AUTH CONTROLLER - PART 2 OF 2
// ==========================================
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Please provide both username and password' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    const userResponse = user.toObject();
    delete userResponse.password; 

    res.status(200).json({
      token,
      user: {
        id: userResponse._id, username: userResponse.username,
        firstName: userResponse.firstName || "", lastName: userResponse.lastName || "",
        phoneNumber: userResponse.phoneNumber || "", email: userResponse.email || "",
        profileImage: userResponse.profileImage || "", shippingAddress: userResponse.shippingAddress || {},
        createdAt: userResponse.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Login Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userInstance = await User.findById(req.user.id);
    if (!userInstance) return res.status(404).json({ error: 'Account missing.' });

    const { firstName, lastName, phoneNumber, email, shippingAddress } = req.body;
    const hasValue = (val) => val !== undefined && val !== null && val !== "undefined" && String(val).trim() !== "";

    if (hasValue(firstName)) userInstance.firstName = firstName.trim();
    if (hasValue(lastName)) userInstance.lastName = lastName.trim();
    if (hasValue(phoneNumber)) userInstance.phoneNumber = phoneNumber.trim();
    if (hasValue(email)) userInstance.email = email.trim();

    if (hasValue(shippingAddress)) {
      try {
        const parsedAddress = typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress;
        userInstance.shippingAddress = {
          street: hasValue(parsedAddress.street) ? parsedAddress.street.trim() : userInstance.shippingAddress?.street || "",
          city: hasValue(parsedAddress.city) ? parsedAddress.city.trim() : userInstance.shippingAddress?.city || "",
          state: hasValue(parsedAddress.state) ? parsedAddress.state.trim() : userInstance.shippingAddress?.state || "",
          postalCode: hasValue(parsedAddress.postalCode) ? parsedAddress.postalCode.trim() : userInstance.shippingAddress?.postalCode || "",
          country: hasValue(parsedAddress.country) ? parsedAddress.country.trim() : userInstance.shippingAddress?.country || "United States"
        };
      } catch (jsonErr) { console.error(jsonErr.message); }
    }

    if (req.file) {
      if (userInstance.profileImage) {
        const absoluteOldPath = path.join(__dirname, '..', '..', userInstance.profileImage);
        fs.unlink(absoluteOldPath, (err) => { if (err) console.warn(err.message); });
      }
      userInstance.profileImage = `/public/uploads/profiles/${req.file.filename}`;
    }

    await userInstance.save();
    return res.status(200).json({
      message: "Profile saved successfully.",
      user: { id: userInstance._id, username: userInstance.username, firstName: userInstance.firstName, lastName: userInstance.lastName, phoneNumber: userInstance.phoneNumber, email: userInstance.email, profileImage: userInstance.profileImage, shippingAddress: userInstance.shippingAddress, createdAt: userInstance.createdAt }
    });
  } catch (err) {
    console.error("❌ Profile update error:", err.message);
    return res.status(500).json({ error: "Internal operational error." });
  }
};

// 🛠️ CLEAN EXPORT ALIGNMENT BLOCK: Resolves all Express router binding crashes permanently
module.exports = { registerUser, loginUser, updateUserProfile };
