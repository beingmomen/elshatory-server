const Model = require('../models/infoModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.createOne = catchAsync(async (req, res, next) => {
  const doc = await Model.findOneAndUpdate(
    {},
    { $set: req.body },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    status: 'success',
    message: 'Updated successfully',
    data: {
      data: doc
    }
  });
});

exports.getAll = catchAsync(async (req, res, next) => {
  const doc = await Model.findOne();

  res.status(200).json({
    status: 'success',
    data: doc
  });
});

exports.getAllNoPagination = factory.getAllNoPagination(Model);
exports.getOne = factory.getOne(Model);
exports.updateOne = factory.updateOne(Model);
exports.deleteOne = factory.deleteOne(Model);
exports.deleteAll = factory.deleteAll(Model);
