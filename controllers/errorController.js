const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

const IMAGES_BASE = path.resolve(__dirname, '..', 'public', 'images');

const safePath = (baseDir, imageName) => {
  const resolved = path.resolve(path.join(baseDir, imageName));
  if (
    !resolved.startsWith(IMAGES_BASE + path.sep) &&
    resolved !== IMAGES_BASE
  ) {
    return null;
  }
  return resolved;
};

const sendErrorDev = (err, res) => {
  const errorsArr = {};

  // Handle different types of errors
  if (err.isOperational) {
    errorsArr.error = [err.message];
  } else if (err.name === 'JsonWebTokenError') {
    errorsArr.error = ['Invalid Token, please login again!'];
  } else if (err.name === 'TokenExpiredError') {
    errorsArr.error = ['Your token has expired, please login again!'];
  } else if (err.name === 'CastError') {
    if (err.path === '_id') {
      errorsArr.error = [
        `Invalid ${err.path}: "${err.value}". Please provide a valid ID`
      ];
    } else {
      errorsArr.error = [
        `Invalid ${err.path}: "${err.value}". Please provide a valid value`
      ];
    }
  } else if (err instanceof TypeError && err.message.includes('jwt')) {
    errorsArr.error = [
      'Authentication configuration error. Please contact the administrator.'
    ];
    err.statusCode = 500;
  } else if (err.message && err.message.includes('role')) {
    errorsArr.error = ['You do not have permission to perform this action'];
  } else if (
    err.message &&
    err.message.includes('images') &&
    err.message.includes('The system cannot find the file specified')
  ) {
    errorsArr.error = ['The system cannot find the specified image file'];
  } else if (err.name === 'MulterError') {
    errorsArr.error = ['You cannot add more than 3 images'];
  } else if (err.code === 'EMESSAGE') {
    errorsArr.error = [
      'Mail cannot be sent. The from address does not match a verified Sender Identity'
    ];
  } else if (err.errors) {
    // Handle validation errors
    try {
      Object.entries(err.errors).forEach(([key, value]) => {
        errorsArr[key] = [value.message];
      });
    } catch (e) {
      errorsArr.error = ['Validation Error'];
    }
  } else if (err.isHandled && err.errmsg && err.keyValue) {
    // Handle duplicate key errors
    try {
      const key = err.errmsg.split(' { ')[1].split(':')[0];
      errorsArr[key] = [`( ${err.keyValue[key]} ) Already exists.`];
    } catch (e) {
      errorsArr.error = ['Duplicate Entry Error'];
    }
  } else {
    // Handle unknown errors
    errorsArr.error = ['Something went wrong'];
  }

  // Send error response
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    statusCode: err.statusCode || 500,
    errors: errorsArr
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else if (err.name === 'CastError') {
    // Handle CastError in production with a user-friendly message
    res.status(400).json({
      status: 'fail',
      message: 'Invalid ID format'
    });
  } else if (err instanceof TypeError && err.message.includes('jwt')) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error. Please try again later.'
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('Unhandled error', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

module.exports = async (err, req, res, next) => {
  if (req.filesToDelete && req.filesToDelete.images.length > 0) {
    const folderPath = path.join(__dirname, '..', 'public', 'images');

    const deletePromises = req.filesToDelete.images.map(async image => {
      const imagePath = safePath(folderPath, image);
      if (!imagePath) {
        logger.error(`Blocked path traversal attempt: ${image}`);
        return;
      }
      try {
        await fs.unlink(imagePath);
        logger.info(`Deleted file: ${imagePath}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          logger.error(`Failed to delete file ${imagePath}:`, error.message);
        }
      }
    });
    await Promise.all(deletePromises);
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err.code === 11000) {
    err.isHandled = true;
  }

  // Mark CastError as operational
  if (err.name === 'CastError') {
    err.isOperational = true;
    err.statusCode = 400;
    err.message = `Invalid ${err.path}: "${
      err.value
    }". Please provide a valid ${err.path === '_id' ? 'ID' : 'value'}`;
  }

  // Handle JWT-related TypeError specifically
  if (err instanceof TypeError && err.message.includes('jwt')) {
    err.isOperational = true;
    err.statusCode = 500;
    err.message = 'Authentication configuration error';
  }

  if (process.env.NODE_ENV === 'production') {
    sendErrorProd(err, res);
  } else {
    sendErrorDev(err, res);
  }
};
