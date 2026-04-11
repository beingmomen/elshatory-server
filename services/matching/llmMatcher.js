/**
 * LLM-based job matching enhancer.
 * Fallback-safe: returns null on any error.
 * Uses native fetch (Node 18+).
 */

const LLM_TIMEOUT_MS = 15000;

const buildPrompt = (job, snapshot, rulesResult) => {
  const userSkills = (snapshot.allSkills || []).slice(0, 20).join(', ');
  const jobSkillsList = (job.skills || []).slice(0, 15).join(', ');
  const jobDesc = (job.description || '').substring(0, 600);
  const targetRoles = (snapshot.settings?.targetRoles || []).join(', ');
  const targetSeniority = (snapshot.settings?.targetSeniority || []).join(', ');

  return `You are a senior technical recruiter and career advisor. Analyze this job match and return ONLY a valid JSON object with no markdown, no explanation, just raw JSON.

Job Title: ${job.title || 'Unknown'}
Company: ${job.company || 'Unknown'}
Seniority: ${job.seniority || 'not specified'}
Required Skills: ${jobSkillsList || 'not listed'}
Job Description (excerpt): ${jobDesc}

Candidate Profile:
- Skills: ${userSkills || 'not specified'}
- Target Roles: ${targetRoles || 'not specified'}
- Target Seniority: ${targetSeniority || 'not specified'}
- Rules Score: ${rulesResult.score}/100 (${rulesResult.level})
- Already Matched Skills: ${(rulesResult.matchedSkills || []).join(', ') || 'none'}
- Missing Skills: ${(rulesResult.missingSkills || []).join(', ') || 'none'}

Return JSON with exactly these keys:
{
  "reasons": ["up to 3 specific reasons why this is or isn't a good match, in Arabic"],
  "risks": ["up to 2 specific risks or concerns, in Arabic"],
  "recommendations": ["up to 3 specific, job-tailored recommendations for the CV or application, in Arabic"],
  "missingSkills": ["list of skills from the job description that the candidate lacks"]
}

Rules:
- All text values must be in Arabic
- Be specific to THIS job, not generic advice
- missingSkills must only include skills actually mentioned in the job
- If the match is strong, focus recommendations on how to stand out`;
};

/**
 * Enhance rules-based result with LLM analysis.
 * @param {Object} job - lean job object
 * @param {Object} snapshot - career profile snapshot
 * @param {Object} rulesResult - output from rulesScorer
 * @returns {Object|null} LLM enhancements or null on failure
 */
const enhance = async (job, snapshot, rulesResult) => {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  const baseUrl = (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

  if (!apiKey || !model) return null;

  const prompt = buildPrompt(job, snapshot, rulesResult);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[LLM] Request failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    // Validate structure
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.filter((r) => typeof r === 'string').slice(0, 3) : undefined,
      risks: Array.isArray(parsed.risks) ? parsed.risks.filter((r) => typeof r === 'string').slice(0, 2) : undefined,
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.filter((r) => typeof r === 'string').slice(0, 3)
        : undefined,
      missingSkills: Array.isArray(parsed.missingSkills)
        ? parsed.missingSkills.filter((s) => typeof s === 'string').slice(0, 10)
        : undefined
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.warn('[LLM] Request timed out — falling back to rules');
    } else {
      console.warn('[LLM] Error:', err.message);
    }
    return null;
  }
};

module.exports = { enhance };
