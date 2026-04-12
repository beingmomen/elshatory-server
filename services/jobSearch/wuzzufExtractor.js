/**
 * Wuzzuf Job Extractor
 *
 * Responsibilities:
 *  - Build Wuzzuf search URLs
 *  - Fetch search result pages
 *  - Parse job cards from search results
 *  - Fetch individual job detail pages
 *  - Return raw job objects (no DB interaction)
 *
 * Rate limiting: enforces a configurable delay between every HTTP request
 * to avoid hammering the site. Respects HTTP errors and does not attempt
 * to bypass blocks.
 *
 * Usage is strictly personal / internal dashboard only.
 */

const cheerio = require('cheerio');
const { sleep } = require('./rateLimit');

const BASE_URL = 'https://wuzzuf.net';
const DELAY_MS = parseInt(
  process.env.JOB_SEARCH_REQUEST_DELAY_MS || '3000',
  10
);
const RETRY_DELAY_MS = 2000;

// Identify the bot clearly while staying respectful
const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Cache-Control': 'no-cache'
};

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

/**
 * Build a Wuzzuf search URL for a given term, location and page number.
 * Page 0 = first page, page 1 = second page, etc. (10 results per page).
 */
function buildSearchUrl(term, location, page) {
  const params = new URLSearchParams({ q: term, start: String(page * 10) });
  if (location) params.set('filters[country][0]', location);
  return `${BASE_URL}/search/jobs/?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// HTTP fetcher
// ---------------------------------------------------------------------------

/**
 * Fetch HTML from a URL with a single automatic retry on transient failures.
 * Throws if both attempts fail.
 */
async function fetchHtml(url, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: REQUEST_HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(RETRY_DELAY_MS);
    }
  }
}

// ---------------------------------------------------------------------------
// Search results parser
// ---------------------------------------------------------------------------

/**
 * Parse job listing cards from a Wuzzuf search results page.
 *
 * Strategy: find all <a> tags that link to /jobs/p/ paths.
 * This is more resilient than relying on hashed CSS class names which change.
 *
 * Returns an array of partial job objects with: title, jobUrl, sourceJobId.
 */
function parseJobsFromSearchPage(html) {
  const $ = cheerio.load(html);
  const seenUrls = new Set();
  const jobs = [];

  $('a[href*="/jobs/p/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href.includes('/jobs/p/')) return;

    // Build an absolute, query-string-free URL for deduplication
    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    const cleanUrl = fullUrl.split('?')[0];

    if (seenUrls.has(cleanUrl)) return;
    seenUrls.add(cleanUrl);

    // Title: prefer the title attribute (more reliable than text which may
    // include child-element text noise)
    const title = ($(el).attr('title') || $(el).text()).trim();
    if (!title || title.length < 3) return;

    // sourceJobId: Wuzzuf slugs look like /jobs/p/<ID>-company-title
    // The ID is the alphanumeric prefix before the first hyphen.
    const pathMatch = cleanUrl.match(/\/jobs\/p\/([^/?]+)/);
    const slug = pathMatch ? pathMatch[1] : null;
    const idMatch = slug ? slug.match(/^([A-Za-z0-9]+)/) : null;
    const sourceJobId = idMatch ? idMatch[1] : slug;

    jobs.push({ title, jobUrl: cleanUrl, sourceJobId });
  });

  return jobs;
}

// ---------------------------------------------------------------------------
// Detail page parser
// ---------------------------------------------------------------------------

/**
 * Parse a Wuzzuf job detail page.
 *
 * Strategy:
 *  1. Try JSON-LD structured data (most stable — semantic web standard)
 *  2. Fall back to HTML heuristics for any missing fields
 *
 * Returns a raw detail object merged with the base card info later.
 */
function parseDetailPage(html, jobUrl) {
  const $ = cheerio.load(html);

  // Remove noise elements before any text extraction.
  // Wuzzuf uses CSS-in-JS (Emotion) which injects <style> blocks into the body;
  // removing them prevents CSS rules from leaking into description / rawText.
  $('style, script, noscript, header, nav, footer').remove();

  // Build rawText early — needed by location extraction below.
  // style/script already stripped, so text() is clean.
  const rawText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000);

  const result = {
    jobUrl,
    description: null,
    company: null,
    location: null,
    postedAt: null,
    workplace: null,
    applyUrl: null,
    skills: [],
    rawText
  };

  // --- 1. JSON-LD (preferred) ---
  // Note: JSON-LD scripts were already removed above if they are after the
  // <body> injection. Re-parse the *original* html just for JSON-LD.
  const $raw = cheerio.load(html);
  $raw('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $raw(el).html();
      if (!text) return;
      const data = JSON.parse(text);
      if (data['@type'] !== 'JobPosting') return;

      // description from JSON-LD may contain HTML markup — strip tags
      if (data.description) {
        const $desc = cheerio.load(data.description);
        $desc('style, script').remove();
        const clean = $desc('body').text().replace(/\s+/g, ' ').trim();
        result.description = clean || null;
      }

      result.company = data.hiringOrganization?.name || null;

      const addr = data.jobLocation?.address;
      if (addr) {
        result.location =
          addr.addressLocality ||
          addr.addressRegion ||
          (typeof addr === 'string' ? addr : null);
      }

      result.postedAt = data.datePosted || null;
      result.applyUrl = data.url || null;

      // Map employmentType to our workplace enum
      const empType = (data.employmentType || '').toLowerCase();
      if (empType.includes('remote')) result.workplace = 'remote';
      else if (empType.includes('hybrid')) result.workplace = 'hybrid';
      else if (
        empType.includes('onsite') ||
        empType.includes('on-site') ||
        empType.includes('on site')
      )
        result.workplace = 'onsite';
    } catch {
      // Malformed JSON-LD – ignore and fall through to HTML
    }
  });

  // --- 2. HTML fallback: company ---
  if (!result.company) {
    const companySelectors = [
      'a[href*="/company/"]',
      '[class*="company"] a',
      'h3 a'
    ];
    for (const sel of companySelectors) {
      const text = $(sel).first().text().trim();
      if (text && text.length > 1) {
        result.company = text;
        break;
      }
    }
  }

  // --- 3. HTML fallback: location ---
  if (!result.location) {
    // Try: Wuzzuf renders location as a link to /jobs/in/<city>
    const locEl = $('a[href*="/jobs/in/"]').first();
    if (locEl.length) {
      result.location = locEl.text().trim() || null;
    }
  }
  // Final fallback: extract "Company - City, Country" pattern from page text.
  // Wuzzuf renders "[Company] - [City, Country]Apply For Job" (no space before "Apply").
  // Use non-greedy capture so the greedy .{2,60} prefix doesn't swallow the location.
  const textForLocation = result.rawText || result.description || '';
  if (!result.location && textForLocation) {
    const locMatch = textForLocation.match(/ - (.{3,60}?)Apply For Job/);
    if (locMatch) result.location = locMatch[1].trim() || null;
  }

  // --- 4. HTML fallback: description ---
  if (!result.description) {
    // Walk through likely containers and pick the one with the most plain text.
    // style/script already removed so text() is clean.
    let maxLen = 0;
    const candidates = [
      'main',
      'article',
      'section',
      '[class*="description"]',
      '[class*="details"]'
    ];
    $(candidates.join(', ')).each((_, el) => {
      // Skip tiny containers and navigation-like elements
      const $el = $(el);
      if ($el.find('nav, header, footer').length > 0) return;
      const text = $el.text().replace(/\s+/g, ' ').trim();
      if (text.length > maxLen && text.length > 200) {
        maxLen = text.length;
        result.description = text;
      }
    });
  }

  // --- 5. Tags / skills ---
  // Wuzzuf renders skill tags as small pill elements.
  // We filter aggressively to avoid picking up job titles or timestamps.
  const tagSelectors = [
    '[data-js-aid*="tag"] span',
    '[class*="tag"] span',
    '[class*="skill"] span',
    '[class*="chips"] span',
    '[class*="requirement"] li'
  ];
  for (const sel of tagSelectors) {
    const tags = [];
    $(sel).each((_, el) => {
      const t = $(el).text().trim();
      if (isValidSkillTag(t)) tags.push(t);
    });
    if (tags.length >= 2) {
      result.skills = [...new Set(tags)];
      break;
    }
  }

  return result;
}

/**
 * Heuristic filter: is this string likely a skill/technology tag?
 * Rejects: timestamps ("3 days ago"), truncated titles ("Some Job Titl..."),
 * long strings (job titles, company names).
 */
function isValidSkillTag(t) {
  if (!t || t.length < 2 || t.length > 40) return false;
  if (/\d+\s+(day|week|month|year)s?\s+ago/i.test(t)) return false; // "3 days ago"
  if (t.endsWith('...')) return false; // truncated job title
  if (/^[\d,]+$/.test(t)) return false; // pure number
  return true;
}

// ---------------------------------------------------------------------------
// Main extraction orchestrator
// ---------------------------------------------------------------------------

/**
 * Run a full Wuzzuf search for the given query.
 *
 * Flow:
 *  1. For each term × page: fetch search page, collect job card links
 *  2. For each unique job URL: fetch detail page and parse it
 *
 * @param {object} query  - { terms, location, maxPages, maxJobs }
 * @param {object} options - { onFetch(url), onError({phase, ...}) }
 * @returns {Promise<Array>} Raw job objects
 */
async function extractJobs(query = {}, options = {}) {
  const {
    terms = ['Frontend Developer'],
    location = 'Egypt',
    maxPages = 3,
    maxJobs = parseInt(process.env.JOB_SEARCH_MAX_JOBS_PER_RUN || '60', 10)
  } = query;

  const { onFetch, onError } = options;

  const cardsByUrl = new Map(); // url → card

  // ---- Phase 1: Collect job cards from search results ----
  for (const term of terms) {
    if (cardsByUrl.size >= maxJobs) break;

    for (let page = 0; page < maxPages; page++) {
      if (cardsByUrl.size >= maxJobs) break;

      const searchUrl = buildSearchUrl(term, location, page);

      try {
        await sleep(DELAY_MS);
        const html = await fetchHtml(searchUrl);
        const cards = parseJobsFromSearchPage(html);

        if (cards.length === 0) {
          // No results on this page → stop paginating this term
          break;
        }

        for (const card of cards) {
          if (cardsByUrl.size >= maxJobs) break;
          if (!cardsByUrl.has(card.jobUrl)) {
            cardsByUrl.set(card.jobUrl, { ...card, _term: term });
          }
        }
      } catch (err) {
        console.error(
          `[Wuzzuf] Search error — term="${term}" page=${page}: ${err.message}`
        );
        if (onError)
          onError({ phase: 'search', term, page, error: err.message });
      }
    }
  }

  // ---- Phase 2: Fetch detail pages ----
  const detailedJobs = [];

  for (const [, card] of cardsByUrl) {
    try {
      await sleep(DELAY_MS);
      const html = await fetchHtml(card.jobUrl);
      const detail = parseDetailPage(html, card.jobUrl);

      detailedJobs.push({
        ...card,
        ...detail,
        // Prefer card title if detail page title is empty
        title: card.title || detail.title
      });

      if (onFetch) onFetch(card.jobUrl);
    } catch (err) {
      console.error(
        `[Wuzzuf] Detail fetch error — url=${card.jobUrl}: ${err.message}`
      );
      if (onError)
        onError({ phase: 'detail', url: card.jobUrl, error: err.message });

      // Still include the job with partial (card-only) data
      detailedJobs.push({ ...card, _partialFetch: true });
    }
  }

  return detailedJobs;
}

module.exports = {
  extractJobs,
  buildSearchUrl,
  parseJobsFromSearchPage,
  parseDetailPage
};
