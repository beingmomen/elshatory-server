const CareerProfile = require('../models/careerProfileModel');
const catchAsync = require('../utils/catchAsync');

const ALLOWED_FIELDS = [
  'targetRoles',
  'targetSeniority',
  'defaultStacks',
  'optionalStacks',
  'locationPreferences',
  'workplacePreferences',
  'requiredKeywords',
  'excludedKeywords',
  'maxJobAgeDays'
];

const sanitize = body => {
  const out = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
};

exports.getProfile = catchAsync(async (req, res) => {
  const userId = req.user?._id;
  const filter = userId ? { user: userId } : {};
  let profile = await CareerProfile.findOne(filter);

  if (!profile) {
    profile = await CareerProfile.create({ ...(userId && { user: userId }) });
  }

  res.status(200).json({ status: 'success', data: profile });
});

exports.updateSettings = catchAsync(async (req, res) => {
  const userId = req.user?._id;
  const filter = userId ? { user: userId } : {};
  const update = sanitize(req.body);

  const profile = await CareerProfile.findOneAndUpdate(
    filter,
    { $set: update, ...(userId && { $setOnInsert: { user: userId } }) },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ status: 'success', data: profile });
});
