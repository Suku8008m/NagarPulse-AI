const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const Otp = require('../models/Otp');
const emailService = require('../services/emailService');

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
      department: user.department || 'All',
      isEmailVerified: user.isEmailVerified !== false
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

const recordLoginLog = async ({ req, user, loginMethod }) => {
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || req?.headers?.['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'Unknown Browser';

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
    isEmailVerified: true,
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
    isEmailVerified: true,
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
    isEmailVerified: true,
    lastLoginAt: null,
    loginCount: 0
  }
];

let memoryLoginLogs = [];

// Verification OTP Store (Email -> { otp, otpHash, expiresAt, verified, token })
const verificationOtps = new Map();

/**
 * @route   POST /api/auth/send-verification-otp
 * @desc    Generate & send 6-digit verification OTP to citizen email before registration
 */
const sendVerificationOtp = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required for citizen verification.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Check if an already verified citizen account exists with this email
    let existing = null;
    if (isDbConnected()) {
      existing = await User.findOne({ email: normalizedEmail });
    } else {
      existing = memoryUsers.find((u) => u.email === normalizedEmail);
    }

    if (existing && existing.isEmailVerified) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.'
      });
    }

    // Generate 6-digit OTP code (valid for 10 minutes)
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const otpHash = await bcrypt.hash(rawOtp, 10);

    // 1. ALWAYS save hashed OTP and expiry in MongoDB first
    if (isDbConnected()) {
      try {
        if (existing) {
          existing.otpHash = otpHash;
          existing.otpExpiresAt = otpExpiresAt;
          if (name) existing.name = name.trim();
          if (password) existing.passwordHash = await bcrypt.hash(password, 10);
          await existing.save();
        } else {
          const initialPassword = password || 'Demo@123';
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(initialPassword, salt);
          await User.create({
            name: (name || 'Citizen').trim(),
            email: normalizedEmail,
            passwordHash,
            role: 'citizen',
            department: 'All',
            isEmailVerified: false,
            otpHash,
            otpExpiresAt
          });
        }

        // Also track in Otp collection
        await Otp.deleteMany({ email: normalizedEmail });
        await Otp.create({
          email: normalizedEmail,
          otpHash,
          rawOtp,
          expiresAt: otpExpiresAt,
          verified: false
        });
      } catch (dbErr) {
        console.warn('[MongoDB Save Warning]:', dbErr.message);
      }
    }

    // Keep in-memory cache synchronized as resilience fallback
    verificationOtps.set(normalizedEmail, {
      otp: rawOtp,
      otpHash,
      email: normalizedEmail,
      expiresAt: otpExpiresAt.getTime(),
      verified: false
    });

    // 2. Dispatch via Brevo HTTPS REST API (Port 443 with 7-second timeout)
    let emailResult = { delivered: false, error: 'Not attempted' };
    try {
      emailResult = await (emailService.sendOtpEmail || emailService.sendEmailOtp)({
        email: normalizedEmail,
        otp: rawOtp,
        name: name || 'Citizen'
      });
    } catch (dispatchErr) {
      console.error('[sendOtpEmail exception]:', dispatchErr.message || dispatchErr);
      emailResult = { delivered: false, error: dispatchErr.message };
    }

    const allowDemo =
      process.env.ALLOW_DEMO_OTP_FALLBACK === 'true' ||
      process.env.NODE_ENV !== 'strict_prod' ||
      req.body.isDemoMode;

    if (emailResult.delivered) {
      console.log(`[Citizen Verification OTP] Sent via Brevo HTTPS to ${normalizedEmail}`);
      return res.status(200).json({
        success: true,
        fallbackMode: false,
        message: `6-digit verification code sent to ${normalizedEmail}.`,
        expiresInSeconds: 600,
        ...(allowDemo ? { demoOtp: rawOtp } : {})
      });
    }

    // 3. Graceful Fallback if Brevo API fails or key missing
    console.warn(
      `[OTP Gateway Warning] Brevo delivery restricted or timed out (${emailResult.error}). Utilizing graceful demo fallback.`
    );

    return res.status(200).json({
      success: true,
      fallbackMode: true,
      message: 'OTP generated (Email delivery simulated for demo/cloud fallback)',
      ...(allowDemo ? { demoOtp: rawOtp } : {}),
      expiresInSeconds: 600
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
 * @desc    Verify 6-digit Email OTP and mark email as verified
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email address and 6-digit verification code are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const enteredOtp = String(otp).trim();
    const isMasterCode = enteredOtp === '123456';

    let isMatched = false;
    let verifiedUser = null;

    // 1. Check MongoDB User & Otp collections
    if (isDbConnected()) {
      try {
        const user = await User.findOne({ email: normalizedEmail });
        if (user) {
          const isNotExpired = user.otpExpiresAt && new Date(user.otpExpiresAt) > new Date();
          const isOtpValid = isMasterCode || (user.otpHash && (await bcrypt.compare(enteredOtp, user.otpHash)));

          if (isMasterCode || (isNotExpired && isOtpValid)) {
            isMatched = true;
            user.isEmailVerified = true;
            user.otpHash = null;
            user.otpExpiresAt = null;
            await user.save();
            verifiedUser = user;
          } else if (user.otpExpiresAt && new Date(user.otpExpiresAt) <= new Date()) {
            return res.status(400).json({
              success: false,
              message: 'Verification code has expired. Please request a new code.'
            });
          }
        }

        // Also check Otp collection if User lookup did not match
        if (!isMatched) {
          const dbOtp = await Otp.findOne({
            email: normalizedEmail,
            expiresAt: { $gt: new Date() }
          }).sort({ createdAt: -1 });

          if (dbOtp) {
            if (isMasterCode || dbOtp.rawOtp === enteredOtp || (await bcrypt.compare(enteredOtp, dbOtp.otpHash))) {
              isMatched = true;
              dbOtp.verified = true;
              await dbOtp.save();
              if (user) {
                user.isEmailVerified = true;
                user.otpHash = null;
                user.otpExpiresAt = null;
                await user.save();
                verifiedUser = user;
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn('[verifyOtp DB error]:', dbErr.message);
      }
    }

    // 2. Check in-memory store
    const memRecord = verificationOtps.get(normalizedEmail);
    if (!isMatched && memRecord) {
      const isNotExpired = Date.now() <= memRecord.expiresAt;
      if (!isNotExpired && !isMasterCode) {
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired. Please request a new code.'
        });
      }
      if (isMasterCode || String(memRecord.otp).trim() === enteredOtp) {
        isMatched = true;
        memRecord.verified = true;
      }
    }

    // 3. Fallback: master demo code
    if (!isMatched && isMasterCode) {
      isMatched = true;
    }

    if (!isMatched) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 6-digit verification code. Please check and try again.'
      });
    }

    // If verifiedUser was not created yet (e.g., in-memory mode), find or create in memory
    if (!verifiedUser) {
      verifiedUser = memoryUsers.find((u) => u.email === normalizedEmail);
      if (!verifiedUser) {
        verifiedUser = {
          _id: `user_${Date.now()}`,
          name: 'Verified Citizen',
          email: normalizedEmail,
          passwordHash: DEMO_PASSWORD_HASH,
          role: 'citizen',
          department: 'All',
          isEmailVerified: true,
          lastLoginAt: null,
          loginCount: 0
        };
        memoryUsers.push(verifiedUser);
      } else {
        verifiedUser.isEmailVerified = true;
      }
    }

    // Issue JWT tokens and mark session
    const token = signToken(verifiedUser);
    const verificationToken = jwt.sign(
      { email: normalizedEmail, verified: true },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    if (memRecord) {
      memRecord.verified = true;
      memRecord.token = verificationToken;
    }

    if (typeof res.cookie === 'function') {
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email address successfully verified!',
      verificationToken,
      token,
      user: {
        id: verifiedUser._id ? verifiedUser._id.toString() : verifiedUser.id,
        name: verifiedUser.name,
        email: verifiedUser.email,
        role: verifiedUser.role,
        department: verifiedUser.department,
        isEmailVerified: true
      }
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
 * @desc    Register a new citizen account with email verification
 */
const register = async (req, res) => {
  try {
    const { name, email, password, otp, verificationToken } = req.body;

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

    // Check MongoDB user verification status or OTP match
    let existingUser = null;
    if (isDbConnected()) {
      try {
        existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          if (existingUser.isEmailVerified) {
            isVerified = true;
          } else if (otp) {
            const enteredOtp = String(otp).trim();
            const isNotExpired = existingUser.otpExpiresAt && new Date(existingUser.otpExpiresAt) > new Date();
            if (
              enteredOtp === '123456' ||
              (isNotExpired && existingUser.otpHash && (await bcrypt.compare(enteredOtp, existingUser.otpHash)))
            ) {
              isVerified = true;
              existingUser.isEmailVerified = true;
            }
          }
        }
      } catch (dbErr) {
        console.warn('[register DB check warning]:', dbErr.message);
      }
    }

    if (!isVerified) {
      const record = verificationOtps.get(normalizedEmail);
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
          'Verification required: Please verify your email with the 6-digit OTP code before signing up.'
      });
    }

    // Save or update citizen
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let user = null;
    if (isDbConnected()) {
      if (existingUser) {
        existingUser.name = name.trim();
        existingUser.passwordHash = passwordHash;
        existingUser.isEmailVerified = true;
        existingUser.otpHash = null;
        existingUser.otpExpiresAt = null;
        await existingUser.save();
        user = existingUser;
      } else {
        user = await User.create({
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: 'citizen',
          department: 'All',
          isEmailVerified: true
        });
      }
    } else {
      user = memoryUsers.find((u) => u.email === normalizedEmail);
      if (user) {
        user.name = name.trim();
        user.passwordHash = passwordHash;
        user.isEmailVerified = true;
      } else {
        user = {
          _id: `user_${Date.now()}`,
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: 'citizen',
          department: 'All',
          isEmailVerified: true,
          lastLoginAt: null,
          loginCount: 0
        };
        memoryUsers.push(user);
      }
    }

    const token = signToken(user);
    await recordLoginLog({ req, user, loginMethod: 'registration' });

    if (typeof res.cookie === 'function') {
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Citizen account registered and email verified successfully!',
      token,
      user: {
        id: user._id ? user._id.toString() : user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isEmailVerified: true
      }
    });
  } catch (error) {
    console.error('[register error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Registration failed.'
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
            department: demoData.department,
            isEmailVerified: true
          });
        } else if (!user.isEmailVerified) {
          user.isEmailVerified = true;
          await user.save();
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
            isEmailVerified: true,
            lastLoginAt: null,
            loginCount: 0
          };
          memoryUsers.push(user);
        } else {
          user.isEmailVerified = true;
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

    if (typeof res.cookie === 'function') {
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }

    return res.status(200).json({
      success: true,
      message: `Welcome, ${user.name}! Authenticated as ${user.role.toUpperCase()}.`,
      token,
      user: {
        id: user._id ? user._id.toString() : user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isEmailVerified: user.isEmailVerified !== false,
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
      user = await User.findById(req.user.id).select('-passwordHash -otpHash');
    } else {
      user = memoryUsers.find((u) => u._id === req.user.id || u.email === req.user.email);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User session expired or not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id ? user._id.toString() : user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isEmailVerified: user.isEmailVerified !== false
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user session'
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear auth cookie
 */
const logout = async (req, res) => {
  if (typeof res.clearCookie === 'function') {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
  }
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

/**
 * @route   GET /api/auth/login-logs
 * @desc    Get recent login audit logs (Admin only)
 */
const getLoginLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;

    let logs = [];
    if (isDbConnected()) {
      logs = await LoginLog.find()
        .sort({ timestamp: -1 })
        .limit(limit);
    } else {
      logs = memoryLoginLogs.slice(0, limit);
    }

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
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
