const Model = require('../models/infoModel');
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

  res.status(200).json(doc);
});

exports.updateOne = catchAsync(async (req, res, next) => {
  const doc = await Model.findOneAndUpdate(
    {},
    { $set: req.body },
    {
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
