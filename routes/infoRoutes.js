const express = require('express');
const controller = require('../controllers/_infoController');
const authController = require('../controllers/authController');
const v = require('../middleware/validators');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router
  .route('/')
  .get(controller.getAll)
  .post(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    v.createInfoRules,
    v.validate,
    controller.createOne
  )
  .patch(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    v.updateInfoRules,
    v.validate,
    controller.updateOne
  );

module.exports = router;
