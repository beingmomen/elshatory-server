const mongoose = require('mongoose');
const { slug } = require('../utils/slug');
const counterPlugin = require('./plugins/counterPlugin');

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      unique: true,
      index: true
    },
    slug: {
      type: String,
      index: true
    },
    original_slug: String,
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Image is required']
    },
    imageCover: {
      type: String,
      required: [true, 'Image Cover is required']
    },
    images: {
      type: [String],
      required: [true, 'Images are required']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Category must belong to a user'],
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Create compound indexes for common query patterns
schema.index({ slug: 1, user: 1 });
schema.index({ createdAt: -1, name: 1 });
schema.index({ name: 'text', description: 'text' });

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
schema.pre('save', function setSlug(next) {
  if (this.isModified('name')) {
    const s = slug(this.name);
    this.slug = s;
    if (this.isNew) {
      this.original_slug = s;
    }
  }
  next();
});

schema.pre('findOneAndUpdate', function updateSlugOnUpdate(next) {
  const update = this.getUpdate();
  if (update.name) {
    update.slug = slug(update.name);
  }
  next();
});

schema.plugin(counterPlugin);

const Category = mongoose.model('Category', schema);

module.exports = Category;
