const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nagarpulse_ai');
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    const Grievance = require('../models/Grievance');
    await Grievance.createIndexes();
    console.log('[MongoDB] Geospatial 2dsphere indexes synchronized.');
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // Do not exit process in development to allow server to start for inspection
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
