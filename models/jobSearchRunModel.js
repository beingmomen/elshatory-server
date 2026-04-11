const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ['wuzzuf', 'linkedin', 'all'],
      required: [true, 'Search run source is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'partial'],
      default: 'pending',
      index: true
    },
    query: {
      type: mongoose.Schema.Types.Mixed
    },
    sourceStats: {
      type: mongoose.Schema.Types.Mixed
    },
    stats: {
      fetched: { type: Number, default: 0 },
      saved: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      errors: { type: Number, default: 0 }
    },
    errorMessage: {
      type: String
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Search run must belong to a user'],
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

schema.index({ createdAt: -1 });

const JobSearchRun = mongoose.model('JobSearchRun', schema);

module.exports = JobSearchRun;
