const Model = require('../models/infoModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.createOne = catchAsync(async (req, res, next) => {
  await Model.deleteMany();
  const doc = await Model.create(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Updated successfully',
    data: {
      data: doc
    }
  });
});
exports.updateOne = factory.updateOne(Model);
exports.deleteOne = factory.deleteOne(Model);

exports.getAllNoPagination = factory.getAllNoPagination(Model);

exports.getAll = catchAsync(async (req, res, next) => {
  const doc = await Model.findOne();
  res.status(200).json({
    status: 'success',
    data: doc
  });
});

exports.getOne = factory.getOne(Model);

exports.deleteAll = factory.deleteAll(Model);
