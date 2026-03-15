const express = require('express');
const rateLimit = require('express-rate-limit');

const controller = require('../controllers/_userController');
const imageService = require('../imageServices/user.image');
const authController = require('../controllers/authController');
const v = require('../middleware/validateMiddleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();

const methodNotAllowed = allowedMethods => (req, res) => {
  res.status(405).json({
    status: 'fail',
    statusCode: 405,
    errors: {
      error: [
        `Method ${req.method} not allowed. Use ${allowedMethods.join(' or ')}.`
      ]
    }
  });
};

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many attempts, please try again after 15 minutes',
  validate: { trustProxy: false }
});

router.post('/signup', v.signupRules, v.validate, authController.signup);
router.all('/signup', methodNotAllowed(['POST']));
router.post(
  '/login',
  authLimiter,
  v.loginRules,
  v.validate,
  authController.login
);
router.all('/login', methodNotAllowed(['POST']));
router.post('/logout', authController.logout);
router.all('/logout', methodNotAllowed(['POST']));
router.post(
  '/forgotPassword',
  authLimiter,
  v.forgotPasswordRules,
  v.validate,
  authController.forgotPassword
);
router.all('/forgotPassword', methodNotAllowed(['POST']));
router.get(
  '/resetPassword/:token/validate',
  authLimiter,
  authController.validateResetToken
);
router.all('/resetPassword/:token/validate', methodNotAllowed(['GET']));
router
  .route('/resetPassword/:token')
  .patch(v.resetPasswordRules, v.validate, authController.resetPassword)
  .post(v.resetPasswordRules, v.validate, authController.resetPassword);
router.all('/resetPassword/:token', methodNotAllowed(['PATCH', 'POST']));

// Protect all routes after this middleware
router.use(authController.protect);

router.patch(
  '/updateMyPassword',
  v.updatePasswordRules,
  v.validate,
  authController.updatePassword
);
router.get('/me', controller.getMyProfile);
router.patch(
  '/updateMe',
  imageService.handleImages,
  imageService.updateImages,
  v.updateMeRules,
  v.validate,
  controller.updateMe
);
router.delete('/deleteMe', controller.deleteMe);

router.use(authController.restrictTo([ROLES.ADMIN, ROLES.DEV]));

router.route('/').get(controller.getAllUsers).post(controller.createOne);

router.route('/admins').get(controller.getAllAdmins);
router.route('/all/admins').get(controller.getAllAdminsNoPagination);
router.route('/all').get(controller.getAllUsersNoPagination);

router
  .route('/admin')
  .post(
    authController.restrictTo([ROLES.DEV]),
    v.createAdminRules,
    v.validate,
    controller.createAdmin
  );

router
  .route('/:id')
  .get(controller.adminGetOne)
  .patch(
    imageService.handleImages,
    imageService.updateImages,
    controller.adminUpdateOne
  )
  .delete(controller.adminDeleteOne, imageService.deleteImages);

module.exports = router;
