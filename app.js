const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// Main Routers
const userRouter = require('./routes/userRoutes');
const categoryRouter = require('./routes/categoryRoutes');

const app = express();

app.use(cors()); // Enable CORS for all routes

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static('images'));
// Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 1000,
  message: {
    errors: ['Too many requests from this IP, please try again in a minute!']
  }
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compression
app.use(
  compression({
    level: 6,
    threshold: 0,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  })
);

// Add cache control headers
app.use((req, res, next) => {
  // Don't cache API responses
  if (req.url.match(/^\/api/)) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);

app.post('/api/v1/logout', (req, res) => {
  res.send('Done');
});

// Handle 404 for API routes
app.all('/api/*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Handle 404 errors - add this at the end before error handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
