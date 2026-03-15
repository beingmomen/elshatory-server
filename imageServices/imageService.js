const localStorage = require('./config/local.image');
const cloudinaryStorage = require('./config/cloudinary-image.image');

module.exports = (uploadFields, Model, storage = 'cloudinary') => {
  const service = storage === 'local' ? localStorage : cloudinaryStorage;

  return {
    handleImages: service.handleImages(uploadFields),
    updateImages: service.updateImages(uploadFields, Model),
    deleteImages: service.deleteImages(uploadFields)
  };
};
