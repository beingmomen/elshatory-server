const catchAsync = require('../utils/catchAsync');
const gemini = require('../utils/geminiClient');

const LINKEDIN_ENABLED =
  String(process.env.LINKEDIN_AUTOFETCH_ENABLED || 'false').toLowerCase() === 'true';

exports.getAll = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: [
      {
        key: 'wuzzuf',
        label: 'Wuzzuf',
        enabled: true,
        type: 'scrape'
      },
      {
        key: 'linkedin',
        label: 'LinkedIn',
        enabled: LINKEDIN_ENABLED,
        type: 'jobspy'
      },
      {
        key: 'gemini',
        label: 'Gemini 2.5 Flash',
        enabled: gemini.isConfigured(),
        type: 'ai'
      }
    ]
  });
});

exports.getWuzzufHealth = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { source: 'wuzzuf', healthy: true }
  });
});

exports.getLinkedinHealth = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      source: 'linkedin',
      healthy: LINKEDIN_ENABLED,
      degradedReason: LINKEDIN_ENABLED ? '' : 'disabled_by_config'
    }
  });
});
