const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    otpHash: {
      type: String,
      default: null
    },
    otpExpiresAt: {
      type: Date,
      default: null
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['citizen', 'operator', 'admin'],
      default: 'citizen',
      index: true
    },
    department: {
      type: String,
      enum: ['Roads', 'Sanitation', 'Water', 'Electrical', 'All'],
      default: 'All'
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    loginCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Method to verify entered password against hashed password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Exclude sensitive fields from JSON transformations
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.otpHash;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
