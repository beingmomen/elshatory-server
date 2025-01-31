const mongoose = require('mongoose');
const Model = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const ImageHandler = require('../utils/images/ImageHandler');

const imageFields = [
  {
    name: 'photo',
    maxCount: 1,
    resize: { width: 500, height: 500, quality: 85 }
  }
];

const imageHandler = new ImageHandler(Model, imageFields, 'users');

exports.uploadImages = imageHandler.uploadImages();
exports.processImages = imageHandler.processImages();

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    'name',
    'email',
    'country',
    'phone',
    'slug'
  );

  // 3) Add processed image if any
  if (req.processedImages && req.processedImages.photo) {
    filteredBody.photo = req.body.photo;
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 4) Get old user document for image cleanup
    const oldUser = await Model.findById(req.user.id).session(session);

    // 5) Update user document
    const updatedUser = await Model.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
        session
      }
    );

    // 6) Save new images and cleanup old ones if needed
    if (req.processedImages) {
      await imageHandler._saveImages(req.processedImages);
      await imageHandler._removeOldImages(oldUser, updatedUser);
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'success',
      message: 'Updated successfully!',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await Model.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createOne = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead'
  });
};

exports.createAdmin = catchAsync(async (req, res, next) => {
  const body = req.body;
  const newAdmin = await Model.create({
    name: body.name,
    email: body.email,
    phone: body.phone,
    password: body.password,
    passwordConfirm: body.passwordConfirm,
    role: 'admin'
  });

  res.status(201).json({
    status: 'success',
    message: 'Created successfully',
    data: {
      data: newAdmin
    }
  });
});

exports.getAllUsersNoPagination = factory.getAllNoPagination(Model);
exports.getAllAdminsNoPagination = factory.getAllNoPagination(Model, {
  optFilter: { role: 'admin' }
});

exports.getOne = factory.getOne(Model);
exports.getAll = factory.getAll(Model);
exports.getAllUsers = factory.getAll(Model, { optFilter: { role: 'user' } });
exports.getAllAdmins = factory.getAll(Model, { optFilter: { role: 'admin' } });

// Do NOT update passwords with this!
exports.updateOne = imageHandler.updateOne();
exports.deleteOne = imageHandler.deleteOne();
