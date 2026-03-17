const { body, validationResult } = require('express-validator');

// ─── Parse bracket-notation form fields (e.g. resources[0].url) ──────────────

exports.parseFormFields = (req, res, next) => {
  const flat = {};
  Object.keys(req.body).forEach(key => {
    const keys = key.match(/[^[\].]+/g);
    if (!keys) return;
    let current = flat;
    keys.forEach((k, i) => {
      if (i === keys.length - 1) {
        current[k] = req.body[key];
      } else {
        const nextKey = keys[i + 1];
        const isArray = /^\d+$/.test(nextKey);
        if (!current[k]) current[k] = isArray ? [] : {};
        current = current[k];
      }
    });
  });
  req.body = flat;
  next();
};

// ─── Response helper ──────────────────────────────────────────────────────────

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorsArr = {};
    errors.array().forEach(err => {
      if (!errorsArr[err.path]) errorsArr[err.path] = [err.msg];
    });
    return res.status(400).json({ status: 'fail', errors: errorsArr });
  }
  next();
};

// ─── Reusable field rules ─────────────────────────────────────────────────────

const nameRule = body('name')
  .trim()
  .notEmpty()
  .withMessage('Name is required.')
  .isLength({ min: 3, max: 50 })
  .withMessage('Name must be between 3 and 50 characters.')
  .escape();

const emailRule = body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required.')
  .isEmail()
  .withMessage('Please provide a valid email.')
  .normalizeEmail();

const phoneRule = body('phone')
  .trim()
  .notEmpty()
  .withMessage('Phone number is required.')
  .matches(/^\+?[\d\s\-().]{7,20}$/)
  .withMessage('Please provide a valid phone number.');

const passwordRule = body('password')
  .notEmpty()
  .withMessage('Password is required.')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters.');

const passwordConfirmRule = body('passwordConfirm')
  .notEmpty()
  .withMessage('Password confirmation is required.')
  .custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password and Confirm Password do not match.');
    }
    return true;
  });

// ─── Route-specific validation chains ────────────────────────────────────────

exports.signupRules = [
  nameRule,
  emailRule,
  phoneRule,
  passwordRule,
  passwordConfirmRule
];

exports.loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email.')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
];

exports.forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email.')
    .normalizeEmail()
];

exports.resetPasswordRules = [passwordRule, passwordConfirmRule];

exports.updatePasswordRules = [
  body('passwordCurrent')
    .notEmpty()
    .withMessage('Current password is required.'),
  passwordRule,
  passwordConfirmRule
];

exports.updateMeRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Name must be between 3 and 50 characters.')
    .escape(),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-().]{7,20}$/)
    .withMessage('Please provide a valid phone number.')
];

exports.createAdminRules = [
  nameRule,
  emailRule,
  phoneRule,
  passwordRule,
  passwordConfirmRule
];

// ─── Project rules ───────────────────────────────────────────────────────────

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

// ─── Blog rules ──────────────────────────────────────────────────────────────

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

// ─── Service rules ───────────────────────────────────────────────────────────

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

// ─── Skill rules ─────────────────────────────────────────────────────────────

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

// ─── Client rules ────────────────────────────────────────────────────────────

exports.createClientRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.')
    .escape()
];

exports.updateClientRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.')
    .escape()
];

// ─── Contact rules ───────────────────────────────────────────────────────────

exports.createContactRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required.')
    .matches(/^\+?[\d\s\-().]{7,20}$/)
    .withMessage('Please provide a valid phone number.'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters.'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email.')
    .normalizeEmail()
];

exports.updateContactRules = [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters.')
];

// ─── Testimonial rules ──────────────────────────────────────────────────────

exports.createTestimonialRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email.')
    .normalizeEmail(),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters.')
];

exports.updateTestimonialRules = [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters.'),
  body('isConfirmed')
    .optional()
    .isBoolean()
    .withMessage('isConfirmed must be a boolean value.')
];

// ─── Resource rules ──────────────────────────────────────────────────────────

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

// ─── Info rules ──────────────────────────────────────────────────────────────

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
