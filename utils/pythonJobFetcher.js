const { spawn } = require('child_process');
const path = require('path');
const logger = require('./logger');

const SCRIPT_PATH = path.resolve(__dirname, '..', 'scripts', 'job_fetcher.py');
const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';
const TIMEOUT_MS = Number(process.env.JOB_FETCHER_TIMEOUT_MS || 180000); // 3 min

const HOURS_IN_DAY = 24;

const runPython = args =>
  new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [SCRIPT_PATH, ...args], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(new Error(`job_fetcher.py timed out after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('error', err => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (stderr) logger.warn(`job_fetcher.py stderr: ${stderr.slice(0, 500)}`);
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve({ code, parsed });
      } catch (err) {
        reject(
          new Error(
            `Failed to parse job_fetcher output (code ${code}): ${err.message}`
          )
        );
      }
    });
  });

/**
 * Fetch jobs for the given terms from JobSpy sites.
 * @param {Object} options
 * @param {string[]} options.terms - search terms
 * @param {string} options.location - e.g. "Egypt"
 * @param {string[]} options.sites - JobSpy sites (linkedin)
 * @param {number} options.maxJobs - per-source cap (used to compute resultsPerSite)
 * @param {number} options.maxJobAgeDays - filter by age
 */
exports.fetch = async ({
  terms = [],
  location = 'Egypt',
  sites = ['linkedin'],
  maxJobs = 60,
  maxJobAgeDays = 7
}) => {
  if (!terms.length) {
    return { status: 'failed', error: 'No search terms', sources: {} };
  }

  const resultsPerSite = Math.max(
    10,
    Math.ceil(maxJobs / Math.max(1, sites.length))
  );

  const args = [
    '--terms',
    terms.join(','),
    '--location',
    location,
    '--sites',
    sites.join(','),
    '--results-per-site',
    String(resultsPerSite),
    '--hours-old',
    String(Math.max(1, maxJobAgeDays * HOURS_IN_DAY))
  ];

  try {
    const { parsed } = await runPython(args);
    return parsed;
  } catch (err) {
    logger.error(`python job fetcher failed: ${err.message}`);
    return {
      status: 'failed',
      error: err.message,
      sources: Object.fromEntries(
        sites.map(s => [s, { jobs: [], error: err.message, degraded: true }])
      )
    };
  }
};
