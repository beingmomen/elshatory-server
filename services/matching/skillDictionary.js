/**
 * Skill Dictionary for job matching.
 * Maps canonical skill names to their common aliases.
 */

const SKILL_DICTIONARY = {
  vue: ['vue', 'vue.js', 'vuejs', 'vue 3', 'vue3', 'vue js'],
  nuxt: ['nuxt', 'nuxt.js', 'nuxtjs', 'nuxt 3', 'nuxt3', 'nuxt js'],
  react: ['react', 'react.js', 'reactjs', 'react js'],
  next: ['next.js', 'nextjs', 'next js', 'next'],
  angular: ['angular', 'angularjs', 'angular.js', 'angular js'],
  svelte: ['svelte', 'sveltekit'],
  typescript: ['typescript', 'ts'],
  javascript: ['javascript', 'js', 'ecmascript', 'es6', 'es2015', 'vanilla js'],
  node: ['node', 'node.js', 'nodejs', 'node js'],
  express: ['express', 'expressjs', 'express.js'],
  tailwind: ['tailwind', 'tailwind css', 'tailwindcss'],
  pinia: ['pinia'],
  vuex: ['vuex'],
  redux: ['redux', 'redux toolkit', 'rtk'],
  graphql: ['graphql', 'gql', 'apollo', 'apollo graphql'],
  rest: ['rest', 'rest api', 'restful', 'restful api'],
  docker: ['docker', 'dockerfile', 'docker compose', 'containerization'],
  kubernetes: ['kubernetes', 'k8s', 'kubectl'],
  git: ['git', 'github', 'gitlab', 'version control'],
  python: ['python', 'python3'],
  django: ['django', 'django rest framework', 'drf'],
  fastapi: ['fastapi', 'fast api'],
  laravel: ['laravel'],
  php: ['php'],
  java: ['java', 'spring', 'spring boot', 'springboot'],
  csharp: ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
  go: ['go', 'golang'],
  rust: ['rust', 'rustlang'],
  mongodb: ['mongodb', 'mongo', 'mongoose'],
  postgresql: ['postgresql', 'postgres', 'pg', 'psql'],
  mysql: ['mysql', 'mariadb'],
  redis: ['redis'],
  elasticsearch: ['elasticsearch', 'elastic search', 'opensearch'],
  aws: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  azure: ['azure', 'microsoft azure'],
  gcp: ['gcp', 'google cloud', 'google cloud platform'],
  firebase: ['firebase', 'firestore'],
  jest: ['jest', 'vitest', 'testing', 'unit testing'],
  cypress: ['cypress', 'e2e', 'end to end', 'playwright'],
  webpack: ['webpack', 'vite', 'rollup', 'bundler'],
  figma: ['figma', 'design'],
  sass: ['sass', 'scss', 'less', 'css preprocessor'],
  css: ['css', 'css3'],
  html: ['html', 'html5'],
  linux: ['linux', 'ubuntu', 'bash', 'shell', 'unix'],
  nginx: ['nginx', 'apache'],
  ci_cd: ['ci/cd', 'cicd', 'github actions', 'gitlab ci', 'jenkins', 'devops'],
  agile: ['agile', 'scrum', 'kanban'],
  microservices: ['microservices', 'micro services', 'microservice architecture'],
  websockets: ['websockets', 'websocket', 'socket.io', 'real-time', 'realtime']
};

/**
 * Normalize a single skill name to its canonical form.
 * @param {string} name
 * @returns {string|null} canonical name or null if not found
 */
const normalizeSkillName = (name) => {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(SKILL_DICTIONARY)) {
    if (aliases.includes(lower) || canonical === lower) {
      return canonical;
    }
  }
  return null;
};

/**
 * Detect canonical skill names in a block of text.
 * @param {string} text
 * @returns {string[]} unique canonical skill names found
 */
const detectSkillsInText = (text) => {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = new Set();

  for (const [canonical, aliases] of Object.entries(SKILL_DICTIONARY)) {
    for (const alias of aliases) {
      // Word-boundary-safe check: alias must not be surrounded by letters/digits
      const regex = new RegExp(`(?<![a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`, 'i');
      if (regex.test(lower)) {
        found.add(canonical);
        break;
      }
    }
  }

  return Array.from(found);
};

/**
 * Convert an array of user skill names (possibly aliases) to canonical names.
 * Unrecognized skills are included as-is in lowercase.
 * @param {string[]} skills
 * @returns {string[]} canonical names
 */
const userSkillsToCanonical = (skills = []) => {
  const result = new Set();
  for (const s of skills) {
    const canonical = normalizeSkillName(s);
    result.add(canonical || s.toLowerCase().trim());
  }
  return Array.from(result).filter(Boolean);
};

module.exports = { SKILL_DICTIONARY, normalizeSkillName, detectSkillsInText, userSkillsToCanonical };
