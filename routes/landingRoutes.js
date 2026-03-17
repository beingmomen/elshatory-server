const express = require('express');
const rateLimit = require('express-rate-limit');
const { getLandingData } = require('../controllers/landingController');

const router = express.Router();

const landingLimiter = rateLimit({
  max: 60,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many requests, please try again later'
});

router.route('/').get(landingLimiter, getLandingData);

module.exports = router;
