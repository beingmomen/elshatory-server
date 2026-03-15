# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Development server with nodemon
npm start            # Production server
npm run start:prod   # Production with NODE_ENV=production explicitly set
npm run lint         # ESLint check (Airbnb style)
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format with Prettier
npm run format:check # Check formatting without changes
```

No test framework is configured in this project.

## Environment Setup

Copy `.env` to the project root (not tracked by git). Required variables:

```
NODE_ENV, PORT, DATABASE, DATABASE_ATLAS
JWT_SECRET, JWT_EXPIRES_IN, JWT_COOKIE_EXPIRES_IN
EMAIL_USERNAME, EMAIL_PASSWORD, EMAIL_HOST, EMAIL_PORT, EMAIL_FROM
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_UPLOAD_PRESET
APP_NAME, MANAGER, FRONTEND_URL
```

## Architecture

### Request Flow

```
server.js → app.js (middleware stack) → routes/ → controllers/ → models/
```

**Security middleware order in app.js**: helmet → CORS → rate limiter → morgan → body-parser → data sanitization (mongoSanitize) → HPP → static files → routes → global error handler.

### Factory Pattern (handlerFactory.js)

The core architectural pattern. All standard CRUD routes use generic factory functions rather than per-resource implementations:

```js
exports.getAll = (Model, options) => catchAsync(async (req, res, next) => { ... })
exports.getOne = (Model, popOptions) => ...
exports.createOne = (Model) => ...
exports.updateOne = (Model) => ...
exports.deleteOne = (Model) => ...
```

Resource controllers (e.g., `_categoryController.js`) compose these with resource-specific middleware (image handling, auth) in route definitions.

### Image Handling (imageServices/)

Each resource has its own image service module in `imageServices/` (e.g., `user.image.js`, `category.image.js`). These use:

- Multer with **memory storage** (no disk writes during upload)
- Sharp for resizing/formatting
- Cloudinary for cloud storage (with fallback to `public/images/`)

Two middleware functions per resource: `handleImages` (parse multipart, resize) → `updateImages` (upload to Cloudinary, delete old images on update).

### Error Handling

- `utils/appError.js` — Custom error class with `statusCode` and `isOperational` flag
- `utils/catchAsync.js` — Wraps async controllers, forwards errors to next()
- `controllers/errorController.js` — Global handler; returns detailed errors in dev, sanitized in prod; handles JWT errors, Mongoose validation/cast errors, duplicate key errors

### Authentication Flow

JWT issued on login/signup, stored in httpOnly cookie and returned in response body. `authController.protect` middleware:

1. Extracts token from `Authorization: Bearer` header or cookie
2. Verifies JWT signature and expiry
3. Checks user still exists in DB
4. Checks `passwordChangedAt` hasn't changed since token issue
5. Attaches `req.user`

`authController.restrictTo(...roles)` follows protect for role-based access.

### Models

Mongoose schemas use:

- **Pre-hooks** for password hashing (bcrypt, 12 rounds), slug generation, `passwordChangedAt` tracking
- `timestamps: true` for automatic `createdAt`/`updatedAt`
- **counterPlugin** (`models/plugins/counterPlugin.js`) for auto-incrementing sequential `num` fields with race-condition handling
- Indexes on commonly queried fields (email unique, slug, createdAt, compounds)

### API Query Features (utils/apiFeatures.js)

`APIFeatures` class chains `.filter()`, `.sort()`, `.limitFields()`, `.paginate()`, `.search()` onto a Mongoose query. Used in `handlerFactory.getAll`.

### Serverless Support

The app supports both traditional Node server (`server.js`) and Netlify Functions (`netlify/functions/server.js`). `app.js` sets `trust proxy: 1` for this reason.

## Adding a New Resource

1. Create model in `models/`
2. Create controller in `controllers/` using `handlerFactory` functions
3. Create image service in `imageServices/` (if resource has images)
4. Create route file in `routes/` and mount in `app.js`
