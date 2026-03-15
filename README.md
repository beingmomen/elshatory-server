# Express Project with MongoDB and Mongoose

A robust Express.js backend API with MongoDB integration, featuring advanced authentication, image handling system, validation middleware, and comprehensive security implementations. Built with MVC architecture and ready for production deployment on Netlify or traditional servers.

## Recent Updates (v3.0.0)

### Major Refactoring - Image Handling System

- ✅ **Cloudinary Integration**: Migrated from local file storage to Cloudinary cloud storage
- ✅ **New Image Services Architecture**: Created dedicated `imageServices/` directory with modular design
- ✅ **Dual Image Handling**: Support for both local storage and Cloudinary via configurable services
- ✅ **Automatic Image Processing**: Upload, resize, and optimize images with Sharp and Cloudinary transformations
- ✅ **Smart Image Deletion**: Automatic cleanup of old images on Cloudinary when updating/deleting records
- ✅ **Memory-based Upload**: Multer configured with memory storage for seamless Cloudinary uploads

### Image Services Structure

- ✅ **cloudinary-image.image.js**: Full Cloudinary integration with upload/update/delete operations
- ✅ **image.image.js**: Local file storage fallback (for development or self-hosted deployments)
- ✅ **Resource-specific services**: Separate image handlers for users and categories
- ✅ **Centralized Configuration**: Cloudinary config in `config/cloudinary.config.js`

### Middleware & Logging Updates

- ✅ **Enhanced Request Logging**: Improved Morgan logging middleware with better formatting
- ✅ **Package Metadata**: Updated author and version information
- ✅ **Multer Version Update**: Upgraded to multer 2.0.2 for better stability

### Netlify Serverless Deployment

- ✅ **Fully configured for Netlify Functions** with optimized build process
- ✅ **Automatic dependency installation** during deployment
- ✅ **MongoDB connection pooling** for serverless environments
- ✅ **Proper trust proxy configuration** for rate limiting behind load balancers
- ✅ **External module optimization** (mongoose, express, sharp) for faster builds

### Security Enhancements

- ✅ **Fixed trust proxy vulnerability**: Changed from `trust proxy: true` to `trust proxy: 1`
- ✅ **Rate limiting compatibility**: Works correctly with Netlify's load balancer
- ✅ **IP-based rate limiting**: Properly identifies client IPs in serverless environments

### Bug Fixes & Cleanup

- ✅ Removed unused category image files from old local storage system
- ✅ Cleaned up debug logs from error controller
- ✅ Fixed image path handling and deletion logic
- ✅ Removed sensitive tokens from repository

## Features

- **Authentication & Authorization**: JWT-based authentication with secure cookie handling
- **Cloud Image Handling**: Cloudinary integration with automatic upload, resize, and deletion
- **Flexible Image Storage**: Choose between Cloudinary (cloud) or local file storage
- **Email Service**: Template-based email system using Pug templates and Nodemailer
- **Security**: Helmet, XSS protection, rate limiting, data sanitization, HPP protection
- **Validation**: Express-validator middleware for request validation (configured but not currently used)
- **Database**: MongoDB with Mongoose ODM and custom counter plugin
- **MVC Architecture**: Clean separation of concerns with modular design
- **Error Handling**: Global error handler with custom error classes
- **API Features**: Filtering, sorting, pagination, field limiting
- **Code Quality**: ESLint and Prettier configuration
- **CI/CD**: GitHub Actions workflow for automated deployment
- **Serverless**: Netlify Functions support with optimized configuration
- **Compression**: Response compression for better performance
- **CORS**: Cross-Origin Resource Sharing support
- **Logging**: Morgan HTTP request logger with enhanced formatting

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 18.0.0 (specified in `.nvmrc`: 22.14.0)
- **MongoDB**: Latest version
- **npm** or **pnpm** package manager

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd express
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV=development
PORT=1234
DATABASE=your_mongodb_connection_string
DATABASE_PASSWORD=your_database_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Email Configuration
EMAIL_USERNAME=your_email_username
EMAIL_PASSWORD=your_email_password
EMAIL_HOST=your_email_host
EMAIL_PORT=your_email_port
EMAIL_FROM=noreply@yourdomain.com

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_UPLOAD_PRESET=your_app_name

# Optional: Ngrok (for development tunneling)
NGROK_AUTH_TOKEN=your_ngrok_token
```

## Running the Project

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm run start:prod
```

**Netlify development:**

```bash
npm run n:dev
```

**Debug mode:**

```bash
npm run debug
```

The server will start on `http://localhost:1234` by default.

## Project Structure

```
express/
├── .github/
│   └── workflows/
│       └── node.js.yml          # CI/CD workflow for demo/prod deployment
├── config/
│   └── cloudinary.config.js     # Cloudinary configuration
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── errorController.js       # Global error handler
│   ├── globalFactory.js         # Global factory functions
│   ├── handlerFactory.js        # Generic CRUD handlers
│   ├── _categoryController.js   # Category controller (example)
│   ├── _sectionController.js    # Section controller (example)
│   └── _userController.js       # User controller
├── imageServices/
│   ├── config/
│   │   ├── cloudinary-image.image.js  # Cloudinary image service
│   │   └── image.image.js             # Local file storage service
│   ├── category.image.js        # Category image handling
│   └── user.image.js            # User image handling
├── middleware/
│   └── validateMiddleware.js    # Request validation middleware (not currently used)
├── models/
│   ├── plugins/
│   │   └── counterPlugin.js     # Auto-increment document numbers
│   ├── categoryModel.js         # Category schema
│   ├── sectionModel.js          # Section schema
│   └── userModel.js             # User schema with auth
├── netlify/
│   └── functions/
│       ├── package.json         # Netlify function dependencies
│       └── server.js            # Serverless function handler
├── public/
│   └── images/
│       ├── categories/          # Category images (local storage fallback)
│       └── users/               # User profile images (local storage fallback)
├── routes/
│   ├── categoryRoutes.js        # Category API routes
│   ├── sectionRoutes.js         # Section API routes
│   └── userRoutes.js            # User & auth routes
├── utils/
│   ├── apiFeatures.js           # Query features (filter, sort, paginate)
│   ├── appError.js              # Custom error class
│   ├── catchAsync.js            # Async error wrapper
│   ├── email.js                 # Email service class
│   ├── logger.js                # Logging utility
│   └── sendMail.js              # Email sender utility
├── views/
│   └── email/
│       ├── _style.pug           # Email styles
│       ├── baseEmail.pug        # Base email template
│       ├── passwordReset.pug    # Password reset email
│       └── welcome.pug          # Welcome email
├── .eslintrc.json               # ESLint configuration
├── .nvmrc                       # Node version specification
├── app.js                       # Express app configuration
├── netlify.toml                 # Netlify deployment configuration
├── package.json                 # Project dependencies
├── README.md                    # Documentation
└── server.js                    # Server entry point
```

## Technologies Used

### Core Dependencies

- **Express.js**: ^4.21.2 - Web application framework
- **MongoDB & Mongoose**: ^8.12.1 - Database and ODM with transaction support
- **dotenv**: ^16.4.7 - Environment variable management

### Authentication & Security

- **jsonwebtoken**: ^9.0.2 - JWT authentication
- **bcryptjs**: ^2.4.3 - Password hashing
- **express-oauth2-jwt-bearer**: ^1.6.0 - OAuth2 JWT bearer authentication
- **express-rate-limit**: ^7.5.0 - API rate limiting
- **helmet**: ^8.0.0 - Security HTTP headers
- **express-mongo-sanitize**: ^2.2.0 - NoSQL injection prevention
- **hpp**: ^0.2.3 - HTTP parameter pollution protection
- **cors**: ^2.8.5 - Cross-Origin Resource Sharing

### File Handling & Email

- **cloudinary**: ^2.8.0 - Cloud-based image storage and transformation
- **multer**: 2.0.2 - Multipart form data / file upload
- **sharp**: ^0.33.5 - High-performance image processing
- **uuid**: ^13.0.0 - Unique identifier generation
- **nodemailer**: ^6.10.0 - Email sending
- **pug**: ^3.0.3 - Template engine for emails
- **html-to-text**: ^9.0.5 - HTML to plain text conversion

### Validation & Utilities

- **express-validator**: ^7.0.1 - Request validation middleware
- **validator**: ^13.12.0 - String validation and sanitization
- **slugify**: ^1.6.6 - URL slug generation
- **compression**: ^1.8.0 - Response compression middleware
- **morgan**: ^1.10.0 - HTTP request logger

### Development & Deployment

- **@ngrok/ngrok**: ^1.4.1 - Secure tunneling for development
- **ngrok**: ^5.0.0-beta.2 - Alternative ngrok package
- **serverless-http**: ^3.2.0 - AWS Lambda and Netlify Functions wrapper
- **connect-history-api-fallback**: ^2.0.0 - SPA routing support

### Dev Dependencies

- **eslint**: ^8.57.1 - Code linting
- **eslint-config-airbnb-base**: ^15.0.0 - Airbnb style guide
- **eslint-config-prettier**: ^9.1.0 - Prettier compatibility
- **eslint-plugin-import**: ^2.29.1 - ES6+ import/export linting
- **eslint-plugin-node**: ^11.1.0 - Node.js specific rules
- **eslint-plugin-prettier**: ^5.1.3 - Prettier integration
- **prettier**: ^3.2.5 - Code formatting

## Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run start:prod     # Start production server with NODE_ENV=production
npm run debug          # Start server with ndb debugger
npm run n:dev          # Start Netlify functions dev server
npm run build          # Build public assets
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
npm run lint           # Lint code with ESLint
npm run lint:fix       # Fix linting issues automatically
```

## Key Features

### 1. Advanced Image Handling System with Cloudinary

The project includes a sophisticated cloud-based image handling system:

**Architecture:**

- **Resource-specific handlers**: Separate image services for users, categories, etc.
- **Modular design**: Located in `imageServices/` directory with configurable backends
- **Dual storage support**: Switch between Cloudinary (cloud) and local file storage

**Cloudinary Integration** (`imageServices/config/cloudinary-image.image.js`):

- **Cloud storage**: Images stored on Cloudinary CDN
- **Automatic upload**: Memory-based multer upload to Cloudinary
- **Image transformations**: Resize, crop, and optimize with Cloudinary's transformation API
- **Smart deletion**: Automatically removes old images from Cloudinary when updating/deleting records
- **Public ID extraction**: Intelligent URL parsing for image management
- **Error handling**: Robust error handling with fallback mechanisms

**Local Storage Fallback** (`imageServices/config/image.image.js`):

- **Development friendly**: Local file storage for development environments
- **Self-hosted option**: No external dependencies for image storage
- **Sharp processing**: Image resizing and optimization with Sharp library

**Features:**

- Multiple image field support (single or array)
- Configurable image dimensions and quality per field
- Transaction-safe database operations
- Automatic cleanup of old images on update/delete
- Memory-efficient buffer-based uploads

**Configuration:**
Each resource (user, category) has its own image service configuration in files like:

- [imageServices/user.image.js](imageServices/user.image.js)
- [imageServices/category.image.js](imageServices/category.image.js)

### 2. Counter Plugin

Custom Mongoose plugin (`models/plugins/counterPlugin.js`) that:

- Automatically generates sequential document numbers
- Handles race conditions with retry logic
- Provides counter reset functionality
- Ensures unique document numbering across collections

### 3. Validation Middleware (Available but Not Currently Integrated)

Express-validator based middleware (`middleware/validateMiddleware.js`) is configured but not currently used in routes:

- Ready-to-use validation chains for authentication (signup, login)
- User profile update validation
- Category creation and update validation
- Can be easily integrated into route handlers when needed

**Note:** This middleware is available in the codebase but routes currently don't implement it. To use it, import the validation chains and add them to your route definitions.

### 4. Handler Factory

Generic CRUD operation handlers (`controllers/handlerFactory.js`) that:

- Reduce code duplication
- Provide consistent API responses
- Support advanced query features (filtering, sorting, pagination)
- Handle errors uniformly

### 5. API Features

The `utils/apiFeatures.js` utility provides:

- **Filtering**: Query by any field with operators (gt, gte, lt, lte)
- **Sorting**: Sort by one or multiple fields
- **Field Limiting**: Select specific fields to return
- **Pagination**: Page-based result pagination

### 6. Email System

Template-based email system using Pug templates:

- Welcome emails
- Password reset emails
- HTML and plain text versions
- Responsive email design
- Custom styling support

### 7. Security Features

Comprehensive security implementation with production-ready configurations:

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: Prevent brute force attacks (100 req/hour per IP)
  - Configured for serverless environments
  - Proper trust proxy settings (`trust proxy: 1`)
  - Validates real client IPs behind Netlify's load balancer
- **Helmet**: Security HTTP headers with Content Security Policy
  - XSS Protection
  - Frame Options (DENY)
  - Content-Type Options (nosniff)
  - Referrer Policy (strict-origin-when-cross-origin)
- **CORS**: Configurable cross-origin resource sharing
  - Production: Restricted to `FRONTEND_URL`
  - Development: Open for testing
- **Data Sanitization**: NoSQL injection prevention with express-mongo-sanitize
- **HPP Protection**: HTTP parameter pollution prevention
- **Input Validation**: Express-validator middleware for request validation
- **Proxy Security**: Correctly configured for Netlify and reverse proxy environments

### 8. CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/node.js.yml`) for:

- Automated deployment to demo/production environments
- Self-hosted runners support
- Environment-specific configuration
- PM2 process management
- pnpm package manager support

## Development

### Code Quality Tools

The project is configured with:

- **ESLint**: Airbnb style guide with Prettier integration
- **Prettier**: Consistent code formatting
- **Nodemon**: Auto-restart on file changes

### Environment Setup

1. Use the specified Node.js version:

```bash
nvm use
# or manually install Node.js 22.14.0
```

2. Configure your editor to use ESLint and Prettier

3. Install dependencies with your preferred package manager

## API Documentation

### Authentication Endpoints

- `POST /api/v1/users/signup` - Register a new user
- `POST /api/v1/users/login` - Login user
- `POST /api/v1/users/forgotPassword` - Request password reset
- `PATCH /api/v1/users/resetPassword/:token` - Reset password with token
- `GET /api/v1/users/logout` - Logout user

### Protected Routes (Require Authentication)

- `PATCH /api/v1/users/updateMyPassword` - Update current user password
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/updateMe` - Update current user data
- `DELETE /api/v1/users/deleteMe` - Deactivate account

### Category Routes

- `GET /api/v1/categories` - Get all categories (with filtering, sorting, pagination)
- `POST /api/v1/categories` - Create new category (with image upload)
- `GET /api/v1/categories/:id` - Get category by ID
- `PATCH /api/v1/categories/:id` - Update category (with image upload)
- `DELETE /api/v1/categories/:id` - Delete category

### Section Routes

- `GET /api/v1/sections` - Get all sections
- `POST /api/v1/sections` - Create new section
- `GET /api/v1/sections/:id` - Get section by ID
- `PATCH /api/v1/sections/:id` - Update section
- `DELETE /api/v1/sections/:id` - Delete section

### Query Parameters

All GET endpoints support advanced querying:

```
# Filtering
GET /api/v1/categories?name=Technology&active=true

# Filtering with operators
GET /api/v1/categories?price[gte]=100&price[lt]=500

# Sorting
GET /api/v1/categories?sort=name,-createdAt

# Field limiting
GET /api/v1/categories?fields=name,description,image

# Pagination
GET /api/v1/categories?page=2&limit=10
```

## Deployment

### Netlify Functions (Recommended for Serverless)

The project is fully configured for serverless deployment on Netlify with optimized settings:

#### Configuration Files

- **[netlify.toml](netlify.toml)**: Main configuration file with build settings
- **[netlify/functions/server.js](netlify/functions/server.js)**: Serverless function handler
- **[netlify/functions/package.json](netlify/functions/package.json)**: Function-specific dependencies

#### Deployment Steps

1. **Connect to Netlify**:
   - Link your repository to Netlify via Git integration
   - Or use Netlify CLI: `netlify deploy`

2. **Environment Variables**:
   Set these in Netlify Dashboard → Site Settings → Environment Variables:

   ```env
   NODE_ENV=production
   DATABASE_ATLAS=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key_min_32_chars
   JWT_EXPIRES_IN=90d
   JWT_COOKIE_EXPIRES_IN=90
   EMAIL_USERNAME=your_email_username
   EMAIL_PASSWORD=your_email_password
   EMAIL_HOST=your_email_host
   EMAIL_PORT=your_email_port
   EMAIL_FROM=noreply@yourdomain.com
   FRONTEND_URL=https://your-frontend-url.com
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CLOUDINARY_UPLOAD_PRESET=your_app_name
   ```

3. **Build Settings** (automatically configured in [netlify.toml](netlify.toml)):
   - Build command: `cd netlify/functions && npm install && cd ../..`
   - Functions directory: `netlify/functions`
   - Publish directory: `public`

4. **Deploy**:

   ```bash
   # Production deployment
   git push origin main

   # Or manual deploy via CLI
   netlify deploy --prod
   ```

#### How It Works

- **Automatic Dependency Installation**: The build command installs dependencies in `netlify/functions/` before deployment
- **Database Connection**: Uses MongoDB connection pooling optimized for serverless
- **External Modules**: `mongoose`, `express`, and `sharp` are configured as external modules for faster builds
- **Redirects**: All routes redirect to `/.netlify/functions/server`
- **Memory**: Function memory set to 1024MB for handling image processing
- **Timeout**: 10 seconds timeout for API requests

#### Important Notes

- **MongoDB Atlas**: Use MongoDB Atlas (cloud) instead of local MongoDB
- **Cloudinary**: The project uses Cloudinary for image storage - images are stored in the cloud, not on Netlify's ephemeral file system
- **Image Storage**: Cloudinary is already integrated and configured - no need for additional storage setup
- **Environment Variables**: Never commit `.env` - use Netlify's environment variable management
- **Cold Starts**: First request may be slower due to serverless cold starts
- **Cloudinary Account**: Sign up for a free Cloudinary account at https://cloudinary.com to get your API credentials

### Traditional Hosting (VPS/Cloud Instances)

For traditional hosting on servers like DigitalOcean, AWS EC2, or VPS:

1. **Set up MongoDB**:

   ```bash
   # Install MongoDB or use MongoDB Atlas
   # Configure connection string in .env
   ```

2. **Configure environment variables**:

   ```bash
   # Create .env in project root
   cp .env.example .env
   # Edit with your values
   ```

3. **Install PM2 for process management**:

   ```bash
   npm install -g pm2
   pm2 start server.js --name "express-api"
   pm2 save
   pm2 startup
   ```

4. **Set up Nginx as reverse proxy** (recommended):

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:1234;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### CI/CD with GitHub Actions

The project includes a workflow for automated deployment to self-hosted servers:

- **Demo Environment**: Pushes to `main` branch deploy automatically
- **Production Environment**: Pushes to `prod` branch deploy to production
- **Process Manager**: Uses PM2 for zero-downtime deployments
- **Package Manager**: Configured for pnpm (can be changed to npm)

#### Setup GitHub Secrets

Configure these secrets in GitHub → Settings → Secrets:

- **`ENV_DEMO`**: Demo environment variables (entire `.env` content)
- **`ENV_PROD`**: Production environment variables (optional, for prod branch)

#### Workflow Configuration

See [.github/workflows/node.js.yml](.github/workflows/node.js.yml) for the complete CI/CD setup.

## Troubleshooting

### Netlify Deployment Issues

#### "Cannot find module 'mongoose'" Error

**Problem**: Runtime error when calling API endpoints on Netlify.

**Solution**: This is fixed in the latest version. The [netlify.toml](netlify.toml) includes a build command that installs dependencies:

```toml
[build]
  command = "cd netlify/functions && npm install && cd ../.."
```

If you still encounter this:

1. Verify `netlify/functions/package.json` exists with all dependencies
2. Check Netlify build logs to ensure dependencies are installed
3. Redeploy after clearing build cache

#### Trust Proxy Rate Limiting Error

**Problem**: `ERR_ERL_PERMISSIVE_TRUST_PROXY` validation error.

**Solution**: Already fixed in [app.js:25](app.js#L25). The app uses `trust proxy: 1` instead of `true`:

```javascript
// Configure trust proxy for serverless environments (Netlify)
// Trust only the first proxy (Netlify's load balancer)
app.set('trust proxy', 1);
```

This configuration:

- Trusts only Netlify's first proxy layer
- Prevents IP spoofing attacks
- Allows rate limiting to work correctly with real client IPs

#### Function Timeout

**Problem**: API requests timeout after 10 seconds.

**Solutions**:

- Optimize database queries (add indexes)
- Reduce image processing time
- Increase timeout in [netlify.toml](netlify.toml#L13):
  ```toml
  [functions.server]
    timeout = 26  # Maximum allowed is 26 seconds
  ```

#### Cold Start Delays

**Problem**: First request takes 3-5 seconds.

**Expected Behavior**: Serverless functions "sleep" when inactive and "wake up" on first request.

**Mitigation**:

- Use Netlify's "Keep Functions Warm" feature (paid plans)
- Implement a ping endpoint and use a cron job to keep function warm
- Accept cold starts as normal serverless behavior

### MongoDB Connection Issues

```bash
# Check if MongoDB is running (local development)
mongosh

# Verify connection string in .env
DATABASE=mongodb://localhost:27017/your-database

# For MongoDB Atlas (Netlify deployment)
DATABASE_ATLAS=mongodb+srv://username:<password>@cluster.mongodb.net/database
```

**Common Issues**:

- **IP Whitelist**: Add `0.0.0.0/0` to MongoDB Atlas IP whitelist for Netlify
- **Connection Pooling**: The serverless handler reuses connections (see [netlify/functions/server.js](netlify/functions/server.js#L15))
- **Timeout**: Increase `serverSelectionTimeoutMS` if deployment is slow

### Rate Limiting Issues

**Problem**: Rate limiting not working correctly behind proxy.

**Cause**: Incorrect trust proxy configuration.

**Solution**: Use the current configuration in [app.js](app.js):

```javascript
app.set('trust proxy', 1); // Trust first proxy

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
  validate: { trustProxy: false } // Skip strict validation
});
```

### Image Upload Issues

**Using Cloudinary (Default):**

- Verify Cloudinary environment variables are set correctly
- Check Cloudinary dashboard for upload activity
- Ensure `CLOUDINARY_UPLOAD_PRESET` folder exists or remove folder restrictions
- Check API key permissions in Cloudinary settings
- Review network connectivity to Cloudinary API

**Using Local Storage (Fallback):**

- Switch image service import in `imageServices/user.image.js` or `imageServices/category.image.js`
- Change from `require('./config/cloudinary-image.image')` to `require('./config/image.image')`
- Ensure `public/images/` directories exist
- Check file permissions (755 for directories, 644 for files)
- Verify multer and sharp are installed correctly
- **Netlify Note**: Local file uploads don't persist on serverless deployments

### Email Not Sending

- Verify SMTP credentials in environment variables
- Check firewall/network settings
- Test with a service like Mailtrap for development
- Ensure `EMAIL_FROM` matches your SMTP provider's verified sender

### Port Already in Use

```bash
# Find process using port 1234
lsof -i :1234  # macOS/Linux
netstat -ano | findstr :1234  # Windows

# Kill the process or change PORT in .env
PORT=3000
```

### Build or Linting Errors

```bash
# Fix linting issues automatically
npm run lint:fix

# Check code formatting
npm run format:check

# Format all files
npm run format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the Airbnb JavaScript style guide
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Run linting before committing: `npm run lint:fix`

## License

This project is licensed under the ISC License.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

- Built with Express.js and MongoDB
- Uses Airbnb JavaScript style guide
- Image handling inspired by modern image processing best practices
- Security implementations following OWASP guidelines

## Author

**beingmomen**

---

**Note**: This is a template project. Remember to:

- Update repository URLs
- Configure your own MongoDB instance
- Set up proper environment variables
- Review and customize security settings for production
- Remove example controllers (prefixed with `_`) if not needed
