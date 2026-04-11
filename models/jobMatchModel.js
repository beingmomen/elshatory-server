const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.ObjectId,
      ref: 'Job',
      required: [true, 'Job match must reference a job'],
      index: true
    },
    profileVersion: {
      type: String
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    level: {
      type: String,
      enum: ['strong', 'good', 'possible', 'stretch', 'poor']
    },
    matchedSkills: [String],
    missingSkills: [String],
    reasons: [String],
    risks: [String],
    recommendations: [String],
    generatedBy: {
      type: String,
      enum: ['rules', 'llm', 'hybrid'],
      default: 'rules'
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Job match must belong to a user'],
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

schema.index({ job: 1, user: 1 }, { unique: true });

const JobMatch = mongoose.model('JobMatch', schema);

module.exports = JobMatch;
