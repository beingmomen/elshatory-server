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
  controller.processImages,
  controller.updateMe
);
router.delete('/deleteMe', controller.deleteMe);

router.use(authController.restrictTo(['admin', 'dev']));

router
  .route('/')
  .get(controller.getAllUsers)
  .post(controller.createOne);

router.route('/admins').get(controller.getAllAdmins);
router.route('/all/admins').get(controller.getAllAdminsNoPagination);
router.route('/all').get(controller.getAllUsersNoPagination);

router.route('/admin').post(controller.createAdmin);

router
  .route('/:id')
  .get(controller.getOne)
  .patch(controller.updateOne)
  .delete(controller.deleteOne);

module.exports = router;
