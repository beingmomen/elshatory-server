const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const counterPlugin = require('./plugins/counterPlugin');
const { slug } = require('../utils/slug');

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.']
    },
    slug: String,
    original_slug: String,
    email: {
      type: String,
      required: [true, 'Email is required.'],
      lowercase: true,
      validate: [validator.isEmail, 'Email is not valid.']
    },
    photo: {
      type: String,
      default: '/images/users/default.jpg'
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required.']
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'dev'],
      default: 'user'
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: 8,
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Password confirmation is required.'],
      validate: {
        validator: function validatePasswordMatch(el) {
          return el === this.password;
        },
        message: 'Password and Confirm Password do not match.'
      }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: true
    }
  },

  {
    timestamps: true
  }
);

// Create individual indexes for frequently queried fields
schema.index({ email: 1 }, { unique: true });
schema.index({ slug: 1 });

// Compound index for name and phone if they're frequently queried together
schema.index({ createdAt: -1, name: 1 });
schema.index({ name: 1, phone: 1 });
schema.index({ name: 'text', email: 'text' });

schema.pre('save', function setSlug(next) {
  if (this.isModified('name')) {
    const s = slug(this.name);
    this.slug = s;
    if (this.isNew) {
      this.original_slug = s;
    }
  }
  next();
});

schema.pre('findOneAndUpdate', function updateSlugOnUpdate(next) {
  const update = this.getUpdate();
  if (update.name) {
    update.slug = slug(update.name);
  }
  next();
});

schema.pre('save', async function hashPassword(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

schema.pre('save', function updatePasswordChangedAt(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

schema.pre(/^find/, function filterInactive(next) {
  this.find({ active: { $ne: false } });
  next();
});

schema.methods.correctPassword = async function validatePassword(
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

schema.methods.changedPasswordAfter = function checkPasswordChange(
  JWTTimestamp
) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

schema.methods.createPasswordResetToken = function generateResetToken() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

schema.plugin(counterPlugin);

const User = mongoose.model('User', schema);

module.exports = User;
