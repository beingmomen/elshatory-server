const Model = require('../models/blogModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.createOne = factory.createOne(Model);
// exports.createOne = catchAsync(async (req, res, next) => {
//   const doc = await Model.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       data: doc
//     }
//   });
// });

exports.updateOne = factory.updateOne(Model);
exports.deleteOne = factory.deleteOne(Model);

exports.getAllNoPagination = factory.getAllNoPagination(Model);

exports.getAll = factory.getAll(Model);

exports.getOne = factory.getOne(Model);

// Custom getOneBySlug implementation to track views with anti-fraud measures
exports.getOneBySlug = catchAsync(async (req, res, next) => {
  const clientIP =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
  const userAgent = req.get('User-Agent') || '';
  const sessionId = req.sessionID || req.headers['x-session-id'];

  // Find the document by slug and include viewHistory
  let doc = await Model.findOne({ slug: req.params.slug }).select(
    '+viewHistory'
  );

  if (!doc) {
    return next(new AppError('No document found with that slug', 404));
  }

  // Check if the request is coming from the allowed domain
  const referer = req.get('Referer') || req.get('Origin') || '';
  const allowedDomain = process.env.ALLOWED_DOMAIN || 'https://beingmomen.com';
  const isFromAllowedDomain = referer.startsWith(allowedDomain);

  // Only count views if coming from the allowed domain
  if (isFromAllowedDomain) {
    // Ensure viewHistory is an array
    if (!Array.isArray(doc.viewHistory)) {
      doc.viewHistory = [];
    }

    // Check if this IP has viewed this article recently (within last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentView = doc.viewHistory.find(
      view => view.ip === clientIP && view.timestamp > thirtyMinutesAgo
    );
    let shouldIncrementViews = false;
    let shouldIncrementUniqueViews = false;

    if (!recentView) {
      // This is a valid new view
      shouldIncrementViews = true;

      // Check if this IP has ever viewed this article before
      const existingView = doc.viewHistory.find(view => view.ip === clientIP);
      if (!existingView) {
        shouldIncrementUniqueViews = true;
      }

      // Add view to history
      const viewRecord = {
        ip: clientIP,
        userAgent: userAgent,
        timestamp: new Date(),
        sessionId: sessionId
      };

      // Update the document with new view
      const updateQuery = {
        $push: { viewHistory: viewRecord }
      };

      if (shouldIncrementViews) {
        updateQuery.$inc = { views: 1 };
      }

      if (shouldIncrementUniqueViews) {
        updateQuery.$inc = { ...updateQuery.$inc, uniqueViews: 1 };
      }

      doc = await Model.findOneAndUpdate(
        { slug: req.params.slug },
        updateQuery,
        {
          new: true,
          runValidators: true
        }
      ).select('+viewHistory');
    }
  }

  console.log('12');
  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  });
});

exports.deleteAll = factory.deleteAll(Model);
