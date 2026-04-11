const JobSearchRun = require('../models/jobSearchRunModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const { runWuzzufSearch } = require('../services/jobSearch/index');

exports.getAll = factory.getAll(JobSearchRun);
exports.getOne = factory.getOne(JobSearchRun);

exports.createOne = catchAsync(async (req, res) => {
  const run = await JobSearchRun.create({
    source: req.body.source,
    query: req.body.query || {},
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
  if (req.body.source === 'wuzzuf') {
    setImmediate(() => {
      runWuzzufSearch(run._id, req.user.id).catch((err) =>
        console.error('[JobSearch] Unhandled run error:', err.message)
      );
    });
  }
});
