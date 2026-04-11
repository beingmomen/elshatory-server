const ResumeDraft = require('../models/resumeDraftModel');
const factory = require('./handlerFactory');

exports.getAll = factory.getAll(ResumeDraft);
exports.getOne = factory.getOne(ResumeDraft);
