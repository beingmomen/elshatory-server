const Job = require('../models/jobModel');
const logger = require('./logger');
const gemini = require('./geminiClient');

const AI_GUARD_MIN_SCORE = Number(process.env.AI_GUARD_MIN_SCORE || 45);
const AI_GUARD_DELAY_MS = Number(process.env.GEMINI_RATE_LIMIT_MS || 1500);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Upsert a batch of scraped jobs. Returns counts {saved, skipped, errors, rejectedByAI}.
 * - saved: newly inserted jobs
 * - skipped: existing jobs whose lastSeenAt was bumped
 * - errors: write failures (not counted as skipped)
 * - rejectedByAI: jobs skipped because Gemini score < AI_GUARD_MIN_SCORE
 *
 * AI Guard runs only for newly-scraped jobs (before insert) when:
 *   - `profile` is provided
 *   - gemini.isConfigured() === true
 * Existing jobs bypass AI Guard (we just bump lastSeenAt).
 */
exports.upsertJobs = async ({
  jobs = [],
  source,
  userId = null,
  searchRunId = null,
  profile = null
}) => {
  const stats = { saved: 0, skipped: 0, errors: 0, rejectedByAI: 0 };
  const aiGuardEnabled = Boolean(profile) && gemini.isConfigured();

  for (const job of jobs) {
    if (!job || !job.jobUrl || !job.title) {
      stats.errors += 1;
      continue;
    }

    try {
      const now = new Date();

      // Check if job already exists — bypass AI Guard for existing jobs.
      // eslint-disable-next-line no-await-in-loop
      const existing = await Job.findOne({ jobUrl: job.jobUrl }).select('_id');

      let latestMatch = null;
      if (!existing && aiGuardEnabled) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const result = await gemini.scoreJob({
            job: {
              title: job.title,
              company: job.company,
              location: job.location,
              description: job.description,
              requirements: job.requirements,
              skills: job.skills,
              seniority: job.seniority,
              workplace: job.workplace
            },
            profile
          });

          if (result && typeof result.score === 'number') {
            if (result.score < AI_GUARD_MIN_SCORE) {
              stats.rejectedByAI += 1;
              // eslint-disable-next-line no-await-in-loop
              await delay(AI_GUARD_DELAY_MS);
              continue;
            }
            latestMatch = result;
          }
        } catch (err) {
          // Fail open: if Gemini errors (quota/network), we still save the job.
          logger.warn(`[AI Guard] scoring failed for ${job.jobUrl}: ${err.message}`);
        }
      }

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
          ...(job.postedAt && { postedAt: new Date(job.postedAt) }),
          ...(latestMatch && { latestMatch })
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
        new: false,
        includeResultMetadata: true
      });

      if (result?.lastErrorObject?.upserted) {
        stats.saved += 1;
      } else {
        stats.skipped += 1;
      }

      // Rate-limit after a successful AI call to stay under Gemini RPM cap.
      if (!existing && aiGuardEnabled && latestMatch) {
        // eslint-disable-next-line no-await-in-loop
        await delay(AI_GUARD_DELAY_MS);
      }
    } catch (err) {
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
