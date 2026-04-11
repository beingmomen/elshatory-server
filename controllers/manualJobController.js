const catchAsync = require('../utils/catchAsync');

exports.importJob = catchAsync(async (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'Not implemented yet'
  });
});
