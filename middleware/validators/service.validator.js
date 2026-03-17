const { body } = require('express-validator');

exports.createServiceRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters.')
    .escape(),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters.'),
  body('altText')
    .trim()
    .notEmpty()
    .withMessage('Alt text is required.')
    .isLength({ min: 2, max: 200 })
    .withMessage('Alt text must be between 2 and 200 characters.')
    .escape()
];

exports.updateServiceRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters.')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters.'),
  body('altText')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Alt text must be between 2 and 200 characters.')
    .escape()
];
