const { body } = require('express-validator');

exports.createExperienceRules = [
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters.'),
  body('position')
    .trim()
    .notEmpty()
    .withMessage('Position is required.')
    .isLength({ min: 2, max: 200 })
    .withMessage('Position must be between 2 and 200 characters.'),
  body('employmentType')
    .trim()
    .notEmpty()
    .withMessage('Employment type is required.'),
  body('workPlace').trim().notEmpty().withMessage('Work place is required.'),
  body('startDate').trim().notEmpty().withMessage('Start date is required.'),
  body('endDate').trim().notEmpty().withMessage('End date is required.'),
  body('responsibilities')
    .isArray({ min: 1 })
    .withMessage('At least 1 responsibility is required.'),
  body('responsibilities.*')
    .trim()
    .notEmpty()
    .withMessage('Responsibility must not be empty.'),
  body('linkedInUrl')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('LinkedIn URL must be a valid URL.'),
  body('companySiteUrl')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Company site URL must be a valid URL.'),
  body('iconName').optional().trim(),
  body('imageAlt').optional().trim(),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer.')
];

exports.updateExperienceRules = [
  body('company')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters.'),
  body('position')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Position must be between 2 and 200 characters.'),
  body('employmentType').optional().trim(),
  body('workPlace').optional().trim(),
  body('startDate').optional().trim(),
  body('endDate').optional().trim(),
  body('responsibilities')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least 1 responsibility is required.'),
  body('responsibilities.*')
    .trim()
    .notEmpty()
    .withMessage('Responsibility must not be empty.'),
  body('linkedInUrl')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('LinkedIn URL must be a valid URL.'),
  body('companySiteUrl')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Company site URL must be a valid URL.'),
  body('iconName').optional().trim(),
  body('imageAlt').optional().trim(),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer.')
];
