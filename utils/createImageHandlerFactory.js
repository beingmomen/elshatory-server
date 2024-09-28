const mongoose = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const createImageHandlerFactory = (Model, imageFields, imagePath) => {
  const multerStorage = multer.memoryStorage();

  const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
  });

  const uploadImages = upload.fields(imageFields);

  const processImages = catchAsync(async (req, res, next) => {
    if (!req.files) return next();

    req.processedImages = {};

    for (const { name: fieldName, resize } of imageFields) {
      if (!req.files[fieldName]) continue;

      const files = Array.isArray(req.files[fieldName])
        ? req.files[fieldName]
        : [req.files[fieldName]];
      req.processedImages[fieldName] = [];

      for (const file of files) {
        const filename = `${imagePath}-${fieldName}-${req.params.id ||
          req.user.id}-${Date.now()}-${files.indexOf(file)}.jpeg`;

        const processedImageBuffer = await sharp(file.buffer)
          .resize(resize.width, resize.height)
          .toFormat('jpeg')
          .jpeg({ quality: resize.quality })
          .toBuffer();

        req.processedImages[fieldName].push({
          filename,
          buffer: processedImageBuffer
        });
      }

      req.body[fieldName] =
        req.processedImages[fieldName].length === 1
          ? req.processedImages[fieldName][0].filename
          : req.processedImages[fieldName].map(img => img.filename);
    }

    next();
  });

  const saveImages = async (processedImages, folderName) => {
    for (const [fieldName, images] of Object.entries(processedImages)) {
      for (const image of images) {
        const folderPath = path.join('images', folderName);
        await fs.mkdir(folderPath, { recursive: true });
        await fs.writeFile(path.join(folderPath, image.filename), image.buffer);
      }
    }
  };

  const removeOldImages = async (oldDoc, newDoc, folderName) => {
    for (const { name: fieldName } of imageFields) {
      if (
        oldDoc[fieldName] &&
        newDoc[fieldName] &&
        oldDoc[fieldName] !== newDoc[fieldName]
      ) {
        const oldImages = Array.isArray(oldDoc[fieldName])
          ? oldDoc[fieldName]
          : [oldDoc[fieldName]];
        for (const oldImage of oldImages) {
          const imagePath = path.join('images', folderName, oldImage);
          try {
            await fs.unlink(imagePath);
          } catch (err) {
            console.error(`Failed to delete old image: ${imagePath}`, err);
          }
        }
      }
    }
  };

  const createOneWithImages = catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      req.body.user = req.user._id;
      const doc = await Model.create([req.body], { session: session });

      if (req.processedImages) {
        await saveImages(req.processedImages, Model.collection.collectionName);
      }

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        status: 'success',
        message: 'Created successfully',
        data: {
          data: doc[0]
        }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      next(error);
    }
  });

  const updateOneWithImages = catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const oldDoc = await Model.findById(req.params.id).session(session);

      if (!oldDoc) {
        throw new AppError('No document found with that ID', 404);
      }

      const updatedDoc = await Model.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
          session: session
        }
      );

      if (req.processedImages) {
        await saveImages(req.processedImages, Model.collection.collectionName);
      }

      await removeOldImages(
        oldDoc,
        updatedDoc,
        Model.collection.collectionName
      );

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        status: 'success',
        message: 'Updated successfully',
        data: {
          data: updatedDoc
        }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      next(error);
    }
  });

  return {
    uploadImages,
    processImages,
    createOneWithImages,
    updateOneWithImages
  };
};

module.exports = createImageHandlerFactory;
