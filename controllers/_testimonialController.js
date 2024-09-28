const Model = require('../models/categoryModel');
const factory = require('./handlerFactory');
const createImageHandlerFactory = require('../utils/createImageHandlerFactory');

const imageFields = [
  {
    name: 'image',
    maxCount: 1,
    resize: { width: 500, height: 500, quality: 85 }
  }
];

const {
  uploadImages,
  processImages,
  createOneWithImages,
  updateOneWithImages
} = createImageHandlerFactory(Model, imageFields, 'testimonials');

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
