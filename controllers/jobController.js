const Job = require('../models/jobModel');
const JobMatch = require('../models/jobMatchModel');
const ResumeDraft = require('../models/resumeDraftModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { matchJob } = require('../services/matching/matchJob');
const { buildSnapshot, computeProfileVersion } = require('../services/careerProfile/snapshot');
const { generateAtsDraft } = require('../services/resume/atsDraftGenerator');

exports.getAll = factory.getAll(Job);

exports.updateOne = factory.updateOne(Job);

/**
 * GET /api/v1/jobs/:id
 * Returns the job with its latest match analysis embedded.
 */
exports.getOne = catchAsync(async (req, res, next) => {
  const job = await Job.findOne({ _id: req.params.id, user: req.user.id }).lean();

  if (!job) {
    return next(new AppError('لم يتم العثور على الوظيفة', 404));
  }

  const latestMatch = await JobMatch.findOne({ job: job._id, user: req.user.id })
    .select('score level matchedSkills missingSkills reasons risks recommendations generatedBy updatedAt profileVersion')
    .lean();

  res.status(200).json({
    status: 'success',
    data: { ...job, latestMatch: latestMatch || null }
  });
});

/**
 * POST /api/v1/jobs/:id/analyze
 * Runs matching analysis and persists the result.
 */
exports.analyzeJob = catchAsync(async (req, res) => {
  const match = await matchJob(req.params.id, req.user.id);

  res.status(200).json({
    status: 'success',
    data: { match }
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

exports.createResumeDraft = catchAsync(async (req, res, next) => {
  const job = await Job.findOne({ _id: req.params.id, user: req.user.id }).lean();
  if (!job) return next(new AppError('لم يتم العثور على الوظيفة', 404));

  const snapshot = await buildSnapshot(req.user.id);
  const profileVersion = computeProfileVersion(snapshot);

  const match = await JobMatch.findOne({ job: job._id, user: req.user.id })
    .select('missingSkills level')
    .lean();

  const { content, warnings, format } = generateAtsDraft(job, snapshot, match);

  const draft = await ResumeDraft.create({
    job: job._id,
    user: req.user.id,
    profileVersion,
    format,
    content,
    warnings
  });

  res.status(201).json({ status: 'success', data: { draft } });
});
