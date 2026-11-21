const multer = require('multer');

/**
 * Production Global Error Handler Middleware
 * Cleanly handles Multer, Gemini API, CORS, and runtime errors
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Global Error Middleware]:', err.message || err);

  // Multer error handling
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        errorType: 'MulterError',
        message: 'Uploaded file exceeds maximum limit of 15MB.'
      });
    }
    return res.status(400).json({
      success: false,
      errorType: 'MulterError',
      message: `File upload error: ${err.message}`
    });
  }

  // Multer file filter rejection
  if (err.message && err.message.includes('Unsupported file type')) {
    return res.status(400).json({
      success: false,
      errorType: 'InvalidFileType',
      message: err.message
    });
  }

  // CORS rejection
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({
      success: false,
      errorType: 'CorsError',
      message: err.message
    });
  }

  // Gemini API load notices
  if (err.message && (err.message.includes('Gemini') || err.message.includes('generative'))) {
    return res.status(503).json({
      success: false,
      errorType: 'GeminiServiceNotice',
      message: 'AI Service is experiencing temporary latency. Fallback routing applied.'
    });
  }

  // Standard JSON error response
  res.status(err.status || err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred'
  });
};

module.exports = errorHandler;
