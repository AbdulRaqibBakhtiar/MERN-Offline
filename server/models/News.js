// server/models/News.js
const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    meta: { type: String, default: "Published Today | Business Desk" },
    summary: { type: String, required: true },
    fullText: { type: String },
    imagePath: { type: String },
    
    // Tracks database authorship by linking straight to your users database collection
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },

    // 🚀 NEW COMMENTS FIELD: Stores an array of live comment objects inside MongoDB
    comments: [{
        user: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, { 
    timestamps: true // Automatically creates and updates 'createdAt' and 'updatedAt' fields
});

const News = mongoose.models.News || mongoose.model('News', NewsSchema);
module.exports = News;
