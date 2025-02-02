const Model = require('../models/contactModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const { getMailForService } = require('../utils/sendMail');

exports.createOne = factory.createOne(Model);

exports.getAll = factory.getAll(Model);

exports.sendMail = catchAsync(async (req, res, next) => {
  console.log('req.body :>> ', req.body);

  const obj = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    description: req.body.description,
    from: req.body.email,
    to: 'abdelmomenelshatory@gmail.com',
    next: next
  };

  await getMailForService(obj);
});

exports.getOne = factory.getOne(Model);

exports.updateOne = factory.updateOne(Model);

exports.deleteOne = factory.deleteOne(Model);
