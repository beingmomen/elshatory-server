const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.ObjectId,
      ref: 'Job',
      required: [true, 'Resume draft must reference a job'],
      index: true
    },
    profileVersion: {
      type: String
    },
    format: {
      type: String,
      enum: ['text', 'html', 'markdown'],
      default: 'text'
    },
    content: {
      type: mongoose.Schema.Types.Mixed
    },
    warnings: [String],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Resume draft must belong to a user'],
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

schema.index({ job: 1, user: 1 });

const ResumeDraft = mongoose.model('ResumeDraft', schema);

module.exports = ResumeDraft;
