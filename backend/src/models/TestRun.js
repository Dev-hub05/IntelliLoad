const mongoose = require('mongoose');

const AnomalySchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  type: { type: String, required: true },
  confidence: { type: Number, required: true }, // 0.0 to 1.0
  message: { type: String, required: true }
}, { _id: false });

const ContributingFactorSchema = new mongoose.Schema({
  feature: { type: String, required: true },
  importance: { type: Number, required: true } // Importance score
}, { _id: false });

const TestRunSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  targetUrl: {
    type: String,
    required: true,
    trim: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE'],
    required: true
  },
  headers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  apiKey: {
    type: String,
    default: ''
  },
  body: {
    type: String,
    default: ''
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    default: null
  },
  config: {
    connections: { type: Number, default: 10, max: 500 },
    duration: { type: Number, default: 30 }, // in seconds
    rampUpTime: { type: Number, default: 0 }, // in seconds
    pattern: {
      type: String,
      enum: ['steady', 'ramp', 'spike', 'wave', 'stress', 'autonomous'],
      default: 'steady'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'stopped'],
    default: 'pending'
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  summary: {
    totalRequests: { type: Number, default: 0 },
    successfulRequests: { type: Number, default: 0 },
    failedRequests: { type: Number, default: 0 },
    avgLatency: { type: Number, default: 0 },     // ms
    p50Latency: { type: Number, default: 0 },     // ms
    p95Latency: { type: Number, default: 0 },     // ms
    p99Latency: { type: Number, default: 0 },     // ms
    maxLatency: { type: Number, default: 0 },     // ms
    avgThroughput: { type: Number, default: 0 },   // req/sec
    errorRate: { type: Number, default: 0 }        // percentage
  },
  anomalies: [AnomalySchema],
  failurePrediction: {
    probability: { type: Number, default: 0 }, // 0.0 to 1.0
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    contributingFactors: [ContributingFactorSchema]
  },
  rootCause: {
    scores: {
      database: { type: Number, default: 0 },
      network: { type: Number, default: 0 },
      cpu: { type: Number, default: 0 },
      memory: { type: Number, default: 0 },
      concurrency: { type: Number, default: 0 }
    },
    primaryCause: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    explanation: { type: String, default: '' }
  },
  breakingPoint: {
    maxStableUsers: { type: Number, default: 0 },
    failureStartsAt: { type: Number, default: 0 },
    recommendedCapacity: { type: Number, default: 0 },
    stepsCompleted: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('TestRun', TestRunSchema);
