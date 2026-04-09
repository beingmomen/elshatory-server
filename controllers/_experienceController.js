const Model = require('../models/experienceModel');
const factory = require('./handlerFactory');

exports.getAll = factory.getAll(Model, { optSort: { sort: 'order' } });
exports.getAllNoPagination = factory.getAllNoPagination(Model, {
  selectFields:
    'company position employmentType workPlace startDate endDate responsibilities linkedInUrl companySiteUrl iconName imageAlt order'
});
exports.getOne = factory.getOne(Model);
exports.createOne = factory.createOne(Model);
exports.updateOne = factory.updateOne(Model);
exports.deleteOne = factory.deleteOne(Model);
exports.deleteAll = factory.deleteAll(Model);
