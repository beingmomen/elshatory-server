const mongoose = require('mongoose');
const counterPlugin = require('./plugins/counterPlugin');

const schema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      trim: true
    },
    workPlace: {
      type: String,
      required: [true, 'Work place is required'],
      trim: true
    },
    startDate: {
      type: String,
      required: [true, 'Start date is required'],
      trim: true
    },
    endDate: {
      type: String,
      required: [true, 'End date is required'],
      trim: true
    },
    responsibilities: {
      type: [String],
      required: [true, 'Responsibilities are required'],
      validate: {
        validator: v => v.length >= 1,
        message: 'At least 1 responsibility is required'
      }
    },
    linkedInUrl: {
      type: String,
      trim: true
    },
    companySiteUrl: {
      type: String,
      trim: true
    },
    iconName: {
      type: String,
      trim: true
    },
    imageAlt: {
      type: String,
      trim: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

schema.index({ order: 1 });
schema.plugin(counterPlugin);

const Experience = mongoose.model('Experience', schema);

module.exports = Experience;
