const mongoose = require('mongoose');
const { slug } = require('../controllers/globalFactory');
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
    image: {
      type: String,
      required: [true, 'Image is required']
    },
    website: {
      type: String,
      required: [false, 'Website is required']
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
      required: [true, 'Client must belong to a user'],
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
schema.index({ createdAt: -1, name: 1 });

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

const Client = mongoose.model('Client', schema);

module.exports = Client;
