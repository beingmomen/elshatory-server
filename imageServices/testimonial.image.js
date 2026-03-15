const createImageService = require('./imageService');
const Model = require('../models/testimonialModel');

module.exports = createImageService(
  [
    {
      name: 'image',
      maxCount: 1,
      resize: { width: 500, height: 500, quality: 85 }
    }
  ],
  Model
);
