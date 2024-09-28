const fs = require('fs').promises;
const path = require('path');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const deleteImageMiddleware = (Model, imageFields) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    for (const field of imageFields) {
      if (doc[field]) {
        const imagesToDelete = Array.isArray(doc[field])
          ? doc[field]
          : [doc[field]];

        for (const image of imagesToDelete) {
          // Extract the folder name from the image filename
          const folderName = image.split('-')[0];
          const imagePath = path.join('images', folderName, image);

          try {
            await fs.unlink(imagePath);
            console.log(`Successfully deleted image: ${imagePath}`);
          } catch (err) {
            console.error(`Failed to delete image: ${imagePath}`, err);
            // Continue with the next image even if one fails to delete
          }
        }
      }
    }

    next();
  });

module.exports = deleteImageMiddleware;
