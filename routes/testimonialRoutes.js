const express = require('express');
const controller = require('../controllers/_testimonialController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo(['admin', 'dev']),
    controller.getAll
  )
  .post(controller.createOne, controller.sendMail);

router.route('/confirmed').get(controller.getAllConfirmed);
// .post(controller.createOne);

router
  .route('/:id')
  .get(controller.getOne)
  .patch(
    authController.protect,
    authController.restrictTo(['admin', 'dev']),
    controller.updateOne
  )
  .delete(
    authController.protect,
    authController.restrictTo(['admin', 'dev']),
    controller.deleteOne
  );

module.exports = router;
