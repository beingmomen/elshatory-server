const express = require('express');
const controller = require('../controllers/_testimonialController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(controller.getAll)
  .post(
    authController.protect,
    authController.restrictTo(['admin', 'dev']),
    controller.uploadImages,
    controller.processImages,
    controller.createOne
  );

router
  .route('/:id')
  .get(controller.getOne)
  .patch(
    authController.protect,
    authController.restrictTo(['admin', 'dev']),
    controller.uploadImages,
    controller.processImages,
    controller.updateOne
  )
  .delete(
    authController.protect,
    authController.restrictTo(['admin', 'dev']),
    controller.deleteOne
  );

module.exports = router;
