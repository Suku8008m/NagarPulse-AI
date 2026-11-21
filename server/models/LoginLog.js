const mongoose = require('mongoose');

const LoginLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['citizen', 'operator', 'admin'],
      required: true
    },
    department: {
      type: String,
      default: 'All'
    },
    loginMethod: {
      type: String,
      enum: ['credentials', 'demo-quick-login'],
      default: 'credentials'
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    userAgent: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('LoginLog', LoginLogSchema);
