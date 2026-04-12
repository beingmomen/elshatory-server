/**
 * LinkedIn Adapter
 *
 * Attempts to fetch public LinkedIn job listings via the jobs-guest endpoint.
 * All constraints respected:
 *   - No login
 *   - No cookies
 *   - No proxy rotation
 *   - No bypass
 *
 * Controlled by LINKEDIN_SOURCE_MODE env var:
 *   'automatic'     — attempt public fetch; degrade silently on block
 *   'manual_import' — skip fetch, return degraded immediately (default)
 *   'disabled'      — skip fetch, return degraded immediately
 *
 * Every exported function is designed to never throw — callers rely on this
 * to keep `source=all` runs alive when LinkedIn fails.
 */

const cheerio = require('cheerio');
const JobSource = require('../../models/jobSourceModel');
const {
  extractSeniority,
  extractWorkplace,
  mergeSkills
} = require('./normalizer');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const LINKEDIN_MODE = (
  process.env.LINKEDIN_SOURCE_MODE || 'manual_import'
).trim();
const LINKEDIN_GUEST_API =
  'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';
const REQUEST_TIMEOUT_MS = 10_000;
const INTER_TERM_DELAY_MS = 2_000;
const MAX_JOBS_HARD_CAP = 50;

// ---------------------------------------------------------------------------
// DB helper — upserts LinkedIn source record (non-critical, never throws)
// ---------------------------------------------------------------------------

async function updateLinkedInSourceStatus(status, error) {
  try {
    await JobSource.findOneAndUpdate(
      { key: 'linkedin' },
      {
        lastHealthStatus: status,
        lastCheckedAt: new Date(),
        lastError: error || null
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: {
          name: 'LinkedIn',
          enabled: true,
          mode: LINKEDIN_MODE === 'disabled' ? 'disabled' : 'manual_import'
        }
      }
    );
  } catch (err) {
    // Non-critical — do not propagate
    console.error('[LinkedIn] Failed to update source status:', err.message);
  }
}

// ---------------------------------------------------------------------------
// HTTP fetch helper
// ---------------------------------------------------------------------------

function buildSearchUrl(term, location, start = 0) {
  const url = new URL(LINKEDIN_GUEST_API);
  url.searchParams.set('keywords', term || '');
  if (location) url.searchParams.set('location', location);
  url.searchParams.set('start', String(start));
  // Limit to past week so results are fresh
  url.searchParams.set('f_TPR', 'r604800');
  return url.toString();
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

// ---------------------------------------------------------------------------
// HTML parser — LinkedIn jobs-guest fragment
// ---------------------------------------------------------------------------

/**
 * Parse job cards from a LinkedIn jobs-guest API HTML fragment.
 * Selectors are resilient across common LinkedIn class name patterns.
 */
function parseJobCards(html, term) {
  const $ = cheerio.load(html);
  const jobs = [];

  // LinkedIn guest endpoint wraps each job in a <div class="base-card"> or <li>
  const cards = $('div.base-card, li.jobs-search__results-item').toArray();

  for (const el of cards) {
    const $el = $(el);

    const title =
      $el.find('.base-search-card__title').first().text().trim() ||
      $el.find('[class*="job-search-card__title"]').first().text().trim();

    const company =
      $el.find('.base-search-card__subtitle').first().text().trim() ||
      $el
        .find('[class*="job-search-card__company-name"]')
        .first()
        .text()
        .trim();

    const location =
      $el.find('.job-search-card__location').first().text().trim() ||
      $el.find('[class*="job-search-card__location"]').first().text().trim();

    // Prefer full-link anchor; fallback to any <a> inside the card
    const rawUrl =
      $el.find('a.base-card__full-link').first().attr('href') ||
      $el.find('a[class*="job-search-card"]').first().attr('href') ||
      $el.find('a').first().attr('href');

    // Normalise URL — strip query params that break dedup
    let jobUrl;
    try {
      const parsed = new URL(rawUrl || '');
      // Keep only the path (job ID is in the path)
      jobUrl = `${parsed.origin}${parsed.pathname}`;
    } catch {
      jobUrl = rawUrl || undefined;
    }

    // Extract numeric job ID from URL path
    let sourceJobId;
    if (jobUrl) {
      const match = jobUrl.match(/\/view\/(\d+)/);
      if (match) sourceJobId = match[1];
    }

    const postedAt = $el.find('time').first().attr('datetime') || undefined;

    if (!title || !jobUrl) continue;

    jobs.push({
      title,
      company: company || undefined,
      location: location || undefined,
      jobUrl,
      sourceJobId,
      postedAt,
      _term: term
    });
  }

  return jobs;
}

// ---------------------------------------------------------------------------
// Core fetch loop — tries each search term
// ---------------------------------------------------------------------------

async function fetchLinkedInJobs(query) {
  const terms = Array.isArray(query.terms)
    ? query.terms
    : [query.terms || 'developer'];
  const location = query.location || '';
  const maxJobs = Math.min(Number(query.maxJobs) || 25, MAX_JOBS_HARD_CAP);

  const allJobs = [];
  const errors = [];

  for (const term of terms) {
    if (allJobs.length >= maxJobs) break;

    try {
      const url = buildSearchUrl(term, location, 0);
      const html = await fetchHtml(url);
      const cards = parseJobCards(html, term);

      for (const card of cards) {
        if (allJobs.length >= maxJobs) break;
        allJobs.push(card);
      }

      if (cards.length === 0) {
        // Page returned no cards — possible soft block or empty results
        errors.push({
          term,
          error:
            'No job cards found — possible soft block or genuinely empty results'
        });
      }
    } catch (err) {
      errors.push({ term, error: err.message });
    }

    // Polite inter-term delay
    if (terms.indexOf(term) < terms.length - 1) {
      await new Promise(r => setTimeout(r, INTER_TERM_DELAY_MS));
    }
  }

  return { jobs: allJobs, errors };
}

// ---------------------------------------------------------------------------
// Normalizer — LinkedIn raw → jobModel shape
// ---------------------------------------------------------------------------

/**
 * Convert a raw LinkedIn job card object into the shape expected by jobModel.
 *
 * @param {object} rawJob  Output from parseJobCards
 * @returns {object}       Normalized job ready for Job.create()
 */
function normalizeLinkedInJob(rawJob) {
  const now = new Date();
  const descText = rawJob.description || rawJob.rawText || '';

  const seniority = extractSeniority(rawJob.title || '', descText);
  const workplace = extractWorkplace(rawJob.title || '', descText, []);
  const skills = mergeSkills([], descText);

  const normalized = {
    source: 'linkedin',
    title: (rawJob.title || '').trim(),
    jobUrl: rawJob.jobUrl,
    rawPayload: rawJob,
    firstSeenAt: now,
    lastSeenAt: now,
    skills,
    tags: []
  };

  if (rawJob.sourceJobId) normalized.sourceJobId = rawJob.sourceJobId;
  if (rawJob.company) normalized.company = rawJob.company.trim();
  if (rawJob.location) normalized.location = rawJob.location.trim();
  if (workplace) normalized.workplace = workplace;
  if (seniority) normalized.seniority = seniority;
  if (rawJob.applyUrl) normalized.applyUrl = rawJob.applyUrl;
  if (descText) normalized.description = descText;

  if (rawJob.postedAt) {
    const d = new Date(rawJob.postedAt);
    if (!isNaN(d.getTime())) normalized.postedAt = d;
  }

  return normalized;
}

// ---------------------------------------------------------------------------
// Health check — lightweight, no full scrape
// ---------------------------------------------------------------------------

/**
 * Perform a lightweight LinkedIn availability check.
 *
 * @returns {Promise<{status: 'healthy'|'degraded'|'down', reason: string|null}>}
 */
async function checkLinkedInHealth() {
  if (LINKEDIN_MODE === 'disabled') {
    return { status: 'down', reason: 'disabled_by_config' };
  }

  if (LINKEDIN_MODE === 'manual_import') {
    return { status: 'degraded', reason: 'manual_import_only' };
  }

  // automatic mode — quick HEAD/GET probe
  try {
    const url = buildSearchUrl('developer', 'Egypt', 0);
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html'
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: 'follow'
    });

    if (!response.ok) {
      return { status: 'degraded', reason: `HTTP ${response.status}` };
    }

    // Quick sanity-check: does the response look like job cards?
    const html = await response.text();
    const $ = cheerio.load(html);
    const hasCards =
      $('div.base-card').length > 0 ||
      $('li.jobs-search__results-item').length > 0;

    if (!hasCards) {
      return {
        status: 'degraded',
        reason: 'Response received but no job cards found — possible soft block'
      };
    }

    return { status: 'healthy', reason: null };
  } catch (err) {
    return { status: 'degraded', reason: err.message };
  }
}

// ---------------------------------------------------------------------------
// Main public function — executeLinkedInSearch
// ---------------------------------------------------------------------------

/**
 * Execute a LinkedIn search.
 * NEVER throws — always returns a result object.
 *
 * @param {object} query   - run.query: { terms, location, maxJobs, ... }
 * @param {string} userId  - for deduplication context (not used here, passed through)
 * @returns {Promise<{
 *   jobs: object[],
 *   stats: { fetched: number, saved: number, skipped: number, errors: number },
 *   degraded: boolean,
 *   degradedReason: string|null
 * }>}
 */
async function executeLinkedInSearch(query, userId) {
  const emptyStats = { fetched: 0, saved: 0, skipped: 0, errors: 0 };

  // --- Non-automatic modes: skip immediately ---
  if (LINKEDIN_MODE === 'disabled') {
    return {
      jobs: [],
      stats: { ...emptyStats },
      degraded: true,
      degradedReason: 'disabled_by_config'
    };
  }

  if (LINKEDIN_MODE === 'manual_import') {
    return {
      jobs: [],
      stats: { ...emptyStats },
      degraded: true,
      degradedReason: 'manual_import_only'
    };
  }

  // --- Automatic mode: attempt fetch ---
  try {
    const { jobs: rawJobs, errors } = await fetchLinkedInJobs(query || {});

    const hasFetchErrors = errors.length > 0;
    const gotJobs = rawJobs.length > 0;

    if (!gotJobs) {
      const reason =
        errors.length > 0 ? errors[0].error : 'No jobs returned by LinkedIn';

      await updateLinkedInSourceStatus('degraded', reason);

      return {
        jobs: [],
        stats: { ...emptyStats, errors: errors.length },
        degraded: true,
        degradedReason: reason
      };
    }

    // Partial success — some terms failed but we have jobs
    const status = hasFetchErrors ? 'degraded' : 'healthy';
    await updateLinkedInSourceStatus(
      status,
      hasFetchErrors ? errors[0]?.error : null
    );

    return {
      jobs: rawJobs,
      stats: {
        fetched: rawJobs.length,
        saved: 0, // caller updates this after dedup/save
        skipped: 0,
        errors: errors.length
      },
      degraded: hasFetchErrors && !gotJobs,
      degradedReason: hasFetchErrors ? errors[0]?.error : null
    };
  } catch (err) {
    // Catastrophic fetch failure — still never throw
    const reason = err.message;
    console.error('[LinkedIn] executeLinkedInSearch fatal error:', reason);
    await updateLinkedInSourceStatus('degraded', reason);

    return {
      jobs: [],
      stats: { ...emptyStats, errors: 1 },
      degraded: true,
      degradedReason: reason
    };
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  executeLinkedInSearch,
  normalizeLinkedInJob,
  checkLinkedInHealth,
  updateLinkedInSourceStatus
};
