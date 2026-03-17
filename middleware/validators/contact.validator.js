const { body } = require('express-validator');

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
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email.')
    .normalizeEmail()
];

exports.updateContactRules = [
  body().custom((_, { req }) => {
    const allowedFields = ['isViewed'];
    const extraFields = Object.keys(req.body).filter(
      key => !allowedFields.includes(key)
    );
    if (extraFields.length > 0) {
      throw new Error(
        `Only isViewed can be updated. Invalid fields: ${extraFields.join(', ')}`
      );
    }
    return true;
  }),
  body('isViewed')
    .optional()
    .isBoolean()
    .withMessage('isViewed must be a boolean value.')
];
