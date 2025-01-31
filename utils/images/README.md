# Express Image Handler System

A powerful and flexible image handling system for Express.js applications. This system provides a clean and efficient way to handle image uploads, processing, and management in your Express applications.

## Features

- 🖼️ Multiple image upload support
- 🔄 Automatic image processing and resizing
- 💾 Transaction-safe database operations
- 🧹 Automatic cleanup of old images
- 🎯 Easy integration with any model
- ⚡ Memory-efficient streaming uploads
- 🔒 Secure file type validation

## Installation

Make sure you have the required dependencies in your `package.json`:

```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.32.0",
    "mongoose": "^7.0.0"
  }
}
```

## Quick Start

### 1. Define Image Fields

First, define your image fields with their upload and processing options:

```javascript
const imageFields = [
  {
    name: 'profileImage',      // Field name in your form
    maxCount: 1,              // Maximum number of files
    resize: {
      width: 500,            // Output width
      height: 500,           // Output height
      quality: 85           // JPEG quality (0-100)
    }
  },
  {
    name: 'gallery',
    maxCount: 5,
    resize: {
      width: 1000,
      height: 666,
      quality: 90
    }
  }
];
```

### 2. Create Image Handler Instance

```javascript
const ImageHandler = require('../utils/images/ImageHandler');
const YourModel = require('../models/yourModel');

const imageHandler = new ImageHandler(
  YourModel,           // Your Mongoose model
  imageFields,         // Image field configurations
  'yourModelFolder'    // Subfolder name for images
);
```

### 3. Set Up Routes

```javascript
const express = require('express');
const router = express.Router();

// Add image handling middleware to your routes
router.post('/',
  imageHandler.uploadImages(),     // Handle multipart form data
  imageHandler.processImages(),    // Process and resize images
  imageHandler.createOne()         // Save document with images
);

router.patch('/:id',
  imageHandler.uploadImages(),
  imageHandler.processImages(),
  imageHandler.updateOne()
);

router.delete('/:id',
  imageHandler.deleteOne()         // Automatically cleans up images
);
```

## API Reference

### ImageHandler Class

#### Constructor
```javascript
new ImageHandler(model, imageFields, folderName)
```
- `model`: Mongoose model
- `imageFields`: Array of image field configurations
- `folderName`: Subfolder name for storing images

#### Methods

##### `uploadImages()`
Handles multipart form data upload using Multer.
- Returns: Express middleware
- Validates file types (images only)
- Stores files in memory for processing

##### `processImages()`
Processes uploaded images using Sharp.
- Returns: Express middleware
- Resizes images according to field configurations
- Generates unique filenames
- Prepares images for storage

##### `createOne()`
Creates a new document with images.
- Returns: Express middleware
- Uses MongoDB transactions
- Automatically saves processed images
- Returns created document in response

##### `updateOne()`
Updates an existing document and its images.
- Returns: Express middleware
- Uses MongoDB transactions
- Removes old images when replaced
- Returns updated document in response

##### `deleteOne()`
Deletes a document and its associated images.
- Returns: Express middleware
- Automatically removes all associated images
- Returns 204 status on success

## Example Usage

### Basic Example

```javascript
// categoryController.js
const Model = require('../models/categoryModel');
const ImageHandler = require('../utils/images/ImageHandler');

const imageFields = [
  {
    name: 'image',
    maxCount: 1,
    resize: { width: 500, height: 500, quality: 85 }
  }
];

const imageHandler = new ImageHandler(Model, imageFields, 'categories');

exports.uploadImages = imageHandler.uploadImages();
exports.processImages = imageHandler.processImages();
exports.createOne = imageHandler.createOne();
exports.updateOne = imageHandler.updateOne();
exports.deleteOne = imageHandler.deleteOne();
```

### Advanced Example with Multiple Image Fields

```javascript
// productController.js
const imageFields = [
  {
    name: 'mainImage',
    maxCount: 1,
    resize: { width: 800, height: 800, quality: 90 }
  },
  {
    name: 'thumbnails',
    maxCount: 4,
    resize: { width: 200, height: 200, quality: 80 }
  },
  {
    name: 'detailImages',
    maxCount: 8,
    resize: { width: 1200, height: 800, quality: 85 }
  }
];

const imageHandler = new ImageHandler(ProductModel, imageFields, 'products');
```

## File Structure

The image handling system consists of two main classes:

- `ImageService.js`: Core service for image operations
- `ImageHandler.js`: High-level middleware and business logic

Images are stored in:
```
your-project/
  └── images/
      └── [folderName]/
          └── [generated-image-names].jpeg
```

## Best Practices

1. **Image Field Names**
   - Use descriptive names for image fields
   - Keep names consistent across your application
   - Use camelCase naming convention

2. **Image Sizes**
   - Choose appropriate sizes for your use case
   - Consider bandwidth and storage constraints
   - Use lower quality for thumbnails (70-80)
   - Use higher quality for main images (85-95)

3. **Error Handling**
   - Always handle upload errors gracefully
   - Provide meaningful error messages to users
   - Log errors for debugging

4. **Security**
   - Always validate file types
   - Set appropriate file size limits
   - Use secure file naming conventions

## Common Issues and Solutions

### Issue: Images Not Uploading
- Check form enctype is `multipart/form-data`
- Verify field names match configuration
- Check file size limits

### Issue: Poor Image Quality
- Increase quality setting in resize options
- Verify input image resolution
- Check output dimensions are appropriate

### Issue: Performance Issues
- Reduce maxCount for multiple uploads
- Lower image quality settings
- Implement pagination for image galleries

## Contributing

Feel free to submit issues and enhancement requests!
