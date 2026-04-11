const Job = require('../models/jobModel');
const ResumeDraft = require('../models/resumeDraftModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.getAll = factory.getAll(Job);
exports.getOne = factory.getOne(Job);
exports.updateOne = factory.updateOne(Job);

exports.analyzeJob = catchAsync(async (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'Not implemented yet'
  });
});

exports.getResumeDrafts = catchAsync(async (req, res) => {
  const drafts = await ResumeDraft.find({
    job: req.params.id,
    user: req.user.id
  }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: drafts.length,
    data: { drafts }
  });
});

exports.createResumeDraft = catchAsync(async (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'Not implemented yet'
  });
});
