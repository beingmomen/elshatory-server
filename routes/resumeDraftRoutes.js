const express = require('express');
const controller = require('../controllers/resumeDraftController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').get(authController.protect, controller.getAll);

router.route('/:id').get(authController.protect, controller.getOne);

module.exports = router;
