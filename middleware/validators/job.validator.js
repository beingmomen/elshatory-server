const { body } = require('express-validator');

exports.createJobSearchRunRules = [
  body('source')
    .notEmpty()
    .withMessage('Source is required.')
    .isIn(['wuzzuf', 'linkedin', 'all'])
    .withMessage('Source must be one of: wuzzuf, linkedin, all.'),
  body('query').optional().isObject().withMessage('Query must be an object.')
];

exports.updateJobRules = [
  body('status')
    .optional()
    .isIn(['new', 'shortlisted', 'ignored', 'cv_ready', 'applied'])
    .withMessage(
      'Status must be one of: new, shortlisted, ignored, cv_ready, applied.'
    ),
  body('tags').optional().isArray().withMessage('Tags must be an array.')
];

exports.importJobRules = [
  body('source')
    .optional()
    .isIn(['linkedin', 'manual'])
    .withMessage('Source must be one of: linkedin, manual.'),
  body('jobUrl').optional().isURL().withMessage('Job URL must be a valid URL.'),
  body('rawText')
    .optional()
    .isString()
    .withMessage('Raw text must be a string.')
];

exports.updateCareerProfileSettingsRules = [
  body('targetRoles')
    .optional()
    .isArray()
    .withMessage('Target roles must be an array.'),
  body('targetSeniority')
    .optional()
    .isArray()
    .withMessage('Target seniority must be an array.'),
  body('defaultStacks')
    .optional()
    .isArray()
    .withMessage('Default stacks must be an array.'),
  body('optionalStacks')
    .optional()
    .isArray()
    .withMessage('Optional stacks must be an array.'),
  body('locationPreferences')
    .optional()
    .isArray()
    .withMessage('Location preferences must be an array.'),
  body('workplacePreferences')
    .optional()
    .isArray()
    .withMessage('Workplace preferences must be an array.'),
  body('requiredKeywords')
    .optional()
    .isArray()
    .withMessage('Required keywords must be an array.'),
  body('excludedKeywords')
    .optional()
    .isArray()
    .withMessage('Excluded keywords must be an array.'),
  body('maxJobAgeDays')
    .optional()
    .isNumeric()
    .withMessage('Max job age days must be a number.')
];
