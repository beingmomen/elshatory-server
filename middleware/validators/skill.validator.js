const { body } = require('express-validator');

exports.createSkillRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required.')
    .isLength({ min: 2, max: 50 })
    .withMessage('Title must be between 2 and 50 characters.')
    .escape(),
  body('icon').trim().notEmpty().withMessage('Icon is required.')
];

exports.updateSkillRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Title must be between 2 and 50 characters.')
    .escape(),
  body('icon').optional().trim()
];
