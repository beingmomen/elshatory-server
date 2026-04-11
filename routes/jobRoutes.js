const express = require('express');
const controller = require('../controllers/jobController');
const authController = require('../controllers/authController');
const v = require('../middleware/validators');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.route('/').get(authController.protect, controller.getAll);

router
  .route('/:id')
  .get(authController.protect, controller.getOne)
  .patch(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    v.updateJobRules,
    v.validate,
    controller.updateOne
  );

router
  .route('/:id/analyze')
  .post(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    controller.analyzeJob
  );

router
  .route('/:id/resume-drafts')
  .get(authController.protect, controller.getResumeDrafts)
  .post(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    controller.createResumeDraft
  );

module.exports = router;
