const express = require('express');
const controller = require('../controllers/_serviceController');
const imageService = require('../imageServices/service.image');
const authController = require('../controllers/authController');
const v = require('../middleware/validateMiddleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router
  .route('/')
  .get(controller.getAll)
  .post(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    imageService.handleImages,
    v.createServiceRules,
    v.validate,
    controller.createOne
  );

router.route('/all').get(controller.getAllNoPagination);

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
    imageService.handleImages,
    imageService.updateImages,
    v.updateServiceRules,
    v.validate,
    controller.updateOne
  )
  .delete(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    controller.deleteOne,
    imageService.deleteImages
  );

module.exports = router;
