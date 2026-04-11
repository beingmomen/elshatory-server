const express = require('express');
const controller = require('../controllers/careerProfileController');
const authController = require('../controllers/authController');
const v = require('../middleware/validators');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.route('/').get(authController.protect, controller.getProfile);

router
  .route('/settings')
  .patch(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    v.updateCareerProfileSettingsRules,
    v.validate,
    controller.updateSettings
  );

module.exports = router;
