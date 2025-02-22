const Model = require('../models/blogModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.createOne = factory.createOne(Model);
exports.updateOne = factory.updateOne(Model);
exports.deleteOne = factory.deleteOne(Model);

exports.getAllNoPagination = factory.getAllNoPagination(Model);

exports.getAll = factory.getAll(Model);

// Custom getOne implementation to track views
exports.getOne = catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } }, // Increment views by 1
    {
      new: true, // Return updated document
      runValidators: true
    }
  );

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  });
});

exports.deleteAll = factory.deleteAll(Model);
