const Model = require('../models/faqModel');
const factory = require('./handlerFactory');

exports.getAll = factory.getAll(Model, { optSort: { sort: 'category,order' } });
exports.getAllNoPagination = factory.getAllNoPagination(Model, {
  selectFields: 'category question answer order'
});
exports.getOne = factory.getOne(Model);
exports.createOne = factory.createOne(Model);
exports.updateOne = factory.updateOne(Model);
exports.deleteOne = factory.deleteOne(Model);
exports.deleteAll = factory.deleteAll(Model);
