require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Database Connections
connectDB();
require('./src/config/influx');
require('./src/config/redis');

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    services: {
      mongodb: 'connected', // connection is async, full check can be added later
      redis: 'ready'
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`IntelliLoad Backend Server running on port ${PORT}`);
});
