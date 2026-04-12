const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { importJob } = require('../services/jobSearch/manualImport');

exports.importJob = catchAsync(async (req, res, next) => {
  const { source = 'linkedin', jobUrl, rawText } = req.body;

  if (!jobUrl && !rawText) {
    return next(
      new AppError(
        'يجب توفير jobUrl أو rawText. الرجاء لصق وصف الوظيفة في حقل rawText.',
        400
      )
    );
  }

  const result = await importJob({
    source,
    jobUrl,
    rawText,
    userId: req.user._id
  });

  const statusCode = result.isDuplicate ? 200 : 201;

  res.status(statusCode).json({
    status: 'success',
    isDuplicate: result.isDuplicate,
    ...(result.duplicateReason && { duplicateReason: result.duplicateReason }),
    data: { job: result.job }
  });
});
