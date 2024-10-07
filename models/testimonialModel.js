const mongoose = require('mongoose');
const validator = require('validator');
const { slug } = require('../controllers/globalFactory');

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.']
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      lowercase: true,
      validate: [validator.isEmail, 'Email is not valid.']
    },
    slug: String,
    original_slug: String,
    description: {
      type: String,
      required: [true, 'Description is required.']
    },
    image: {
      type: String,
      required: [true, 'Image is required.']
    },
    isConfirmed: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: true
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

schema.index({ slug: 1, name: 1 });

// DOCUMENT MIDDLEWARE: runs before .save() and .create()

schema.pre('save', function(next) {
  this.original_slug = slug(this.name);
  next();
});

schema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slug(this.name);
  }
  next();
});

schema.pre('findOneAndUpdate', function(next) {
  if (this._update.name) {
    this._update.slug = slug(this._update.name);
  }
  next();
});

const Testimonial = mongoose.model('Testimonial', schema);

module.exports = Testimonial;
