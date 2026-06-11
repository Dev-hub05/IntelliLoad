const axios = require('axios');
const { expandTemplate } = require('./templateEngine');
const metricsCollector = require('./metricsCollector');

class CollectionRunnerService {
  /**
   * Run a load test session on a collection
   * @param {Object} collection - The Collection model document
   * @param {number} connections - Concurrency levels
   * @param {number} duration - Runtimes in seconds
   * @param {string} testRunId - Accompanying TestRun record ID
   */
  async runCollection(collection, connections, duration, testRunId) {
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    // Store overall collections metrics in local metricsCollector
    metricsCollector.initTest(testRunId);

    // Dynamic extraction variables storage context
    const runtimeVariables = {};

    console.log(`Starting Collection Load Engine for run: ${testRunId} (Concurrency: ${connections})`);

    // In a production scenario, we spawn multiple concurrent virtual users (VUs) 
    // each running the loop of requests. We can implement a clean concurrent executor loop.
    const runVirtualUser = async () => {
      while (Date.now() < endTime) {
        if (collection.executionMode === 'parallel') {
          // Parallel Execution
          const requests = collection.endpoints.map(endpoint => 
            this.executeEndpoint(collection, endpoint, runtimeVariables, testRunId)
          );
          await Promise.all(requests);
        } else {
          // Sequential Execution (Default)
          for (const endpoint of collection.endpoints) {
            if (Date.now() >= endTime) break;
            await this.executeEndpoint(collection, endpoint, runtimeVariables, testRunId);
            if (endpoint.delayAfterMs > 0) {
              await new Promise(resolve => setTimeout(resolve, endpoint.delayAfterMs));
            }
          }
        }
      }
    };

    // Spawn VUs
    const virtualUsers = Array.from({ length: connections }, () => runVirtualUser());
    
    // Keep feeding metrics updates to SSE and database via interval ticks
    let tickStats = {
      activeUsers: connections,
      totalRequests: 0,
      errors: 0,
      non2xx: 0,
      throughput: 0,
      avgLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      maxLatency: 0
    };

    const latencyHistory = [];

    const statsInterval = setInterval(() => {
      const buffer = metricsCollector.testBuffers.get(testRunId) || [];
      const currentTickRequests = buffer.length;
      
      tickStats.totalRequests += currentTickRequests;
      
      let tickErrors = 0;
      let tickSumLatency = 0;

      buffer.forEach(item => {
        if (item.statusCode < 200 || item.statusCode >= 300) {
          tickErrors++;
        }
        tickSumLatency += item.responseTime;
        latencyHistory.push(item.responseTime);
      });

      tickStats.errors += tickErrors;
      
      if (currentTickRequests > 0) {
        tickStats.avgLatency = tickSumLatency / currentTickRequests;
        
        // Calculate Percentiles
        const sorted = buffer.map(item => item.responseTime).sort((a, b) => a - b);
        tickStats.p50Latency = sorted[Math.floor(sorted.length * 0.50)] || 0;
        tickStats.p95Latency = sorted[Math.floor(sorted.length * 0.95)] || 0;
        tickStats.p99Latency = sorted[Math.floor(sorted.length * 0.99)] || 0;
        tickStats.maxLatency = sorted[sorted.length - 1] || 0;
        tickStats.throughput = currentTickRequests; // Requests per second
      } else {
        tickStats.throughput = 0;
      }

      metricsCollector.processTick(testRunId, tickStats);
    }, 1000);

    // Wait for all VUs to complete
    await Promise.all(virtualUsers);
    
    clearInterval(statsInterval);

    // Save overall summary
    metricsCollector.cleanup(testRunId);
    console.log(`Collection Load Engine execution complete for run: ${testRunId}`);
  }

  /**
   * Helper to parse and execute an individual API endpoint call
   */
  async executeEndpoint(collection, endpoint, runtimeVariables, testRunId) {
    const fullUrl = `${collection.baseUrl}${endpoint.url}`;
    const expandedUrl = expandTemplate(fullUrl, runtimeVariables);
    const expandedBody = expandTemplate(endpoint.body, runtimeVariables);

    // Headers merging
    const headers = {
      ...collection.globalHeaders,
      ...endpoint.headers
    };

    if (collection.apiKey) {
      headers['X-API-Key'] = collection.apiKey;
    }

    const start = Date.now();
    let statusCode = 200;
    let resBytes = 0;
    let responseData = null;

    try {
      const response = await axios({
        method: endpoint.method,
        url: expandedUrl,
        headers,
        data: endpoint.method !== 'GET' ? expandedBody : undefined,
        timeout: 10000 // 10s timeout limit
      });

      statusCode = response.status;
      responseData = response.data;
      resBytes = JSON.stringify(responseData).length;
    } catch (err) {
      statusCode = err.response ? err.response.status : 500;
      responseData = err.response ? err.response.data : null;
      resBytes = responseData ? JSON.stringify(responseData).length : 0;
    }

    const responseTime = Date.now() - start;

    // Record Metrics
    metricsCollector.recordResponse({
      testId: testRunId,
      statusCode,
      responseTime,
      bytes: resBytes,
      endpoint: endpoint.name,
      timestamp: Date.now()
    });

    // Run Extractors to capture variables for next steps
    if (responseData && endpoint.extractors && Array.isArray(endpoint.extractors)) {
      endpoint.extractors.forEach(ext => {
        try {
          if (ext.source === 'body') {
            // Basic JSON path extractor helper, e.g., 'data.token'
            const value = this.getValueByPath(responseData, ext.path);
            if (value !== undefined) {
              runtimeVariables[ext.variable] = value;
              console.log(`[Extractor] Extracted variable '${ext.variable}' = '${value}'`);
            }
          } else if (ext.source === 'header' && ext.responseHeaders) {
            // Header extractors
            const val = ext.responseHeaders[ext.path.toLowerCase()];
            if (val) runtimeVariables[ext.variable] = val;
          }
        } catch (err) {
          console.error(`Failed to run extractor for variable ${ext.variable}:`, err.message);
        }
      });
    }
  }

  /**
   * Helper to retrieve nested object fields by string path (e.g. "data.user.id")
   */
  getValueByPath(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
}

module.exports = new CollectionRunnerService();
