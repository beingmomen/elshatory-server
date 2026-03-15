const mongoose = require('mongoose');
const Model = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const { ROLES } = require('../utils/constants');

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

exports.getMyProfile = catchAsync(async (req, res, next) => {
  const user = await Model.findById(req.user.id);

  if (!user) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json(user);
});

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
  // Reject email change attempts
  if (req.body.email) {
    return next(new AppError('Email cannot be changed.', 400));
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'phone', 'slug', 'photo');

  // Start a session for transaction
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

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

    // Commit the transaction
    await session.commitTransaction();

    res.status(200).json({
      status: 'success',
      message: 'Updated successfully!',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await Model.findByIdAndUpdate(req.user.id, { active: false });

  res.status(200).json({
    status: 'success',
    message: 'Deleted successfully!',
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
  const { body } = req;
  const newAdmin = await Model.create({
    name: body.name,
    email: body.email,
    phone: body.phone,
    password: body.password,
    passwordConfirm: body.passwordConfirm,
    role: ROLES.ADMIN
  });

  res.status(201).json({
    status: 'success',
    message: 'Created successfully',
    data: {
      data: newAdmin
    }
  });
});

exports.getAllUsersNoPagination = factory.getAllNoPagination(Model, {
  optFilter: { role: { $ne: ROLES.DEV } }
});
exports.getAllAdminsNoPagination = factory.getAllNoPagination(Model, {
  optFilter: { role: ROLES.ADMIN }
});

exports.getOne = factory.getOne(Model);

// Prevent admin from viewing dev accounts
exports.adminGetOne = catchAsync(async (req, res, next) => {
  const user = await Model.findById(req.params.id);

  if (!user) {
    return next(new AppError('No document found with that ID', 404));
  }

  if (user.role === ROLES.DEV && req.user.role !== ROLES.DEV) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { data: user }
  });
});
exports.getAll = factory.getAll(Model);
exports.getAllUsers = factory.getAll(Model, {
  optFilter: { role: ROLES.USER }
});
exports.getAllAdmins = factory.getAll(Model, {
  optFilter: { role: ROLES.ADMIN }
});

// Admin update with field whitelist to prevent mass assignment
exports.adminUpdateOne = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates.', 400));
  }

  // Prevent admin from modifying dev accounts
  const targetUser = await Model.findById(req.params.id);
  if (!targetUser) {
    return next(new AppError('No document found with that ID', 404));
  }
  if (targetUser.role === ROLES.DEV && req.user.role !== ROLES.DEV) {
    return next(new AppError('You cannot modify a dev account.', 403));
  }

  const filteredBody = filterObj(
    req.body,
    'name',
    'email',
    'phone',
    'active',
    'photo'
  );

  const updatedUser = await Model.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Updated successfully',
    data: { data: updatedUser }
  });
});

// Admin delete with dev account protection
exports.adminDeleteOne = catchAsync(async (req, res, next) => {
  const targetUser = await Model.findById(req.params.id);
  if (!targetUser) {
    return next(new AppError('No document found with that ID', 404));
  }
  if (targetUser.role === ROLES.DEV && req.user.role !== ROLES.DEV) {
    return next(new AppError('You cannot delete a dev account.', 403));
  }

  await Model.findByIdAndDelete(req.params.id);

  req.deletedRecord = targetUser;
  next();
});
