const express = require('express');
const controller = require('../controllers/_infoController');
const infoImage = require('../imageServices/info.image');
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
    infoImage.handleImages,
    v.parseFormFields,
    v.createInfoRules,
    v.validate,
    controller.createOne
  )
  .patch(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    infoImage.handleImages,
    v.parseFormFields,
    v.updateInfoRules,
    v.validate,
    controller.updateOne
  );

module.exports = router;
