const { Queue } = require('bullmq');
const { redis } = require('../config/redis');

// Instantiate primary background analysis queue
const mlQueue = new Queue('ml-analysis', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

/**
 * Enqueue background analysis jobs for ML processing
 * @param {string} testRunId - Target TestRun ID
 * @param {string} jobType - Name of task ('anomaly-detect' | 'failure-predict' | 'generate-report' | 'root-cause-score')
 * @param {Object} extraData - Optional runtime parameters
 */
async function enqueueAnalysis(testRunId, jobType, extraData = {}) {
  try {
    const job = await mlQueue.add(jobType, {
      testRunId,
      ...extraData
    });
    console.log(`Successfully enqueued ML job ${jobType} (ID: ${job.id}) for TestRun: ${testRunId}`);
    return job;
  } catch (err) {
    console.error(`Failed to enqueue ML job ${jobType} for TestRun ${testRunId}:`, err.message);
    throw err;
  }
}

module.exports = {
  mlQueue,
  enqueueAnalysis
};
