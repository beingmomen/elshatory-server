const { body } = require('express-validator');

exports.createBlogRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required.')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters.'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters.'),
  body('content').optional().trim(),
  body('tags').isArray({ min: 3 }).withMessage('At least 3 tags are required.'),
  body('tags.*')
    .trim()
    .notEmpty()
    .withMessage('Tag must not be empty.')
    .isLength({ min: 2, max: 50 })
    .withMessage('Each tag must be between 2 and 50 characters.'),
  body('keywords')
    .trim()
    .notEmpty()
    .withMessage('Keywords are required.')
    .isLength({ min: 2, max: 200 })
    .withMessage('Keywords must be between 2 and 200 characters.'),
  body('resources')
    .isArray({ min: 1 })
    .withMessage('At least 1 resource is required.'),
  body('resources.*.url')
    .trim()
    .notEmpty()
    .withMessage('Resource URL is required.')
    .isURL()
    .withMessage('Please provide a valid URL.'),
  body('resources.*.title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Resource title must be between 2 and 100 characters.')
];

exports.updateBlogRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters.'),
  body('content').optional().trim(),
  body('tags')
    .optional()
    .isArray({ min: 3 })
    .withMessage('At least 3 tags are required.'),
  body('tags.*')
    .trim()
    .notEmpty()
    .withMessage('Tag must not be empty.')
    .isLength({ min: 2, max: 50 })
    .withMessage('Each tag must be between 2 and 50 characters.'),
  body('keywords')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Keywords must be between 2 and 200 characters.'),
  body('resources')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least 1 resource is required.'),
  body('resources.*.url')
    .trim()
    .notEmpty()
    .withMessage('Resource URL is required.')
    .isURL()
    .withMessage('Please provide a valid URL.'),
  body('resources.*.title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Resource title must be between 2 and 100 characters.')
];
