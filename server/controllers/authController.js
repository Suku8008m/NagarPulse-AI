const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');

const JWT_SECRET = process.env.JWT_SECRET || 'nagarpulse_civic_super_secret_jwt_key_2026';
const TOKEN_EXPIRY = '7d';

const isDbConnected = () => mongoose.connection.readyState === 1;

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id ? user._id.toString() : user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department || 'All'
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

const recordLoginLog = async ({ req, user, loginMethod }) => {
  try {
    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    user.lastLoginAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    if (isDbConnected() && typeof user.save === 'function') {
      await user.save();
    }

    const logEntry = {
      userId: user._id ? user._id.toString() : user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || 'All',
      loginMethod: loginMethod || 'credentials',
      ipAddress: String(ipAddress),
      userAgent: String(userAgent),
      timestamp: new Date()
    };

    if (isDbConnected()) {
      await LoginLog.create(logEntry);
    } else {
      memoryLoginLogs.unshift(logEntry);
      if (memoryLoginLogs.length > 500) memoryLoginLogs.pop();
    }
  } catch (err) {
    console.error('[recordLoginLog error]:', err.message);
  }
};

// Seeded in-memory users for resilience when MongoDB Atlas is unreachable
const DEMO_PASSWORD_HASH = '$2b$10$gX0mrFodv6VeB3zVVltizu3iiEl29qISb0vK5Gqd8M.Ea47f1ZU1u'; // 'Demo@123'

let memoryUsers = [
  {
    _id: 'user_demo_citizen_01',
    name: 'Ravi Kumar',
    email: 'citizen@nagarpulse.in',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'citizen',
    department: 'All',
    lastLoginAt: null,
    loginCount: 0
  },
  {
    _id: 'user_demo_operator_02',
    name: 'Eng. Karthik Rao',
    email: 'operator.roads@nagarpulse.in',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'operator',
    department: 'Roads',
    lastLoginAt: null,
    loginCount: 0
  },
  {
    _id: 'user_demo_admin_03',
    name: 'Commissioner Nellore',
    email: 'admin@nagarpulse.in',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'admin',
    department: 'All',
    lastLoginAt: null,
    loginCount: 0
  }
];

let memoryLoginLogs = [];

// Verification OTP Store (Email/Phone -> { otp, expiresAt, verified, token })
const verificationOtps = new Map();

// Helper to normalize phone numbers
const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '').trim();
};

/**
 * @route   POST /api/auth/send-verification-otp
 * @desc    Generate & send verification OTP to citizen email and phone before registration
 */
const sendVerificationOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Both email and mobile phone number are required for citizen verification.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanPhone = normalizePhone(phone);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Validate phone number (at least 10 digits)
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile phone number.'
      });
    }

    // Check if user already exists with this email or phone
    let existing = null;
    if (isDbConnected()) {
      existing = await User.findOne({
        $or: [{ email: normalizedEmail }, { phone: cleanPhone }]
      });
    } else {
      existing = memoryUsers.find(
        (u) => u.email === normalizedEmail || (u.phone && u.phone === cleanPhone)
      );
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or phone number already exists. Please log in.'
      });
    }

    // Generate 6-digit OTP (e.g. 123456 in demo/test or random 6-digit code)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    const otpKey = `${normalizedEmail}_${cleanPhone}`;
    verificationOtps.set(otpKey, {
      otp,
      email: normalizedEmail,
      phone: cleanPhone,
      expiresAt,
      verified: false
    });

    console.log(`[Citizen Verification OTP] Dispatched code "${otp}" to ${normalizedEmail} and ${cleanPhone}`);

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${normalizedEmail} and ${cleanPhone}.`,
      demoOtp: otp, // Surfaced for judge / hackathon testing convenience
      expiresInSeconds: 300
    });
  } catch (error) {
    console.error('[sendVerificationOtp error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch verification OTP.'
    });
  }
};

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP for email and phone number
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    if (!email || !phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and 6-digit verification code are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanPhone = normalizePhone(phone);
    const otpKey = `${normalizedEmail}_${cleanPhone}`;

    const record = verificationOtps.get(otpKey);

    // Support master demo code 123456 or matching active OTP
    const isMasterCode = String(otp).trim() === '123456';
    const isMatchingOtp = record && String(record.otp).trim() === String(otp).trim();

    if (!isMasterCode && !isMatchingOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 6-digit verification code. Please check and try again.'
      });
    }

    if (record && Date.now() > record.expiresAt && !isMasterCode) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    // Mark as verified and issue verificationToken
    const verificationToken = jwt.sign(
      { email: normalizedEmail, phone: cleanPhone, verified: true },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    if (record) {
      record.verified = true;
      record.token = verificationToken;
    } else {
      verificationOtps.set(otpKey, {
        email: normalizedEmail,
        phone: cleanPhone,
        verified: true,
        token: verificationToken,
        expiresAt: Date.now() + 15 * 60 * 1000
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email and mobile phone successfully verified!',
      verificationToken
    });
  } catch (error) {
    console.error('[verifyOtp error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Verification failed.'
    });
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new citizen account with email & phone verification
 */
const register = async (req, res) => {
  try {
    const { name, email, phone, password, otp, verificationToken } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanPhone = normalizePhone(phone);

    // Enforce OTP verification before registration
    let isVerified = false;

    if (verificationToken) {
      try {
        const decoded = jwt.verify(verificationToken, JWT_SECRET);
        if (decoded.email === normalizedEmail && decoded.verified) {
          isVerified = true;
        }
      } catch (e) {
        // invalid token
      }
    }

    if (!isVerified) {
      const otpKey = `${normalizedEmail}_${cleanPhone}`;
      const record = verificationOtps.get(otpKey);
      if (record && record.verified) {
        isVerified = true;
      } else if (
        otp &&
        (String(otp).trim() === '123456' ||
          (record && String(record.otp).trim() === String(otp).trim()))
      ) {
        isVerified = true;
      }
    }

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message:
          'Verification required: Please verify your email and phone number with the 6-digit OTP code before signing up.'
      });
    }

    let existing = null;
    if (isDbConnected()) {
      existing = await User.findOne({
        $or: [{ email: normalizedEmail }, ...(cleanPhone ? [{ phone: cleanPhone }] : [])]
      });
    } else {
      existing = memoryUsers.find(
        (u) => u.email === normalizedEmail || (cleanPhone && u.phone === cleanPhone)
      );
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or phone already exists. Please log in.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let user = null;
    if (isDbConnected()) {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: cleanPhone,
        isVerified: true,
        verifiedAt: new Date(),
        passwordHash,
        role: 'citizen',
        department: 'All'
      });
    } else {
      user = {
        _id: `user_${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        phone: cleanPhone,
        isVerified: true,
        verifiedAt: new Date(),
        passwordHash,
        role: 'citizen',
        department: 'All',
        lastLoginAt: null,
        loginCount: 0
      };
      memoryUsers.push(user);
    }

    const token = signToken(user);
    await recordLoginLog({ req, user, loginMethod: 'credentials' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      message: 'Citizen account verified and registered successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isVerified: true,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('[register error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

/**
 * Demo accounts map for 1-click portal login
 */
const DEMO_ACCOUNTS = {
  citizen: {
    email: 'citizen@nagarpulse.in',
    name: 'Ravi Kumar',
    role: 'citizen',
    department: 'All'
  },
  operator: {
    email: 'operator.roads@nagarpulse.in',
    name: 'Eng. Karthik Rao',
    role: 'operator',
    department: 'Roads'
  },
  admin: {
    email: 'admin@nagarpulse.in',
    name: 'Commissioner Nellore',
    role: 'admin',
    department: 'All'
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Log in via credentials OR instant 1-click Judge Demo login
 */
const login = async (req, res) => {
  try {
    const { email, password, demoRole } = req.body;

    let user = null;
    let loginMethod = 'credentials';

    // 1. Instant 1-Click Judge Demo Login flow
    if (demoRole && DEMO_ACCOUNTS[demoRole]) {
      const demoData = DEMO_ACCOUNTS[demoRole];
      if (isDbConnected()) {
        user = await User.findOne({ email: demoData.email });
        if (!user) {
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash('Demo@123', salt);
          user = await User.create({
            name: demoData.name,
            email: demoData.email,
            passwordHash,
            role: demoData.role,
            department: demoData.department
          });
        }
      } else {
        user = memoryUsers.find((u) => u.email === demoData.email);
        if (!user) {
          user = {
            _id: `user_demo_${demoRole}`,
            name: demoData.name,
            email: demoData.email,
            passwordHash: DEMO_PASSWORD_HASH,
            role: demoData.role,
            department: demoData.department,
            lastLoginAt: null,
            loginCount: 0
          };
          memoryUsers.push(user);
        }
      }
      loginMethod = 'demo-quick-login';
    } else {
      // 2. Standard Credentials Login flow
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both email and password.'
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      if (isDbConnected()) {
        user = await User.findOne({ email: normalizedEmail });
      } else {
        user = memoryUsers.find((u) => u.email === normalizedEmail);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. User not found.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Password incorrect.'
        });
      }
    }

    const token = signToken(user);
    await recordLoginLog({ req, user, loginMethod });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: `Welcome, ${user.name}! Authenticated as ${user.role.toUpperCase()}.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount
      }
    });
  } catch (error) {
    console.error('[login error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user session
 */
const getMe = async (req, res) => {
  try {
    let user = null;
    if (isDbConnected()) {
      user = await User.findById(req.user.id).select('-passwordHash');
    } else {
      user = memoryUsers.find((u) => u._id === req.user.id || u.email === req.user.email);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User session not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.'
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Clear session cookie
 */
const logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

/**
 * @route   GET /api/auth/login-logs
 * @desc    Get real-time audit ledger of logins (Admin portal only)
 */
const getLoginLogs = async (req, res) => {
  try {
    let logs = [];
    let totalLogins = 0;
    let demoLogins = 0;
    let credentialLogins = 0;
    let roleBreakdown = { citizen: 0, operator: 0, admin: 0 };

    if (isDbConnected()) {
      logs = await LoginLog.find().sort({ timestamp: -1 }).limit(100);
      totalLogins = await LoginLog.countDocuments();
      demoLogins = await LoginLog.countDocuments({ loginMethod: 'demo-quick-login' });
      credentialLogins = await LoginLog.countDocuments({ loginMethod: 'credentials' });
      roleBreakdown = {
        citizen: await LoginLog.countDocuments({ role: 'citizen' }),
        operator: await LoginLog.countDocuments({ role: 'operator' }),
        admin: await LoginLog.countDocuments({ role: 'admin' })
      };
    } else {
      logs = memoryLoginLogs.slice(0, 100);
      totalLogins = memoryLoginLogs.length;
      demoLogins = memoryLoginLogs.filter((l) => l.loginMethod === 'demo-quick-login').length;
      credentialLogins = memoryLoginLogs.filter((l) => l.loginMethod === 'credentials').length;
      roleBreakdown = {
        citizen: memoryLoginLogs.filter((l) => l.role === 'citizen').length,
        operator: memoryLoginLogs.filter((l) => l.role === 'operator').length,
        admin: memoryLoginLogs.filter((l) => l.role === 'admin').length
      };
    }

    return res.status(200).json({
      success: true,
      count: logs.length,
      stats: {
        totalLogins,
        demoLogins,
        credentialLogins,
        roleBreakdown
      },
      logs
    });
  } catch (error) {
    console.error('[getLoginLogs error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve login audit logs.'
    });
  }
};

module.exports = {
  sendVerificationOtp,
  verifyOtp,
  register,
  login,
  getMe,
  logout,
  getLoginLogs
};
