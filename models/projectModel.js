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
    tag: {
      type: String,
      required: [true, 'Tag is required'],
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    url: {
      type: String,
      required: [true, 'Url is required'],
      trim: true,
      validate: {
        validator: function(value) {
          try {
            new URL(value);
            return true;
          } catch (error) {
            return false;
          }
        },
        message: 'Please provide a valid URL'
      }
    },
    tagIds: {
      type: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'Skill'
        }
      ],
      required: [true, 'Tags are required'],
      validate: {
        validator: function(val) {
          return val.length > 0 && val.length >= 3;
        },
        message: 'Project must have at least 3 skills as tags'
      }
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
      required: [true, 'Project must belong to a user'],
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

// Add virtual field for populated tags
schema.virtual('tags', {
  ref: 'Skill',
  localField: 'tagIds',
  foreignField: '_id',
  justOne: false,
  options: { select: 'title' }
});

schema.plugin(counterPlugin);

const Project = mongoose.model('Project', schema);

module.exports = Project;
