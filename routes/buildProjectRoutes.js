const express = require('express');
const controller = require('../controllers/_buildProjectController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo(['admin', 'dev']),
    controller.createOne
  );

module.exports = router;
