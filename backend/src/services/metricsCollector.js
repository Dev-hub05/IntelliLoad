const { Point, writeApi } = require('../config/influx');
const { cacheMetrics, setTestState } = require('../config/redis');
const sseManager = require('../sse/sseManager');

// Keep a simple runtime buffer in memory for quick calculations
class MetricsCollector {
  constructor() {
    this.testBuffers = new Map(); // testId -> array of responses in the current second
  }

  /**
   * Initialize collector for a new test run
   * @param {string} testId 
   */
  initTest(testId) {
    this.testBuffers.set(testId, []);
  }

  /**
   * Record an individual request response
   * @param {Object} data - Contains testId, statusCode, responseTime, bytes, timestamp
   */
  recordResponse(data) {
    const { testId } = data;
    const buffer = this.testBuffers.get(testId);
    if (buffer) {
      buffer.push(data);
    }
  }

  /**
   * Process a 1-second interval tick and compile snapshot metrics
   * @param {string} testId 
   * @param {Object} tickStats - Aggregated stats from load generator
   */
  async processTick(testId, tickStats) {
    const buffer = this.testBuffers.get(testId) || [];
    this.testBuffers.set(testId, []); // Flush buffer for next second

    // Calculate aggregated metrics from buffer if needed, otherwise use tickStats
    const totalCount = tickStats.totalRequests;
    const errors = tickStats.errors + tickStats.non2xx;
    const successCount = Math.max(0, buffer.length - errors); // simple estimation
    const errorRate = buffer.length > 0 ? (errors / buffer.length) * 100 : 0;

    const snapshot = {
      testId,
      timestamp: Date.now(),
      activeUsers: tickStats.activeUsers,
      avgLatency: tickStats.avgLatency,
      p50Latency: tickStats.p50Latency,
      p95Latency: tickStats.p95Latency,
      p99Latency: tickStats.p99Latency,
      maxLatency: tickStats.maxLatency,
      throughput: tickStats.throughput, // requests per sec
      totalRequests: totalCount,
      successCount: successCount,
      errorCount: errors,
      errorRate: parseFloat(errorRate.toFixed(2))
    };

    // 1. Write metric point to InfluxDB (if initialized)
    if (writeApi) {
      try {
        const point = new Point('request_metrics')
          .tag('testRunId', testId)
          .floatField('avg_latency', snapshot.avgLatency)
          .floatField('p50_latency', snapshot.p50Latency)
          .floatField('p95_latency', snapshot.p95Latency)
          .floatField('p99_latency', snapshot.p99Latency)
          .floatField('max_latency', snapshot.maxLatency)
          .floatField('throughput', snapshot.throughput)
          .floatField('error_rate', snapshot.errorRate)
          .intField('total_requests', snapshot.totalRequests)
          .intField('success_count', snapshot.successCount)
          .intField('error_count', snapshot.errorCount)
          .intField('active_users', snapshot.activeUsers)
          .timestamp(new Date(snapshot.timestamp));

        writeApi.writePoint(point);
        // Flush changes to database buffer
        await writeApi.flush();
      } catch (err) {
        console.error(`Error writing metrics to InfluxDB for test ${testId}:`, err.message);
      }
    }

    // 2. Cache latest snapshot in Redis
    try {
      await cacheMetrics(testId, snapshot);
      await setTestState(testId, {
        status: 'running',
        activeUsers: snapshot.activeUsers,
        currentLatency: snapshot.avgLatency,
        errorRate: snapshot.errorRate,
        throughput: snapshot.throughput
      });
    } catch (err) {
      console.error(`Error writing metrics to Redis cache for test ${testId}:`, err.message);
    }

    // 3. Broadcast to all active clients listening via SSE
    sseManager.broadcast(testId, snapshot);

    // 4. Trigger background ML prediction/anomaly check job (every 5 seconds)
    // We will hook this to the queues in Phase 4 / ML integration.
    // For now we just compile and stream it.
  }

  /**
   * Finalize metric collection and cleanup buffers
   * @param {string} testId 
   */
  cleanup(testId) {
    this.testBuffers.delete(testId);
    sseManager.closeConnections(testId);
  }
}

module.exports = new MetricsCollector();
