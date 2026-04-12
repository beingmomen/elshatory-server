/**
 * ATS Resume Draft Generator.
 *
 * Builds a structured CV draft tailored to a specific job posting,
 * using only real data from the user's career profile snapshot.
 * Never fabricates skills or experience.
 *
 * @param {Object} job - Job document (from jobModel)
 * @param {Object} snapshot - Result of buildSnapshot(userId)
 * @param {Object|null} match - Latest JobMatch document (optional)
 * @returns {{ content: Object, warnings: string[], format: string }}
 */
const { renderAtsText } = require('./templates/atsText');

/**
 * Normalise a skill string for case-insensitive comparison.
 */
const normalise = str => (str || '').toLowerCase().trim();

const generateAtsDraft = (job, snapshot, match = null) => {
  const warnings = [];

  // ─── Job skills (lowercased set for lookup) ───────────────
  const jobSkillsLower = new Set((job.skills || []).map(normalise));
  const profileSkillsAll = snapshot.allSkills || [];

  // ─── 1. Skills ────────────────────────────────────────────
  // Group 1: profile skills that appear in the job description (matched first)
  const matchedProfileSkills = profileSkillsAll.filter(s =>
    jobSkillsLower.has(normalise(s))
  );
  // Group 2: remaining profile skills (not in job)
  const remainingProfileSkills = profileSkillsAll.filter(
    s => !jobSkillsLower.has(normalise(s))
  );
  const orderedSkills = [...matchedProfileSkills, ...remainingProfileSkills];

  // ─── 2. Headline ──────────────────────────────────────────
  const latestRole =
    snapshot.experiences && snapshot.experiences.length > 0
      ? snapshot.experiences[0].position
      : null;
  const headlineSkills = matchedProfileSkills.slice(0, 4);
  const headline = [latestRole, headlineSkills.join(' | ')]
    .filter(Boolean)
    .join(' | ');

  // ─── 3. Summary ───────────────────────────────────────────
  const bioParagraph =
    snapshot.bio?.paragraphs?.length > 0 ? snapshot.bio.paragraphs[0] : null;

  let summary = '';
  if (bioParagraph) {
    const topSkills = matchedProfileSkills.slice(0, 3).join(', ');
    summary = topSkills
      ? `${bioParagraph} متخصص في ${topSkills}.`
      : bioParagraph;
  } else {
    warnings.push(
      'الملخص المهني مُولَّد من بيانات ناقصة، يُنصح بإضافة bio مفصل في إعدادات البروفايل'
    );
    const topSkills = matchedProfileSkills.slice(0, 4).join(', ');
    summary = latestRole
      ? `مطور ${latestRole} متخصص في ${topSkills || 'تطوير الويب'}.`
      : `مطور متخصص في ${topSkills || 'تطوير الويب'}.`;
  }

  // ─── 4. Experience bullets ────────────────────────────────
  const experienceBullets = (snapshot.experiences || []).map(exp => ({
    company: exp.company,
    role: exp.position,
    startDate: exp.startDate || null,
    endDate: exp.endDate || null,
    bullets: exp.responsibilities || []
  }));

  // ─── 5. Projects ──────────────────────────────────────────
  // Score each project by how many of its skills overlap with job skills
  const scoredProjects = (snapshot.projects || []).map(project => {
    const projectSkillsLower = (project.skills || []).map(normalise);
    const overlap = projectSkillsLower.filter(s =>
      jobSkillsLower.has(s)
    ).length;
    return { project, overlap };
  });

  scoredProjects.sort((a, b) => b.overlap - a.overlap);

  const hasOverlap = scoredProjects.some(sp => sp.overlap > 0);
  if (!hasOverlap && scoredProjects.length > 0) {
    warnings.push('لا توجد مشاريع مرتبطة بتقنيات الوظيفة، قد يبدو CV عامًا');
  }

  const topProjects = scoredProjects.slice(0, 4).map(({ project }) => ({
    title: project.title,
    stack: project.skills || [],
    bullets: project.description ? [project.description] : []
  }));

  // ─── 6. Warnings from match analysis ─────────────────────
  if (match) {
    for (const skill of match.missingSkills || []) {
      warnings.push(`الوظيفة تطلب '${skill}' وهي غير موجودة في ملفك المهني`);
    }

    if (
      job.seniority &&
      match.level &&
      ['stretch', 'poor'].includes(match.level)
    ) {
      warnings.push('الوظيفة قد تتطلب خبرة أعلى من مستواك الحالي');
    }
  }

  // ─── 7. Render ATS text ───────────────────────────────────
  const text = renderAtsText({
    headline,
    summary,
    skills: orderedSkills,
    experienceBullets,
    projects: topProjects,
    personal: {}
  });

  const content = {
    headline,
    summary,
    skills: orderedSkills,
    experienceBullets,
    projects: topProjects,
    text
  };

  return { content, warnings, format: 'text' };
};

module.exports = { generateAtsDraft };
