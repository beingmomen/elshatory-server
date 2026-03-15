const createImageService = require('./imageService');
const CategoryModel = require('../models/categoryModel');

module.exports = createImageService(
  [
    {
      name: 'image',
      maxCount: 1,
      resize: { width: 500, height: 500, quality: 85 }
    },
    {
      name: 'imageCover',
      maxCount: 1,
      resize: { width: 800, height: 400, quality: 85 }
    },
    {
      name: 'images',
      maxCount: 3,
      resize: { width: 500, height: 500, quality: 85 }
    }
  ],
  CategoryModel,
  'local'
);
