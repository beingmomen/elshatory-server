const Model = require('../models/testimonialModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const { getMailForTestimonial } = require('./../utils/sendMail');

exports.createOne = factory.createOne(Model);

exports.getAll = factory.getAll(Model);

exports.getAllConfirmed = catchAsync(async (req, res, next) => {
  const doc = await Model.find({ isConfirmed: true });

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: doc
  });
});

exports.sendMail = catchAsync(async (req, res, next) => {
  console.log('req.body :>> ', req.body);

  const obj = {
    name: req.body.name,
    email: req.body.email,
    description: req.body.description,
    from: req.body.email,
    to: 'abdelmomenelshatory@gmail.com',
    next: next
  };

  await getMailForTestimonial(obj);
});

exports.getOne = factory.getOne(Model);

exports.updateOne = factory.updateOne(Model);

exports.deleteOne = factory.deleteOne(Model);
