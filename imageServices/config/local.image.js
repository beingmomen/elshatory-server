const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');

const IMAGES_BASE = path.resolve(__dirname, '..', '..', 'public', 'images');

/**
 * Resolve an image path and verify it stays inside public/images/.
 * Returns the resolved absolute path, or null if the path escapes.
 */
const safePath = (imagesDir, imageName) => {
  const resolved = path.resolve(path.join(imagesDir, imageName));
  if (
    !resolved.startsWith(IMAGES_BASE + path.sep) &&
    resolved !== IMAGES_BASE
  ) {
    return null;
  }
  return resolved;
};

const multerStorage = multer.memoryStorage();

const multerFilter = (_req, file, cb) => {
  // Accept all image types
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Maximum 10 files
  }
});

const resizeImages = fields =>
  catchAsync(async (req, _res, next) => {
    const folderName = req.baseUrl.split('/').at(-1);
    const allImagesRef = {
      folder: folderName,
      images: []
    };

    // Ensure the images directory exists
    const imagesDir = path.join(
      __dirname,
      '..',
      '..',
      'public',
      'images',
      folderName
    );
    await fs.promises.mkdir(imagesDir, { recursive: true });

    // Process all files
    for (const [key, value] of Object.entries(req.files)) {
      const findField = fields.find(field => field.name === key);

      if (value.length > 1) {
        req.body[key] = [];

        await Promise.all(
          value.map(async (_item, index) => {
            const itemId = uuidv4();
            const fileName = `/${folderName}/${itemId}.jpeg`;
            req.body[key][index] = fileName;
            allImagesRef.images.push(fileName);

            await sharp(req.files[key][index].buffer)
              .resize(findField.resize.width, findField.resize.height)
              .toFormat('jpeg')
              .jpeg({ quality: findField.resize.quality })
              .toFile(path.join(imagesDir, `${itemId}.jpeg`));
          })
        );
      } else {
        const itemId = uuidv4();
        const fileName = `/${folderName}/${itemId}.jpeg`;
        req.body[key] = fileName;
        allImagesRef.images.push(fileName);

        await sharp(req.files[key][0].buffer)
          .resize(findField.resize.width, findField.resize.height)
          .toFormat('jpeg')
          .jpeg({ quality: findField.resize.quality })
          .toFile(path.join(imagesDir, `${itemId}.jpeg`));
      }
    }

    req.filesToDelete = allImagesRef;
    next();
  });

exports.handleImages = fields => {
  const uploadImages = upload.fields(fields);
  return async (req, res, next) => {
    catchAsync(async (req, res, next) => {
      uploadImages(req, res, err => {
        if (err) {
          return next(new AppError(err.message, 400));
        }
        if (req.files && Object.keys(req.files).length > 0) {
          resizeImages(fields)(req, res, next);
        } else {
          next();
        }
      });
    })(req, res, next);
  };
};

exports.updateImages = (uploadFields, Model) =>
  catchAsync(async (req, res, next) => {
    const imagesDir = path.join(__dirname, '..', '..', 'public', 'images');

    // Get the original record before update
    const originalRecord = await Model.findById(req.params.id || req.user.id);

    if (!originalRecord) {
      return next(new AppError('No document found with that ID', 404));
    }

    // Strip image fields from req.body that weren't uploaded as actual files
    for (const field of uploadFields) {
      const hasUploadedFile =
        req.files && req.files[field.name] && req.files[field.name].length > 0;
      if (!hasUploadedFile) {
        delete req.body[field.name];
      }
    }

    const oldImagesToDelete = [];

    for (const field of uploadFields) {
      const fieldName = field.name;
      const newValue = req.body[fieldName];
      const oldValue = originalRecord[fieldName];

      if (
        !newValue ||
        newValue === '' ||
        (Array.isArray(newValue) && newValue.length === 0)
      ) {
        req.body[fieldName] = oldValue;
        continue;
      }

      if (typeof newValue === 'string' && newValue === oldValue) {
        continue;
      }

      // Collect old images — don't delete yet
      if (Array.isArray(oldValue)) {
        const newArray = Array.isArray(newValue) ? newValue : [newValue];
        oldValue
          .filter(oldImageName => !newArray.includes(oldImageName))
          .forEach(oldImageName => oldImagesToDelete.push(oldImageName));
      } else if (newValue !== oldValue && oldValue) {
        oldImagesToDelete.push(oldValue);
      }
    }

    // Delete old images only AFTER the response is successfully sent
    if (oldImagesToDelete.length > 0) {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          Promise.all(
            oldImagesToDelete.map(imageName => {
              const imagePath = safePath(imagesDir, imageName);
              if (!imagePath) {
                logger.error(`Blocked path traversal attempt: ${imageName}`);
                return Promise.resolve();
              }
              return fs.promises
                .unlink(imagePath)
                .then(() => {
                  logger.info(`Deleted old image: ${imagePath}`);
                })
                .catch(err => {
                  if (err.code !== 'ENOENT')
                    logger.error(
                      `Failed to delete old image ${imagePath}:`,
                      err.message
                    );
                });
            })
          );
        }
      });
    }

    next();
  });

exports.deleteImages = uploadFields =>
  catchAsync(async (req, res) => {
    const imagesDir = path.join(__dirname, '..', '..', 'public', 'images');
    const { deletedRecord } = req;

    if (!deletedRecord) {
      return res.status(200).json({
        status: 'success',
        message: 'Deleted successfully',
        data: null
      });
    }

    const deletePromises = [];

    uploadFields.forEach(field => {
      const fieldName = field.name;
      const imageValue = deletedRecord[fieldName];

      if (!imageValue) return;

      if (Array.isArray(imageValue)) {
        imageValue.forEach(imageName => {
          const imagePath = safePath(imagesDir, imageName);
          if (!imagePath) {
            logger.error(`Blocked path traversal attempt: ${imageName}`);
            return;
          }
          deletePromises.push(
            fs.promises
              .unlink(imagePath)
              .then(() => {
                logger.info(`Deleted image: ${imagePath}`);
              })
              .catch(err => {
                if (err.code !== 'ENOENT')
                  logger.error(
                    `Failed to delete image ${imagePath}:`,
                    err.message
                  );
              })
          );
        });
      } else {
        const imagePath = safePath(imagesDir, imageValue);
        if (!imagePath) {
          logger.error(`Blocked path traversal attempt: ${imageValue}`);
        } else {
          deletePromises.push(
            fs.promises
              .unlink(imagePath)
              .then(() => {
                logger.info(`Deleted image: ${imagePath}`);
              })
              .catch(err => {
                if (err.code !== 'ENOENT')
                  logger.error(
                    `Failed to delete image ${imagePath}:`,
                    err.message
                  );
              })
          );
        }
      }
    });

    await Promise.all(deletePromises);

    res.status(200).json({
      status: 'success',
      message: 'Deleted successfully',
      data: null
    });
  });
