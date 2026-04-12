const JobSource = require('../models/jobSourceModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  checkLinkedInHealth,
  updateLinkedInSourceStatus
} = require('../services/jobSearch/linkedinAdapter');

const LINKEDIN_HEALTH_CACHE_TTL_MS = 5 * 60 * 1000;
let linkedInHealthCache = { result: null, timestamp: 0 };

exports.getAll = factory.getAll(JobSource);

exports.getHealth = catchAsync(async (req, res, next) => {
  const { key } = req.params;

  // For LinkedIn: use cached result if recent, otherwise perform live check
  if (key === 'linkedin') {
    const now = Date.now();
    const cacheAge = now - linkedInHealthCache.timestamp;

    if (cacheAge < LINKEDIN_HEALTH_CACHE_TTL_MS && linkedInHealthCache.result) {
      // Use cached result, but still fetch source for response
      const source = await JobSource.findOne({ key: 'linkedin' });
      if (source) {
        return res.status(200).json({
          status: 'success',
          data: {
            key: source.key,
            name: source.name,
            enabled: source.enabled,
            mode: source.mode,
            lastHealthStatus: source.lastHealthStatus,
            lastCheckedAt: source.lastCheckedAt,
            lastError: source.lastError
          }
        });
      }
    }

    // Cache miss or expired — perform live check
    const health = await checkLinkedInHealth();
    await updateLinkedInSourceStatus(health.status, health.reason);
    linkedInHealthCache = { result: health, timestamp: now };
  }

  const source = await JobSource.findOne({ key });

  if (!source) {
    return next(new AppError(`No job source found with key: ${key}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      key: source.key,
      name: source.name,
      enabled: source.enabled,
      mode: source.mode,
      lastHealthStatus: source.lastHealthStatus,
      lastCheckedAt: source.lastCheckedAt,
      lastError: source.lastError
    }
  });
});
