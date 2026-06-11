const autocannon = require('autocannon');
const EventEmitter = require('events');
const { expandTemplate } = require('./templateEngine');

class LoadGeneratorService extends EventEmitter {
  constructor() {
    super();
    this.activeTests = new Map(); // Store active autocannon instances
  }

  /**
   * Start a load test
   * @param {Object} testRun - TestRun model instance
   * @param {Object} variables - Runtime variables context (for collections)
   */
  startTest(testRun, variables = {}) {
    const testId = testRun._id.toString();

    // Check if test is already running
    if (this.activeTests.has(testId)) {
      throw new Error(`Test with ID ${testId} is already running.`);
    }

    const { targetUrl, method, headers, body, apiKey, config } = testRun;
    const { connections, duration, pattern } = config;

    // Process headers and inject API Key if present
    const testHeaders = { ...headers };
    if (apiKey) {
      testHeaders['X-API-Key'] = apiKey;
      testHeaders['Authorization'] = `ApiKey ${apiKey}`; // support both standards
    }

    // Determine request details
    let requestOptions = {
      method: method || 'GET',
      path: new URL(targetUrl).pathname + new URL(targetUrl).search,
      headers: testHeaders
    };

    // autocannon requires custom setup to dynamically generate bodies per-request
    // We hook into the setup function to expand template variables per request
    const setupClient = (client) => {
      client.on('request', (req) => {
        // Expand template strings for URL query and request body per-request
        if (body) {
          req.body = expandTemplate(body, variables);
        }
        
        // Also expand headers if they contain placeholders
        if (req.headers) {
          for (const [key, val] of Object.entries(req.headers)) {
            if (typeof val === 'string') {
              req.headers[key] = expandTemplate(val, variables);
            }
          }
        }
      });
    };

    // Autocannon options
    const options = {
      url: new URL(targetUrl).origin,
      connections: connections,
      duration: duration,
      workers: 2, // Utilize standard background worker pooling
      requests: [requestOptions],
      setupClient: body ? setupClient : undefined
    };

    // Initialize autocannon
    const instance = autocannon(options);
    this.activeTests.set(testId, instance);

    // Track active connection ramp-up dynamically if specified
    if (config.rampUpTime > 0) {
      // Autocannon supports connections parameter as option,
      // but to simulate ramp-up programmatically we can scale it or let autocannon handle it.
      // Autocannon itself has a raw connection ramp-up option we can set:
      options.overallRate = undefined; // raw maximum
    }

    // Bind event listeners
    instance.on('response', (client, statusCode, resBytes, responseTime) => {
      this.emit('response', {
        testId,
        statusCode,
        responseTime,
        bytes: resBytes,
        timestamp: Date.now()
      });
    });

    instance.on('tick', (stats) => {
      // Emitted roughly every second with snapshot aggregated stats
      this.emit('tick', {
        testId,
        activeUsers: stats.connections,
        throughput: stats.requests.average || stats.requests.total / duration,
        avgLatency: stats.latency.average,
        p50Latency: stats.latency.p50,
        p95Latency: stats.latency.p95,
        p99Latency: stats.latency.p99,
        maxLatency: stats.latency.max,
        totalRequests: stats.requests.total,
        errors: stats.errors,
        non2xx: stats.non2xx,
        timestamp: Date.now()
      });
    });

    instance.on('done', (result) => {
      this.activeTests.delete(testId);
      this.emit('done', {
        testId,
        result,
        timestamp: Date.now()
      });
    });

    instance.on('error', (err) => {
      this.activeTests.delete(testId);
      this.emit('error', {
        testId,
        error: err.message,
        timestamp: Date.now()
      });
    });

    return instance;
  }

  /**
   * Gracefully stop a running test
   * @param {string} testId 
   */
  stopTest(testId) {
    const instance = this.activeTests.get(testId);
    if (!instance) {
      return false;
    }
    
    // Stop autocannon instance
    instance.stop();
    this.activeTests.delete(testId);
    return true;
  }

  /**
   * Check if a test is currently running
   * @param {string} testId 
   */
  isTestRunning(testId) {
    return this.activeTests.has(testId);
  }
}

// Singleton instance
module.exports = new LoadGeneratorService();
