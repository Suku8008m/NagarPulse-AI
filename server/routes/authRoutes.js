const express = require('express');
const router = express.Router();
const {
  sendVerificationOtp,
  verifyOtp,
  register,
  login,
  getMe,
  logout,
  getLoginLogs,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.post('/send-verification-otp', sendVerificationOtp);
router.post('/send-otp', sendVerificationOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.get('/login-logs', requireAuth, requireRole('admin'), getLoginLogs);

module.exports = router;
