const Model = require('../models/contactModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const createImageHandlerFactory = require('../utils/createImageHandlerFactory');
const { getMailForService } = require('../utils/sendMail');

exports.createOne = catchAsync(async (req, res, next) => {
  const doc = await Model.create(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Created successfully',
    data: {
      data: doc
    }
  });

  next();
});

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

// exports.deleteOne = factory.deleteOne(
//   Model,
//   imageFields.map(field => field.name)
// );
