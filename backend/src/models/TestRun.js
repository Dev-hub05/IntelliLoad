const mongoose = require('mongoose');

const TestRunSchema = new mongoose.Schema({
  name: { type: String, required: true },
  targetUrl: { type: String, required: true },
  method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' },
  headers: { type: mongoose.Schema.Types.Mixed, default: {} },
  apiKey: { type: String, default: '' },
  body: { type: String, default: '' },
  collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', default: null },
  config: {
    connections: { type: Number, required: true, max: 500, default: 10 },
    duration: { type: Number, required: true, default: 30 }, // in seconds
    rampUpTime: { type: Number, default: 0 }, // in seconds
    pattern: { type: String, enum: ['steady', 'ramp', 'spike', 'wave', 'stress', 'autonomous'], default: 'steady' }
  },
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'stopped'], default: 'pending' },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  summary: {
    totalRequests: { type: Number, default: 0 },
    successfulRequests: { type: Number, default: 0 },
    failedRequests: { type: Number, default: 0 },
    avgLatency: { type: Number, default: 0 },
    p50Latency: { type: Number, default: 0 },
    p95Latency: { type: Number, default: 0 },
    p99Latency: { type: Number, default: 0 },
    maxLatency: { type: Number, default: 0 },
    avgThroughput: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 } // percentage
  },
  anomalies: [{
    timestamp: { type: Date, default: Date.now },
    type: { type: String },
    confidence: { type: Number },
    message: { type: String }
  }],
  failurePrediction: {
    probability: { type: Number, default: 0 },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    contributingFactors: [{
      feature: { type: String },
      importance: { type: Number }
    }]
  },
  rootCause: {
    scores: {
      database: { type: Number, default: 0 },
      network: { type: Number, default: 0 },
      cpu: { type: Number, default: 0 },
      memory: { type: Number, default: 0 },
      concurrency: { type: Number, default: 0 }
    },
    primaryCause: { type: String, default: 'none' },
    confidence: { type: Number, default: 0 },
    explanation: { type: String, default: '' }
  },
  breakingPoint: {
    maxStableUsers: { type: Number, default: 0 },
    failureStartsAt: { type: Number, default: 0 },
    recommendedCapacity: { type: Number, default: 0 },
    stepsCompleted: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TestRun', TestRunSchema);
