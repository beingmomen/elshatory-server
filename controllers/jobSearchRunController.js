const JobSearchRun = require('../models/jobSearchRunModel');
const CareerProfile = require('../models/careerProfileModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const pythonFetcher = require('../utils/pythonJobFetcher');
const wuzzufAdapter = require('../utils/wuzzufAdapter');
const { upsertJobs } = require('../utils/jobUpsert');
const logger = require('../utils/logger');

const LINKEDIN_DISABLED =
  String(process.env.LINKEDIN_AUTOFETCH_ENABLED || 'false').toLowerCase() !== 'true';

const emptyStats = () => ({
  saved: 0,
  skipped: 0,
  errors: 0,
  rejectedByAI: 0,
  degraded: false,
  degradedReason: ''
});

exports.getAll = factory.getAll(JobSearchRun);

exports.getOne = catchAsync(async (req, res, next) => {
  const run = await JobSearchRun.findById(req.params.id);
  if (!run) return next(new AppError('Run not found', 404));
  res.status(200).json({ status: 'success', data: { run } });
});

const runPipeline = async (run, { profile }) => {
  const sources =
    run.source === 'all' ? ['wuzzuf', 'linkedin'] : [run.source];
  const sourceStats = {};
  const totals = { saved: 0, skipped: 0, errors: 0, rejectedByAI: 0 };

  // Wuzzuf (Node-side scraping)
  if (sources.includes('wuzzuf')) {
    try {
      const result = await wuzzufAdapter.scrape({
        terms: run.terms,
        location: run.location,
        maxJobs: run.maxJobs
      });
      const stats = await upsertJobs({
        jobs: result.jobs,
        source: 'wuzzuf',
        userId: run.user,
        searchRunId: run._id,
        profile
      });
      sourceStats.wuzzuf = {
        ...stats,
        degraded: result.degraded,
        degradedReason: result.degraded ? 'rate_limited' : ''
      };
      totals.saved += stats.saved;
      totals.skipped += stats.skipped;
      totals.errors += stats.errors;
      totals.rejectedByAI += stats.rejectedByAI || 0;
    } catch (err) {
      logger.error(`Wuzzuf pipeline failed: ${err.message}`);
      sourceStats.wuzzuf = {
        ...emptyStats(),
        degraded: true,
        degradedReason: 'rate_limited'
      };
    }
  }

  // LinkedIn / Indeed via JobSpy
  const jobspySites = [];
  if (sources.includes('linkedin')) {
    if (LINKEDIN_DISABLED) {
      sourceStats.linkedin = {
        ...emptyStats(),
        degraded: true,
        degradedReason: 'disabled_by_config'
      };
    } else {
      jobspySites.push('linkedin');
    }
  }
  if (jobspySites.length) {
    try {
      const result = await pythonFetcher.fetch({
        terms: run.terms,
        location: run.location,
        sites: jobspySites,
        maxJobs: run.maxJobs,
        maxJobAgeDays: profile?.maxJobAgeDays || 7
      });

      for (const site of jobspySites) {
        const bucket = result.sources?.[site];
        if (!bucket) {
          sourceStats[site] = {
            ...emptyStats(),
            degraded: true,
            degradedReason: 'manual_import_only'
          };
          continue;
        }

        const stats = await upsertJobs({
          jobs: bucket.jobs || [],
          source: site,
          userId: run.user,
          searchRunId: run._id,
          profile
        });

        sourceStats[site] = {
          ...stats,
          degraded: bucket.degraded || false,
          degradedReason: bucket.degraded ? 'manual_import_only' : ''
        };
        totals.saved += stats.saved;
        totals.skipped += stats.skipped;
        totals.errors += stats.errors;
        totals.rejectedByAI += stats.rejectedByAI || 0;
      }
    } catch (err) {
      logger.error(`JobSpy pipeline failed: ${err.message}`);
      for (const site of jobspySites) {
        sourceStats[site] = {
          ...emptyStats(),
          degraded: true,
          degradedReason: 'manual_import_only'
        };
      }
    }
  }

  return { totals, sourceStats };
};

exports.create = catchAsync(async (req, res) => {
  const { terms = [], source = 'wuzzuf', location = 'Egypt', maxPages = 3, maxJobs = 60 } =
    req.body || {};

  const run = await JobSearchRun.create({
    user: req.user?._id,
    terms,
    source,
    location,
    maxPages,
    maxJobs,
    status: 'running',
    startedAt: new Date()
  });

  // Respond immediately with the pending run
  res.status(201).json({ status: 'success', data: { run } });

  // Fire-and-forget background pipeline
  setImmediate(async () => {
    try {
      const profile = await CareerProfile.findOne({});
      const { totals, sourceStats } = await runPipeline(run, {
        profile: profile?.toObject ? profile.toObject() : profile || {}
      });

      const stats = Object.values(sourceStats).filter(Boolean);
      const anyJobsFound = stats.some(s => (s.saved + s.skipped) > 0);
      const realFailure = stats.some(
        s => s.degraded && s.degradedReason !== 'disabled_by_config'
      );
      const onlyConfigDegraded = stats.some(
        s => s.degraded && s.degradedReason === 'disabled_by_config'
      );

      let finalStatus;
      if (!anyJobsFound && realFailure) finalStatus = 'failed';
      else if (realFailure || onlyConfigDegraded) finalStatus = 'partial';
      else finalStatus = 'completed';

      await JobSearchRun.findByIdAndUpdate(run._id, {
        status: finalStatus,
        stats: totals,
        sourceStats,
        completedAt: new Date()
      });
    } catch (err) {
      logger.error(`Job search run ${run._id} failed: ${err.message}`);
      await JobSearchRun.findByIdAndUpdate(run._id, {
        status: 'failed',
        errorMessage: err.message,
        completedAt: new Date()
      });
    }
  });
});
