const multer = require('multer');
const cloudinary = require('../config/cloudinary.config');
const AppError = require('../utils/appError');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }
});

const uploadToCloudinary = buffer =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `${process.env.CLOUDINARY_UPLOAD_PRESET}/infos`,
          transformation: [
            { width: 800, height: 800, crop: 'fill', quality: 85 }
          ],
          format: 'jpeg'
        },
        (err, result) => (err ? reject(err) : resolve(result))
      )
      .end(buffer);
  });

// Match "images[N][src]" → returns N
const getImageIndex = fieldname => {
  const m = fieldname.match(/^images\[(\d+)\]\[src\]$/);
  return m ? parseInt(m[1], 10) : null;
};

exports.handleImages = (req, res, next) => {
  upload.any()(req, res, async err => {
    if (err) return next(new AppError(err.message, 400));

    try {
      const imageFiles = (req.files || []).filter(
        f => getImageIndex(f.fieldname) !== null
      );

      await Promise.all(
        imageFiles.map(async file => {
          const idx = getImageIndex(file.fieldname);
          const result = await uploadToCloudinary(file.buffer);
          req.body[`images[${idx}][src]`] = result.secure_url;
        })
      );

      next();
    } catch (error) {
      next(error);
    }
  });
};
