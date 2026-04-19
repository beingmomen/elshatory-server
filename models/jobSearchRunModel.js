const mongoose = require('mongoose');

const sourceStatSchema = new mongoose.Schema(
  {
    saved: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
    rejectedByAI: { type: Number, default: 0 },
    degraded: { type: Boolean, default: false },
    degradedReason: {
      type: String,
      enum: ['manual_import_only', 'disabled_by_config', 'rate_limited', ''],
      default: ''
    }
  },
  { _id: false, suppressReservedKeysWarning: true }
);

const statsSchema = new mongoose.Schema(
  {
    saved: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
    rejectedByAI: { type: Number, default: 0 }
  },
  { _id: false, suppressReservedKeysWarning: true }
);

const jobSearchRunSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    terms: { type: [String], default: [] },
    source: {
      type: String,
      enum: ['wuzzuf', 'linkedin', 'all'],
      required: true
    },
    location: { type: String, default: '' },
    maxPages: { type: Number, default: 3 },
    maxJobs: { type: Number, default: 60 },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'partial', 'failed'],
      default: 'pending',
      index: true
    },
    stats: { type: statsSchema, default: () => ({}) },
    sourceStats: {
      wuzzuf: { type: sourceStatSchema, default: null },
      linkedin: { type: sourceStatSchema, default: null }
    },
    errorMessage: { type: String, default: '' },
    startedAt: { type: Date },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

jobSearchRunSchema.index({ createdAt: -1 });
jobSearchRunSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('JobSearchRun', jobSearchRunSchema);
