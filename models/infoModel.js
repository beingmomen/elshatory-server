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
    },
    bio: {
      paragraphs: {
        type: [String],
        default: []
      },
      quote: {
        type: String,
        trim: true
      }
    },
    stats: [
      {
        value: { type: String, trim: true },
        label: { type: String, trim: true },
        icon: { type: String, trim: true },
        _id: false
      }
    ],
    skills: [
      {
        title: { type: String, trim: true },
        icon: { type: String, trim: true },
        items: [
          {
            name: { type: String, trim: true },
            icon: { type: String, trim: true },
            _id: false
          }
        ],
        _id: false
      }
    ],
    images: [
      {
        src: { type: String, trim: true },
        alt: { type: String, trim: true },
        _id: false
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Info = mongoose.model('Info', schema);

module.exports = Info;
