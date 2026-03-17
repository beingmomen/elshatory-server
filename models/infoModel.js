const mongoose = require('mongoose');
const validator = require('validator');

const schema = new mongoose.Schema(
  {
    resumeUrl: {
      type: String,
      required: [true, 'Resume URL is required'],
      validate: {
        validator(value) {
          return validator.isURL(value);
        },
        message: 'Please provide a valid URL for the resume'
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Info = mongoose.model('Info', schema);

module.exports = Info;
