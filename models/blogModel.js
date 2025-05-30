const mongoose = require('mongoose');
const { slug } = require('../controllers/globalFactory');
const counterPlugin = require('./plugins/counterPlugin');
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
      required: [true, 'Content is required'],
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
      required: [false, 'Alt text is required'],
      trim: true
    },
    tag: {
      type: String,
      required: [true, 'Tag is required'],
      trim: true
    },
    keywords: {
      type: String,
      required: [false, 'Keywords are required'],
      trim: true
    },
    links: {
      type: [
        {
          url: {
            type: String,
            required: true
          },
          title: {
            type: String,
            required: false
          }
        }
      ],
      default: [],
      required: false
    },
    views: {
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
    createdAt: {
      type: Date,
      default: Date.now,
      select: true,
      index: true
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Blog must belong to a user'],
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

// Added text index for better performance in blog text search queries
schema.index({
  title: 'text',
  description: 'text',
  content: 'text',
  tag: 'text'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
schema.pre('save', function(next) {
  this.original_slug = slug(this.title);
  next();
});

// Process content to extract headings and generate table of contents
schema.pre('save', function(next) {
  if (this.isModified('content')) {
    const { content, tableOfContents } = parseHeadings(this.content);
    this.content = content;
    this.tableOfContents = tableOfContents;
  }
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

  // Process content to extract headings and generate table of contents
  if (this._update.content) {
    const { content, tableOfContents } = parseHeadings(this._update.content);
    this._update.content = content;
    this._update.tableOfContents = tableOfContents;
  }
  next();
});

schema.plugin(counterPlugin);

const Blog = mongoose.model('Blog', schema);

module.exports = Blog;
