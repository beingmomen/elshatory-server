const express = require('express');
const controller = require('../controllers/jobSourceController');

const router = express.Router();

router.route('/').get(controller.getAll);
router.route('/wuzzuf/health').get(controller.getWuzzufHealth);
router.route('/linkedin/health').get(controller.getLinkedinHealth);

module.exports = router;
