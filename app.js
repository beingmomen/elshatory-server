const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');

const AppError = require('./utils/appError');

const globalErrorHandler = require('./controllers/errorController');

// Main Routers
const userRouter = require('./routes/userRoutes');
const healthRouter = require('./routes/healthRoutes');
const projectRouter = require('./routes/projectRoutes');
const blogRouter = require('./routes/blogRoutes');
const serviceRouter = require('./routes/serviceRoutes');
const skillRouter = require('./routes/skillRoutes');
const clientRouter = require('./routes/clientRoutes');
const contactRouter = require('./routes/contactRoutes');
const testimonialRouter = require('./routes/testimonialRoutes');
const resourceRouter = require('./routes/resourceRoutes');
const infoRouter = require('./routes/infoRoutes');
const viewRouter = require('./routes/viewRoutes');
const landingRouter = require('./routes/landingRoutes');
const buildProjectRouter = require('./routes/buildProjectRoutes');

const app = express();

// Configure trust proxy for serverless environments (Netlify)
// Trust only the first proxy (Netlify's load balancer)
app.set('trust proxy', 1);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static('images'));

// Set security HTTP headers with enhanced CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.FRONTEND_URL].filter(Boolean),
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: { policy: 'credentialless' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })
);

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request correlation IDs for tracing
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

// Limit requests from same API
const limiter = rateLimit({
  max: 10000,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour',
  validate: { trustProxy: true }
});
app.use('/api', limiter);

// Body parser with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse cookies (required for JWT cookie auth)
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['sort', 'fields', 'page', 'limit']
  })
);

// Enable CORS with specific options
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
    credentials: true,
    maxAge: 86400
  })
);
app.options('*', cors());

// Compression for responses (skip for small payloads)
app.use(compression({ threshold: 1024 }));

// Add cache control headers
app.use((req, res, next) => {
  // Don't cache API responses
  if (req.url.match(/^\/api/)) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint (should be before rate limiting)
app.use('/health', healthRouter);

app.use('/api/v1/users', userRouter);
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/blogs', blogRouter);
app.use('/api/v1/services', serviceRouter);
app.use('/api/v1/skills', skillRouter);
app.use('/api/v1/clients', clientRouter);
app.use('/api/v1/contacts', contactRouter);
app.use('/api/v1/testimonials', testimonialRouter);
app.use('/api/v1/resources', resourceRouter);
app.use('/api/v1/infos', infoRouter);
app.use('/api/v1/views', viewRouter);
app.use('/api/v1/landing', landingRouter);
app.use('/api/v1/build-project', buildProjectRouter);

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
