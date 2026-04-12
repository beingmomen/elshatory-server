/**
 * ATS text template renderer.
 * Converts structured draft content into a plain-text ATS-friendly CV string.
 *
 * @param {Object} params
 * @param {string} params.headline
 * @param {string} params.summary
 * @param {string[]} params.skills
 * @param {Array<{company, role, startDate, endDate, bullets}>} params.experienceBullets
 * @param {Array<{title, stack, bullets}>} params.projects
 * @param {Object} [params.personal] - { name, email, phone, linkedin, github, portfolio }
 * @returns {string} Plain text ATS resume
 */
const renderAtsText = ({
  headline,
  summary,
  skills,
  experienceBullets,
  projects,
  personal = {}
}) => {
  const lines = [];

  const sep = (char = '-', len = 60) => char.repeat(len);

  // ─── Header ───────────────────────────────────────────────
  if (personal.name) lines.push(personal.name.toUpperCase());
  if (headline) lines.push(headline);

  const contactParts = [
    personal.email || '[أضف البريد الإلكتروني]',
    personal.phone || '[أضف رقم الهاتف]',
    personal.linkedin || null,
    personal.github || null,
    personal.portfolio || null
  ].filter(Boolean);
  lines.push(contactParts.join(' | '));

  lines.push('');

  // ─── Summary ──────────────────────────────────────────────
  if (summary) {
    lines.push('SUMMARY');
    lines.push(sep());
    lines.push(summary);
    lines.push('');
  }

  // ─── Skills ───────────────────────────────────────────────
  if (skills && skills.length > 0) {
    lines.push('SKILLS');
    lines.push(sep());
    lines.push(skills.join(' | '));
    lines.push('');
  }

  // ─── Experience ───────────────────────────────────────────
  if (experienceBullets && experienceBullets.length > 0) {
    lines.push('EXPERIENCE');
    lines.push(sep());
    for (const exp of experienceBullets) {
      const dateRange = [exp.startDate, exp.endDate]
        .filter(Boolean)
        .join(' - ');
      lines.push(
        `${exp.company} — ${exp.role}${dateRange ? ` (${dateRange})` : ''}`
      );
      for (const bullet of exp.bullets || []) {
        lines.push(`  - ${bullet}`);
      }
      lines.push('');
    }
  }

  // ─── Projects ─────────────────────────────────────────────
  if (projects && projects.length > 0) {
    lines.push('PROJECTS');
    lines.push(sep());
    for (const project of projects) {
      const stackStr =
        project.stack && project.stack.length > 0
          ? ` | ${project.stack.join(', ')}`
          : '';
      lines.push(`${project.title}${stackStr}`);
      for (const bullet of project.bullets || []) {
        lines.push(`  - ${bullet}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n').trim();
};

module.exports = { renderAtsText };
