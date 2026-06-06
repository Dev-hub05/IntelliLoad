const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Performance simulation state
let currentConnections = 0;
let forceLatency = 0;       // Inject manual extra latency (ms)
let forceErrorRate = 0;     // Inject manual error rate percentage (0 - 100)

// Track active connections middleware to simulate resource limitations
app.use((req, res, next) => {
  currentConnections++;
  
  res.on('finish', () => {
    currentConnections = Math.max(0, currentConnections - 1);
  });
  
  next();
});

// Helper to calculate dynamic latency based on load
function getDynamicLatency() {
  let latency = 50 + Math.random() * 50; // Base: 50-100ms
  
  // Simulate CPU/Thread/Database contention under higher concurrency
  if (currentConnections > 20) {
    // Latency increases exponentially with connections past threshold
    const extraLoad = currentConnections - 20;
    latency += Math.pow(extraLoad, 1.5) * 8; 
  }
  
  // Apply manual injection
  latency += forceLatency;
  
  return latency;
}

// Helper to determine if a request should fail
function shouldFail() {
  // Manual override
  if (forceErrorRate > 0 && Math.random() * 100 < forceErrorRate) {
    return true;
  }
  
  // Dynamic degradation based on load
  if (currentConnections > 40) {
    // 40+ connections: error rate increases dynamically
    const failChance = Math.min((currentConnections - 40) * 1.5, 95);
    return Math.random() * 100 < failChance;
  }
  
  return false;
}

// Shared delay utility
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Endpoints
app.get('/api/data', async (req, res) => {
  const latency = getDynamicLatency();
  await delay(latency);
  
  if (shouldFail()) {
    const errorCodes = [500, 503, 504];
    const code = errorCodes[Math.floor(Math.random() * errorCodes.length)];
    return res.status(code).json({ error: 'Internal Server Error', code });
  }
  
  res.json({
    message: 'Success',
    latency: `${Math.round(latency)}ms`,
    connections: currentConnections,
    data: Array.from({ length: 10 }, (_, i) => ({ id: i, value: Math.random() }))
  });
});

app.post('/api/login', async (req, res) => {
  const latency = getDynamicLatency() + 20; // Extra auth hashing overhead
  await delay(latency);
  
  if (shouldFail()) {
    return res.status(500).json({ error: 'Database Connection Timeout' });
  }
  
  const { email } = req.body;
  res.json({
    token: `mock_jwt_token_${Buffer.from(email || 'default').toString('base64')}`,
    connections: currentConnections
  });
});

app.post('/api/checkout', async (req, res) => {
  const latency = getDynamicLatency() + 100; // Extra payment processing delay
  await delay(latency);
  
  if (shouldFail() || (currentConnections > 25 && Math.random() > 0.5)) {
    return res.status(503).json({ error: 'Payment Gateway Timeout (DB Lock Contention)' });
  }
  
  res.json({
    orderId: `order_${Math.floor(Math.random() * 1000000)}`,
    status: 'completed'
  });
});

// Admin endpoint to inject performance problems manually
app.post('/admin/inject', (req, res) => {
  const { latency, errorRate } = req.body;
  if (latency !== undefined) forceLatency = latency;
  if (errorRate !== undefined) forceErrorRate = errorRate;
  
  res.json({
    message: 'Injected parameters updated',
    injectedLatency: forceLatency,
    injectedErrorRate: forceErrorRate
  });
});

app.listen(PORT, () => {
  console.log(`IntelliLoad Mock API running on port ${PORT}`);
});
