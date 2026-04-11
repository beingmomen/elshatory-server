/**
 * Manual Job Import Service
 *
 * Accepts a LinkedIn job URL and/or pasted raw text, extracts normalized
 * job data, deduplicates against the DB, and saves it.
 *
 * Strategy:
 *   1. If rawText is provided → parse it directly (primary path).
 *   2. If only jobUrl is provided → attempt a best-effort public fetch.
 *      If the fetch fails (LinkedIn blocks it) → return a clear error
 *      asking the user to paste the job description instead.
 */

'use strict';

const cheerio = require('cheerio');
const Job = require('../../models/jobModel');
const AppError = require('../../utils/appError');
const { findExistingJob } = require('./dedupe');
const {
  extractSeniority,
  extractWorkplace,
  mergeSkills,
} = require('./normalizer');

// ---------------------------------------------------------------------------
// LinkedIn job ID extraction
// ---------------------------------------------------------------------------

/**
 * Extract numeric job ID from a LinkedIn jobs URL.
 * e.g. https://www.linkedin.com/jobs/view/3987654321/?...  → '3987654321'
 */
function extractLinkedInJobId(url) {
  if (!url) return undefined;
  const match = url.match(/\/jobs\/view\/(\d+)/);
  return match ? match[1] : undefined;
}

// ---------------------------------------------------------------------------
// Structured field extraction from pasted text
// ---------------------------------------------------------------------------

/**
 * Try to find a labelled field in the text.
 * Looks for patterns like "Field: value" (case-insensitive).
 */
function extractLabelled(text, ...labels) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^\\s*${escaped}\\s*[:\\-]\\s*(.+)`, 'im');
    const match = text.match(regex);
    if (match) return match[1].trim();
  }
  return undefined;
}

/**
 * Parse pasted raw text into a raw job object.
 *
 * LinkedIn "Copy" output is usually:
 *   Line 1: Job title
 *   Line 2: Company name
 *   Line 3: Location (City, Country · Workplace type)
 *   ...rest: description
 *
 * We support both that format and labelled formats ("Title: ...", "Company: ...").
 */
function parseRawText(rawText, jobUrl) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // --- Try labelled extraction first ---
  let title =
    extractLabelled(rawText, 'Job Title', 'Title', 'Position', 'Role') ||
    extractLabelled(rawText, 'المسمى الوظيفي', 'الوظيفة');

  let company =
    extractLabelled(rawText, 'Company', 'Employer', 'Organization') ||
    extractLabelled(rawText, 'الشركة', 'صاحب العمل');

  let location =
    extractLabelled(rawText, 'Location', 'City', 'Place') ||
    extractLabelled(rawText, 'الموقع', 'المدينة');

  // --- Fallback: positional lines (LinkedIn default copy format) ---
  if (!title && lines.length >= 1) title = lines[0];
  if (!company && lines.length >= 2) company = lines[1];
  if (!location && lines.length >= 3) {
    // LinkedIn location line often has "City · Workplace" — strip workplace suffix
    location = lines[2].replace(/\s*·\s*(Remote|Hybrid|On-site).*/i, '').trim();
  }

  const descriptionText = rawText;

  const seniority = extractSeniority(title || '', descriptionText);
  const workplace = extractWorkplace(title || '', descriptionText, []);
  const skills = mergeSkills([], descriptionText);
  const sourceJobId = extractLinkedInJobId(jobUrl);

  return {
    title,
    company,
    location,
    seniority,
    workplace,
    skills,
    sourceJobId,
    description: descriptionText,
    rawText,
    jobUrl,
  };
}

// ---------------------------------------------------------------------------
// Optional public page fetch (best-effort)
// ---------------------------------------------------------------------------

/**
 * Attempt to fetch a public LinkedIn job page and extract minimal metadata
 * (title, company) from the HTML <title> tag.
 *
 * LinkedIn frequently returns 403/429 or redirects to login — this is
 * expected and not an error in our system.
 *
 * @param {string} jobUrl
 * @returns {Promise<{title:string|undefined, company:string|undefined}>}
 * @throws {AppError} when the fetch fails or is blocked
 */
async function tryFetchPublicPage(jobUrl) {
  let response;

  try {
    response = await fetch(jobUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; JobImporter/1.0; +https://example.com)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
  } catch (err) {
    // Network error or timeout
    throw new AppError(
      'تعذّر الوصول إلى الصفحة. الرجاء نسخ وصف الوظيفة ولصقه في حقل rawText.',
      400
    );
  }

  if (!response.ok) {
    throw new AppError(
      `تعذّر جلب الصفحة (${response.status}). LinkedIn يحجب الطلبات الآلية. الرجاء نسخ وصف الوظيفة ولصقه في حقل rawText.`,
      400
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // LinkedIn page title format: "Job Title at Company | LinkedIn"
  const pageTitle = $('title').first().text().trim();
  let title;
  let company;

  if (pageTitle) {
    const atMatch = pageTitle.match(/^(.+?)\s+at\s+(.+?)\s*[|\-]/i);
    if (atMatch) {
      title = atMatch[1].trim();
      company = atMatch[2].trim();
    } else {
      title = pageTitle.replace(/\s*\|.*$/, '').trim() || undefined;
    }
  }

  // Also try OG tags as fallback
  if (!title) {
    title = $('meta[property="og:title"]').attr('content') || undefined;
  }

  return { title, company };
}

// ---------------------------------------------------------------------------
// Normalize to jobModel shape
// ---------------------------------------------------------------------------

function buildNormalizedJob(parsed, source) {
  const now = new Date();
  const normalized = {
    source,
    title: (parsed.title || 'وظيفة غير معنونة').trim(),
    rawText: parsed.rawText,
    rawPayload: parsed,
    firstSeenAt: now,
    lastSeenAt: now,
    skills: parsed.skills || [],
    tags: [],
  };

  if (parsed.sourceJobId) normalized.sourceJobId = parsed.sourceJobId;
  if (parsed.company) normalized.company = parsed.company.trim();
  if (parsed.location) normalized.location = parsed.location.trim();
  if (parsed.workplace) normalized.workplace = parsed.workplace;
  if (parsed.seniority) normalized.seniority = parsed.seniority;
  if (parsed.jobUrl) normalized.jobUrl = parsed.jobUrl;
  if (parsed.description) normalized.description = parsed.description;

  return normalized;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Import a job manually from a LinkedIn URL and/or pasted raw text.
 *
 * @param {object} options
 * @param {string} options.source    - 'linkedin' | 'manual'
 * @param {string} [options.jobUrl] - LinkedIn job URL (optional)
 * @param {string} [options.rawText] - Pasted job description (optional)
 * @param {string} options.userId
 * @returns {Promise<{job: object, isDuplicate: boolean, duplicateReason?: string}>}
 */
async function importJob({ source, jobUrl, rawText, userId }) {
  let parsed;

  if (rawText) {
    // Primary path: use pasted text directly
    parsed = parseRawText(rawText, jobUrl);
  } else {
    // Fallback: attempt public page fetch
    // This will throw an AppError if LinkedIn blocks the request
    const fetched = await tryFetchPublicPage(jobUrl);

    parsed = {
      title: fetched.title,
      company: fetched.company,
      jobUrl,
      sourceJobId: extractLinkedInJobId(jobUrl),
      skills: [],
    };
  }

  const normalizedJob = buildNormalizedJob(parsed, source);

  // --- Deduplication ---
  const found = await findExistingJob(normalizedJob, userId);
  if (found) {
    // Update lastSeenAt on the existing record
    found.existing.lastSeenAt = new Date();
    await found.existing.save();

    return {
      job: found.existing,
      isDuplicate: true,
      duplicateReason: found.reason,
    };
  }

  // --- Save new job ---
  const job = await Job.create({ ...normalizedJob, user: userId });

  return { job, isDuplicate: false };
}

module.exports = {
  importJob,
  extractJobFromRawText,
  fetchJobPage
};

module.exports = { importJob };
