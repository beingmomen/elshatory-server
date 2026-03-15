const express = require('express');
const {
  cleanupOldViews,
  resetAllViews,
  getViewStats
} = require('../utils/viewsCleanup');
const authController = require('../controllers/authController');
const catchAsync = require('../utils/catchAsync');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo([ROLES.ADMIN, ROLES.DEV]));

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

router.post(
  '/cleanup',
  catchAsync(async (req, res, next) => {
    const result = await cleanupOldViews();

    res.status(200).json({
      status: 'success',
      message: 'Old view records cleaned up successfully',
      data: {
        deletedCount: result.deletedCount
      }
    });
  })
);

router.post(
  '/reset',
  catchAsync(async (req, res, next) => {
    const result = await resetAllViews();

    res.status(200).json({
      status: 'success',
      message: 'All views reset successfully',
      data: {
        blogsModified: result.blogResult.modifiedCount,
        viewsDeleted: result.viewResult.deletedCount
      }
    });
  })
);

module.exports = router;
