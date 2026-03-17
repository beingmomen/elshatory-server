const { body } = require('express-validator');

exports.createResourceRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters.')
    .escape(),
  body('url')
    .trim()
    .notEmpty()
    .withMessage('URL is required.')
    .isURL()
    .withMessage('Please provide a valid URL.')
];

exports.updateResourceRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters.')
    .escape(),
  body('url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL.')
];
