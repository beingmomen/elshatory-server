const { body } = require('express-validator');

exports.createFaqRules = [
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters.'),
  body('question')
    .trim()
    .notEmpty()
    .withMessage('Question is required.')
    .isLength({ min: 5, max: 500 })
    .withMessage('Question must be between 5 and 500 characters.'),
  body('answer')
    .trim()
    .notEmpty()
    .withMessage('Answer is required.')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Answer must be between 5 and 2000 characters.'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer.')
];

exports.updateFaqRules = [
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters.'),
  body('question')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Question must be between 5 and 500 characters.'),
  body('answer')
    .optional()
    .trim()
    .isLength({ min: 5, max: 2000 })
    .withMessage('Answer must be between 5 and 2000 characters.'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer.')
];
