const mongoose = require('mongoose');

const softwareSchema = new mongoose.Schema({
  name: { type: String, required: true },
  version: { type: String, required: true, default: "v1.0" },
  description: { type: String, required: true },

  image: {
    type: String,
    default: ""
  },

  downloadLink: { type: String, default: "/404" },
  slug: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Software', softwareSchema);
