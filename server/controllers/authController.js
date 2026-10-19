// ==========================================
// AUTH CONTROLLER - PART 1 OF 2
// ==========================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users'); 
const fs = require('fs');
const path = require('path');
const { getJwtSecret } = require('../middleware/auth');
const { configuredRoleFor } = require('../utils/configuredRole');

const registerUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phoneNumber, shippingAddress, preferredPaymentMethod } = req.body;
    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      console.error("❌ Registration Rejected: Core parameters missing.");
      return res.status(400).json({ error: 'Please provide a username, email address, and password.' });
    }

    const normalizedUsername = String(username).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedUsername || normalizedUsername.length < 3 || normalizedUsername.length > 30 || !/^[a-zA-Z0-9._-]+$/.test(normalizedUsername)) {
      return res.status(400).json({ error: 'Username must be 3–30 characters and use only letters, numbers, dots, underscores, or hyphens.' });
    }
    if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>_]/.test(password)) {
      return res.status(400).json({ error: 'Password must be 8+ characters and include an uppercase letter, a number, and a symbol.' });
    }

    const userExists = await User.findOne({ username: { $regex: `^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
    if (userExists) return res.status(400).json({ error: 'Username is already taken.' });

    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) return res.status(400).json({ error: 'An account with this email already exists.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: normalizedUsername, email: normalizedEmail, password: hashedPassword,
      firstName: firstName || "", lastName: lastName || "", phoneNumber: phoneNumber || "",
      shippingAddress: {
        street: String(shippingAddress?.street || '').trim(),
        city: String(shippingAddress?.city || '').trim(),
        state: String(shippingAddress?.state || '').trim(),
        postalCode: String(shippingAddress?.postalCode || '').trim(),
        country: String(shippingAddress?.country || '').trim()
      },
      preferredPaymentMethod: ['cash_on_delivery', 'card_to_seller', 'bank_transfer'].includes(preferredPaymentMethod)
        ? preferredPaymentMethod : 'cash_on_delivery'
    });

    await newUser.save();
    console.log("✅ User created successfully in MongoDB!");
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('❌ Registration Engine Error:', error.message);
    if (error.code === 11000) return res.status(409).json({ error: 'That username or email is already registered.' });
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

    const user = await User.findOne({ username }).select('+tokenVersion');
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

    const configuredRole = configuredRoleFor(user.username);
    if (user.role !== configuredRole) {
      user.role = configuredRole;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role, tokenVersion: user.tokenVersion || 0 }, getJwtSecret(), { expiresIn: '7d' });
    
    const userResponse = user.toObject();
    delete userResponse.password; 

    res.status(200).json({
      token,
      user: {
        id: userResponse._id, username: userResponse.username, role: userResponse.role,
        firstName: userResponse.firstName || "", lastName: userResponse.lastName || "",
        phoneNumber: userResponse.phoneNumber || "", email: userResponse.email || "",
        preferredPaymentMethod: userResponse.preferredPaymentMethod || 'cash_on_delivery',
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

    const { firstName, lastName, phoneNumber, email, shippingAddress, preferredPaymentMethod } = req.body;
    const hasValue = (val) => val !== undefined && val !== null && val !== "undefined" && String(val).trim() !== "";

    if (hasValue(firstName)) userInstance.firstName = firstName.trim();
    if (hasValue(lastName)) userInstance.lastName = lastName.trim();
    if (phoneNumber !== undefined && phoneNumber !== null) userInstance.phoneNumber = String(phoneNumber).trim();
    if (hasValue(email)) userInstance.email = email.trim();
    if (preferredPaymentMethod !== undefined) {
      const allowedPaymentMethods = ['cash_on_delivery', 'card_to_seller', 'bank_transfer'];
      if (!allowedPaymentMethods.includes(preferredPaymentMethod)) return res.status(400).json({ error: 'Choose a supported payment preference.' });
      userInstance.preferredPaymentMethod = preferredPaymentMethod;
    }

    if (hasValue(shippingAddress)) {
      try {
        const parsedAddress = typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress;
        const addressValue = (key, fallback = '') => Object.prototype.hasOwnProperty.call(parsedAddress, key)
          ? String(parsedAddress[key] ?? '').trim()
          : userInstance.shippingAddress?.[key] || fallback;
        userInstance.shippingAddress = {
          street: addressValue('street'),
          city: addressValue('city'),
          state: addressValue('state'),
          postalCode: addressValue('postalCode'),
          country: addressValue('country', 'United States')
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
      user: { id: userInstance._id, username: userInstance.username, role: userInstance.role, firstName: userInstance.firstName, lastName: userInstance.lastName, phoneNumber: userInstance.phoneNumber, email: userInstance.email, profileImage: userInstance.profileImage, shippingAddress: userInstance.shippingAddress, preferredPaymentMethod: userInstance.preferredPaymentMethod, createdAt: userInstance.createdAt }
    });
  } catch (err) {
    console.error("❌ Profile update error:", err.message);
    return res.status(500).json({ error: "Internal operational error." });
  }
};

// 🛠️ CLEAN EXPORT ALIGNMENT BLOCK: Resolves all Express router binding crashes permanently
module.exports = { registerUser, loginUser, updateUserProfile };
