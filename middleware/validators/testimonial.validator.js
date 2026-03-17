const { body } = require('express-validator');

exports.createTestimonialRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email.')
    .normalizeEmail(),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters.')
];

exports.updateTestimonialRules = [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters.'),
  body('isConfirmed')
    .optional()
    .isBoolean()
    .withMessage('isConfirmed must be a boolean value.')
];
