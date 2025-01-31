const mongoose = require('mongoose');
const validator = require('validator');
const { slug } = require('../controllers/globalFactory');
const counterPlugin = require('./plugins/counterPlugin');

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.']
    },
    email: {
      type: String,
      required: [false, 'Email is required.'],
      lowercase: true,
      validate: [validator.isEmail, 'Email is not valid.']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required.']
    },
    slug: String,
    original_slug: String,
    description: {
      type: String,
      required: [true, 'Description is required.']
    },
    createdAt: {
      type: Date,
      default: Date.now,
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

schema.plugin(counterPlugin);

const Contact = mongoose.model('Contact', schema);

module.exports = Contact;
