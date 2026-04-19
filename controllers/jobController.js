const Job = require('../models/jobModel');
const CareerProfile = require('../models/careerProfileModel');
const ResumeDraft = require('../models/resumeDraftModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const gemini = require('../utils/geminiClient');

exports.getAll = catchAsync(async (req, res, next) => {
  const { source, status, seniority, search, keyword } = req.query;

  const optFilter = {};
  if (source) optFilter.source = source;
  if (status) optFilter.status = status;
  if (seniority) optFilter.seniority = seniority;

  if (search || keyword) {
    const needle = String(search || keyword).trim();
    if (needle) {
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(escaped, 'i');
      optFilter.$or = [{ title: rx }, { company: rx }, { skills: rx }];
    }
  }

  // Strip our custom params from req.query so APIFeatures doesn't double-filter
  req.query = { ...req.query };
  delete req.query.source;
  delete req.query.status;
  delete req.query.seniority;
  delete req.query.search;
  delete req.query.keyword;

  return factory.getAll(Job, { optFilter })(req, res, next);
});

exports.getOne = factory.getOne(Job);

exports.updateOne = catchAsync(async (req, res, next) => {
  const allowed = ['status'];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const doc = await Job.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true
  });

  if (!doc) return next(new AppError('Job not found', 404));

  res.status(200).json({ status: 'success', data: doc });
});

exports.analyze = catchAsync(async (req, res, next) => {
  if (!gemini.isConfigured()) {
    return next(new AppError('AI scoring is not configured (missing GEMINI_API_KEY)', 503));
  }

  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found', 404));

  const profile = (await CareerProfile.findOne({})) || {
    targetRoles: [],
    targetSeniority: [],
    defaultStacks: [],
    optionalStacks: [],
    locationPreferences: [],
    workplacePreferences: [],
    requiredKeywords: [],
    excludedKeywords: []
  };

  const match = await gemini.scoreJob({
    job: job.toObject(),
    profile: profile.toObject ? profile.toObject() : profile
  });

  if (!match) {
    return next(new AppError('AI analysis failed to return valid JSON', 502));
  }

  job.latestMatch = match;
  await job.save();

  res.status(200).json({ status: 'success', data: job });
});

exports.getDrafts = catchAsync(async (req, res) => {
  const drafts = await ResumeDraft.find({ job: req.params.id })
    .sort({ createdAt: -1 })
    .limit(10);
  res.status(200).json({ status: 'success', data: { drafts } });
});

exports.createDraft = catchAsync(async (req, res, next) => {
  if (!gemini.isConfigured()) {
    return next(new AppError('AI drafting is not configured (missing GEMINI_API_KEY)', 503));
  }

  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found', 404));

  const profile = (await CareerProfile.findOne({})) || {};

  const draft = await gemini.tailorResume({
    job: job.toObject(),
    profile: profile.toObject ? profile.toObject() : profile
  });

  const saved = await ResumeDraft.create({
    job: job._id,
    user: req.user?._id,
    ...draft
  });

  if (job.status === 'new') {
    job.status = 'cv_ready';
    await job.save();
  }

  res.status(201).json({ status: 'success', data: saved });
});
