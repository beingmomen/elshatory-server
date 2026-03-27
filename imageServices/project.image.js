const createImageService = require('./imageService');
const Model = require('../models/projectModel');

module.exports = createImageService(
  [
    {
      name: 'image',
      maxCount: 1,
      resize: { width: 400, height: 192, fit: 'cover', quality: 85 }
    }
  ],
  Model
);
