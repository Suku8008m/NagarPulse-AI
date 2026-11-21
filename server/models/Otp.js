const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    rawOtp: {
      type: String,
      default: ''
    },
    verified: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '10m' } // MongoDB automatically purges expired records
    }
  },
  {
    timestamps: true
  }
);

// Compound index for quick lookup of active OTPs
OtpSchema.index({ email: 1, phone: 1, expiresAt: 1 });

module.exports = mongoose.model('Otp', OtpSchema);
