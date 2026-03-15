const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  blog: {
    type: mongoose.Schema.ObjectId,
    ref: 'Blog',
    required: [true, 'Blog reference is required'],
    index: true
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  sessionId: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Fast cooldown check: find recent view by blog + ip
schema.index({ blog: 1, ip: 1, timestamp: -1 });

// TTL index: auto-delete records after 90 days
schema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const BlogView = mongoose.model('BlogView', schema);

module.exports = BlogView;
