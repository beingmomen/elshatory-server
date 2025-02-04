const mongoose = require('mongoose');
const validator = require('validator');

const schema = new mongoose.Schema(
  {
    resumeUrl: {
      type: String,
      required: [true, 'Resume URL is required'],
      validate: {
        validator: function(value) {
          return validator.isURL(value);
        },
        message: 'Please provide a valid URL for the resume'
      }
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: true,
      index: true
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

schema.index({ fieldToBeUnique: 1 }, { unique: true });

const Info = mongoose.model('Info', schema);

module.exports = Info;
