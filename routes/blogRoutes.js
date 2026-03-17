const express = require('express');
const controller = require('../controllers/_blogController');
const imageService = require('../imageServices/blog.image');
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
    imageService.handleImages,
    v.parseFormFields,
    v.createBlogRules,
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

router.route('/slug/:slug').get(controller.getOneBySlug);

router
  .route('/:id')
  .get(controller.getOne)
  .patch(
    authController.protect,
    authController.restrictTo([ROLES.ADMIN, ROLES.DEV]),
    imageService.handleImages,
    imageService.updateImages,
    v.parseFormFields,
    v.updateBlogRules,
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
