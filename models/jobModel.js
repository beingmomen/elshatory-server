const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0, max: 100 },
    level: {
      type: String,
      enum: ['strong', 'good', 'possible', 'stretch', 'poor']
    },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    reasons: { type: [String], default: [] },
    risks: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    generatedBy: {
      type: String,
      enum: ['rules', 'llm', 'hybrid'],
      default: 'llm'
    },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    company: { type: String, trim: true, index: true },
    location: { type: String, trim: true },
    description: { type: String, default: '' },
    requirements: { type: [String], default: [] },
    skills: { type: [String], default: [] },

    jobUrl: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    source: {
      type: String,
      enum: ['wuzzuf', 'linkedin', 'manual'],
      required: true,
      index: true
    },
    externalId: { type: String, trim: true },

    seniority: { type: String, trim: true },
    workplace: { type: String, trim: true },
    salary: { type: String, trim: true },
    postedAt: { type: Date },

    status: {
      type: String,
      enum: ['new', 'shortlisted', 'ignored', 'cv_ready', 'applied'],
      default: 'new',
      index: true
    },

    latestMatch: { type: matchSchema, default: null },
    lastSeenAt: { type: Date, default: Date.now },

    searchRun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobSearchRun'
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

jobSchema.index({ title: 'text', company: 'text', description: 'text' });
jobSchema.index({ source: 1, status: 1 });
jobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
