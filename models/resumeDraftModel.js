const mongoose = require('mongoose');

const resumeDraftSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    summary: { type: String, default: '' },
    highlightedSkills: { type: [String], default: [] },
    experienceBullets: { type: [String], default: [] },
    suggestedKeywords: { type: [String], default: [] },
    rawOutput: { type: String, default: '' },
    generatedBy: {
      type: String,
      enum: ['llm', 'template'],
      default: 'llm'
    }
  },
  { timestamps: true }
);

resumeDraftSchema.index({ job: 1, createdAt: -1 });

module.exports = mongoose.model('ResumeDraft', resumeDraftSchema);
