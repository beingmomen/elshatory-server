const createImageService = require('./imageService');
const Model = require('../models/blogModel');

module.exports = createImageService(
  [
    {
      name: 'image',
      maxCount: 1,
      resize: { width: 800, height: 400, quality: 85 }
    }
  ],
  Model
);
