const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const AppError = require('../appError');

/**
 * Service class for handling core image operations
 * @class ImageService
 */
class ImageService {
  /**
   * Creates an instance of ImageService
   * Initializes multer storage and upload configuration
   */
  constructor() {
    this.storage = multer.memoryStorage();
    this.upload = multer({
      storage: this.storage,
      fileFilter: this._fileFilter
    });
  }

  /**
   * Multer file filter to ensure only images are uploaded
   * @param {Object} req - Express request object
   * @param {Object} file - Uploaded file object
   * @param {Function} cb - Callback function
   * @private
   */
  _fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
  }

  /**
   * Process an image buffer with Sharp
   * @param {Buffer} buffer - Image buffer to process
   * @param {Object} options - Processing options
   * @param {number} [options.width=500] - Output width
   * @param {number} [options.height=500] - Output height
   * @param {number} [options.quality=90] - JPEG quality
   * @param {string} [options.format='jpeg'] - Output format
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async processImage(buffer, options = {}) {
    const {
      width = 500,
      height = 500,
      quality = 90,
      format = 'jpeg'
    } = options;

    return sharp(buffer)
      .resize(width, height)
      .toFormat(format)
      .jpeg({ quality })
      .toBuffer();
  }

  /**
   * Save an image buffer to disk
   * @param {Buffer} buffer - Image buffer to save
   * @param {string} filename - Target filename
   * @param {string} folderPath - Target folder path
   * @returns {Promise<string>} Saved filename
   */
  async saveImage(buffer, filename, folderPath) {
    const fullPath = path.join('public/images', folderPath);
    await fs.mkdir(fullPath, { recursive: true });
    await fs.writeFile(path.join(fullPath, filename), buffer);
    return filename;
  }

  /**
   * Delete an image from disk
   * @param {string} filename - Image filename to delete
   * @param {string} folderPath - Folder path containing the image
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteImage(filename, folderPath) {
    try {
      const fullPath = path.join('public/images', folderPath, filename);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error(`Failed to delete image: ${filename}`, error);
      return false;
    }
  }

  /**
   * Generate a unique filename for an image
   * @param {string} prefix - Filename prefix (usually folder name)
   * @param {string} fieldName - Form field name
   * @param {string} identifier - Unique identifier (user ID or record ID)
   * @param {number} [index=0] - Index for multiple files
   * @returns {string} Generated filename
   */
  generateFilename(prefix, fieldName, identifier, index = 0) {
    return `${prefix}-${fieldName}-${identifier}-${Date.now()}-${index}.jpeg`;
  }
}

module.exports = new ImageService();
