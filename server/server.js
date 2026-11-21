const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const grievanceRoutes = require('./routes/grievanceRoutes');
const authRoutes = require('./routes/authRoutes');

// Load environment variables
dotenv.config({ override: true });

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Render / Cloud deployment (needed for accurate IP rate limiting)
app.set('trust proxy', 1);

// Configure CORS for local development and production deployment (Vercel)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some((o) => o.replace(/\/$/, '') === cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production';

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Access-Token', 'X-QA-Test']
}));

// Body & Cookie parsers
app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lightweight Health Check endpoint for Render / AWS uptime probes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Detailed API Health Status
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'NagarPulse AI - Civic Grievance Triage API',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
    cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/grievances', grievanceRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found.`
  });
});

// Production Global Error Handler Middleware
app.use(errorHandler);

// Safety handlers for uncaught promises & exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.warn('[Server Warning] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server Warning] Uncaught Exception:', error.message || error);
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` 🚀 NagarPulse AI Server running on port ${PORT}`);
  console.log(` 🌐 Render Health Probe: http://localhost:${PORT}/health`);
  console.log(` 🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(` 📋 Grievances API: http://localhost:${PORT}/api/grievances`);
  console.log(`====================================================`);
});

module.exports = app;
