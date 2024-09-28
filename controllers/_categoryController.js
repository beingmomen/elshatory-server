const Model = require('../models/categoryModel');
const factory = require('./handlerFactory');
const createImageHandlerFactory = require('../utils/createImageHandlerFactory');

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

const {
  uploadImages,
  processImages,
  createOneWithImages,
  updateOneWithImages
} = createImageHandlerFactory(Model, imageFields, 'categories');

exports.uploadImages = uploadImages;
exports.processImages = processImages;
exports.createOne = createOneWithImages;
exports.updateOne = updateOneWithImages;

exports.getAllNoPagination = factory.getAllNoPagination(
  Model,
  [],
  (selectFields = '')
);

exports.getAll = factory.getAll(Model);
exports.getOne = factory.getOne(Model);

exports.deleteOne = factory.deleteOne(
  Model,
  imageFields.map(field => field.name)
);
