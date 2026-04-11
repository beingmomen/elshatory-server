const JobSearchRun = require('../models/jobSearchRunModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.getAll = factory.getAll(JobSearchRun);
exports.getOne = factory.getOne(JobSearchRun);

exports.createOne = catchAsync(async (req, res) => {
  const run = await JobSearchRun.create({
    source: req.body.source,
    query: req.body.query || {},
    status: 'pending',
    user: req.user.id
  });

  res.status(202).json({
    status: 'success',
    message: 'Search run queued',
    data: { run }
  });
});
