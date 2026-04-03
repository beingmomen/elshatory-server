const express = require('express');
const controller = require('../controllers/_contactController');
const authController = require('../controllers/authController');
const v = require('../middleware/validators');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    controller.getAll
  )
  .post(v.createContactRules, v.validate, controller.createOne);

router
  .route('/all')
  .get(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    controller.getAllNoPagination
  );

router
  .route('/delete-all')
  .delete(
    authController.protect,
    authController.restrictTo([ROLES.DEV]),
    controller.deleteAll
  );

router
  .route('/:id')
  .get(controller.getOne)
  .patch(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    v.updateContactRules,
    v.validate,
    controller.updateOne
  )
  .delete(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    controller.deleteOne
  );

module.exports = router;
