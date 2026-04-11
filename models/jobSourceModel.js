const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: ['wuzzuf', 'linkedin'],
      required: [true, 'Source key is required'],
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Source name is required'],
      trim: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    mode: {
      type: String,
      enum: ['automatic', 'manual_import', 'disabled'],
      default: 'disabled'
    },
    lastHealthStatus: {
      type: String,
      enum: ['healthy', 'degraded', 'down'],
      default: 'healthy'
    },
    lastCheckedAt: {
      type: Date
    },
    lastError: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const JobSource = mongoose.model('JobSource', schema);

module.exports = JobSource;
