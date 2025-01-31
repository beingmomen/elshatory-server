const Model = require('../models/projectModel');
const factory = require('./handlerFactory');

exports.createOne = factory.createOne(Model);
exports.updateOne = factory.updateOne(Model);
exports.deleteOne = factory.deleteOne(Model);

exports.getAllNoPagination = factory.getAllNoPagination(Model);

exports.getAll = factory.getAll(Model, {
  popOptions: ['tags']
});
exports.getOne = factory.getOne(Model);

exports.deleteAll = factory.deleteAll(Model);
