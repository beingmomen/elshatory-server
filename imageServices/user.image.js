const createImageService = require('./imageService');
const UserModel = require('../models/userModel');

module.exports = createImageService(
  [
    {
      name: 'photo',
      maxCount: 1,
      resize: { width: 500, height: 500, quality: 85 }
    }
  ],
  UserModel,
  'local'
);
