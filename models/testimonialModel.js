const mongoose = require('mongoose');
const validator = require('validator');
const counterPlugin = require('./plugins/counterPlugin');
const { slug } = require('../utils/slug');

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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

schema.index({ slug: 1, name: 1 });

schema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slug(this.name);
    if (this.isNew) {
      this.original_slug = slug(this.name);
    }
  }
  next();
});

schema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.name) {
    update.slug = slug(update.name);
  }
  next();
});

schema.plugin(counterPlugin);

const Testimonial = mongoose.model('Testimonial', schema);

module.exports = Testimonial;
