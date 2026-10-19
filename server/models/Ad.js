const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: 'SPONSORED LINKS'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    imagePath: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Ad = mongoose.models.Ad || mongoose.model('Ad', AdSchema);

module.exports = Ad;