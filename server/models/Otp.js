const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
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
      index: { expires: '15m' } // MongoDB automatically purges expired records
    }
  },
  {
    timestamps: true
  }
);

OtpSchema.index({ email: 1, expiresAt: 1 });

module.exports = mongoose.model('Otp', OtpSchema);
