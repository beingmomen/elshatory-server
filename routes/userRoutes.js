const express = require('express');

const controller = require('../controllers/_userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', controller.getMe, controller.getOne);
router.patch(
  '/updateMe',
  controller.uploadImages,
  controller.resizeImages,
  controller.updateMe
);
router.delete('/deleteMe', controller.deleteMe);

router.use(authController.restrictTo(['admin', 'dev']));

router
  .route('/')
  .get(controller.getAll)
  .post(controller.createOne);

router.route('/all').get(controller.getAllNoPagination);

router
  .route('/:id')
  .get(controller.getOne)
  .patch(controller.updateOne)
  .delete(controller.deleteOne);

module.exports = router;
