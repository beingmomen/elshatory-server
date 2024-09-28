const sendErrorDev = (err, res) => {
  console.warn('print', err.message);
  const errorsArr = {};

  if (err.isOperational) {
    errorsArr.error = [err.message];
  } else if (err.name === 'JsonWebTokenError') {
    errorsArr.error = ['Invalid Token, please login again!'];
  } else if (err.name === 'TokenExpiredError') {
    errorsArr.error = ['Your token has expired, please login again!'];
  } else if (err.name === 'CastError') {
    errorsArr.error = ['Invalid Value'];
  } else if (err.message.includes('role')) {
    errorsArr.error = ['You do not have permission to perform this action'];
  } else if (
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
  } else {
    if (!err.isHandled) {
      for (const [key, value] of Object.entries(err.errors)) {
        errorsArr[key] = [value.message];
      }
    } else {
      const key = err.errmsg.split(' { ')[1].split(':')[0];
      errorsArr[key] = [
        `The ${key} ((${
          err.keyValue[key]
        })) already exists. Please choose a different ${key}.`
      ];
    }
  }

  res.status(err.statusCode).json({
    status: err.status,
    statusCode: err.statusCode,
    errors: errorsArr
    // message: err.message,
    // stack: err.stack
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err.code === 11000) {
    err.isHandled = true;
  }
  sendErrorDev(err, res);
};
