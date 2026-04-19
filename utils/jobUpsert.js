const Job = require('../models/jobModel');
const logger = require('./logger');

/**
 * Upsert a batch of scraped jobs. Returns counts {saved, skipped, errors}.
 * - saved: newly inserted jobs
 * - skipped: existing jobs whose lastSeenAt was bumped
 * - errors: write failures (not counted as skipped)
 */
exports.upsertJobs = async ({ jobs = [], source, userId = null, searchRunId = null }) => {
  const stats = { saved: 0, skipped: 0, errors: 0 };

  for (const job of jobs) {
    if (!job || !job.jobUrl || !job.title) {
      stats.errors += 1;
      continue;
    }

    try {
      const now = new Date();
      const update = {
        $set: {
          title: job.title,
          company: job.company || '',
          location: job.location || '',
          description: job.description || '',
          requirements: Array.isArray(job.requirements) ? job.requirements : [],
          skills: Array.isArray(job.skills) ? job.skills : [],
          seniority: job.seniority || '',
          workplace: job.workplace || '',
          salary: job.salary || '',
          source: source || job.source,
          externalId: job.externalId || '',
          lastSeenAt: now,
          ...(job.postedAt && { postedAt: new Date(job.postedAt) })
        },
        $setOnInsert: {
          status: 'new',
          jobUrl: job.jobUrl,
          ...(userId && { user: userId }),
          ...(searchRunId && { searchRun: searchRunId })
        }
      };

      // eslint-disable-next-line no-await-in-loop
      const result = await Job.findOneAndUpdate({ jobUrl: job.jobUrl }, update, {
        upsert: true,
        new: false, // return pre-update doc to detect insert
        includeResultMetadata: true
      });

      if (result?.lastErrorObject?.upserted) {
        stats.saved += 1;
      } else {
        stats.skipped += 1;
      }
    } catch (err) {
      // Duplicate key on unique jobUrl can happen under concurrency; treat as skipped
      if (err.code === 11000) {
        stats.skipped += 1;
      } else {
        stats.errors += 1;
        logger.warn(`upsertJobs error for ${job.jobUrl}: ${err.message}`);
      }
    }
  }

  return stats;
};
