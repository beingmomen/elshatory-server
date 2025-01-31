const mongoose = require('mongoose');
const { slug } = require('../controllers/globalFactory');
const counterPlugin = require('./plugins/counterPlugin');

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
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
    createdAt: {
      type: Date,
      default: Date.now,
      select: true,
      index: true
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Service must belong to a user'],
      index: true
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create compound indexes for common query patterns
schema.index({ slug: 1, user: 1 });
schema.index({ createdAt: -1, title: 1 });

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
schema.pre('save', function(next) {
  this.original_slug = slug(this.title);
  next();
});

schema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slug(this.title);
  }
  next();
});

schema.pre('findOneAndUpdate', function(next) {
  if (this._update.title) {
    this._update.slug = slug(this._update.title);
  }
  next();
});

schema.plugin(counterPlugin);

const Service = mongoose.model('Service', schema);

module.exports = Service;
