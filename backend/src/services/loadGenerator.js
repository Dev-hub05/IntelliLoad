const autocannon = require('autocannon');
const { expandTemplate } = require('./templateEngine');
const metricsCollector = require('./metricsCollector');
const sseManager = require('../sse/sseManager');

// Store active autocannon runner instances mapping testRunId -> autocannonInstance
const activeTestRunners = new Map();

/**
 * Build request headers, injecting API keys if configured.
 */
function buildHeaders(customHeaders = {}, apiKey = '') {
  const headers = { ...customHeaders };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['x-api-key'] = apiKey; // Common alternative header config
  }
  return headers;
}

/**
 * Starts a load test runner instance programmatically.
 * @param {Object} testRun - TestRun document from MongoDB
 * @returns {Promise<Object>} Autocannon instance wrapper
 */
function startTest(testRun) {
  const { _id, targetUrl, method, headers, apiKey, body, config } = testRun;
  const testRunId = _id.toString();

  // Initialize metrics collector queue for this test
  metricsCollector.initTestRun(testRunId);

  // Setup Autocannon configuration
  const autocannonOptions = {
    url: targetUrl,
    connections: config.connections || 10,
    duration: config.duration || 30,
    method: method || 'GET',
    headers: buildHeaders(headers, apiKey),
    // Dynamic request builders: autocannon supports custom request setups
    setupClient: (client) => {
      // Intercept and overwrite request payload with expanded template variables
      client.on('request', (requestOptions) => {
        if (body) {
          const expandedBody = expandTemplate(body);
          requestOptions.body = expandedBody;
          // Dynamically compute content length
          requestOptions.headers['content-length'] = Buffer.byteLength(expandedBody).toString();
          requestOptions.headers['content-type'] = 'application/json';
        }
        return requestOptions;
      });
    }
  };

  const instance = autocannon(autocannonOptions);
  activeTestRunners.set(testRunId, instance);

  // Track active connection ramp-up dynamically
  let activeUsers = config.connections;

  // Track per-request measurements
  instance.on('response', (client, statusCode, resBytes, responseTime) => {
    metricsCollector.recordResponse(testRunId, {
      statusCode,
      bytes: resBytes,
      responseTime
    });
  });

  // Track per-second ticks
  instance.on('tick', async (tickData) => {
    // Process aggregated metrics snapshot
    await metricsCollector.processTick(testRunId, tickData, activeUsers);
  });

  // Handle errors
  instance.on('error', (err) => {
    console.error(`Autocannon engine error for test run ${testRunId}:`, err.message);
    sseManager.broadcast(testRunId, 'error', { message: err.message });
  });

  return new Promise((resolve) => {
    instance.on('done', async (result) => {
      activeTestRunners.delete(testRunId);
      
      // Calculate final aggregates from autocannon summary report
      const finalSummary = {
        totalRequests: result.requests.sent || result.requests.total || 0,
        successfulRequests: result.requests.average ? Math.round(result.requests.average * (result.duration || 1)) : 0, // estimate or extract
        failedRequests: result.errors || 0,
        avgLatency: Math.round(result.latency.average || 0),
        p50Latency: Math.round(result.latency.p50 || 0),
        p95Latency: Math.round(result.latency.p95 || 0),
        p99Latency: Math.round(result.latency.p99 || 0),
        maxLatency: Math.round(result.latency.max || 0),
        avgThroughput: parseFloat((result.requests.average || 0).toFixed(2)),
        errorRate: result.requests.total > 0 ? parseFloat(((result.errors / result.requests.total) * 100).toFixed(2)) : 0
      };

      // Ensure success count reflects requests minus errors
      finalSummary.successfulRequests = Math.max(0, finalSummary.totalRequests - finalSummary.failedRequests);

      metricsCollector.cleanup(testRunId);
      resolve(finalSummary);
    });
  });
}

/**
 * Stops a running load test instance.
 * @param {string} testRunId - Unique test run ID
 * @returns {boolean} True if stopped, false if not running
 */
function stopTest(testRunId) {
  const runner = activeTestRunners.get(testRunId);
  if (!runner) {
    return false;
  }
  
  try {
    runner.stop();
    activeTestRunners.delete(testRunId);
    return true;
  } catch (err) {
    console.error(`Error stopping test run ${testRunId}:`, err.message);
    return false;
  }
}

module.exports = {
  startTest,
  stopTest,
  activeTestRunners
};
