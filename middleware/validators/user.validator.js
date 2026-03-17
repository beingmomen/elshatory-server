const { body } = require('express-validator');
const {
  nameRule,
  emailRule,
  phoneRule,
  passwordRule,
  passwordConfirmRule
} = require('./common');

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
