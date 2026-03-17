const Model = require('../models/testimonialModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const { getMailForTestimonial } = require('../utils/sendMail');
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
  getMailForTestimonial({
    name: req.body.name,
    email: req.body.email,
    description: req.body.description,
    from: req.body.email,
    to: process.env.MANAGER || 'abdelmomenelshatory@gmail.com'
  }).catch(err => logger.error('Testimonial email failed', err));
});

exports.getAllConfirmed = catchAsync(async (req, res, next) => {
  const doc = await Model.find({ isConfirmed: true });

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: doc
  });
});
exports.getAllNoPagination = factory.getAllNoPagination(Model);
exports.getAll = factory.getAll(Model);
exports.getOne = factory.getOne(Model);
exports.updateOne = factory.updateOne(Model);
exports.deleteOne = factory.deleteOne(Model, true);
exports.deleteAll = factory.deleteAll(Model);
