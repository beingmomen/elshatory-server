const { body, validationResult } = require('express-validator');

// ─── Response helper ──────────────────────────────────────────────────────────

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorsArr = {};
    errors.array().forEach(err => {
      if (!errorsArr[err.path]) errorsArr[err.path] = [err.msg];
    });
    return res.status(400).json({ status: 'fail', errors: errorsArr });
  }
  next();
};

// ─── Reusable field rules ─────────────────────────────────────────────────────

const nameRule = body('name')
  .trim()
  .notEmpty()
  .withMessage('Name is required.')
  .isLength({ min: 3, max: 50 })
  .withMessage('Name must be between 3 and 50 characters.')
  .escape();

const emailRule = body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required.')
  .isEmail()
  .withMessage('Please provide a valid email.')
  .normalizeEmail();

const phoneRule = body('phone')
  .trim()
  .notEmpty()
  .withMessage('Phone number is required.')
  .matches(/^\+?[\d\s\-().]{7,20}$/)
  .withMessage('Please provide a valid phone number.');

const passwordRule = body('password')
  .notEmpty()
  .withMessage('Password is required.')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters.');

const passwordConfirmRule = body('passwordConfirm')
  .notEmpty()
  .withMessage('Password confirmation is required.')
  .custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password and Confirm Password do not match.');
    }
    return true;
  });

// ─── Route-specific validation chains ────────────────────────────────────────

exports.signupRules = [
  nameRule,
  emailRule,
  phoneRule,
  passwordRule,
  passwordConfirmRule
];

exports.loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email.')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
];

exports.forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email.')
    .normalizeEmail()
];

exports.resetPasswordRules = [passwordRule, passwordConfirmRule];

exports.updatePasswordRules = [
  body('passwordCurrent')
    .notEmpty()
    .withMessage('Current password is required.'),
  passwordRule,
  passwordConfirmRule
];

exports.updateMeRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Name must be between 3 and 50 characters.')
    .escape(),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-().]{7,20}$/)
    .withMessage('Please provide a valid phone number.')
];

exports.createAdminRules = [
  nameRule,
  emailRule,
  phoneRule,
  passwordRule,
  passwordConfirmRule
];
