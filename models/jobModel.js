const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema(
  {
    min: Number,
    max: Number,
    currency: { type: String, default: 'EGP' }
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ['wuzzuf', 'linkedin', 'manual'],
      required: [true, 'Job source is required'],
      index: true
    },
    sourceJobId: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    workplace: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid']
    },
    seniority: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'lead', 'manager', 'any']
    },
    jobUrl: {
      type: String,
      trim: true
    },
    applyUrl: {
      type: String,
      trim: true
    },
    postedAt: {
      type: Date
    },
    description: {
      type: String
    },
    requirements: [String],
    skills: [String],
    tags: [String],
    salary: salarySchema,
    status: {
      type: String,
      enum: ['new', 'reviewed', 'saved', 'applied', 'rejected', 'expired'],
      default: 'new',
      index: true
    },
    rawText: {
      type: String
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed
    },
    firstSeenAt: {
      type: Date,
      default: Date.now
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Job must belong to a user'],
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

schema.index({ source: 1, sourceJobId: 1 }, { unique: true, sparse: true });
schema.index({ source: 1, jobUrl: 1 });
schema.index({ status: 1, createdAt: -1 });
schema.index({ source: 1, status: 1 });
schema.index(
  { title: 'text', company: 'text', description: 'text', skills: 'text' },
  { name: 'job_text_index' }
);

const Job = mongoose.model('Job', schema);

module.exports = Job;
