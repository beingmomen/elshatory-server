/**
 * Rate limiting utilities for job search requests.
 * Used to avoid overwhelming external job sites.
 */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { sleep };
