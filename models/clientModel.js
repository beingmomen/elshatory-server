const mongoose = require('mongoose');
const counterPlugin = require('./plugins/counterPlugin');
const { slug } = require('../utils/slug');

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
    website: {
      type: String,
      validate: {
        validator(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Website must be a valid URL.'
      }
    },
    altText: {
      type: String,
      required: [true, 'Alt text is required'],
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Image is required']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Client must belong to a user'],
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

schema.index({ slug: 1, user: 1 });
schema.index({ createdAt: -1, name: 1 });

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

const Client = mongoose.model('Client', schema);

module.exports = Client;
