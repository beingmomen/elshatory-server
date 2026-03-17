const Model = require('../models/contactModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const { getMailForService } = require('../utils/sendMail');
const logger = require('../utils/logger');

exports.createOne = catchAsync(async (req, res, next) => {
  const doc = await Model.create({ ...req.body });

  res.status(201).json({
    status: 'success',
    message: 'Created successfully',
    data: {
      data: doc
    }
  });

  // Fire-and-forget email
  getMailForService({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    description: req.body.description,
    from: req.body.email,
    to: process.env.MANAGER || 'abdelmomenelshatory@gmail.com'
  }).catch(err => logger.error('Contact email failed', err));
});
exports.getAllNoPagination = factory.getAllNoPagination(Model);
exports.getAll = factory.getAll(Model);
exports.getOne = factory.getOne(Model);
exports.updateOne = factory.updateOne(Model);
exports.deleteOne = factory.deleteOne(Model);
exports.deleteAll = factory.deleteAll(Model);
