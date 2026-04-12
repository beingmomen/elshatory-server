const express = require('express');
const controller = require('../controllers/resumeDraftController');
const authController = require('../controllers/authController');

const router = express.Router();

const scopeToUser = (req, res, next) => {
  req.mergeFilter = { user: req.user.id };
  next();
};

router.route('/').get(authController.protect, scopeToUser, controller.getAll);

router.route('/:id').get(authController.protect, controller.getOne);

module.exports = router;
