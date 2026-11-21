require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Grievance = require('./models/Grievance');
const User = require('./models/User');

const DEMO_USERS = [
  {
    name: 'Ravi Kumar',
    email: 'citizen@nagarpulse.in',
    password: 'Demo@123',
    role: 'citizen',
    department: 'All'
  },
  {
    name: 'Eng. Karthik Rao',
    email: 'operator.roads@nagarpulse.in',
    password: 'Demo@123',
    role: 'operator',
    department: 'Roads'
  },
  {
    name: 'Commissioner Nellore',
    email: 'admin@nagarpulse.in',
    password: 'Demo@123',
    role: 'admin',
    department: 'All'
  }
];

const NELLORE_SEEDS = [
  {
    trackingId: 'NP-NEL-DARG-01',
    description: 'Heavy municipal solid waste accumulation and plastic choke obstructing pedestrian walkway near Dargamitta RTC bus shelter.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: '',
    audioUrl: '',
    category: 'Sanitation',
    severityScore: 6,
    department: 'Department of Public Health & Solid Waste',
    aiSummary: 'Substantial municipal waste overflow with bio-waste hazard blocking pedestrian access near bus shelter.',
    isVerifiedAuthentic: true,
    status: 'Pending',
    upvotes: 12,
    location: {
      type: 'Point',
      coordinates: [79.9730, 14.4320] // [longitude, latitude]
    },
    verificationNotes: 'Pending field sanitation squad assignment.',
    createdAt: new Date(Date.now() - 3600000 * 14)
  },
  {
    trackingId: 'NP-NEL-MAGU-02',
    description: 'Deep road collapse and asphalt cavitation surrounding drainage manhole near Magunta Layout Main Park avenue.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80',
    audioUrl: '',
    category: 'Roads',
    severityScore: 8,
    department: 'Department of Roads & Pavement Infrastructure',
    aiSummary: 'Dangerous 4-foot deep asphalt cavitation around sewer collar. Severe road hazard for transit.',
    isVerifiedAuthentic: true,
    status: 'Verified Resolved',
    upvotes: 24,
    location: {
      type: 'Point',
      coordinates: [79.9680, 14.4250]
    },
    verificationNotes: '[Gemini Vision Audit]: Before/After visual comparison confirms cavitation backfilled with compacted aggregate and bitumen overlay. Manhole ring flush with pavement grade. (Confidence: 96%, Quality: Excellent)',
    resolvedAt: new Date(Date.now() - 3600000 * 3),
    createdAt: new Date(Date.now() - 3600000 * 48)
  },
  {
    trackingId: 'NP-NEL-KOVR-03',
    description: 'Storm-damaged step-down transformer sparking with low dangling 11kV conductor line near Kovur Junction Bridge entrance.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: '',
    audioUrl: '',
    category: 'Electrical',
    severityScore: 9,
    department: 'Electricity & Street Lighting Authority',
    aiSummary: 'Critical high-voltage hazard: Exposed energized cable sagging 2.2 meters above vehicular carriage.',
    isVerifiedAuthentic: true,
    status: 'Pending',
    upvotes: 28,
    location: {
      type: 'Point',
      coordinates: [79.9850, 14.4980]
    },
    verificationNotes: 'Classified as Code Red emergency. Linemen team alerted.',
    createdAt: new Date(Date.now() - 3600000 * 4)
  },
  {
    trackingId: 'NP-NEL-MBYP-04',
    description: 'Underground drinking water distribution pipeline leak creating localized street flooding on Mini Bypass Road near Sub-station.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: '',
    audioUrl: '',
    category: 'Water',
    severityScore: 7,
    department: 'Water Supply & Sewerage Board',
    aiSummary: 'Continuous potable water line breach wasting ~1,800 L/hr and undermining sub-base soil stability.',
    isVerifiedAuthentic: true,
    status: 'In Progress',
    upvotes: 15,
    location: {
      type: 'Point',
      coordinates: [79.9600, 14.4380]
    },
    verificationNotes: 'Excavation team on-site isolating feeder valve.',
    createdAt: new Date(Date.now() - 3600000 * 20)
  },
  {
    trackingId: 'NP-NEL-TRNK-05',
    description: 'Series of sharp road craters and broken asphalt along central lane of Trunk Road opposite Gandhi Statue.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80',
    audioUrl: '',
    category: 'Roads',
    severityScore: 7,
    department: 'Department of Roads & Pavement Infrastructure',
    aiSummary: 'Cluster of multiple potholes along arterial commercial corridor causing severe vehicular deceleration.',
    isVerifiedAuthentic: true,
    status: 'Verified Resolved',
    upvotes: 19,
    location: {
      type: 'Point',
      coordinates: [79.9865, 14.4426]
    },
    verificationNotes: '[Gemini Vision Audit]: High-resolution visual inspection confirms complete resurfacing of all craters with uniform asphalt mix and edge-sealing. (Confidence: 94%, Quality: High Quality)',
    resolvedAt: new Date(Date.now() - 3600000 * 6),
    createdAt: new Date(Date.now() - 3600000 * 36)
  },
  {
    trackingId: 'NP-NEL-PODL-06',
    description: 'Open stormwater canal blocked with plastic sacks, silt, and construction debris along Podalakur Road flyover.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: '',
    audioUrl: '',
    category: 'Sanitation',
    severityScore: 5,
    department: 'Department of Public Health & Solid Waste',
    aiSummary: 'Stormwater canal siltation and debris restriction impeding runoff discharge; potential flash flood hazard.',
    isVerifiedAuthentic: true,
    status: 'In Progress',
    upvotes: 7,
    location: {
      type: 'Point',
      coordinates: [79.9550, 14.4190]
    },
    verificationNotes: 'JCB backhoe deployed for silt clearance.',
    createdAt: new Date(Date.now() - 3600000 * 18)
  },
  {
    trackingId: 'NP-NEL-VEDY-07',
    description: 'Severely tilted municipal steel lighting post with exposed sparking cable terminal junction at Vedayapalem Railway Gate.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    audioUrl: '',
    category: 'Electrical',
    severityScore: 8,
    department: 'Electricity & Street Lighting Authority',
    aiSummary: 'Structural tilt and accessible electrical junction hazard adjacent to high-pedestrian railway crossing.',
    isVerifiedAuthentic: true,
    status: 'Verified Resolved',
    upvotes: 14,
    location: {
      type: 'Point',
      coordinates: [79.9620, 14.4120]
    },
    verificationNotes: '[Gemini Vision Audit]: Inspection confirms pole foundation re-anchored perpendicular to ground, junction box locked in weatherproof enclosure, and LED luminaire functional. (Confidence: 98%, Quality: Excellent)',
    resolvedAt: new Date(Date.now() - 3600000 * 8),
    createdAt: new Date(Date.now() - 3600000 * 60)
  },
  {
    trackingId: 'NP-NEL-STON-08',
    description: 'Discolored contaminated municipal drinking water discharge at public standpost near Stonehousepet Fish Market.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: '',
    audioUrl: '',
    category: 'Water',
    severityScore: 6,
    department: 'Water Supply & Sewerage Board',
    aiSummary: 'Public health alert: Cross-contamination between municipal water line and adjacent storm channel.',
    isVerifiedAuthentic: true,
    status: 'Pending',
    upvotes: 9,
    location: {
      type: 'Point',
      coordinates: [79.9920, 14.4530]
    },
    verificationNotes: 'Water quality lab testing sample collected.',
    createdAt: new Date(Date.now() - 3600000 * 8)
  }
];

async function seedDatabase() {
  console.log('====================================================');
  console.log('🌱 Seeding NagarPulse AI: Demo Users & Nellore Grievances');
  console.log('====================================================\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nagarpulse_ai';
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB: ${mongoose.connection.host}`);

    // 1. Seed Demo User Accounts
    console.log('\n--- Seeding 3 Role-Based Demo Accounts ---');
    for (const demo of DEMO_USERS) {
      const existingUser = await User.findOne({ email: demo.email });
      if (existingUser) {
        existingUser.isEmailVerified = true;
        await existingUser.save();
        console.log(`  ℹ️  [User Exists & Verified] ${demo.name} (${demo.role}) -> ${demo.email}`);
      } else {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(demo.password, salt);
        await User.create({
          name: demo.name,
          email: demo.email,
          passwordHash,
          role: demo.role,
          department: demo.department,
          isEmailVerified: true
        });
        console.log(`  ✅ [User Created & Verified] ${demo.name} (${demo.role}) -> ${demo.email}`);
      }
    }

    // 2. Ensure 2dsphere index exists on Grievances
    await Grievance.createIndexes();

    console.log('\n--- Seeding 8 Nellore Landmark Grievances ---');
    let insertedCount = 0;
    let existingCount = 0;

    for (const seed of NELLORE_SEEDS) {
      const existing = await Grievance.findOne({ trackingId: seed.trackingId });
      if (existing) {
        console.log(`  ℹ️  [Exists] ${seed.trackingId} - ${seed.category} (${seed.status})`);
        existingCount++;
      } else {
        await Grievance.create(seed);
        console.log(`  ✅ [Inserted] ${seed.trackingId} - ${seed.category} (${seed.status}) - ${seed.department}`);
        insertedCount++;
      }
    }

    const totalCount = await Grievance.countDocuments();
    const totalUsers = await User.countDocuments();
    console.log('\n----------------------------------------------------');
    console.log(`Summary: Users in DB: ${totalUsers} | Grievances in DB: ${totalCount}`);
    console.log(`Grievances: ${insertedCount} newly seeded, ${existingCount} already present.`);
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
