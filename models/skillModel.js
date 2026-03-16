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
    icon: {
      type: String,
      required: [true, 'Icon is required'],
      trim: true
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Skill must belong to a user'],
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

schema.plugin(counterPlugin);

const Skill = mongoose.model('Skill', schema);

module.exports = Skill;
