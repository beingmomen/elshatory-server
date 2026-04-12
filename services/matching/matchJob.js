/**
 * Main job matching orchestrator.
 * Combines rules scorer with optional LLM enhancement and persists the result.
 */

const Job = require('../../models/jobModel');
const JobMatch = require('../../models/jobMatchModel');
const AppError = require('../../utils/appError');
const {
  buildSnapshot,
  computeProfileVersion
} = require('../careerProfile/snapshot');
const { rulesScorer } = require('./rulesScorer');
const llmMatcher = require('./llmMatcher');

/**
 * Analyze a job and persist the match result.
 * @param {string} jobId
 * @param {string} userId
 * @returns {Promise<Object>} JobMatch document
 */
const matchJob = async (jobId, userId) => {
  // 1. Fetch the job
  const job = await Job.findOne({ _id: jobId, user: userId }).lean();
  if (!job) throw new AppError('لم يتم العثور على الوظيفة', 404);

  // 2. Build career profile snapshot
  const snapshot = await buildSnapshot(userId);
  const profileVersion = computeProfileVersion(snapshot);

  // 3. Run rules scorer
  const rulesResult = rulesScorer(job, snapshot);

  // 4. Try LLM enhancement (fallback-safe)
  let llmResult = null;
  let generatedBy = 'rules';

  if (process.env.LLM_API_KEY && process.env.LLM_MODEL) {
    llmResult = await llmMatcher.enhance(job, snapshot, rulesResult);
    if (llmResult) generatedBy = 'hybrid';
  }

  // 5. Merge results (LLM overrides individual fields if available)
  const finalResult = {
    score: rulesResult.score,
    level: rulesResult.level,
    matchedSkills: rulesResult.matchedSkills,
    missingSkills: llmResult?.missingSkills?.length
      ? llmResult.missingSkills
      : rulesResult.missingSkills,
    reasons: llmResult?.reasons?.length
      ? llmResult.reasons
      : rulesResult.reasons,
    risks: llmResult?.risks?.length ? llmResult.risks : rulesResult.risks,
    recommendations: llmResult?.recommendations?.length
      ? llmResult.recommendations
      : rulesResult.recommendations,
    generatedBy,
    profileVersion
  };

  // 6. Upsert JobMatch (job+user unique index)
  const match = await JobMatch.findOneAndUpdate(
    { job: jobId, user: userId },
    { $set: { ...finalResult, job: jobId, user: userId } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return match;
};

module.exports = { matchJob };
