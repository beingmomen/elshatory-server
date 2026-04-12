const JobSearchRun = require('../models/jobSearchRunModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  runWuzzufSearch,
  runLinkedInSearch,
  runAllSearch
} = require('../services/jobSearch/index');

exports.getAll = factory.getAll(JobSearchRun);

exports.getOne = catchAsync(async (req, res, next) => {
  const doc = await JobSearchRun.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  if (!doc) return next(new AppError('لم يتم العثور على عملية البحث', 404));
  res.status(200).json({ status: 'success', data: { run: doc } });
});

exports.createOne = catchAsync(async (req, res, next) => {
  // Separate source from the rest of the request body so query contains
  // exactly what the extractors need (terms, location, maxPages, maxJobs, …)
  const { source, ...queryData } = req.body;

  if (!source) {
    return next(
      new AppError('Source is required (wuzzuf, linkedin, or all)', 400)
    );
  }

  const run = await JobSearchRun.create({
    source,
    query: queryData,
    status: 'pending',
    user: req.user.id
  });

  // Return immediately — client polls GET /job-search-runs/:id for completion
  res.status(202).json({
    status: 'success',
    message: 'Search run started',
    data: { run }
  });

  // Fire extraction in the background (non-blocking)
  const handleError = err =>
    console.error('[JobSearch] Unhandled run error:', err.message);

  if (source === 'wuzzuf') {
    setImmediate(() =>
      runWuzzufSearch(run._id, req.user.id).catch(handleError)
    );
  } else if (source === 'linkedin') {
    setImmediate(() =>
      runLinkedInSearch(run._id, req.user.id).catch(handleError)
    );
  } else if (source === 'all') {
    setImmediate(() => runAllSearch(run._id, req.user.id).catch(handleError));
  }
});
