const express = require('express');
const controller = require('../controllers/buildProjectController');
const authController = require('../controllers/authController');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    controller.createOne
  );

module.exports = router;
