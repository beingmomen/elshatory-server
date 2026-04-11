const express = require('express');
const controller = require('../controllers/manualJobController');
const authController = require('../controllers/authController');
const v = require('../middleware/validators');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router
  .route('/import')
  .post(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    v.importJobRules,
    v.validate,
    controller.importJob
  );

module.exports = router;
