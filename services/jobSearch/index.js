/**
 * Job Search Orchestrator
 *
 * Coordinates search pipelines for all supported sources.
 *
 * Exported runners:
 *   runWuzzufSearch(runId, userId)    — Wuzzuf only
 *   runLinkedInSearch(runId, userId)  — LinkedIn only
 *   runAllSearch(runId, userId)       — Wuzzuf + LinkedIn; LinkedIn failure is isolated
 *
 * Design principles:
 *   - Each runner marks its run 'running', processes jobs, then finalises the run record.
 *   - `source=all` keeps Wuzzuf's result authoritative; LinkedIn degraded → status='partial'.
 *   - A single failed job does NOT abort a run.
 *   - All runners are fire-and-forget safe (no unhandled rejections).
 */

const { extractJobs } = require('./wuzzufExtractor');
const { normalizeWuzzufJob } = require('./normalizer');
const { findExistingJob } = require('./dedupe');
const { register } = require('./sourceRegistry');
const {
  executeLinkedInSearch,
  normalizeLinkedInJob
} = require('./linkedinAdapter');
const Job = require('../../models/jobModel');
const JobSearchRun = require('../../models/jobSearchRunModel');

// ---------------------------------------------------------------------------
// Shared save helper
// ---------------------------------------------------------------------------

/**
 * Normalise, deduplicate and persist a list of raw jobs.
 * Updates statsRef in-place.
 *
 * @param {object[]} rawJobs
 * @param {Function} normalizeFn  - (rawJob) → normalized
 * @param {string}   userId
 * @param {object}   statsRef     - { fetched, saved, skipped, errors }
 * @param {object[]} errorLog     - array to append error details to
 */
async function _saveJobs(rawJobs, normalizeFn, userId, statsRef, errorLog) {
  for (const rawJob of rawJobs) {
    try {
      const normalized = normalizeFn(rawJob);
      const dupe = await findExistingJob(normalized, userId);

      if (dupe) {
        await Job.findByIdAndUpdate(dupe.existing._id, {
          lastSeenAt: new Date()
        });
        statsRef.skipped += 1;
      } else {
        await Job.create({ ...normalized, user: userId });
        statsRef.saved += 1;
      }
    } catch (err) {
      console.error(`[JobSearch] Error saving job: ${err.message}`, {
        url: rawJob?.jobUrl
      });
      statsRef.errors += 1;
      errorLog.push({
        phase: 'save',
        url: rawJob?.jobUrl,
        error: err.message
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Wuzzuf core — extraction only, no run record updates
// ---------------------------------------------------------------------------

/**
 * Run the full Wuzzuf extraction + save pipeline.
 * Does NOT touch the run document.
 *
 * @param {object} query   - run.query
 * @param {string} userId
 * @returns {Promise<{ stats: object, errorLog: object[] }>}
 */
async function _runWuzzufCore(query, userId) {
  const stats = { fetched: 0, saved: 0, skipped: 0, errors: 0 };
  const errorLog = [];

  const rawJobs = await extractJobs(query || {}, {
    onFetch() {},
    onError(info) {
      errorLog.push(info);
      stats.errors += 1;
    }
  });

  stats.fetched = rawJobs.length;

  await _saveJobs(rawJobs, normalizeWuzzufJob, userId, stats, errorLog);

  return { stats, errorLog };
}

// ---------------------------------------------------------------------------
// runWuzzufSearch — public, manages run record
// ---------------------------------------------------------------------------

async function runWuzzufSearch(runId, userId) {
  const run = await JobSearchRun.findById(runId);
  if (!run) {
    console.error(`[JobSearch] Run ${runId} not found`);
    return;
  }

  run.status = 'running';
  run.startedAt = new Date();
  await run.save();

  try {
    const { stats, errorLog } = await _runWuzzufCore(run.query, userId);

    const allFailed =
      stats.errors > 0 && stats.saved === 0 && stats.skipped === 0;
    const someErrors = stats.errors > 0;

    run.status = allFailed ? 'failed' : someErrors ? 'partial' : 'completed';
    run.stats = stats;
    run.sourceStats = { wuzzuf: { ...stats, errors: errorLog } };
    run.completedAt = new Date();

    if (allFailed && errorLog.length > 0) {
      run.errorMessage = errorLog
        .map(e => e.error)
        .join('; ')
        .slice(0, 500);
    }

    await run.save();

    console.log(
      `[JobSearch] Run ${runId} ${run.status} — fetched=${stats.fetched} saved=${stats.saved} skipped=${stats.skipped} errors=${stats.errors}`
    );
  } catch (err) {
    console.error(`[JobSearch] Run ${runId} fatal error: ${err.message}`);
    run.status = 'failed';
    run.errorMessage = err.message;
    run.completedAt = new Date();
    await run.save();
  }
}

// ---------------------------------------------------------------------------
// runLinkedInSearch — public, manages run record
// ---------------------------------------------------------------------------

async function runLinkedInSearch(runId, userId) {
  const run = await JobSearchRun.findById(runId);
  if (!run) {
    console.error(`[JobSearch] LinkedIn run ${runId} not found`);
    return;
  }

  run.status = 'running';
  run.startedAt = new Date();
  await run.save();

  try {
    const result = await executeLinkedInSearch(run.query, userId);
    const stats = { ...result.stats };
    const errorLog = [];

    // Save fetched jobs
    if (result.jobs.length > 0) {
      await _saveJobs(
        result.jobs,
        normalizeLinkedInJob,
        userId,
        stats,
        errorLog
      );
    }

    // Status: if we got nothing and it's degraded → partial; otherwise normal rules
    const allFailed =
      stats.errors > 0 && stats.saved === 0 && stats.skipped === 0;

    run.status =
      result.degraded || allFailed
        ? 'partial'
        : stats.errors > 0
          ? 'partial'
          : 'completed';

    run.stats = stats;
    run.sourceStats = {
      linkedin: {
        ...stats,
        degraded: result.degraded,
        degradedReason: result.degradedReason
      }
    };
    run.completedAt = new Date();

    if (result.degradedReason) {
      run.errorMessage = result.degradedReason.slice(0, 500);
    }

    await run.save();

    console.log(
      `[JobSearch:LinkedIn] Run ${runId} ${run.status} — fetched=${stats.fetched} saved=${stats.saved} degraded=${result.degraded}`
    );
  } catch (err) {
    console.error(
      `[JobSearch:LinkedIn] Run ${runId} fatal error: ${err.message}`
    );
    run.status = 'failed';
    run.errorMessage = err.message;
    run.completedAt = new Date();
    await run.save();
  }
}

// ---------------------------------------------------------------------------
// runAllSearch — Wuzzuf + LinkedIn, LinkedIn failure is isolated
// ---------------------------------------------------------------------------

async function runAllSearch(runId, userId) {
  const run = await JobSearchRun.findById(runId);
  if (!run) {
    console.error(`[JobSearch] All-source run ${runId} not found`);
    return;
  }

  run.status = 'running';
  run.startedAt = new Date();
  await run.save();

  // ---- Wuzzuf (primary — must complete) ----
  const wuzzufStats = { fetched: 0, saved: 0, skipped: 0, errors: 0 };
  const wuzzufErrorLog = [];
  let wuzzufFailed = false;

  try {
    const { stats, errorLog } = await _runWuzzufCore(run.query, userId);
    Object.assign(wuzzufStats, stats);
    wuzzufErrorLog.push(...errorLog);
    wuzzufFailed = stats.errors > 0 && stats.saved === 0 && stats.skipped === 0;
  } catch (err) {
    wuzzufFailed = true;
    wuzzufStats.errors += 1;
    wuzzufErrorLog.push({ phase: 'orchestration', error: err.message });
    console.error('[JobSearch:All] Wuzzuf failed:', err.message);
  }

  // ---- LinkedIn (secondary — isolated, failure never affects Wuzzuf) ----
  const linkedinStats = { fetched: 0, saved: 0, skipped: 0, errors: 0 };
  const linkedinErrorLog = [];
  let linkedinDegraded = false;
  let linkedinDegradedReason = null;

  try {
    const result = await executeLinkedInSearch(run.query, userId);
    linkedinDegraded = result.degraded;
    linkedinDegradedReason = result.degradedReason;

    linkedinStats.fetched = result.stats?.fetched || 0;
    linkedinStats.errors = result.stats?.errors || 0;

    if (result.jobs.length > 0) {
      await _saveJobs(
        result.jobs,
        normalizeLinkedInJob,
        userId,
        linkedinStats,
        linkedinErrorLog
      );
    }
  } catch (err) {
    // Fully isolated — Wuzzuf is unaffected
    linkedinDegraded = true;
    linkedinDegradedReason = err.message;
    linkedinStats.errors += 1;
    console.error('[JobSearch:All] LinkedIn failed (isolated):', err.message);
  }

  // ---- Aggregate & finalise ----
  const totalStats = {
    fetched: wuzzufStats.fetched + linkedinStats.fetched,
    saved: wuzzufStats.saved + linkedinStats.saved,
    skipped: wuzzufStats.skipped + linkedinStats.skipped,
    errors: wuzzufStats.errors + linkedinStats.errors
  };

  // Final status is driven by Wuzzuf; LinkedIn degraded → 'partial'
  run.status = wuzzufFailed
    ? 'failed'
    : linkedinDegraded
      ? 'partial'
      : totalStats.errors > 0
        ? 'partial'
        : 'completed';

  run.stats = totalStats;
  run.sourceStats = {
    wuzzuf: { ...wuzzufStats },
    linkedin: {
      ...linkedinStats,
      degraded: linkedinDegraded,
      degradedReason: linkedinDegradedReason
    }
  };
  run.completedAt = new Date();
  await run.save();

  console.log(
    `[JobSearch:All] Run ${runId} ${run.status} — ` +
      `wuzzuf: saved=${wuzzufStats.saved} errors=${wuzzufStats.errors} | ` +
      `linkedin: saved=${linkedinStats.saved} degraded=${linkedinDegraded}`
  );
}

// ---------------------------------------------------------------------------
// Source registry
// ---------------------------------------------------------------------------

register('wuzzuf', runWuzzufSearch);
register('linkedin', runLinkedInSearch);
register('all', runAllSearch);

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { runWuzzufSearch, runLinkedInSearch, runAllSearch };
