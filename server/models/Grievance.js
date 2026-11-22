const mongoose = require('mongoose');
const { generateTrackingId } = require('../utils/generateTrackingId');

const GrievanceSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      default: () => generateTrackingId('NP')
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    beforeImageUrl: {
      type: String,
      required: true
    },
    afterImageUrl: {
      type: String,
      default: ''
    },
    beforeImageHash: {
      type: String,
      default: '',
      index: true
    },
    afterImageHash: {
      type: String,
      default: ''
    },
    captureSource: {
      type: String,
      enum: ['LIVE_GEO_CAM', 'FILE_UPLOAD', 'SEED'],
      default: 'FILE_UPLOAD'
    },
    verificationSource: {
      type: String,
      enum: ['AI_VISION_VERIFIED', 'ADMIN_MANUAL_OVERRIDE', 'PENDING'],
      default: 'PENDING'
    },
    audioUrl: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      required: true,
      enum: ['Roads', 'Sanitation', 'Water', 'Electrical', 'Other'],
      default: 'Other'
    },
    severityScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 5
    },
    department: {
      type: String,
      required: true,
      default: 'General Civic Administration'
    },
    assignedDepartment: {
      type: String,
      default: ''
    },
    aiSummary: {
      type: String,
      default: ''
    },
    isVerifiedAuthentic: {
      type: Boolean,
      default: true
    },
    aiModelUsed: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Verified Resolved'],
      default: 'Pending',
      index: true
    },
    upvotes: {
      type: Number,
      default: 1,
      min: 0
    },
    locationName: {
      type: String,
      default: 'Nellore Municipal Corporation'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude] in GeoJSON format
        required: true
      }
    },
    reportedBy: {
      type: mongoose.Schema.Types.Mixed,
      default: 'Anonymous Citizen'
    },
    reporterName: {
      type: String,
      default: 'Anonymous Citizen'
    },
    reporterEmail: {
      type: String,
      default: ''
    },
    resolvedBy: {
      id: { type: mongoose.Schema.Types.Mixed, default: null },
      name: { type: String, default: '' },
      role: { type: String, default: '' },
      department: { type: String, default: '' },
      resolvedAt: { type: Date, default: null }
    },
    verificationNotes: {
      type: String,
      default: ''
    },
    aiVerification: {
      isResolved: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 },
      qualityAssessment: { type: String, default: '' },
      verificationNote: { type: String, default: '' },
      aiModelUsed: { type: String, default: '' }
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    auditTrail: [
      {
        action: { type: String, required: true },
        actor: { type: String, default: 'System' },
        role: { type: String, default: 'system' },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' }
      }
    ]
  },
  {
    timestamps: true
  }
);

// 2dsphere index on location for geospatial queries ($near, $geoWithin)
GrievanceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Grievance', GrievanceSchema);
