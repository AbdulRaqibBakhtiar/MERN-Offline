const express = require("express"); 
const router = express.Router(); 
const ChatMessage = require("../models/ChatMessage"); 
const User = require('../models/Users'); // Imports your user schema 
const Group = require('../models/Group'); // Imports your dynamic group schema 
const mongoose = require('mongoose');

// 🚀 1. Fetch real active personnel directory from database 
router.get("/users", async (req, res) => { 
  try { 
    const staff = await User.find({}, 'username firstName lastName email profileImage'); 
    res.status(200).json(staff); 
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed to read database personnel indexes." }); 
  } 
}); 

// 🚀 2. Store a freshly provisioned collaboration group channel 
router.post("/groups", async (req, res) => { 
  try { 
    const { name, members, createdBy } = req.body; 
    const newGroup = new Group({ name, members, createdBy }); 
    await newGroup.save(); 
    res.status(201).json({ id: newGroup._id, name: newGroup.name, members: newGroup.members, type: 'group' }); 
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed to save group room configuration." }); 
  } 
}); 

// 🚀 3. Get all active collaborative workspace groups 
router.get("/groups", async (req, res) => { 
  try { 
    const activeGroups = await Group.find({}); 
    const formatted = activeGroups.map(g => ({ id: g._id, name: g.name, members: g.members, type: 'group' })); 
    res.status(200).json(formatted); 
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed to read workspace group logs." }); 
  } 
}); 

// 🚀 4. Load message log history dynamically by target room channel ID 
router.get("/history/:roomId", async (req, res) => { 
  try { 
    const { roomId } = req.params; 
    const messages = await ChatMessage 
      .find({ room: roomId }) 
      .sort({ createdAt: -1 }) 
      .limit(50); 
    res.json(messages.reverse()); 
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed to load custom chat channel histories." }); 
  } 
}); 

// 🚀 NEW ROUTE 5: Get recent active conversations summary map for a user
router.get('/conversations-summary', async (req, res) => {
  try {
    const { userId } = req.query; // Expecting user ID passed as query: ?userId=xxxx
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "A valid User ID query parameter is required." });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    const summary = await ChatMessage.aggregate([
      // Match messages belonging to a group room or a direct DM conversation containing the user's ID string
      {
        $match: {
          $or: [
            { room: { $regex: userId } },       // Matches direct message room strings (e.g. "userA_userB")
            { room: { $not: { $regex: /_/ } } } // Matches group channel names or IDs with no underscores
          ]
        }
      },
      // Sort messages descending to catch the most recent updates first
      { $sort: { createdAt: -1 } },
      // Group by room ID to extract latest message preview fields
      {
        $group: {
          _id: "$room",
          lastMessage: { $first: "$message" },
          type: { $first: "$type" },
          timestamp: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                { $in: [userObjId, { $ifNull: ["$readBy.userId", []] }] }, 0, 1
              ]
            }
          }
        }
      }
    ]);

    // Format output array into an easily queryable object look-up dictionary map
    const metadataMap = {};
    summary.forEach(item => {
      metadataMap[item._id] = {
        lastMessage: item.type === 'text' ? item.lastMessage : `📷 ${item.type}`,
        timestamp: item.timestamp,
        unreadCount: item.unreadCount
      };
    });

    res.status(200).json(metadataMap);
  } catch (err) {
    console.error("❌ Aggregation summary error:", err);
    res.status(500).json({ error: "Failed to calculate active conversations overview." });
  }
});

module.exports = router;
