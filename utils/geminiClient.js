/* eslint-disable no-await-in-loop */
const logger = require('./logger');

const RATE_LIMIT_DELAY_MS = Number(process.env.GEMINI_RATE_LIMIT_MS || 2000);
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let lastCallAt = 0;
let clientPromise = null;

const getClient = async () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!clientPromise) {
    clientPromise = (async () => {
      // eslint-disable-next-line global-require, import/no-unresolved
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    })();
  }
  return clientPromise;
};

const throttle = async () => {
  const now = Date.now();
  const wait = Math.max(0, RATE_LIMIT_DELAY_MS - (now - lastCallAt));
  if (wait > 0) {
    await new Promise(resolve => setTimeout(resolve, wait));
  }
  lastCallAt = Date.now();
};

const extractJson = text => {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(raw);
  } catch {
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const callModel = async prompt => {
  await throttle();
  const genAI = await getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3
    }
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

const buildScorePrompt = ({ job, profile }) => `
أنت محلل توظيف. حلّل مدى ملاءمة الوظيفة للملف المهني التالي.
أجب بـ JSON فقط (بدون Markdown أو شرح).

الصيغة المطلوبة:
{
  "score": 0-100,
  "level": "strong"|"good"|"possible"|"stretch"|"poor",
  "matchedSkills": ["..."],
  "missingSkills": ["..."],
  "reasons": ["..."],
  "risks": ["..."],
  "recommendations": ["..."]
}

الملف المهني:
- الأدوار المستهدفة: ${(profile.targetRoles || []).join(', ') || 'غير محدد'}
- المستويات: ${(profile.targetSeniority || []).join(', ') || 'غير محدد'}
- التقنيات الأساسية: ${(profile.defaultStacks || []).join(', ') || 'غير محدد'}
- التقنيات الاختيارية: ${(profile.optionalStacks || []).join(', ') || 'غير محدد'}
- المواقع المفضلة: ${(profile.locationPreferences || []).join(', ') || 'غير محدد'}
- بيئة العمل: ${(profile.workplacePreferences || []).join(', ') || 'غير محدد'}
- كلمات مطلوبة: ${(profile.requiredKeywords || []).join(', ') || 'لا يوجد'}
- كلمات مستبعدة: ${(profile.excludedKeywords || []).join(', ') || 'لا يوجد'}

الوظيفة:
- العنوان: ${job.title || ''}
- الشركة: ${job.company || ''}
- الموقع: ${job.location || ''}
- المستوى: ${job.seniority || ''}
- بيئة العمل: ${job.workplace || ''}
- الوصف:
${(job.description || '').slice(0, 4000)}
- المتطلبات: ${(job.requirements || []).join(' | ') || 'غير محدد'}
- المهارات: ${(job.skills || []).join(', ') || 'غير محدد'}
`.trim();

const buildResumePrompt = ({ job, profile }) => `
أنت خبير في كتابة CV مناسب لأنظمة ATS.
أنتج مسودة CV مخصصة للوظيفة، بصيغة JSON فقط:
{
  "summary": "سطرين عن الملاءمة",
  "highlightedSkills": ["..."],
  "experienceBullets": ["bullet 1", "bullet 2"],
  "suggestedKeywords": ["..."]
}

الملف المهني:
${JSON.stringify({
    targetRoles: profile.targetRoles,
    stacks: [...(profile.defaultStacks || []), ...(profile.optionalStacks || [])],
    locationPreferences: profile.locationPreferences,
    workplacePreferences: profile.workplacePreferences
  }, null, 2)}

الوظيفة:
- ${job.title} @ ${job.company || ''}
- ${job.location || ''} / ${job.workplace || ''}
- المستوى: ${job.seniority || ''}
- الوصف: ${(job.description || '').slice(0, 3500)}
- المتطلبات: ${(job.requirements || []).join(' | ')}
- المهارات: ${(job.skills || []).join(', ')}
`.trim();

exports.isConfigured = () => Boolean(process.env.GEMINI_API_KEY);

exports.scoreJob = async ({ job, profile }) => {
  const prompt = buildScorePrompt({ job, profile });
  const text = await callModel(prompt);
  const parsed = extractJson(text);
  if (!parsed) {
    logger.warn('Gemini returned unparsable JSON for scoreJob');
    return null;
  }

  const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
  const validLevels = ['strong', 'good', 'possible', 'stretch', 'poor'];
  const level = validLevels.includes(parsed.level) ? parsed.level : 'possible';

  return {
    score,
    level,
    matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills.slice(0, 30) : [],
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills.slice(0, 30) : [],
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 10) : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 10) : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 10)
      : [],
    generatedBy: 'llm',
    updatedAt: new Date()
  };
};

exports.tailorResume = async ({ job, profile }) => {
  const prompt = buildResumePrompt({ job, profile });
  const text = await callModel(prompt);
  const parsed = extractJson(text);
  if (!parsed) {
    logger.warn('Gemini returned unparsable JSON for tailorResume');
    return {
      summary: '',
      highlightedSkills: [],
      experienceBullets: [],
      suggestedKeywords: [],
      rawOutput: text,
      generatedBy: 'llm'
    };
  }

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    highlightedSkills: Array.isArray(parsed.highlightedSkills)
      ? parsed.highlightedSkills.slice(0, 20)
      : [],
    experienceBullets: Array.isArray(parsed.experienceBullets)
      ? parsed.experienceBullets.slice(0, 10)
      : [],
    suggestedKeywords: Array.isArray(parsed.suggestedKeywords)
      ? parsed.suggestedKeywords.slice(0, 20)
      : [],
    rawOutput: text,
    generatedBy: 'llm'
  };
};
