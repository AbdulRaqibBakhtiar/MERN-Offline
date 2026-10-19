const fs = require('fs');
const path = require('path');
const Ad = require('../models/Ad');

const getAbsoluteUploadPath = imagePath => {
  if (!imagePath) return null;

  const cleanPath = imagePath.replace(/^\/+/, '');

  return path.join(__dirname, '..', '..', cleanPath);
};

const removeFile = imagePath => {
  const absolutePath = getAbsoluteUploadPath(imagePath);

  if (!absolutePath) return;

  fs.unlink(absolutePath, err => {
    if (err && err.code !== 'ENOENT') {
      console.error('Could not remove advertisement image:', err.message);
    }
  });
};

const getAdImages = ad => {
  if (Array.isArray(ad.images) && ad.images.length) {
    return ad.images;
  }

  if (ad.imagePath) {
    return [ad.imagePath];
  }

  return [];
};

exports.getActiveAds = async (req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });

    res.status(200).json(ads);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.createAdCampaign = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'Headline title and description are required.'
      });
    }

    const uploadedImages = Array.isArray(req.files)
      ? req.files.map(file => `/public/uploads/ads/${file.filename}`)
      : [];

    const freshAd = new Ad({
      title,
      description,
      images: uploadedImages,
      imagePath: uploadedImages[0] || ''
    });

    await freshAd.save();

    res.status(201).json(freshAd);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.updateAdCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const existingAd = await Ad.findById(id);

    if (!existingAd) {
      return res.status(404).json({
        error: 'Advertisement campaign not found.'
      });
    }

    const updateData = {
      title,
      description
    };

    if (Array.isArray(req.files) && req.files.length) {
      const oldImages = getAdImages(existingAd);

      oldImages.forEach(removeFile);

      const newImages = req.files.map(
        file => `/public/uploads/ads/${file.filename}`
      );

      updateData.images = newImages;
      updateData.imagePath = newImages[0] || '';
    }

    const updatedAd = await Ad.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json(updatedAd);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.deleteAdCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const targetAd = await Ad.findById(id);

    if (!targetAd) {
      return res.status(404).json({
        error: 'Advertisement campaign not found.'
      });
    }

    const images = getAdImages(targetAd);

    images.forEach(removeFile);

    await Ad.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Advertisement campaign deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};