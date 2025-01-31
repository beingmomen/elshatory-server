const Model = require('../models/categoryModel');
const factory = require('./handlerFactory');
const ImageHandler = require('../utils/images/ImageHandler');

const imageFields = [
  {
    name: 'image',
    maxCount: 1,
    resize: { width: 500, height: 500, quality: 85 }
  },
  {
    name: 'imageCover',
    maxCount: 1,
    resize: { width: 2000, height: 1333, quality: 90 }
  },
  {
    name: 'images',
    maxCount: 3,
    resize: { width: 1000, height: 666, quality: 85 }
  }
];

const imageHandler = new ImageHandler(Model, imageFields, 'categories');

exports.uploadImages = imageHandler.uploadImages();
exports.processImages = imageHandler.processImages();
exports.createOne = imageHandler.createOne();
exports.updateOne = imageHandler.updateOne();
exports.deleteOne = imageHandler.deleteOne();

exports.getAllNoPagination = factory.getAllNoPagination(Model);

exports.getAll = factory.getAll(Model);
exports.getOne = factory.getOne(Model);

exports.deleteAll = factory.deleteAll(Model);
