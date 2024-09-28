const Model = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const ImageMiddleware = require('../utils/imageMiddleware');
const imageMiddleware = new ImageMiddleware('users');
const fs = require('fs').promises;
const path = require('path');

const imageFields = [
  {
    name: 'photo',
    maxCount: 1,
    resize: { width: 500, height: 500, quality: 85 }
  }
];

exports.uploadImages = imageMiddleware.uploadImages(imageFields);
exports.resizeImages = imageMiddleware.resizeImages(
  Object.fromEntries(imageFields.map(field => [field.name, field.resize]))
);

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

const removeOldPhoto = async userId => {
  try {
    const user = await Model.findById(userId);
    if (user && user.photo) {
      const photoPath = path.join('images', 'users', user.photo);
      await fs.unlink(photoPath);
      console.log(`Removed old photo: ${user.photo}`);
    }
  } catch (err) {
    console.error('Error while trying to remove old photo:', err);
    // We don't throw here to allow the update to proceed even if photo removal fails
  }
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
    'photo',
    'slug'
  );
  if (req.file) filteredBody.photo = req.file.filename;

  if (filteredBody.photo) {
    await removeOldPhoto(req.user.id);
  }

  // 3) Update user document
  const updatedUser = await Model.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    message: 'Updated successfully!',
    data: {
      user: updatedUser
    }
  });
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

exports.getAllNoPagination = factory.getAllNoPagination(Model, []);

exports.getOne = factory.getOne(Model);
exports.getAll = factory.getAll(Model);

// Do NOT update passwords with this!
exports.updateOne = factory.updateOne(Model);

// exports.deleteOne = factory.deleteOne(Model);

// Custom deleteOne function
exports.deleteOne = catchAsync(async (req, res, next) => {
  const doc = await Model.findById(req.params.id);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  // Remove the old photo
  await removeOldPhoto(req.params.id);

  // Use the factory's deleteOne function
  await factory.deleteOne(Model)(req, res, next);
});
