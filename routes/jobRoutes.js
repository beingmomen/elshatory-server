const express = require('express');
const controller = require('../controllers/jobController');

const router = express.Router();

router.route('/').get(controller.getAll);

router
  .route('/:id')
  .get(controller.getOne)
  .patch(controller.updateOne);

router.route('/:id/analyze').post(controller.analyze);

router
  .route('/:id/resume-drafts')
  .get(controller.getDrafts)
  .post(controller.createDraft);

module.exports = router;
