const express = require('express');
const controller = require('../controllers/_testimonialController');
const imageService = require('../imageServices/testimonial.image');
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
  .post(
    imageService.handleImages,
    v.createTestimonialRules,
    v.validate,
    controller.createOne
  );

router
  .route('/all')
  .get(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    controller.getAllNoPagination
  );

router.route('/confirmed').get(controller.getAllConfirmed);

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
    v.updateTestimonialRules,
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
