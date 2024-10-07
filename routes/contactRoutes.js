const express = require('express');
const controller = require('../controllers/_contactController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(controller.getAll)
  .post(controller.createOne, controller.sendMail);

// router
//   .route('/:id')
//   .get(controller.getOne)
//   .patch(
//     authController.protect,
//     authController.restrictTo(['admin', 'dev']),
//     controller.uploadImages,
//     controller.processImages,
//     controller.updateOne
//   )
//   .delete(
//     authController.protect,
//     authController.restrictTo(['admin', 'dev']),
//     controller.deleteOne
//   );

module.exports = router;
