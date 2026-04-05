const mongoose = require('mongoose');
const loadEnv = require('./utils/loadEnv');

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

loadEnv(__dirname);
const app = require('./app');

const DB = process.env.DATABASE_ATLAS;

mongoose.connect(DB).then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 1234;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION!!! 💥 Shutting down...');
  console.log(err.name, err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      process.exit(0);
    });
  });
});
