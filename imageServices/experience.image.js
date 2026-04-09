const createImageService = require('./imageService');
const Model = require('../models/experienceModel');

module.exports = createImageService(
  [
    {
      name: 'iconName',
      maxCount: 1,
      resize: { width: 200, height: 200, quality: 90 }
    }
  ],
  Model
);
