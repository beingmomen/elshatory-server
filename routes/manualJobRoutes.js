const express = require('express');
const controller = require('../controllers/manualJobController');

const router = express.Router();

router.route('/import').post(controller.importJob);

module.exports = router;
