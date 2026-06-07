const { Point, writeApi } = require('../config/influx');
const { cacheMetrics, setTestState } = require('../config/redis');
const sseManager = require('../sse/sseManager');

class MetricsCollector {
  constructor() {
    this.buffer = new Map(); // Maps testRunId -> array of raw responses
  }

  /**
   * Initialize a new metrics buffer for a running test.
   */
  initTestRun(testRunId) {
    this.buffer.set(testRunId, []);
  }

  /**
   * Tracks a single HTTP response transaction.
   * Called on every completed request.
   */
  recordResponse(testRunId, { statusCode, bytes, responseTime, endpointName = 'default' }) {
    const runBuffer = this.buffer.get(testRunId);
    if (!runBuffer) return;

    runBuffer.push({
      statusCode,
      bytes,
      responseTime,
      endpointName,
      timestamp: Date.now()
    });
  }

  /**
   * Aggregates and stores 1-second interval metrics.
   * Triggered on every 'tick' event from the load generator.
   */
  async processTick(testRunId, tickData, activeConnections) {
    const runBuffer = this.buffer.get(testRunId) || [];
    // Reset buffer for the next second interval
    this.buffer.set(testRunId, []);

    const totalRequests = runBuffer.length;
    let successCount = 0;
    let errorCount = 0;
    let sumLatency = 0;
    let maxLatency = 0;
    let latencies = [];

    runBuffer.forEach(req => {
      latencies.push(req.responseTime);
      sumLatency += req.responseTime;
      if (req.responseTime > maxLatency) maxLatency = req.responseTime;

      // Classify successes vs errors
      if (req.statusCode >= 200 && req.statusCode < 400) {
        successCount++;
      } else {
        errorCount++;
      }
    });

    // Sort latencies for percentiles
    latencies.sort((a, b) => a - b);
    const getPercentile = (p) => {
      if (latencies.length === 0) return 0;
      const index = Math.ceil(latencies.length * p) - 1;
      return latencies[index];
    };

    const avgLatency = totalRequests > 0 ? Math.round(sumLatency / totalRequests) : 0;
    const p50Latency = getPercentile(0.5);
    const p95Latency = getPercentile(0.95);
    const p99Latency = getPercentile(0.99);
    const errorRate = totalRequests > 0 ? parseFloat(((errorCount / totalRequests) * 100).toFixed(2)) : 0.0;
    const throughput = tickData.requests ? tickData.requests.average : totalRequests; // default fallback to current second's throughput

    const snapshot = {
      testRunId,
      timestamp: new Date().toISOString(),
      avgLatency,
      p50Latency,
      p95Latency,
      p99Latency,
      maxLatency,
      totalRequests,
      successCount,
      errorCount,
      throughput,
      errorRate,
      activeUsers: activeConnections
    };

    // 1. Write Metrics snapshot to InfluxDB (if connected)
    if (writeApi) {
      try {
        const point = new Point('request_metrics')
          .tag('testRunId', testRunId)
          .floatField('avg_latency', avgLatency)
          .floatField('p50_latency', p50Latency)
          .floatField('p95_latency', p95Latency)
          .floatField('p99_latency', p99Latency)
          .floatField('max_latency', maxLatency)
          .intField('total_requests', totalRequests)
          .intField('success_count', successCount)
          .intField('error_count', errorCount)
          .floatField('throughput', throughput)
          .floatField('error_rate', errorRate)
          .intField('active_users', activeConnections);

        writeApi.writePoint(point);
      } catch (err) {
        console.error(`Error writing point to InfluxDB for ${testRunId}:`, err.message);
      }
    }

    // 2. Cache latest snapshot in Redis for fast SSE pickups
    try {
      await cacheMetrics(testRunId, snapshot);
      await setTestState(testRunId, {
        activeUsers: activeConnections,
        currentLatency: avgLatency,
        currentThroughput: throughput,
        errorRate
      });
    } catch (err) {
      console.error(`Error writing state to Redis for ${testRunId}:`, err.message);
    }

    // 3. Push snapshot to Server-Sent Events browser clients
    sseManager.broadcast(testRunId, 'metrics', snapshot);

    return snapshot;
  }

  /**
   * Finalize and clean up buffers after completion of a test run.
   */
  cleanup(testRunId) {
    this.buffer.delete(testRunId);
  }
}

module.exports = new MetricsCollector();
