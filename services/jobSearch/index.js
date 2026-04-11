/**
 * Job Search Orchestrator
 *
 * Coordinates the full Wuzzuf search pipeline:
 *  1. Mark the run as 'running'
 *  2. Extract raw jobs via wuzzufExtractor
 *  3. Normalize each job
 *  4. Deduplicate against existing DB records
 *  5. Save new jobs, update lastSeenAt for duplicates
 *  6. Update the run record with final stats and status
 *
 * Designed to run in the background (fire-and-forget from the controller).
 * A single failed job detail fetch does NOT abort the entire run.
 */

const { extractJobs } = require('./wuzzufExtractor');
const { normalizeWuzzufJob } = require('./normalizer');
const { findExistingJob } = require('./dedupe');
const { register } = require('./sourceRegistry');
const Job = require('../../models/jobModel');
const JobSearchRun = require('../../models/jobSearchRunModel');

/**
 * Execute a Wuzzuf search run end-to-end.
 *
 * @param {string|ObjectId} runId  - ID of the JobSearchRun document
 * @param {string}          userId - Authenticated user ID
 */
async function runWuzzufSearch(runId, userId) {
  // Fetch the run document
  const run = await JobSearchRun.findById(runId);
  if (!run) {
    console.error(`[JobSearch] Run ${runId} not found`);
    return;
  }

  // Mark as running
  run.status = 'running';
  run.startedAt = new Date();
  await run.save();

  const stats = { fetched: 0, saved: 0, skipped: 0, errors: 0 };
  const errorLog = [];

  try {
    // ---- Phase 1: Extract raw jobs ----
    const rawJobs = await extractJobs(run.query || {}, {
      onFetch(url) {
        // Called after each successful detail page fetch
      },
      onError(info) {
        errorLog.push(info);
        stats.errors += 1;
      },
    });

    stats.fetched = rawJobs.length;

    // ---- Phase 2: Normalize → Dedupe → Save ----
    for (const rawJob of rawJobs) {
      try {
        const normalized = normalizeWuzzufJob(rawJob);

        const dupe = await findExistingJob(normalized, userId);

        if (dupe) {
          // Refresh the "last seen" timestamp so stale jobs age out gracefully
          await Job.findByIdAndUpdate(dupe.existing._id, {
            lastSeenAt: new Date(),
          });
          stats.skipped += 1;
        } else {
          await Job.create({ ...normalized, user: userId });
          stats.saved += 1;
        }
      } catch (err) {
        console.error(`[JobSearch] Error processing job: ${err.message}`, {
          url: rawJob?.jobUrl,
        });
        stats.errors += 1;
        errorLog.push({ phase: 'save', url: rawJob?.jobUrl, error: err.message });
      }
    }

    // ---- Phase 3: Finalize run status ----
    const allFailed = stats.errors > 0 && stats.saved === 0 && stats.skipped === 0;
    const someErrors = stats.errors > 0;

    run.status = allFailed ? 'failed' : someErrors ? 'partial' : 'completed';
    run.stats = stats;
    run.sourceStats = { wuzzuf: { ...stats, errors: errorLog } };
    run.completedAt = new Date();

    if (allFailed && errorLog.length > 0) {
      run.errorMessage = errorLog.map((e) => e.error).join('; ').slice(0, 500);
    }

    await run.save();

    console.log(
      `[JobSearch] Run ${runId} ${run.status} — fetched=${stats.fetched} saved=${stats.saved} skipped=${stats.skipped} errors=${stats.errors}`
    );
  } catch (err) {
    // Catastrophic failure (network down, DB issue, etc.)
    console.error(`[JobSearch] Run ${runId} fatal error: ${err.message}`);

    run.status = 'failed';
    run.errorMessage = err.message;
    run.stats = stats;
    run.completedAt = new Date();
    await run.save();
  }
}

// Register Wuzzuf in the source registry so the controller can look it up
register('wuzzuf', runWuzzufSearch);

module.exports = { runWuzzufSearch };
