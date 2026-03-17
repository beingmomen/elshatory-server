const Model = require('../models/blogModel');
const BlogView = require('../models/blogViewModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllNoPagination = factory.getAllNoPagination(Model);
exports.getAll = factory.getAll(Model);
exports.getOne = factory.getOne(Model);
exports.createOne = factory.createOne(Model);
exports.updateOne = factory.updateOne(Model);
exports.deleteOne = factory.deleteOne(Model, true);
exports.deleteAll = factory.deleteAll(Model);

exports.getOneBySlug = catchAsync(async (req, res, next) => {
  const doc = await Model.findOne({ slug: req.params.slug });

  if (!doc) {
    return next(new AppError('No document found with that slug', 404));
  }

  // Check if the request is from the allowed domain
  const referer = req.get('Referer') || req.get('Origin') || '';
  const allowedDomain = process.env.ALLOWED_DOMAIN || process.env.FRONTEND_URL;
  const isFromAllowedDomain =
    allowedDomain && referer.startsWith(allowedDomain);

  if (isFromAllowedDomain) {
    const clientIP = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';
    const sessionId = req.headers['x-session-id'] || '';

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Single atomic query: upsert a view record only if no recent view exists
    // This prevents race conditions from concurrent requests
    const result = await BlogView.findOneAndUpdate(
      {
        blog: doc._id,
        ip: clientIP,
        timestamp: { $gt: thirtyMinutesAgo }
      },
      {
        $setOnInsert: {
          blog: doc._id,
          ip: clientIP,
          userAgent,
          sessionId,
          timestamp: new Date()
        }
      },
      { upsert: true, new: true, rawResult: true }
    );

    // If a new record was created (not just found an existing one)
    if (result.lastErrorObject?.upserted) {
      // Check if this IP has ever viewed this blog before (excluding the one just created)
      const previousView = await BlogView.findOne({
        blog: doc._id,
        ip: clientIP,
        _id: { $ne: result.value._id }
      });

      if (!previousView) {
        doc.uniqueViews += 1;
        await Model.findByIdAndUpdate(doc._id, { $inc: { uniqueViews: 1 } });
      }
    }
  }

  res.status(200).json({
    status: 'success',
    data: doc
  });
});
