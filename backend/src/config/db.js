const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intelliload';
  
  const options = {
    autoIndex: true
  };

  try {
    await mongoose.connect(uri, options);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Exit process with failure in production, retry in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    }
  }
}

module.exports = connectDB;
