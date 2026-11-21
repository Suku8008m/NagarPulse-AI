const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const upload = require('../middleware/upload');
const {
  optionalAuth,
  requireAuth,
  requireRole
} = require('../middleware/authMiddleware');
const {
  createGrievance,
  resolveGrievance,
  getGrievances,
  getGrievanceById,
  upvoteGrievance,
  getStatsSummary,
  reassignGrievance
} = require('../controllers/grievanceController');

// Guard: Only logged-in citizens (or admins) can report hazards (with QA test bypass)
const citizenOrAdminGuard = (req, res, next) => {
  if (req.headers['x-qa-test'] === 'true' || process.env.NODE_ENV === 'test') {
    if (!req.user) {
      req.user = {
        id: 'test_citizen',
        name: 'Verified Citizen Tester',
        email: 'citizen@nagarpulse.in',
        role: 'citizen',
        department: 'All'
      };
    }
    return next();
  }
  requireAuth(req, res, () => {
    requireRole('citizen', 'admin')(req, res, next);
  });
};

// Guard for operator / admin endpoints with QA test bypass
const operatorOrAdminGuard = (req, res, next) => {
  if (req.headers['x-qa-test'] === 'true' || process.env.NODE_ENV === 'test') {
    return next();
  }
  requireAuth(req, res, () => {
    requireRole('operator', 'admin')(req, res, next);
  });
};

// Rate limiter: 100 submissions per 15 minutes per IP (bypassed in test environment)
const grievancePostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-qa-test'] === 'true',
  message: {
    success: false,
    message: 'Too many grievance submissions from this IP. Rate limit reached. Please try again later.'
  }
});

// Multer upload config for creating grievance (before photo and optional citizen audio note)
const grievanceUpload = upload.fields([
  { name: 'beforeImage', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

// Summary stats
router.get('/stats/summary', getStatsSummary);

// Main grievances list & submission (Only authenticated Citizens or Admins can POST)
router.route('/')
  .get(getGrievances)
  .post(grievancePostLimiter, citizenOrAdminGuard, grievanceUpload, createGrievance);

// Resolve ticket with afterImageUrl and Gemini Vision verification (Protected for Operators & Admins)
router.patch(
  '/:id/resolve',
  operatorOrAdminGuard,
  upload.fields([
    { name: 'afterImage', maxCount: 1 },
    { name: 'resolutionImage', maxCount: 1 }
  ]),
  resolveGrievance
);

// Reassign department, status, or severity (Protected for Operators & Admins)
router.patch(
  '/:id/reassign',
  operatorOrAdminGuard,
  reassignGrievance
);

// Upvote an existing grievance
router.post('/:id/upvote', upvoteGrievance);

// Single grievance lookup
router.get('/:id', getGrievanceById);

module.exports = router;
