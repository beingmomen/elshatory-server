const multer = require('multer');
const cloudinary = require('../../config/cloudinary.config');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');

// Multer configuration - store in memory for Cloudinary upload
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
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
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 10 // Maximum 10 files
  }
});

/**
 * Upload single image to Cloudinary
 * @param {Buffer} buffer - Image buffer from multer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });

/**
 * Middleware to upload and process images to Cloudinary
 * @param {Array} fields - Upload field configurations (from closure)
 */
const uploadImagesToCloudinary = fields =>
  catchAsync(async (req, _res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    const folderName = req.baseUrl.split('/').at(-1);
    const allImagesRef = {
      folder: folderName,
      images: []
    };

    // Process all files
    for (const [key, value] of Object.entries(req.files)) {
      const findField = fields.find(field => field.name === key);

      if (!findField) {
        return next(
          new AppError(`No configuration found for field: ${key}`, 400)
        );
      }

      if (value.length > 1) {
        // Multiple images
        req.body[key] = [];

        await Promise.all(
          value.map(async (_item, index) => {
            const uploadOptions = {
              folder: `${process.env.CLOUDINARY_UPLOAD_PRESET}/${folderName}`,
              transformation: [
                {
                  width: findField.resize.width,
                  height: findField.resize.height,
                  crop: 'fill',
                  quality: findField.resize.quality || 85
                }
              ],
              format: 'jpeg'
            };

            const result = await uploadToCloudinary(
              req.files[key][index].buffer,
              uploadOptions
            );

            req.body[key][index] = result.secure_url;
            allImagesRef.images.push({
              url: result.secure_url,
              publicId: result.public_id
            });
          })
        );
      } else {
        // Single image
        const uploadOptions = {
          folder: `${process.env.CLOUDINARY_UPLOAD_PRESET}/${folderName}`,
          transformation: [
            {
              width: findField.resize.width,
              height: findField.resize.height,
              crop: 'fill',
              quality: findField.resize.quality || 85
            }
          ],
          format: 'jpeg'
        };

        const result = await uploadToCloudinary(
          req.files[key][0].buffer,
          uploadOptions
        );

        req.body[key] = result.secure_url;
        allImagesRef.images.push({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    }

    req.uploadedImages = allImagesRef;
    next();
  });

/**
 * Main middleware to handle image uploads
 * @param {Array} fields - Array of upload field configurations
 * @returns {Function} - Express middleware
 */
exports.handleImages = fields => {
  const uploadImages = upload.fields(fields);
  return async (req, res, next) => {
    catchAsync(async (req, res, next) => {
      uploadImages(req, res, err => {
        if (err) {
          return next(new AppError(err.message, 400));
        }

        // Only call uploadImagesToCloudinary if there are files to process
        if (req.files && Object.keys(req.files).length > 0) {
          uploadImagesToCloudinary(fields)(req, res, next);
        } else {
          next();
        }
      });
    })(req, res, next);
  };
};

/**
 * Extract public_id from Cloudinary URL
 * @param {String} url - Cloudinary URL
 * @returns {String} - Public ID
 */
const getPublicIdFromUrl = url => {
  if (!url) return null;

  try {
    // Extract public_id from URL
    // Example: https://res.cloudinary.com/cloud-name/image/upload/v123456/folder/image.jpg
    // Result: folder/image
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');

    if (uploadIndex === -1) return null;

    // Get everything after 'upload/v123456/' and remove extension
    const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithExtension.split('.')[0];

    return publicId;
  } catch (error) {
    logger.error('Error extracting public_id from URL:', error.message);
    return null;
  }
};

/**
 * Delete image from Cloudinary
 * @param {String} url - Cloudinary URL
 * @returns {Promise<Object>} - Deletion result
 */
const deleteFromCloudinary = async url => {
  try {
    const publicId = getPublicIdFromUrl(url);

    if (!publicId) {
      logger.info(`Could not extract public_id from URL: ${url}`);
      return { result: 'skipped' };
    }

    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Deleted image from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error('Failed to delete image from Cloudinary:', error.message);
    throw error;
  }
};

/**
 * Middleware to update images on Cloudinary
 * Deletes old images and keeps new ones
 * @param {Array} uploadFields - Array of upload field configurations
 * @param {Model} Model - Mongoose model
 * @returns {Function} - Express middleware
 */
exports.updateImages = (uploadFields, Model) =>
  catchAsync(async (req, res, next) => {
    // Get the original record before update
    const originalRecord = await Model.findById(req.params.id || req.user.id);

    if (!originalRecord) {
      return next(new AppError('No document found with that ID', 404));
    }

    const oldImagesToDelete = [];

    // Process each field
    for (const field of uploadFields) {
      const fieldName = field.name;
      const newValue = req.body[fieldName];
      const oldValue = originalRecord[fieldName];

      // If newValue is empty string, empty array, or undefined, keep the old value
      if (
        !newValue ||
        newValue === '' ||
        (Array.isArray(newValue) && newValue.length === 0)
      ) {
        req.body[fieldName] = oldValue;
        continue;
      }

      // If newValue is same as oldValue, no file was uploaded - keep old
      if (newValue === oldValue) {
        continue;
      }

      // Collect old images — don't delete yet
      if (Array.isArray(oldValue)) {
        const newArray = Array.isArray(newValue) ? newValue : [newValue];
        oldValue
          .filter(oldImageUrl => !newArray.includes(oldImageUrl))
          .forEach(oldImageUrl => oldImagesToDelete.push(oldImageUrl));
      } else if (newValue !== oldValue && oldValue) {
        oldImagesToDelete.push(oldValue);
      }
    }

    // Delete old images only AFTER the response is successfully sent
    if (oldImagesToDelete.length > 0) {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          Promise.all(
            oldImagesToDelete.map(oldImageUrl =>
              deleteFromCloudinary(oldImageUrl).catch(err => {
                logger.error(
                  'Failed to cleanup old Cloudinary image:',
                  err.message
                );
              })
            )
          ).catch(err => {
            logger.error('Unexpected error during image cleanup:', err.message);
          });
        }
      });
    }

    next();
  });

/**
 * Middleware to delete all images from Cloudinary when record is deleted
 * @param {Array} uploadFields - Array of upload field configurations
 * @returns {Function} - Express middleware
 */
exports.deleteImages = uploadFields =>
  catchAsync(async (req, res) => {
    const { deletedRecord } = req;

    if (!deletedRecord) {
      return res.status(200).json({
        status: 'success',
        message: 'Deleted successfully',
        data: null
      });
    }

    // Delete all images from Cloudinary
    const deletePromises = [];

    uploadFields.forEach(field => {
      const fieldName = field.name;
      const imageValue = deletedRecord[fieldName];

      if (!imageValue) return;

      // Handle array of images
      if (Array.isArray(imageValue)) {
        imageValue.forEach(imageUrl => {
          deletePromises.push(deleteFromCloudinary(imageUrl));
        });
      } else {
        // Handle single image
        deletePromises.push(deleteFromCloudinary(imageValue));
      }
    });

    await Promise.all(deletePromises);

    res.status(200).json({
      status: 'success',
      message: 'Deleted successfully',
      data: null
    });
  });
