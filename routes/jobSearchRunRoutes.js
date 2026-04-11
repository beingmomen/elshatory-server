const express = require('express');
const controller = require('../controllers/jobSearchRunController');
const authController = require('../controllers/authController');
const v = require('../middleware/validators');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router
  .route('/')
  .get(authController.protect, controller.getAll)
  .post(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    v.createJobSearchRunRules,
    v.validate,
    controller.createOne
  );

router.route('/:id').get(authController.protect, controller.getOne);

module.exports = router;
