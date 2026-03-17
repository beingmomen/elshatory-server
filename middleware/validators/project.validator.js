const { body } = require('express-validator');

exports.createProjectRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters.')
    .escape(),
  body('tag')
    .trim()
    .notEmpty()
    .withMessage('Tag is required.')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tag must be between 2 and 50 characters.')
    .escape(),
  body('url')
    .trim()
    .notEmpty()
    .withMessage('URL is required.')
    .isURL()
    .withMessage('Please provide a valid URL.'),
  body('altText')
    .trim()
    .notEmpty()
    .withMessage('Alt text is required.')
    .isLength({ min: 2, max: 200 })
    .withMessage('Alt text must be between 2 and 200 characters.')
    .escape()
];

exports.updateProjectRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters.')
    .escape(),
  body('tag')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tag must be between 2 and 50 characters.')
    .escape(),
  body('url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL.'),
  body('altText')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Alt text must be between 2 and 200 characters.')
    .escape()
];
