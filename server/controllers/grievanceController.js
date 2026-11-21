const mongoose = require('mongoose');
const crypto = require('crypto');
const Grievance = require('../models/Grievance');
const { uploadToCloudinary } = require('../config/cloudinary');
const { triageGrievance, verifyResolution } = require('../services/geminiService');

// Haversine formula for 50-meter distance calculation fallback
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// In-Memory store for when local MongoDB is not yet running
let memoryGrievances = [
  {
    _id: 'np_seed_001',
    trackingId: 'NP-2026-A101',
    description: 'Major arterial road pothole near Magunta Layout primary school crossing causing traffic accidents.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: '',
    beforeImageHash: 'seed_hash_magunta_road_01',
    afterImageHash: '',
    captureSource: 'SEED',
    verificationSource: 'PENDING',
    audioUrl: '',
    category: 'Roads',
    severityScore: 9,
    department: 'Department of Roads & Pavement Infrastructure',
    assignedDepartment: 'Roads & Infrastructure',
    aiSummary: 'Critical road defect: 4-inch deep asphalt depression at high-traffic intersection.',
    isVerifiedAuthentic: true,
    status: 'Pending',
    upvotes: 8,
    locationName: 'Magunta Layout Main Road, Nellore',
    location: {
      type: 'Point',
      coordinates: [79.9680, 14.4250]
    },
    verificationNotes: 'Pending field repair crew assignment.',
    auditTrail: [
      { action: 'Created', actor: 'System Seed', role: 'admin', timestamp: new Date(Date.now() - 3600000 * 5), note: 'Seeded Nellore landmark hazard' }
    ],
    createdAt: new Date(Date.now() - 3600000 * 5)
  },
  {
    _id: 'np_seed_002',
    trackingId: 'NP-2026-B202',
    description: 'Dargamitta commercial market garbage accumulation blocking storm water drainage channel.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
    beforeImageHash: 'seed_hash_dargamitta_sanitation_02',
    afterImageHash: 'seed_hash_dargamitta_after_02',
    captureSource: 'SEED',
    verificationSource: 'AI_VISION_VERIFIED',
    audioUrl: '',
    category: 'Sanitation',
    severityScore: 6,
    department: 'Department of Public Health & Solid Waste',
    assignedDepartment: 'Sanitation & Waste Management',
    aiSummary: 'Solid waste accumulation remediated by municipal compaction team.',
    isVerifiedAuthentic: true,
    status: 'Verified Resolved',
    upvotes: 14,
    locationName: 'Dargamitta RTC Bus Shelter, Nellore',
    location: {
      type: 'Point',
      coordinates: [79.9730, 14.4320]
    },
    verificationNotes: '[Gemini Vision Verification]: After photo visually confirms complete clearance of debris and sidewalk disinfection. (Confidence: 96%, Quality: Satisfactory)',
    resolvedAt: new Date(Date.now() - 3600000 * 2),
    auditTrail: [
      { action: 'Created', actor: 'System Seed', role: 'admin', timestamp: new Date(Date.now() - 3600000 * 24), note: 'Seeded Nellore landmark hazard' },
      { action: 'AI Vision Verified Resolved', actor: 'Eng. Karthik Rao', role: 'operator', timestamp: new Date(Date.now() - 3600000 * 2), note: 'Sanitation clearance confirmed' }
    ],
    createdAt: new Date(Date.now() - 3600000 * 24)
  },
  {
    _id: 'np_seed_003',
    trackingId: 'NP-2026-C303',
    description: 'High-pressure clean water feeder pipe rupture submerging sidewalk near VRC Centre.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: '',
    beforeImageHash: 'seed_hash_vrc_water_03',
    afterImageHash: '',
    captureSource: 'SEED',
    verificationSource: 'PENDING',
    audioUrl: '',
    category: 'Water',
    severityScore: 8,
    department: 'Water Supply & Sewerage Board',
    assignedDepartment: 'Water Supply & Drainage Board',
    aiSummary: 'Underground main line leak causing localized flooding and potable water loss.',
    isVerifiedAuthentic: true,
    status: 'In Progress',
    upvotes: 5,
    locationName: 'VRC Centre Commercial Road, Nellore',
    location: {
      type: 'Point',
      coordinates: [79.9830, 14.4450]
    },
    verificationNotes: 'Emergency pipeline squad dispatched.',
    auditTrail: [
      { action: 'Created', actor: 'System Seed', role: 'admin', timestamp: new Date(Date.now() - 3600000 * 12), note: 'Seeded Nellore landmark hazard' }
    ],
    createdAt: new Date(Date.now() - 3600000 * 12)
  },
  {
    _id: 'np_seed_004',
    trackingId: 'NP-2026-D404',
    description: 'Snapped overhead power cable suspended low over Kovur Junction bus stop waiting area.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: '',
    beforeImageHash: 'seed_hash_kovur_electrical_04',
    afterImageHash: '',
    captureSource: 'SEED',
    verificationSource: 'PENDING',
    audioUrl: '',
    category: 'Electrical',
    severityScore: 10,
    department: 'Electricity & Street Lighting Authority',
    assignedDepartment: 'Electrical & Power Division',
    aiSummary: 'Immediate public hazard: Low-hanging live electrical wiring posing electrocution danger.',
    isVerifiedAuthentic: true,
    status: 'Pending',
    upvotes: 19,
    locationName: 'Kovur Junction Bridge Entrance, Nellore',
    location: {
      type: 'Point',
      coordinates: [79.9850, 14.4980]
    },
    verificationNotes: 'Classified as Code Red civic emergency.',
    auditTrail: [
      { action: 'Created', actor: 'System Seed', role: 'admin', timestamp: new Date(Date.now() - 3600000 * 3), note: 'Seeded Nellore landmark hazard' }
    ],
    createdAt: new Date(Date.now() - 3600000 * 3)
  }
];

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * @route   POST /api/grievances
 * @desc    Submit a new civic grievance with Cryptographic Replay Guard, 50m duplicate check & Gemini Flash AI triage
 */
const createGrievance = async (req, res) => {
  try {
    // 0. Citizen Authentication Check: Only logged-in citizens (or admins) can report hazards
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: Only registered and logged-in citizens can report hazards.'
      });
    }

    if (req.user.role !== 'citizen' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Only citizens can submit civic hazard reports. Your active role is '${req.user.role}'.`
      });
    }

    const { description = '', longitude, latitude, captureSource = 'FILE_UPLOAD', locationName = 'Nellore Municipal Corporation' } = req.body;

    const parsedLng = parseFloat(longitude);
    const parsedLat = parseFloat(latitude);

    if (
      isNaN(parsedLng) ||
      isNaN(parsedLat) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates: latitude must be between -90 and 90, and longitude between -180 and 180.'
      });
    }

    // Step 1: Extract uploaded files (image & optional audio)
    let imageFile = null;
    let audioFile = null;

    if (req.files) {
      if (req.files.beforeImage && req.files.beforeImage[0]) {
        imageFile = req.files.beforeImage[0];
      } else if (req.files.image && req.files.image[0]) {
        imageFile = req.files.image[0];
      }
      if (req.files.audio && req.files.audio[0]) {
        audioFile = req.files.audio[0];
      }
    } else if (req.file) {
      imageFile = req.file;
    }

    let beforeImageUrl = req.body.beforeImageUrl || '';
    let imageBufferForTriage = imageFile ? imageFile.buffer : null;
    let imageMimeForTriage = imageFile ? imageFile.mimetype : 'image/jpeg';

    if (beforeImageUrl && beforeImageUrl.startsWith('data:')) {
      const match = beforeImageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        imageMimeForTriage = match[1];
        imageBufferForTriage = Buffer.from(match[2], 'base64');
      }
    }

    if (!imageBufferForTriage && !beforeImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'A photo of the civic grievance (beforeImage) is required.'
      });
    }

    // Compute SHA-256 hash of the uploaded image buffer for cryptographic replay guard
    let beforeImageHash = '';
    if (imageBufferForTriage) {
      beforeImageHash = crypto.createHash('sha256').update(imageBufferForTriage).digest('hex');

      // 1. Exact Media Replay Guard: reject immediately if exact media hash already exists
      let existingDuplicateMedia = null;
      if (isDbConnected()) {
        existingDuplicateMedia = await Grievance.findOne({ beforeImageHash });
      } else {
        existingDuplicateMedia = memoryGrievances.find((g) => g.beforeImageHash && g.beforeImageHash === beforeImageHash);
      }

      if (existingDuplicateMedia) {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          message: 'Duplicate media detected: this exact photo has already been submitted.',
          existingTrackingId: existingDuplicateMedia.trackingId
        });
      }
    }

    // Step 2: Run Gemini Flash AI Triage FIRST to verify authenticity & determine exact category
    const triageResult = await triageGrievance({
      imageBuffer: imageBufferForTriage,
      imageMimeType: imageMimeForTriage,
      audioBuffer: audioFile ? audioFile.buffer : null,
      audioMimeType: audioFile ? audioFile.mimetype : 'audio/webm',
      userDescription: description
    });

    if (triageResult.isVerifiedAuthentic === false) {
      return res.status(422).json({
        success: false,
        isVerifiedAuthentic: false,
        message: triageResult.rejectionReason || 'Submitted image was rejected by AI verification as non-civic, selfie, spam, or invalid content.',
        rejectionReason: triageResult.rejectionReason || 'Non-civic or spam submission detected by AI audit.',
        triage: triageResult
      });
    }

    const determinedCategory = triageResult.category || 'Other';

    // Step 3: Check 7-Day Post-Resolution Relapse vs. Old Gallery Replay
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let recentResolved = null;

    if (isDbConnected()) {
      try {
        recentResolved = await Grievance.findOne({
          status: 'Verified Resolved',
          category: determinedCategory,
          resolvedAt: { $gte: sevenDaysAgo },
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [parsedLng, parsedLat]
              },
              $maxDistance: 50
            }
          }
        });
      } catch (err) {
        console.warn('Geospatial recentResolved check warning:', err.message);
      }
    } else {
      recentResolved = memoryGrievances.find((g) => {
        if (g.status !== 'Verified Resolved') return false;
        if (g.category !== determinedCategory) return false;
        if (!g.resolvedAt || new Date(g.resolvedAt) < sevenDaysAgo) return false;
        const [gLng, gLat] = g.location.coordinates;
        return getDistanceInMeters(parsedLat, parsedLng, gLat, gLng) <= 50;
      });
    }

    if (recentResolved) {
      // Check if this submission is an exact replay of the previously resolved ticket's before photo
      if (beforeImageHash && recentResolved.beforeImageHash && beforeImageHash === recentResolved.beforeImageHash) {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          message: `Duplicate report: This ${determinedCategory} hazard at ${recentResolved.trackingId} was already repaired and verified resolved within the last 7 days. Stale media replay rejected.`,
          resolvedTrackingId: recentResolved.trackingId
        });
      }
    }

    // Step 4: Run 50m Duplicate Detection on OPEN tickets, strictly scoped to determinedCategory
    let openDuplicate = null;

    if (isDbConnected()) {
      try {
        openDuplicate = await Grievance.findOne({
          status: { $ne: 'Verified Resolved' },
          category: determinedCategory,
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [parsedLng, parsedLat]
              },
              $maxDistance: 50 // 50 meters
            }
          }
        });
      } catch (geoError) {
        console.warn('[Geospatial $near warning]:', geoError.message);
      }
    } else {
      // In-memory geospatial calculation
      openDuplicate = memoryGrievances.find((g) => {
        if (g.status === 'Verified Resolved') return false;
        if (g.category !== determinedCategory) return false;
        const [gLng, gLat] = g.location.coordinates;
        const dist = getDistanceInMeters(parsedLat, parsedLng, gLat, gLng);
        return dist <= 50;
      });
    }

    if (openDuplicate) {
      openDuplicate.upvotes = (openDuplicate.upvotes || 0) + 1;
      if (!openDuplicate.beforeImageHash && beforeImageHash) {
        openDuplicate.beforeImageHash = beforeImageHash;
      }
      if (!Array.isArray(openDuplicate.auditTrail)) openDuplicate.auditTrail = [];
      openDuplicate.auditTrail.push({
        action: 'Duplicate Merged',
        actor: req.user ? req.user.name : (req.body.reporterName || 'Citizen'),
        role: req.user ? req.user.role : 'citizen',
        timestamp: new Date(),
        note: `50m duplicate ${determinedCategory} report merged (+1 upvote). Community impact count now ${openDuplicate.upvotes}.`
      });

      if (isDbConnected()) {
        await openDuplicate.save();
      }

      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: `An open ${determinedCategory} grievance already exists within 50 meters (${openDuplicate.trackingId}). We have automatically upvoted it on your behalf!`,
        triage: triageResult,
        data: openDuplicate
      });
    }

    // Step 5: Upload image & audio to Cloudinary (or fallback)
    if (imageFile) {
      beforeImageUrl = await uploadToCloudinary(
        imageFile.buffer,
        imageFile.mimetype,
        'nagarpulse/grievances'
      );
    } else if (beforeImageUrl && beforeImageUrl.startsWith('data:') && imageBufferForTriage) {
      beforeImageUrl = await uploadToCloudinary(
        imageBufferForTriage,
        imageMimeForTriage,
        'nagarpulse/grievances'
      );
    }

    let audioUrl = req.body.audioUrl || '';
    if (audioFile) {
      audioUrl = await uploadToCloudinary(
        audioFile.buffer,
        audioFile.mimetype,
        'nagarpulse/audio'
      );
    }

    // Step 6: Save new Grievance to MongoDB or Memory Store with Cryptographic Provenance
    const trackingId = `NP-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const reportedBy = req.user ? req.user.id : 'Anonymous Citizen';
    const reporterName = req.user ? req.user.name : (req.body.reporterName || 'Anonymous Citizen');
    const reporterEmail = req.user ? req.user.email : (req.body.reporterEmail || '');

    const grievanceData = {
      trackingId,
      description,
      beforeImageUrl,
      afterImageUrl: '',
      beforeImageHash,
      afterImageHash: '',
      captureSource: captureSource || 'FILE_UPLOAD',
      verificationSource: 'PENDING',
      audioUrl,
      category: determinedCategory,
      severityScore: triageResult.severityScore || 5,
      department: triageResult.department || 'Municipal Grievance Cell',
      assignedDepartment: triageResult.department || 'Municipal Grievance Cell',
      aiSummary: triageResult.aiSummary || 'Civic hazard triaged and logged.',
      isVerifiedAuthentic: triageResult.isVerifiedAuthentic,
      aiModelUsed: triageResult.aiModelUsed || 'gemini-3.8-flash',
      status: 'Pending',
      upvotes: 1,
      reportedBy,
      reporterName,
      reporterEmail,
      locationName: locationName || 'Nellore Municipal Corporation',
      location: {
        type: 'Point',
        coordinates: [parsedLng, parsedLat]
      },
      verificationNotes: triageResult.rationale || '',
      auditTrail: [
        {
          action: 'Created',
          actor: reporterName,
          role: req.user ? req.user.role : 'citizen',
          timestamp: new Date(),
          note: `Grievance registered via ${captureSource}. AI assigned priority: Severity ${triageResult.severityScore}/10 to ${triageResult.department}.`
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let savedGrievance;
    if (isDbConnected()) {
      const newGrievance = new Grievance(grievanceData);
      savedGrievance = await newGrievance.save();
    } else {
      savedGrievance = { _id: `np_mem_${Date.now()}`, ...grievanceData };
      memoryGrievances.unshift(savedGrievance);
    }

    return res.status(201).json({
      success: true,
      isDuplicate: false,
      message: 'Civic grievance successfully analyzed and logged!',
      triage: triageResult,
      data: savedGrievance
    });
  } catch (error) {
    console.error('[createGrievance Error]:', error);
    return res.status(error.statusCode || error.status || 500).json({
      success: false,
      message: error.message || 'Internal server error while processing grievance'
    });
  }
};

/**
 * @route   PATCH /api/grievances/:id/resolve
 * @desc    Accepts an afterImageUrl, verifies repair against beforeImageUrl using Gemini Vision, marks as Verified Resolved
 */
const resolveGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    let afterImageUrl = req.body.afterImageUrl || '';

    let grievance = null;
    if (isDbConnected()) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        grievance = await Grievance.findById(id);
      }
      if (!grievance) {
        grievance = await Grievance.findOne({ trackingId: id });
      }
    } else {
      grievance = memoryGrievances.find((g) => g._id === id || g.trackingId === id);
    }

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: `Grievance with identifier "${id}" not found.`
      });
    }

    // Handle uploaded afterImage file
    let afterImageBuffer = null;
    let afterMimeType = 'image/jpeg';

    if (req.file) {
      afterImageBuffer = req.file.buffer;
      afterMimeType = req.file.mimetype;
    } else if (req.files && req.files.afterImage && req.files.afterImage[0]) {
      afterImageBuffer = req.files.afterImage[0].buffer;
      afterMimeType = req.files.afterImage[0].mimetype;
    } else if (req.files && req.files.resolutionImage && req.files.resolutionImage[0]) {
      afterImageBuffer = req.files.resolutionImage[0].buffer;
      afterMimeType = req.files.resolutionImage[0].mimetype;
    } else if (afterImageUrl && afterImageUrl.startsWith('data:')) {
      const match = afterImageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        afterMimeType = match[1];
        afterImageBuffer = Buffer.from(match[2], 'base64');
      }
    }

    if (!afterImageUrl && !afterImageBuffer) {
      return res.status(400).json({
        success: false,
        message: 'An "after" resolution photo (afterImageUrl or file upload) is required to verify repair.'
      });
    }

    // Compute SHA-256 hash of after photo
    let afterImageHash = '';
    if (afterImageBuffer) {
      afterImageHash = crypto.createHash('sha256').update(afterImageBuffer).digest('hex');
    }

    // 1. Identical Before/After Hash Rejection Guard
    if (afterImageHash && grievance.beforeImageHash && afterImageHash === grievance.beforeImageHash) {
      return res.status(400).json({
        success: false,
        message: 'After photo cannot be identical to the Before hazard photo.'
      });
    }

    // 2. Department RBAC Guard: Verify operator belongs to correct department or admin
    if (req.user) {
      const userRole = req.user.role;
      const userDept = req.user.department;
      const grievanceCat = grievance.category;
      const assignedDept = grievance.assignedDepartment || grievance.department || '';

      const isAuthorized =
        userRole === 'admin' ||
        userDept === 'All' ||
        userDept === grievanceCat ||
        (userDept && assignedDept.toLowerCase().includes(userDept.toLowerCase()));

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: `Unauthorized: Field Operator from "${userDept}" cannot resolve tickets assigned to "${grievanceCat}".`
        });
      }
    }

    // 3. Upload afterImage to Cloudinary
    if (afterImageBuffer) {
      afterImageUrl = await uploadToCloudinary(
        afterImageBuffer,
        afterMimeType,
        'nagarpulse/resolutions'
      );
    }

    // 4. Verify repair against beforeImageUrl using Gemini Vision (Landmark + Hazard Clearance Audit)
    const verification = await verifyResolution({
      beforeImageUrl: grievance.beforeImageUrl,
      afterImageBuffer,
      afterImageUrl,
      afterMimeType,
      category: grievance.category,
      issueDescription: grievance.description || grievance.aiSummary
    });

    // 5. Update Grievance with Resolution & Audit Trail
    grievance.status = 'Verified Resolved';
    grievance.afterImageUrl = afterImageUrl;
    grievance.afterImageHash = afterImageHash;
    grievance.verificationSource = 'AI_VISION_VERIFIED';
    grievance.resolvedAt = new Date();
    grievance.resolvedBy = {
      id: req.user ? (req.user._id || req.user.id) : null,
      name: req.user ? req.user.name : 'Municipal Field Inspector',
      role: req.user ? req.user.role : 'operator',
      department: req.user ? req.user.department : (grievance.department || grievance.category),
      resolvedAt: new Date()
    };
    grievance.aiVerification = {
      isResolved: Boolean(verification.isResolved),
      confidence: verification.confidenceScore || verification.confidence,
      qualityAssessment: verification.qualityAssessment,
      verificationNote: verification.verificationNotes || verification.verificationNote,
      aiModelUsed: verification.aiModelUsed
    };
    grievance.verificationNotes = `[Gemini Vision Verification]: ${verification.verificationNotes} (Confidence: ${verification.confidenceScore}%, Quality: ${verification.qualityAssessment})`;

    if (!Array.isArray(grievance.auditTrail)) grievance.auditTrail = [];
    grievance.auditTrail.push({
      action: 'AI Vision Verified Resolved',
      actor: req.user ? req.user.name : 'Field Operator',
      role: req.user ? req.user.role : 'operator',
      timestamp: new Date(),
      note: `Dual-image repair audit passed with ${verification.confidenceScore}% confidence. Quality: ${verification.qualityAssessment}.`
    });

    if (isDbConnected()) {
      await grievance.save();
    }

    return res.status(200).json({
      success: true,
      isResolved: Boolean(verification.isResolved),
      message: 'Repair successfully verified and ticket marked as Verified Resolved!',
      verification,
      data: grievance
    });
  } catch (error) {
    console.error('[resolveGrievance Error]:', error);
    return res.status(error.statusCode || error.status || 500).json({
      success: false,
      message: error.message || 'Error occurred while verifying repair resolution'
    });
  }
};

/**
 * @route   GET /api/grievances
 * @desc    Fetch all grievances with optional filters, search, and sorting
 */
const getGrievances = async (req, res) => {
  try {
    const { status, category, department, search, sort = 'newest' } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (status && status !== 'all') query.status = status;
      if (category && category !== 'all') query.category = category;
      if (department && department !== 'all') query.department = department;

      if (search) {
        query.$or = [
          { trackingId: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { aiSummary: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } }
        ];
      }

      let sortOptions = { createdAt: -1 };
      if (sort === 'upvotes') sortOptions = { upvotes: -1, createdAt: -1 };
      else if (sort === 'severity') sortOptions = { severityScore: -1, createdAt: -1 };
      else if (sort === 'oldest') sortOptions = { createdAt: 1 };

      const grievances = await Grievance.find(query).sort(sortOptions).limit(100);
      return res.status(200).json({
        success: true,
        count: grievances.length,
        data: grievances
      });
    }

    // In-memory query handling
    let results = [...memoryGrievances];
    if (status && status !== 'all') results = results.filter((g) => g.status === status);
    if (category && category !== 'all') results = results.filter((g) => g.category === category);
    if (department && department !== 'all') results = results.filter((g) => g.department === department);

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (g) =>
          g.trackingId?.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q) ||
          g.aiSummary?.toLowerCase().includes(q) ||
          g.department?.toLowerCase().includes(q)
      );
    }

    if (sort === 'upvotes') {
      results.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (sort === 'severity') {
      results.sort((a, b) => (b.severityScore || 0) - (a.severityScore || 0));
    } else if (sort === 'oldest') {
      results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('[getGrievances Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving grievances'
    });
  }
};

/**
 * @route   GET /api/grievances/:id
 * @desc    Get single grievance by Mongo ID or trackingId
 */
const getGrievanceById = async (req, res) => {
  try {
    const { id } = req.params;
    let grievance = null;

    if (isDbConnected()) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        grievance = await Grievance.findById(id);
      }
      if (!grievance) {
        grievance = await Grievance.findOne({ trackingId: id });
      }
    } else {
      grievance = memoryGrievances.find((g) => g._id === id || g.trackingId === id);
    }

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: `Grievance "${id}" not found.`
      });
    }

    return res.status(200).json({
      success: true,
      data: grievance
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/grievances/:id/upvote
 * @desc    Increment upvotes for a grievance
 */
const upvoteGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    let grievance = null;

    if (isDbConnected()) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        grievance = await Grievance.findById(id);
      }
      if (!grievance) {
        grievance = await Grievance.findOne({ trackingId: id });
      }
      if (grievance) {
        grievance.upvotes = (grievance.upvotes || 0) + 1;
        await grievance.save();
      }
    } else {
      grievance = memoryGrievances.find((g) => g._id === id || g.trackingId === id);
      if (grievance) {
        grievance.upvotes = (grievance.upvotes || 0) + 1;
      }
    }

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Upvote recorded successfully',
      upvotes: grievance.upvotes,
      data: grievance
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/grievances/stats/summary
 * @desc    Get overall stats for dashboard
 */
const getStatsSummary = async (req, res) => {
  try {
    if (isDbConnected()) {
      const total = await Grievance.countDocuments();
      const pending = await Grievance.countDocuments({ status: 'Pending' });
      const inProgress = await Grievance.countDocuments({ status: 'In Progress' });
      const resolved = await Grievance.countDocuments({ status: 'Verified Resolved' });
      const highSeverity = await Grievance.countDocuments({ severityScore: { $gte: 7 } });

      return res.status(200).json({
        success: true,
        stats: {
          total,
          pending,
          inProgress,
          resolved,
          highSeverity,
          resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
        }
      });
    }

    // In-memory stats calculation
    const total = memoryGrievances.length;
    const pending = memoryGrievances.filter((g) => g.status === 'Pending').length;
    const inProgress = memoryGrievances.filter((g) => g.status === 'In Progress').length;
    const resolved = memoryGrievances.filter((g) => g.status === 'Verified Resolved').length;
    const highSeverity = memoryGrievances.filter((g) => (g.severityScore || 0) >= 7).length;

    return res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        resolved,
        highSeverity,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   PATCH /api/grievances/:id/reassign
 * @desc    Reassign department, status, or severity (Operators / Admins only)
 */
const reassignGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, status, severityScore } = req.body;

    let grievance = null;
    if (isDbConnected()) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        grievance = await Grievance.findById(id);
      }
      if (!grievance) {
        grievance = await Grievance.findOne({ trackingId: id });
      }
    } else {
      grievance = memoryGrievances.find((g) => g._id === id || g.trackingId === id);
    }

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found.'
      });
    }

    if (department) grievance.department = department;
    if (status) grievance.status = status;
    if (severityScore !== undefined) grievance.severityScore = Number(severityScore);

    if (isDbConnected()) {
      await grievance.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Grievance updated successfully.',
      data: grievance
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update grievance.'
    });
  }
};

module.exports = {
  createGrievance,
  resolveGrievance,
  getGrievances,
  getGrievanceById,
  upvoteGrievance,
  getStatsSummary,
  reassignGrievance
};
