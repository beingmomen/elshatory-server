const express = require('express');
const controller = require('../controllers/jobSourceController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').get(authController.protect, controller.getAll);

router
  .route('/:key/health')
  .get(authController.protect, controller.getHealth);

module.exports = router;
