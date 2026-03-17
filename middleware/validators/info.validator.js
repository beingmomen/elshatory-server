const { body } = require('express-validator');

exports.createInfoRules = [
  body('resumeUrl')
    .trim()
    .notEmpty()
    .withMessage('Resume URL is required.')
    .isURL()
    .withMessage('Please provide a valid URL.')
];

exports.updateInfoRules = [
  body('resumeUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL.')
];
