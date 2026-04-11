const CareerProfileSettings = require('../models/careerProfileSettingsModel');
const catchAsync = require('../utils/catchAsync');
const { buildSnapshot } = require('../services/careerProfile/snapshot');

exports.getProfile = catchAsync(async (req, res) => {
  const snapshot = await buildSnapshot(req.user.id);

  res.status(200).json({
    status: 'success',
    data: { profile: snapshot }
  });
});

exports.updateSettings = catchAsync(async (req, res) => {
  const allowedFields = [
    'targetRoles',
    'targetSeniority',
    'defaultStacks',
    'optionalStacks',
    'locationPreferences',
    'workplacePreferences'
  ];

  const updateData = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const settings = await CareerProfileSettings.findOneAndUpdate(
    { user: req.user.id },
    { ...updateData, user: req.user.id },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: { settings }
  });
});
