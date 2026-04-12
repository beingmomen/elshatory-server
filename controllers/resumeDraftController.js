const ResumeDraft = require('../models/resumeDraftModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.getAll = factory.getAll(ResumeDraft);

exports.getOne = catchAsync(async (req, res, next) => {
  const doc = await ResumeDraft.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  if (!doc) return next(new AppError('لم يتم العثور على المسودة', 404));
  res.status(200).json({ status: 'success', data: { draft: doc } });
});
