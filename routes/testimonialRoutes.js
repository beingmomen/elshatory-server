const express = require('express');
const controller = require('../controllers/_testimonialController');
const imageService = require('../imageServices/testimonial.image');
const authController = require('../controllers/authController');
const v = require('../middleware/validateMiddleware');
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
    imageService.updateImages,
    v.createTestimonialRules,
    v.validate,
    controller.createOne
  );

router.route('/confirmed').get(controller.getAllConfirmed);

router
  .route('/:id')
  .get(controller.getOne)
  .patch(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
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
