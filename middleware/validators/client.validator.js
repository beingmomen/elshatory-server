const { body } = require('express-validator');

exports.createClientRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.')
    .escape(),
  body('altText')
    .trim()
    .notEmpty()
    .withMessage('Alt text is required.')
    .isLength({ min: 2, max: 200 })
    .withMessage('Alt text must be between 2 and 200 characters.'),
  body('website')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Website must be a valid URL.')
];

exports.updateClientRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.')
    .escape(),
  body('altText')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Alt text must be between 2 and 200 characters.'),
  body('website')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Website must be a valid URL.')
];
