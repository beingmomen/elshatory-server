/**
 * Deduplication service for job search results.
 *
 * Checks the DB before saving a new job to avoid duplicates.
 *
 * Priority order:
 *  1. source + sourceJobId          (most reliable – stable external ID)
 *  2. source + jobUrl               (normalized URL)
 *  3. source + company + title      (fuzzy fallback)
 */

const Job = require('../../models/jobModel');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check whether a normalized job already exists in the DB for this user.
 *
 * @param {object} normalizedJob
 * @param {string} userId
 * @returns {Promise<{existing: object, reason: string}|null>}
 */
async function findExistingJob(normalizedJob, userId) {
  const { source, sourceJobId, jobUrl, company, title } = normalizedJob;

  // 1. Exact external ID match
  if (sourceJobId) {
    const existing = await Job.findOne({ source, sourceJobId, user: userId });
    if (existing) return { existing, reason: 'sourceJobId' };
  }

  // 2. Exact URL match
  if (jobUrl) {
    const existing = await Job.findOne({ source, jobUrl, user: userId });
    if (existing) return { existing, reason: 'jobUrl' };
  }

  // 3. Fuzzy match: same company + title (case-insensitive)
  if (company && title) {
    const existing = await Job.findOne({
      source,
      company: { $regex: new RegExp(`^${escapeRegex(company)}$`, 'i') },
      title: { $regex: new RegExp(`^${escapeRegex(title)}$`, 'i') },
      user: userId
    });
    if (existing) return { existing, reason: 'company+title' };
  }

  return null;
}

module.exports = { findExistingJob };
