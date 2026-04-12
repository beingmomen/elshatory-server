const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    targetRoles: [String],
    targetSeniority: [String],
    defaultStacks: [String],
    optionalStacks: [String],
    locationPreferences: [String],
    workplacePreferences: {
      type: [String],
      enum: ['onsite', 'remote', 'hybrid']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Career profile settings must belong to a user'],
      unique: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const CareerProfileSettings = mongoose.model('CareerProfileSettings', schema);

module.exports = CareerProfileSettings;
