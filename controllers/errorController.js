const sendErrorDev = (err, res) => {
  console.warn('Error:', err.message);
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
      errorsArr.error = [`Invalid ${err.path}: "${err.value}". Please provide a valid ID`];
    } else {
      errorsArr.error = [`Invalid ${err.path}: "${err.value}". Please provide a valid value`];
    }
  } else if (err.message && err.message.includes('Cannot read properties of undefined')) {
    // Handle undefined property errors
    const propertyMatch = err.message.match(/Cannot read properties of undefined \(reading '(.+)'\)/);
    if (propertyMatch && propertyMatch[1] === 'jwt') {
      errorsArr.error = ['Authentication configuration error. Please contact the administrator.'];
      err.statusCode = 500;
    } else if (propertyMatch) {
      errorsArr.error = [`Invalid request: Missing required ${propertyMatch[1]} property`];
      err.statusCode = 400;
    } else {
      errorsArr.error = ['Invalid request: Missing required properties'];
      err.statusCode = 400;
    }
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
      for (const [key, value] of Object.entries(err.errors)) {
        errorsArr[key] = [value.message];
      }
    } catch (e) {
      errorsArr.error = ['Validation Error'];
    }
  } else if (err.isHandled && err.errmsg && err.keyValue) {
    // Handle duplicate key errors
    try {
      const key = err.errmsg.split(' { ')[1].split(':')[0];
      errorsArr[key] = [
        `The ${key} ((${
          err.keyValue[key]
        })) already exists. Please choose a different ${key}.`
      ];
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
  } else if (err.message && err.message.includes('Cannot read properties of undefined')) {
    // Handle undefined property errors in production
    const propertyMatch = err.message.match(/Cannot read properties of undefined \(reading '(.+)'\)/);
    if (propertyMatch && propertyMatch[1] === 'jwt') {
      res.status(500).json({
        status: 'error',
        message: 'Internal server error. Please try again later.'
      });
    } else {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid request format'
      });
    }
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR ', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err.code === 11000) {
    err.isHandled = true;
  }

  // Mark CastError as operational
  if (err.name === 'CastError') {
    err.isOperational = true;
    err.statusCode = 400;
    err.message = `Invalid ${err.path}: "${err.value}". Please provide a valid ${err.path === '_id' ? 'ID' : 'value'}`;
  }

  // Mark undefined property errors as operational
  if (err.message && err.message.includes('Cannot read properties of undefined')) {
    err.isOperational = true;
    const propertyMatch = err.message.match(/Cannot read properties of undefined \(reading '(.+)'\)/);
    if (propertyMatch && propertyMatch[1] === 'jwt') {
      err.statusCode = 500;
      err.message = 'Authentication configuration error';
    } else {
      err.statusCode = 400;
      err.message = `Missing required property: ${propertyMatch ? propertyMatch[1] : 'unknown'}`;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};
