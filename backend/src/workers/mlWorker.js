const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

// Simple API client stub for ML Service queries
const mlClient = {
  detectAnomalies: async (testRunId, window = 30) => {
    const response = await axios.post(`${ML_SERVICE_URL}/ml/anomaly/detect`, { test_run_id: testRunId, window_size: window });
    return response.data;
  },
  predictFailure: async (testRunId, metrics = {}) => {
    const response = await axios.post(`${ML_SERVICE_URL}/ml/predict/failure`, { test_run_id: testRunId, ...metrics });
    return response.data;
  },
  generateReport: async (testRunId) => {
    const response = await axios.post(`${ML_SERVICE_URL}/ml/report/generate`, { test_run_id: testRunId });
    return response.data;
  },
  scoreRootCause: async (testRunId) => {
    const response = await axios.post(`${ML_SERVICE_URL}/ml/root-cause/score`, { test_run_id: testRunId });
    return response.data;
  }
};

let mlWorker = null;

try {
  mlWorker = new Worker('ml-analysis', async (job) => {
    console.log(`Processing background ML job: ${job.name} (Job ID: ${job.id})`);
    const { testRunId, window, metrics } = job.data;

    try {
      switch (job.name) {
        case 'anomaly-detect':
          return await mlClient.detectAnomalies(testRunId, window);
        case 'failure-predict':
          return await mlClient.predictFailure(testRunId, metrics);
        case 'generate-report':
          return await mlClient.generateReport(testRunId);
        case 'root-cause-score':
          return await mlClient.scoreRootCause(testRunId);
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (err) {
      console.error(`Error executing ML backend task ${job.name}:`, err.message);
      throw err;
    }
  }, {
    connection: redis,
    concurrency: 5
  });

  mlWorker.on('completed', (job, result) => {
    console.log(`ML job ${job.name} (Job ID: ${job.id}) completed successfully.`);
  });

  mlWorker.on('failed', (job, err) => {
    console.error(`ML job ${job.name} (Job ID: ${job.id}) failed with error:`, err.message);
  });
} catch (err) {
  console.error('Failed to initialize ML Worker:', err.message);
}

module.exports = {
  mlWorker,
  mlClient
};
