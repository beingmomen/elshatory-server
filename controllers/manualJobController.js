const Job = require('../models/jobModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const deriveTitleFromRaw = text => {
  const firstLine = text.split('\n').find(l => l.trim());
  return (firstLine || 'Imported Job').slice(0, 140);
};

exports.importJob = catchAsync(async (req, res, next) => {
  const { jobUrl, rawText, source = 'linkedin' } = req.body || {};

  if (!jobUrl && !rawText) {
    return next(new AppError('Provide jobUrl or rawText', 400));
  }

  const effectiveUrl = jobUrl || `manual://${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const existing = await Job.findOne({ jobUrl: effectiveUrl });
  if (existing) {
    existing.lastSeenAt = new Date();
    await existing.save();
    return res
      .status(200)
      .json({ status: 'success', isDuplicate: true, data: existing });
  }

  const description = rawText || '';
  const title = rawText ? deriveTitleFromRaw(rawText) : 'Imported LinkedIn Job';

  const doc = await Job.create({
    title,
    description,
    jobUrl: effectiveUrl,
    source,
    status: 'new',
    user: req.user?._id,
    lastSeenAt: new Date()
  });

  res.status(201).json({ status: 'success', isDuplicate: false, data: doc });
});
