const { body } = require('express-validator');

exports.createSkillRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required.')
    .isLength({ min: 2, max: 50 })
    .withMessage('Title must be between 2 and 50 characters.')
    .escape(),
  body('icon')
    .trim()
    .notEmpty()
    .withMessage('Icon is required.')
    .matches(/^i(-[a-z0-9]+)+$/)
    .withMessage(
      'Icon must follow the format "i-logos-firebase" (start with "i-" followed by lowercase words separated by hyphens)'
    )
];

exports.updateSkillRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required.')
    .isLength({ min: 2, max: 50 })
    .withMessage('Title must be between 2 and 50 characters.')
    .escape(),
  body('icon')
    .trim()
    .notEmpty()
    .withMessage('Icon is required.')
    .matches(/^i(-[a-z0-9]+)+$/)
    .withMessage(
      'Icon must follow the format "i-logos-firebase" (start with "i-" followed by lowercase words separated by hyphens)'
    )
];
