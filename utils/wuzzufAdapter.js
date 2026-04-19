/* eslint-disable no-await-in-loop */
const cheerio = require('cheerio');
const logger = require('./logger');

const WUZZUF_BASE = 'https://wuzzuf.net';
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const MAX_PAGES = Number(process.env.WUZZUF_MAX_PAGES || 3);

const buildSearchUrl = ({ term, location = 'Egypt', page = 0 }) => {
  const params = new URLSearchParams();
  params.set('q', term || '');
  if (location) params.set('filters[country][0]', location);
  if (page) params.set('start', String(page));
  return `${WUZZUF_BASE}/search/jobs/?${params.toString()}`;
};

const fetchHtml = async url => {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml'
    },
    redirect: 'follow'
  });
  if (!res.ok) {
    throw new Error(`Wuzzuf ${res.status} on ${url}`);
  }
  return res.text();
};

const absolute = href => {
  if (!href) return '';
  if (href.startsWith('http')) return href;
  if (href.startsWith('/')) return `${WUZZUF_BASE}${href}`;
  return `${WUZZUF_BASE}/${href}`;
};

const extractCards = html => {
  const $ = cheerio.load(html);
  const jobs = [];
  const seenHref = new Set();

  $('a[href*="/jobs/p/"]').each((_, el) => {
    const $anchor = $(el);
    const href = $anchor.attr('href');
    const title = $anchor.text().trim();
    if (!href || !title) return;
    if (seenHref.has(href)) return;
    seenHref.add(href);

    // Walk up to the nearest card-like ancestor (3-5 levels)
    const $card = $anchor.closest('div').parent().parent();

    const company = $card.find('a[href*="/jobs/companies/"]').first().text().trim();

    const locationText = $card
      .find('span:contains("Egypt"), span:contains("Cairo"), span:contains("Giza")')
      .first()
      .text()
      .trim();

    const postedText = $card
      .find('div:contains("ago"), span:contains("ago")')
      .last()
      .text()
      .trim();

    jobs.push({
      title,
      company,
      location: locationText || 'Egypt',
      jobUrl: absolute(href),
      source: 'wuzzuf',
      description: '',
      postedAt: parsePosted(postedText),
      workplace: '',
      salary: '',
      seniority: '',
      externalId: (href.split('/jobs/p/')[1] || '').split('?')[0]
    });
  });

  return jobs;
};

const parsePosted = text => {
  if (!text) return null;
  const match = text.match(/(\d+)\s*(hour|day|week|month)/i);
  if (!match) return null;
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  const ms = {
    hour: 3600e3,
    day: 86400e3,
    week: 7 * 86400e3,
    month: 30 * 86400e3
  }[unit];
  if (!ms) return null;
  return new Date(Date.now() - n * ms).toISOString();
};

const fetchJobDetail = async url => {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const description = $('div[class*="job-description"], section.css-1uobp1k')
      .text()
      .trim();
    const requirements = [];
    $('section:contains("Requirements") li, section:contains("Qualifications") li').each(
      (_, el) => {
        const t = $(el).text().trim();
        if (t) requirements.push(t);
      }
    );
    return { description, requirements };
  } catch (err) {
    logger.warn(`Wuzzuf detail failed for ${url}: ${err.message}`);
    return { description: '', requirements: [] };
  }
};

/**
 * Scrape Wuzzuf for the given terms.
 * Returns { jobs, error, degraded }.
 */
exports.scrape = async ({ terms = [], location = 'Egypt', maxJobs = 60 }) => {
  const aggregated = [];
  let lastError = '';
  const seen = new Set();

  for (const term of terms) {
    if (aggregated.length >= maxJobs) break;
    for (let page = 0; page < MAX_PAGES; page += 1) {
      if (aggregated.length >= maxJobs) break;
      try {
        const url = buildSearchUrl({ term, location, page });
        const html = await fetchHtml(url);
        const cards = extractCards(html);
        if (!cards.length) break;

        for (const job of cards) {
          if (aggregated.length >= maxJobs) break;
          if (seen.has(job.jobUrl)) continue;
          seen.add(job.jobUrl);
          aggregated.push(job);
        }

        await new Promise(r => setTimeout(r, 800));
      } catch (err) {
        lastError = err.message;
        logger.warn(`Wuzzuf page fail (${term}, page ${page}): ${err.message}`);
        break;
      }
    }
  }

  // Enrich top N with descriptions (bounded)
  const enrichCount = Math.min(aggregated.length, 15);
  for (let i = 0; i < enrichCount; i += 1) {
    const detail = await fetchJobDetail(aggregated[i].jobUrl);
    aggregated[i].description = detail.description;
    aggregated[i].requirements = detail.requirements;
    await new Promise(r => setTimeout(r, 500));
  }

  return {
    jobs: aggregated,
    error: aggregated.length ? null : lastError || 'No Wuzzuf results',
    degraded: !aggregated.length
  };
};
