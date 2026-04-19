const express = require('express');
const controller = require('../controllers/careerProfileController');

const router = express.Router();

router.route('/').get(controller.getProfile);
router.route('/settings').patch(controller.updateSettings);

module.exports = router;
