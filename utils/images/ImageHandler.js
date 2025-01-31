const mongoose = require('mongoose');
const catchAsync = require('../catchAsync');
const imageService = require('./ImageService');
const AppError = require('../appError');

/**
 * Handles image-related operations for Express routes
 * Provides middleware for uploading, processing, and managing images
 * @class ImageHandler
 */
class ImageHandler {
  /**
   * Creates an instance of ImageHandler
   * @param {Object} model - Mongoose model
   * @param {Array} imageFields - Configuration for image fields
   * @param {string} imageFields[].name - Form field name
   * @param {number} imageFields[].maxCount - Maximum number of files
   * @param {Object} imageFields[].resize - Sharp resize options
   * @param {string} folderName - Subfolder name for storing images
   */
  constructor(model, imageFields, folderName) {
    this.Model = model;
    this.imageFields = imageFields;
    this.folderName = folderName;
  }

  /**
   * Creates multer middleware for handling file uploads
   * @returns {Function} Express middleware
   */
  uploadImages() {
    return imageService.upload.fields(this.imageFields);
  }

  /**
   * Processes uploaded images using Sharp
   * @returns {Function} Express middleware
   */
  processImages() {
    return catchAsync(async (req, res, next) => {
      if (!req.files) return next();

      req.processedImages = {};

      for (const { name: fieldName, resize } of this.imageFields) {
        if (!req.files[fieldName]) continue;

        const files = Array.isArray(req.files[fieldName])
          ? req.files[fieldName]
          : [req.files[fieldName]];

        req.processedImages[fieldName] = [];

        for (const file of files) {
          const filename = imageService.generateFilename(
            this.folderName,
            fieldName,
            req.params.id || req.user.id,
            files.indexOf(file)
          );

          const processedBuffer = await imageService.processImage(
            file.buffer,
            resize
          );

          const fullPath = `/images/${this.folderName}/${filename}`;

          req.processedImages[fieldName].push({
            filename,
            fullPath,
            buffer: processedBuffer
          });
        }

        req.body[fieldName] =
          req.processedImages[fieldName].length === 1
            ? req.processedImages[fieldName][0].fullPath
            : req.processedImages[fieldName].map(img => img.fullPath);
      }

      next();
    });
  }

  /**
   * Saves processed images to disk
   * @param {Object} processedImages - Object containing processed image buffers
   * @returns {Promise<void>}
   * @private
   */
  async _saveImages(processedImages) {
    for (const [fieldName, images] of Object.entries(processedImages)) {
      for (const image of images) {
        await imageService.saveImage(
          image.buffer,
          image.filename,
          this.folderName
        );
      }
    }
  }

  /**
   * Removes old images when updating
   * @param {Object} oldDoc - Previous document
   * @param {Object} newDoc - Updated document
   * @param {Object} req - Express request object
   * @returns {Promise<void>}
   * @private
   */
  async _removeOldImages(oldDoc, newDoc, req) {
    for (const { name: fieldName } of this.imageFields) {
      // Only remove images if the field is actually being updated in the request
      if (
        oldDoc[fieldName] &&
        fieldName in req.body &&  // Check if the field is in the request body
        oldDoc[fieldName] !== newDoc[fieldName]
      ) {
        const oldImages = Array.isArray(oldDoc[fieldName])
          ? oldDoc[fieldName]
          : [oldDoc[fieldName]];

        for (const oldImage of oldImages) {
          // Extract filename from the full path
          const filename = oldImage.split('/').pop();
          await imageService.deleteImage(filename, this.folderName);
        }
      }
    }
  }

  /**
   * Creates a new document with images
   * @returns {Function} Express middleware
   */
  createOne() {
    return catchAsync(async (req, res, next) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        req.body.user = req.user._id;
        const doc = await this.Model.create([req.body], { session });

        if (req.processedImages) {
          await this._saveImages(req.processedImages);
        }

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
          status: 'success',
          message: 'Created successfully',
          data: { data: doc[0] }
        });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
      }
    });
  }

  /**
   * Updates an existing document and its images
   * @returns {Function} Express middleware
   */
  updateOne() {
    return catchAsync(async (req, res, next) => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const oldDoc = await this.Model.findById(req.params.id).session(
          session
        );
        if (!oldDoc) {
          throw new AppError('No document found with that ID', 404);
        }

        const updatedDoc = await this.Model.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true,
            session
          }
        );

        if (req.processedImages) {
          await this._saveImages(req.processedImages);
          await this._removeOldImages(oldDoc, updatedDoc, req);
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
          status: 'success',
          message: 'Updated successfully',
          data: { data: updatedDoc }
        });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
      }
    });
  }

  /**
   * Deletes a document and its associated images
   * @returns {Function} Express middleware
   */
  deleteOne() {
    return catchAsync(async (req, res, next) => {
      const doc = await this.Model.findById(req.params.id);
      if (!doc) {
        return next(new AppError('No document found with that ID', 404));
      }

      // Delete associated images first
      for (const { name: fieldName } of this.imageFields) {
        if (doc[fieldName]) {
          const images = Array.isArray(doc[fieldName])
            ? doc[fieldName]
            : [doc[fieldName]];

          for (const image of images) {
            // Extract filename from the full path
            const filename = image.split('/').pop();
            await imageService.deleteImage(filename, this.folderName);
          }
        }
      }

      await doc.deleteOne();

      res.status(200).json({
        status: 'success',
        message: 'Deleted successfully'
      });
    });
  }
}

module.exports = ImageHandler;
