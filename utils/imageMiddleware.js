const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

class ImageMiddleware {
  constructor(imagePath) {
    this.imagePath = imagePath;
    this.multerStorage = multer.memoryStorage();
    this.multerFilter = this.multerFilter.bind(this);
    this.upload = multer({
      storage: this.multerStorage,
      fileFilter: this.multerFilter
    });
  }

  multerFilter(req, file, cb) {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
  }

  uploadImages(fields = []) {
    if (!fields || fields.length === 0) {
      // Default to single image upload if no fields are specified
      return this.upload.fields([{ name: 'image', maxCount: 1 }]);
    }

    return this.upload.fields(fields);
  }

  resizeImages(options = {}) {
    return catchAsync(async (req, res, next) => {
      if (!req.files) return next();

      for (const [fieldName, fieldOptions] of Object.entries(options)) {
        if (!req.files[fieldName]) continue;

        const files = req.files[fieldName];
        req.body[fieldName] = [];

        for (const file of files) {
          const filename = `${this.imagePath}-${fieldName}-${req.params.id ||
            req.user.id}-${Date.now()}-${files.indexOf(file)}.jpeg`;

          await this.processAndSaveImage(file, filename, fieldOptions);

          req.body[fieldName].push(filename);
        }

        // If it's a single file field, store the filename directly instead of in an array
        if (req.body[fieldName].length === 1) {
          req.body[fieldName] = req.body[fieldName][0];
        }
      }

      next();
    });
  }

  async processAndSaveImage(file, filename, options) {
    const folderPath = path.join('images', this.imagePath);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    await sharp(file.buffer)
      .resize(options.width || 500, options.height || 500)
      .toFormat('jpeg')
      .jpeg({ quality: options.quality || 90 })
      .toFile(path.join(folderPath, filename));
  }
}

module.exports = ImageMiddleware;
