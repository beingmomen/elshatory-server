const JobSource = require('../models/jobSourceModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAll = factory.getAll(JobSource);

exports.getHealth = catchAsync(async (req, res, next) => {
  const source = await JobSource.findOne({ key: req.params.key });

  if (!source) {
    return next(
      new AppError(`No job source found with key: ${req.params.key}`, 404)
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      key: source.key,
      name: source.name,
      enabled: source.enabled,
      mode: source.mode,
      lastHealthStatus: source.lastHealthStatus,
      lastCheckedAt: source.lastCheckedAt,
      lastError: source.lastError
    }
  });
});
