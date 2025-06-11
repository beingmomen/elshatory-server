const express = require('express');
const {
  cleanupOldViews,
  resetAllViews,
  getViewStats
} = require('../utils/viewsCleanup');
const authController = require('../controllers/authController');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

// Protect all routes - only authenticated users can access
router.use(authController.protect);

// Restrict to admin and dev only
router.use(authController.restrictTo(['admin', 'dev']));

// GET /api/v1/views/stats/:blogId - Get view statistics for a specific blog
router.get(
  '/stats/:blogId',
  catchAsync(async (req, res, next) => {
    const stats = await getViewStats(req.params.blogId);

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  })
);

// POST /api/v1/views/cleanup - Clean up old view records
router.post(
  '/cleanup',
  catchAsync(async (req, res, next) => {
    const result = await cleanupOldViews();

    res.status(200).json({
      status: 'success',
      message: 'Old view records cleaned up successfully',
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  })
);

// POST /api/v1/views/reset - Reset all views (for development)
router.post(
  '/reset',
  catchAsync(async (req, res, next) => {
    const result = await resetAllViews();

    res.status(200).json({
      status: 'success',
      message: 'All views reset successfully',
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  })
);

module.exports = router;
