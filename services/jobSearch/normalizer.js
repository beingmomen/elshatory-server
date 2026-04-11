/**
 * Job Normalizer
 *
 * Converts raw Wuzzuf extraction data into the shape expected by jobModel.
 * Does not touch the database.
 */

// ---------------------------------------------------------------------------
// Seniority detection
// ---------------------------------------------------------------------------

const SENIORITY_PATTERNS = [
  // Order matters – more specific patterns first
  { regex: /\b(intern|internship|trainee|student)\b/i, value: 'junior' },
  { regex: /\b(junior|entry[\s-]?level|entry level|fresh|fresher|graduate|jr\.?)\b/i, value: 'junior' },
  { regex: /\b(mid[\s-]?level|mid level|intermediate|mid)\b/i, value: 'mid' },
  { regex: /\b(senior|sr\.?|experienced)\b/i, value: 'senior' },
  { regex: /\b(lead|principal|staff engineer|staff dev)\b/i, value: 'lead' },
  { regex: /\b(manager|director|head of|vp |vice president|engineering manager)\b/i, value: 'manager' },
];

function extractSeniority(title = '', description = '') {
  const text = `${title} ${description}`;
  for (const { regex, value } of SENIORITY_PATTERNS) {
    if (regex.test(text)) return value;
  }
  return undefined; // Unknown — don't pollute the field
}

// ---------------------------------------------------------------------------
// Workplace detection
// ---------------------------------------------------------------------------

function extractWorkplace(title = '', description = '', tags = []) {
  const text = `${title} ${description} ${tags.join(' ')}`.toLowerCase();

  // Use simple includes() / relaxed patterns because Wuzzuf sometimes
  // concatenates words without spaces (e.g. "Full TimeHybridCompany").
  if (/remote|work from home|wfh|fully remote/.test(text)) return 'remote';
  if (/hybrid/.test(text)) return 'hybrid';
  if (/on.?site|onsite|in.?office|office.?based/.test(text)) return 'onsite';

  return undefined; // Unknown — leave the field unset
}

// ---------------------------------------------------------------------------
// Skills / tech extraction
// ---------------------------------------------------------------------------

// Well-known tech skills to scan for in the description text.
// Intentionally conservative – only clear, widely-used names.
const TECH_SKILL_PATTERNS = [
  // Frontend frameworks
  'Vue', 'Nuxt', 'React', 'Next.js', 'Angular', 'Svelte', 'Ember',
  // JS / TS
  'JavaScript', 'TypeScript', 'ES6', 'ES2020',
  // Backend JS
  'Node.js', 'Express', 'Fastify', 'NestJS', 'Koa',
  // Python
  'Python', 'Django', 'FastAPI', 'Flask',
  // PHP
  'PHP', 'Laravel', 'Symfony',
  // Java / Kotlin
  'Java', 'Spring', 'Spring Boot', 'Kotlin',
  // .NET
  'C#', '.NET', 'ASP.NET',
  // Styling
  'CSS', 'SCSS', 'SASS', 'Tailwind', 'Bootstrap', 'Material UI',
  // State management
  'Vuex', 'Pinia', 'Redux', 'MobX',
  // API
  'REST', 'GraphQL', 'tRPC', 'WebSockets',
  // Tooling
  'Vite', 'Webpack', 'Rollup', 'Babel', 'ESLint', 'Prettier',
  // Testing
  'Jest', 'Vitest', 'Cypress', 'Playwright',
  // DB
  'MongoDB', 'MySQL', 'PostgreSQL', 'SQLite', 'Redis', 'Elasticsearch',
  // Cloud / DevOps
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'GitHub Actions',
  // Version control
  'Git', 'GitHub', 'GitLab', 'Bitbucket',
  // Design
  'Figma', 'Adobe XD', 'Sketch',
  // Mobile
  'React Native', 'Flutter', 'Swift', 'Dart',
  // Other
  'Nuxt UI', 'Quasar', 'Ionic',
];

// Build a lookup map of lowercased skill → canonical casing
const SKILL_MAP = new Map(TECH_SKILL_PATTERNS.map((s) => [s.toLowerCase(), s]));

function extractSkillsFromText(text = '') {
  const found = new Set();
  const lower = text.toLowerCase();

  for (const [lowerSkill, canonical] of SKILL_MAP) {
    // Use word-boundary regex. Escape special regex chars in skill name.
    const escaped = lowerSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`);
    if (regex.test(lower)) found.add(canonical);
  }

  return [...found];
}

function mergeSkills(existingTags = [], description = '') {
  const fromText = extractSkillsFromText(description);
  const all = new Set([...existingTags, ...fromText]);
  return [...all];
}

// ---------------------------------------------------------------------------
// Date parsing
// ---------------------------------------------------------------------------

function parseDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

// ---------------------------------------------------------------------------
// Main normalizer
// ---------------------------------------------------------------------------

/**
 * Convert a raw Wuzzuf job object into a shape compatible with jobModel.
 *
 * @param {object} rawJob  Output from wuzzufExtractor
 * @returns {object}       Normalized job ready for Job.create()
 */
function normalizeWuzzufJob(rawJob) {
  const {
    title = '',
    company,
    location,
    jobUrl,
    applyUrl,
    sourceJobId,
    postedAt,
    description,
    skills: rawSkills = [],
    rawText,
    workplace: rawWorkplace,
    _term,
    _partialFetch,
    // Everything else goes into rawPayload
    ...rest
  } = rawJob;

  const now = new Date();
  const descriptionText = description || '';

  // Derive fields
  const seniority = extractSeniority(title, descriptionText);
  const workplace =
    rawWorkplace || extractWorkplace(title, descriptionText, rawSkills);
  const skills = mergeSkills(rawSkills, descriptionText);

  // Build normalized object — only include defined values
  const normalized = {
    source: 'wuzzuf',
    title: title.trim(),
    jobUrl,
    rawText: rawText || undefined,
    rawPayload: rawJob,
    firstSeenAt: now,
    lastSeenAt: now,
    skills,
    tags: rawSkills,
  };

  if (sourceJobId) normalized.sourceJobId = sourceJobId;
  if (company) normalized.company = company.trim();
  if (location) normalized.location = location.trim();
  if (workplace) normalized.workplace = workplace;
  if (seniority) normalized.seniority = seniority;
  if (applyUrl) normalized.applyUrl = applyUrl;
  if (descriptionText) normalized.description = descriptionText;

  const parsedDate = parseDate(postedAt);
  if (parsedDate) normalized.postedAt = parsedDate;

  return normalized;
}

module.exports = { normalizeWuzzufJob, extractSeniority, extractWorkplace, mergeSkills };
