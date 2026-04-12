const crypto = require('crypto');
const Info = require('../../models/infoModel');
const Skill = require('../../models/skillModel');
const Experience = require('../../models/experienceModel');
const Project = require('../../models/projectModel');
const CareerProfileSettings = require('../../models/careerProfileSettingsModel');

/**
 * Builds a unified career profile snapshot for a given user.
 * Used by matching and resume draft generation.
 *
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {Object} snapshot
 */
const buildSnapshot = async (userId) => {
  const [info, skills, experiences, projects, settings] = await Promise.all([
    Info.findOne().select('resumeUrl bio stats skills').lean(),
    Skill.find({ user: userId })
      .select('title icon')
      .sort({ createdAt: 1 })
      .lean(),
    Experience.find()
      .select(
        'company position employmentType workPlace startDate endDate responsibilities order'
      )
      .sort({ order: 1 })
      .lean(),
    Project.find({ user: userId, isActive: true })
      .select('title description tag url skillIds')
      .populate({ path: 'skillIds', select: 'title' })
      .lean(),
    CareerProfileSettings.findOne({ user: userId }).lean()
  ]);

  // Flat list of skill titles from the Skill collection
  const skillTitles = skills.map((s) => s.title);

  // Skill titles extracted from info.skills groups (grouped category items)
  const infoSkillNames = (info?.skills || []).flatMap((group) =>
    (group.items || []).map((item) => item.name).filter(Boolean)
  );

  // Deduplicated union of all skill signals
  const allSkills = [...new Set([...skillTitles, ...infoSkillNames])];

  return {
    generatedAt: new Date().toISOString(),

    // Personal info
    bio: info?.bio || { paragraphs: [], quote: '' },
    resumeUrl: info?.resumeUrl || null,
    stats: info?.stats || [],

    // Skills
    skills: skills.map((s) => ({ title: s.title, icon: s.icon })),
    allSkills,

    // Work history
    experiences: experiences.map((e) => ({
      company: e.company,
      position: e.position,
      employmentType: e.employmentType,
      workPlace: e.workPlace,
      startDate: e.startDate,
      endDate: e.endDate,
      responsibilities: e.responsibilities
    })),

    // Portfolio
    projects: projects.map((p) => ({
      title: p.title,
      description: p.description,
      tag: p.tag,
      url: p.url,
      skills: (p.skillIds || []).map((s) => s.title)
    })),

    // Career preferences / settings
    settings: settings
      ? {
          targetRoles: settings.targetRoles || [],
          targetSeniority: settings.targetSeniority || [],
          defaultStacks: settings.defaultStacks || [],
          optionalStacks: settings.optionalStacks || [],
          locationPreferences: settings.locationPreferences || [],
          workplacePreferences: settings.workplacePreferences || []
        }
      : null
  };
};

/**
 * Compute a short version hash for the profile snapshot.
 * Changes when skills, target roles, or seniority change.
 *
 * @param {Object} snapshot - Result of buildSnapshot()
 * @returns {string} 12-character hex hash
 */
const computeProfileVersion = (snapshot) => {
  const key = JSON.stringify({
    allSkills: (snapshot.allSkills || []).slice().sort(),
    targetRoles: (snapshot.settings?.targetRoles || []).slice().sort(),
    targetSeniority: (snapshot.settings?.targetSeniority || []).slice().sort(),
    defaultStacks: (snapshot.settings?.defaultStacks || []).slice().sort()
  });
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 12);
};

module.exports = { buildSnapshot, computeProfileVersion };
