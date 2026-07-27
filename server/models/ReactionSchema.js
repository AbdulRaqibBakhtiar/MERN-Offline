const mongoose = require('mongoose');

// 1. Define the sub-document structure for a single reaction slot
const ReactionSchema = new mongoose.Schema({
  emoji: { 
    type: String, 
    required: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// 2. Locate your existing Message schema and inject this field array:
// Add this line inside your main MessageSchema configuration definition:
// reactions: [ReactionSchema]

module.exports = {
  ReactionSchema
};
