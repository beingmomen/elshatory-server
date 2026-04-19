const express = require('express');
const controller = require('../controllers/jobSearchRunController');

const router = express.Router();

router.route('/').get(controller.getAll).post(controller.create);
router.route('/:id').get(controller.getOne);

module.exports = router;
