const mongoose = require('mongoose');
const { slug } = require('../controllers/globalFactory');

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required. #&& الاسم مطلوب.'],
      unique: true
    },
    slug: String,
    original_slug: String,
    description: {
      type: String
    },
    image: {
      type: String,
      required: [false, 'Image is required. #&& الصورة مطلوبة.']
    },
    imageCover: {
      type: String,
      required: [false, 'Image Cover is required.']
    },
    images: {
      type: [String],
      required: [false, 'images is required.']
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: true
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Category must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

schema.index({ slug: 1 });

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

const Category = mongoose.model('Category', schema);

module.exports = Category;
