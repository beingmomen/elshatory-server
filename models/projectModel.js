const mongoose = require('mongoose');
const counterPlugin = require('./plugins/counterPlugin');
const { slug } = require('../utils/slug');

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
    tag: {
      type: String,
      required: [true, 'Tag is required'],
      trim: true
    },
    url: {
      type: String,
      required: [true, 'Url is required'],
      trim: true,
      validate: {
        validator(value) {
          return URL.canParse(value);
        },
        message: 'Please provide a valid URL'
      }
    },
    skillIds: {
      type: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'Skill'
        }
      ],
      required: [true, 'Skills are required'],
      validate: {
        validator(val) {
          return val.length >= 3;
        },
        message: 'Project must have at least 3 skills'
      }
    },
    isActive: {
      type: Boolean,
      default: true
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
      required: [true, 'Project must belong to a user'],
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
schema.index({ createdAt: -1, title: 1 });
schema.index({ isActive: 1, createdAt: -1 });

schema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slug(this.title);
    if (this.isNew) {
      this.original_slug = slug(this.title);
    }
  }
  next();
});

schema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.title) {
    update.slug = slug(update.title);
  }
  next();
});

schema.virtual('skills', {
  ref: 'Skill',
  localField: 'skillIds',
  foreignField: '_id',
  justOne: false,
  options: { select: 'title' }
});

schema.plugin(counterPlugin);

const Project = mongoose.model('Project', schema);

module.exports = Project;
