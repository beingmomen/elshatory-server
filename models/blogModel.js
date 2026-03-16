const mongoose = require('mongoose');
const counterPlugin = require('./plugins/counterPlugin');
const { slug } = require('../utils/slug');
const { parseHeadings } = require('../utils/headingParser');

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
      unique: true,
      index: true
    },
    original_slug: String,
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    content: {
      type: String,
      required: [false, 'Content is required'],
      trim: true
    },
    tableOfContents: {
      type: [
        {
          id: String,
          text: String,
          level: Number
        }
      ],
      default: []
    },
    image: {
      type: String,
      required: [true, 'Image is required']
    },
    altText: {
      type: String,
      trim: true
    },
    tags: {
      type: [String],
      required: [true, 'Tags are required'],
      validate: {
        validator: v => v.length >= 3,
        message: 'At least 3 tags are required'
      }
    },
    keywords: {
      type: String,
      required: [true, 'Keywords are required'],
      trim: true
    },
    resources: {
      type: [
        {
          url: {
            type: String,
            required: [true, 'Resource URL is required'],
            validate: {
              validator: v => URL.canParse(v),
              message: 'Invalid URL'
            }
          },
          title: {
            type: String
          }
        }
      ],
      required: [true, 'Resources are required'],
      validate: {
        validator: v => v.length >= 1,
        message: 'At least 1 resource is required'
      }
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    isArabicArticle: {
      type: Boolean,
      default: true
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Blog must belong to a user'],
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
schema.index({
  title: 'text',
  description: 'text',
  content: 'text',
  tags: 'text'
});

schema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slug(this.title);
    if (this.isNew) {
      this.original_slug = slug(this.title);
    }
  }
  next();
});

schema.pre('save', function (next) {
  if (this.isModified('content')) {
    const result = parseHeadings(this.content);
    this.content = result.content;
    this.tableOfContents = result.tableOfContents;
  }
  next();
});

schema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.title) {
    update.slug = slug(update.title);
  }
  if (update.content) {
    const result = parseHeadings(update.content);
    update.content = result.content;
    update.tableOfContents = result.tableOfContents;
  }
  next();
});

schema.plugin(counterPlugin);

const Blog = mongoose.model('Blog', schema);

module.exports = Blog;
