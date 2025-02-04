const express = require('express');
const { getLandingData } = require('../controllers/_landingController');

const router = express.Router();

router.route('/').get(getLandingData);

module.exports = router;
