/**
 * Rules-based job scorer.
 * Calculates a 0-100 match score between a job and a career profile snapshot.
 */

const { detectSkillsInText, userSkillsToCanonical } = require('./skillDictionary');

const SENIORITY_ORDER = { junior: 0, mid: 1, senior: 2, lead: 3, manager: 4, any: -1 };

/**
 * Get all text from a job for skill detection.
 */
const getJobText = (job) => {
  const parts = [
    job.title || '',
    job.description || '',
    ...(job.skills || []),
    ...(job.requirements || []),
    ...(job.tags || [])
  ];
  return parts.join(' ');
};

/**
 * Role match (25pts): Does job title contain any of the user's target roles?
 */
const scoreRoleMatch = (job, settings) => {
  const targetRoles = settings?.targetRoles || [];
  if (!targetRoles.length) return { pts: 10, reason: null }; // benefit of doubt

  const titleLower = (job.title || '').toLowerCase();

  for (const role of targetRoles) {
    const roleLower = role.toLowerCase();
    if (titleLower.includes(roleLower) || roleLower.includes(titleLower.split(' ')[0])) {
      return {
        pts: 25,
        reason: `العنوان الوظيفي "${job.title}" يتطابق مع الأدوار المستهدفة (${role})`
      };
    }
  }

  // Partial: check word overlap
  const titleWords = titleLower.split(/\s+/);
  const roleWords = targetRoles.flatMap((r) => r.toLowerCase().split(/\s+/));
  const overlap = titleWords.filter((w) => w.length > 3 && roleWords.includes(w));

  if (overlap.length > 0) {
    return {
      pts: 12,
      reason: `العنوان الوظيفي يتقاطع جزئيًا مع الأدوار المستهدفة`
    };
  }

  return { pts: 0, reason: `العنوان الوظيفي "${job.title}" لا يتطابق مع الأدوار المستهدفة` };
};

/**
 * Core stack match (30pts): How many of defaultStacks appear in job?
 */
const scoreCoreStack = (job, snapshot) => {
  const jobText = getJobText(job);
  const jobSkillsCanonical = detectSkillsInText(jobText);
  const userCore = userSkillsToCanonical(snapshot.settings?.defaultStacks || []);
  const userAll = userSkillsToCanonical(snapshot.allSkills || []);

  if (!userCore.length) {
    // Fallback to allSkills
    if (!userAll.length) return { pts: 0, matched: [], missing: jobSkillsCanonical, reason: null };
    const matched = jobSkillsCanonical.filter((s) => userAll.includes(s));
    const missing = jobSkillsCanonical.filter((s) => !userAll.includes(s));
    const ratio = matched.length / Math.max(jobSkillsCanonical.length, 1);
    return {
      pts: Math.round(Math.min(30, ratio * 30)),
      matched,
      missing,
      reason: matched.length
        ? `لديك ${matched.length} من أصل ${jobSkillsCanonical.length} مهارة مطلوبة: ${matched.slice(0, 3).join(', ')}`
        : null
    };
  }

  const matched = jobSkillsCanonical.filter((s) => userCore.includes(s) || userAll.includes(s));
  const coreMatched = jobSkillsCanonical.filter((s) => userCore.includes(s));
  const missing = jobSkillsCanonical.filter((s) => !userAll.includes(s));

  const ratio = coreMatched.length / Math.max(userCore.length, 1);
  const pts = Math.round(Math.min(30, ratio * 30));

  let reason = null;
  if (coreMatched.length > 0) {
    reason = `يطلب ${coreMatched.join(', ')} وهي ضمن core stack الخاص بك`;
  }

  return { pts, matched, missing, reason };
};

/**
 * Secondary stack match (10pts): How many of optionalStacks appear in job?
 */
const scoreSecondaryStack = (job, snapshot) => {
  const jobText = getJobText(job);
  const jobSkillsCanonical = detectSkillsInText(jobText);
  const userOptional = userSkillsToCanonical(snapshot.settings?.optionalStacks || []);

  if (!userOptional.length) return { pts: 5, reason: null }; // benefit of doubt

  const matched = jobSkillsCanonical.filter((s) => userOptional.includes(s));
  const ratio = matched.length / Math.max(userOptional.length, 1);
  const pts = Math.round(Math.min(10, ratio * 10));

  return {
    pts,
    reason: matched.length
      ? `يطلب ${matched.join(', ')} وهي من optional stack الخاص بك`
      : null
  };
};

/**
 * Seniority score (15pts): How close is job seniority to user's target?
 */
const scoreSeniority = (job, settings) => {
  const jobSeniority = job.seniority || 'any';
  const targetSeniority = settings?.targetSeniority || [];

  if (jobSeniority === 'any') {
    return { pts: 15, seniorityDelta: 0, reason: `الوظيفة مفتوحة لجميع المستويات` };
  }

  if (!targetSeniority.length) {
    return { pts: 8, seniorityDelta: 0, reason: null };
  }

  const jobIdx = SENIORITY_ORDER[jobSeniority] ?? 1;
  const targetIndices = targetSeniority.map((s) => SENIORITY_ORDER[s] ?? 1);
  const userMaxIdx = Math.max(...targetIndices);
  const distance = Math.abs(jobIdx - userMaxIdx);

  let pts = 0;
  let reason = null;

  if (distance === 0) {
    pts = 15;
    reason = `مستوى الوظيفة (${jobSeniority}) يطابق المستوى المستهدف`;
  } else if (distance === 1) {
    pts = 8;
    reason = `مستوى الوظيفة (${jobSeniority}) قريب من المستوى المستهدف`;
  } else {
    pts = 0;
    reason = `مستوى الوظيفة (${jobSeniority}) يختلف كثيرًا عن المستوى المستهدف`;
  }

  return { pts, seniorityDelta: distance, userMaxIdx, jobIdx, reason };
};

/**
 * Domain match (10pts): Do user's projects/experiences overlap with job skills?
 */
const scoreDomain = (job, snapshot) => {
  const jobText = getJobText(job);
  const jobSkillsCanonical = detectSkillsInText(jobText);

  if (!jobSkillsCanonical.length) return { pts: 5, reason: null };

  // Skills from projects
  const projectSkills = (snapshot.projects || []).flatMap((p) => p.skills || []);
  const projectSkillsCanonical = userSkillsToCanonical(projectSkills);

  // Skills from experience responsibilities
  const expText = (snapshot.experiences || [])
    .flatMap((e) => e.responsibilities || [])
    .join(' ');
  const expSkillsCanonical = detectSkillsInText(expText);

  const userDomainSkills = new Set([...projectSkillsCanonical, ...expSkillsCanonical]);
  const domainMatched = jobSkillsCanonical.filter((s) => userDomainSkills.has(s));

  const ratio = domainMatched.length / Math.max(jobSkillsCanonical.length, 1);
  const pts = Math.round(Math.min(10, ratio * 10));

  return {
    pts,
    reason: domainMatched.length
      ? `مشاريعك وخبراتك تتضمن ${domainMatched.slice(0, 2).join(', ')}`
      : null
  };
};

/**
 * Location/workplace match (10pts): Do preferences match?
 */
const scoreLocationWorkplace = (job, settings) => {
  const workplacePrefs = settings?.workplacePreferences || [];
  const locationPrefs = settings?.locationPreferences || [];

  let pts = 0;
  const reasons = [];

  // Workplace (5pts)
  if (!workplacePrefs.length) {
    pts += 5;
  } else if (job.workplace && workplacePrefs.includes(job.workplace)) {
    pts += 5;
    reasons.push(`نوع العمل (${job.workplace}) يطابق تفضيلاتك`);
  }

  // Location (5pts)
  if (!locationPrefs.length) {
    pts += 5;
  } else if (job.location) {
    const locationLower = job.location.toLowerCase();
    const matches = locationPrefs.some((loc) => locationLower.includes(loc.toLowerCase()));
    if (matches) {
      pts += 5;
      reasons.push(`الموقع يطابق تفضيلاتك`);
    }
  } else {
    pts += 3; // unknown location, partial credit
  }

  return { pts, reason: reasons.join('، ') || null };
};

/**
 * Determine the match level based on score and seniority context.
 */
const determineLevel = (score, job, settings) => {
  const targetSeniority = settings?.targetSeniority || [];
  const jobSeniority = job.seniority || 'any';

  // Check for stretch override
  if (
    ['senior', 'lead', 'manager'].includes(jobSeniority) &&
    targetSeniority.length > 0 &&
    score >= 40
  ) {
    const targetIndices = targetSeniority.map((s) => SENIORITY_ORDER[s] ?? 1);
    const userMaxIdx = Math.max(...targetIndices);
    const jobIdx = SENIORITY_ORDER[jobSeniority] ?? 2;
    if (userMaxIdx <= 1 && jobIdx >= 2) {
      return 'stretch';
    }
  }

  if (score >= 85) return 'strong';
  if (score >= 70) return 'good';
  if (score >= 50) return 'possible';
  return 'poor';
};

/**
 * Main rules scorer.
 * @param {Object} job - lean job object
 * @param {Object} snapshot - from buildSnapshot()
 * @returns {Object} scoring result
 */
const rulesScorer = (job, snapshot) => {
  const settings = snapshot.settings || null;

  const roleResult = scoreRoleMatch(job, settings);
  const coreResult = scoreCoreStack(job, snapshot);
  const secondaryResult = scoreSecondaryStack(job, snapshot);
  const seniorityResult = scoreSeniority(job, settings);
  const domainResult = scoreDomain(job, snapshot);
  const locationResult = scoreLocationWorkplace(job, settings);

  const score = Math.round(
    roleResult.pts +
      coreResult.pts +
      secondaryResult.pts +
      seniorityResult.pts +
      domainResult.pts +
      locationResult.pts
  );

  const finalScore = Math.min(100, Math.max(0, score));
  const level = determineLevel(finalScore, job, settings);

  // Build reasons (only non-null ones)
  const reasons = [
    roleResult.reason,
    coreResult.reason,
    secondaryResult.reason,
    seniorityResult.reason,
    domainResult.reason,
    locationResult.reason
  ].filter(Boolean);

  // Build risks
  const risks = [];
  if (seniorityResult.seniorityDelta >= 2) {
    risks.push(`فجوة كبيرة في مستوى الخبرة: الوظيفة تطلب ${job.seniority} وأنت تستهدف مستوى أقل`);
  }
  if (coreResult.missing?.length > 3) {
    risks.push(`${coreResult.missing.length} مهارات مطلوبة غير موجودة في ملفك: ${coreResult.missing.slice(0, 3).join(', ')}...`);
  }
  if (level === 'stretch') {
    risks.push(`هذه وظيفة stretch - تحتاج إبراز مشاريع قيادية أو ownership في CV`);
  }
  if (level === 'poor') {
    risks.push(`التطابق منخفض - راجع المتطلبات مع مهاراتك الحالية`);
  }

  // Build basic recommendations
  const recommendations = [];
  if (coreResult.matched?.length > 0) {
    recommendations.push(`أبرز ${coreResult.matched.slice(0, 3).join(', ')} في أعلى CV`);
  }
  if (coreResult.missing?.length > 0) {
    recommendations.push(`ادرس ${coreResult.missing.slice(0, 2).join(', ')} إذا كنت ستتقدم`);
  }
  if (level === 'stretch') {
    recommendations.push(`ركز في CV على مشاريع أثبتت فيها ownership ومسؤولية تقنية`);
  }
  if (roleResult.pts === 0) {
    recommendations.push(`تحقق من عنوان الوظيفة - قد تكون خارج نطاق تخصصك`);
  }

  return {
    score: finalScore,
    level,
    matchedSkills: coreResult.matched || [],
    missingSkills: coreResult.missing || [],
    reasons,
    risks,
    recommendations
  };
};

module.exports = { rulesScorer };
