const mongoose = require('mongoose');

const careerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      sparse: true,
      index: true
    },
    targetRoles: { type: [String], default: [] },
    targetSeniority: { type: [String], default: [] },
    defaultStacks: { type: [String], default: [] },
    optionalStacks: { type: [String], default: [] },
    locationPreferences: { type: [String], default: [] },
    workplacePreferences: { type: [String], default: [] },
    requiredKeywords: { type: [String], default: [] },
    excludedKeywords: { type: [String], default: [] },
    maxJobAgeDays: { type: Number, default: 60, min: 1, max: 365 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CareerProfile', careerProfileSchema);
