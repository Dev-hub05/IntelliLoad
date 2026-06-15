const axios = require('axios');
const TestRun = require('../models/TestRun');
const { queryApi, bucket } = require('../config/influx');
const sseManager = require('../sse/sseManager');
const metricsCollector = require('./metricsCollector');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

class MlAnalyzerService {
  /**
   * Run full performance audit ML pipeline on completed load test run
   * @param {string} testRunId 
   */
  async runMlAnalysis(testRunId) {
    console.log(`[ML Analyzer] Initiating complete performance audit for: ${testRunId}`);
    
    try {
      const testRun = await TestRun.findById(testRunId);
      if (!testRun) {
        throw new Error(`TestRun ${testRunId} not found in database.`);
      }

      // 1. Fetch timeseries metrics from InfluxDB
      const metrics = await this.fetchTimeseriesMetrics(testRunId);
      console.log(`[ML Analyzer] Retained ${metrics.length} telemetry points from InfluxDB.`);

      if (metrics.length === 0) {
        console.warn(`[ML Analyzer] No metrics found in InfluxDB for run ${testRunId}. Skipping ML pipeline.`);
        sseManager.broadcast(testRunId, { status: 'completed', analysisComplete: true });
        metricsCollector.cleanup(testRunId);
        return;
      }

      // Populate summary stats if missing (e.g. for collection runs)
      if (!testRun.summary || !testRun.summary.totalRequests) {
        console.log(`[ML Analyzer] Compiling final summary stats for run ${testRunId}...`);
        const totalReqs = metrics.reduce((sum, m) => sum + (m.throughput || 0), 0);
        const avgLatency = metrics.reduce((sum, m) => sum + (m.avgLatency || 0), 0) / metrics.length;
        const avgThroughput = metrics.reduce((sum, m) => sum + (m.throughput || 0), 0) / metrics.length;
        
        const p50 = metrics.reduce((sum, m) => sum + (m.p50Latency || 0), 0) / metrics.length;
        const p95 = metrics.reduce((sum, m) => sum + (m.p95Latency || 0), 0) / metrics.length;
        const p99 = metrics.reduce((sum, m) => sum + (m.p99Latency || 0), 0) / metrics.length;
        const maxLatency = Math.max(...metrics.map(m => m.maxLatency || 0));
        
        const errorRate = metrics.reduce((sum, m) => sum + (m.errorRate || 0), 0) / metrics.length;
        const failedReqs = Math.round((errorRate / 100) * totalReqs);
        
        testRun.summary = {
          totalRequests: totalReqs || metrics.length,
          successfulRequests: Math.max(0, (totalReqs || metrics.length) - failedReqs),
          failedRequests: failedReqs,
          avgLatency: Math.round(avgLatency),
          p50Latency: Math.round(p50),
          p95Latency: Math.round(p95),
          p99Latency: Math.round(p99),
          maxLatency,
          avgThroughput: Math.round(avgThroughput),
          errorRate: parseFloat(errorRate.toFixed(2))
        };
        await testRun.save();
      }

      // 2. Train and Detect Batch Anomalies
      console.log(`[ML Analyzer] Execution: Anomaly Detection model run...`);
      let anomalies = [];
      try {
        const anomalyRes = await axios.post(`${ML_SERVICE_URL}/ml/anomaly/detect-batch`, {
          test_run_id: testRunId,
          window_size: 1440 // 24 hours
        });
        anomalies = anomalyRes.data.anomalies || [];
      } catch (err) {
        console.error('[ML Analyzer] Anomaly batch detection failed:', err.message);
      }

      // 3. Failure Prediction Risk Assessment
      console.log(`[ML Analyzer] Execution: Failure Prediction modeling...`);
      let failureResult = { failure_probability: 0.0, risk_level: 'LOW', contributing_factors: [] };
      try {
        const lastMetric = metrics[metrics.length - 1] || {};
        const avgMetrics = {
          avg_latency: testRun.summary?.avgLatency || lastMetric.avgLatency || 0,
          p95_latency: testRun.summary?.p95Latency || lastMetric.p95Latency || 0,
          throughput: testRun.summary?.avgThroughput || lastMetric.throughput || 0,
          error_rate: testRun.summary?.errorRate || lastMetric.errorRate || 0,
          active_users: testRun.config?.connections || lastMetric.activeUsers || 0
        };

        const historicalRunsCount = await TestRun.countDocuments({ status: 'completed' });
        
        const predictionRes = await axios.post(`${ML_SERVICE_URL}/ml/predict/failure`, {
          test_run_id: testRunId,
          current_metrics: avgMetrics,
          historical_runs_count: historicalRunsCount
        });
        failureResult = predictionRes.data;
      } catch (err) {
        console.error('[ML Analyzer] Failure prediction failed:', err.message);
      }

      // 4. Bottleneck Root Cause Scoring
      console.log(`[ML Analyzer] Execution: Root Cause diagnostics...`);
      let rootCauseResult = { scores: {}, primary_cause: 'none', confidence: 0.0, explanation: '', recommendations: [] };
      try {
        const rootCauseRes = await axios.post(`${ML_SERVICE_URL}/ml/root-cause/score`, {
          test_run_id: testRunId,
          metrics_history: metrics
        });
        rootCauseResult = rootCauseRes.data;
      } catch (err) {
        console.error('[ML Analyzer] Root cause analysis failed:', err.message);
      }

      // 5. Load Advisor recommendations
      console.log(`[ML Analyzer] Execution: Advisor Tuning calculations...`);
      let advisorResult = { recommendation: 'HOLD', message: '', actions: [] };
      try {
        const lastMetric = metrics[metrics.length - 1] || {};
        const avgMetrics = {
          avg_latency: testRun.summary?.avgLatency || lastMetric.avgLatency || 0,
          p95_latency: testRun.summary?.p95Latency || lastMetric.p95Latency || 0,
          throughput: testRun.summary?.avgThroughput || lastMetric.throughput || 0,
          error_rate: testRun.summary?.errorRate || lastMetric.errorRate || 0,
          active_users: testRun.config?.connections || lastMetric.activeUsers || 0
        };

        const advisorRes = await axios.post(`${ML_SERVICE_URL}/ml/advisor/recommend`, {
          current_metrics: avgMetrics,
          failure_prediction: failureResult,
          root_cause: rootCauseResult
        });
        advisorResult = advisorRes.data;
      } catch (err) {
        console.error('[ML Analyzer] Load advisor recommendation failed:', err.message);
      }

      // 6. Persist outcomes to MongoDB
      testRun.anomalies = anomalies;
      testRun.failurePrediction = {
        probability: failureResult.failure_probability || 0,
        riskLevel: failureResult.risk_level || 'LOW',
        contributingFactors: (failureResult.contributing_factors || []).map(f => ({
          feature: f.feature,
          importance: f.importance
        }))
      };
      testRun.rootCause = {
        scores: rootCauseResult.scores || {},
        primaryCause: rootCauseResult.primary_cause || 'none',
        confidence: rootCauseResult.confidence || 0,
        explanation: rootCauseResult.explanation || ''
      };
      testRun.advisor = {
        recommendation: advisorResult.recommendation || 'HOLD',
        message: advisorResult.message || '',
        actions: advisorResult.actions || []
      };

      await testRun.save();
      console.log(`[ML Analyzer] Audit complete. Diagnostic results saved for test run ${testRunId}.`);

      // 7. Notify client via SSE and cleanup
      sseManager.broadcast(testRunId, { 
        status: 'completed', 
        analysisComplete: true,
        summary: testRun.summary,
        anomalies: testRun.anomalies,
        failurePrediction: testRun.failurePrediction,
        rootCause: testRun.rootCause,
        advisor: testRun.advisor
      });
      metricsCollector.cleanup(testRunId);

    } catch (err) {
      console.error(`[ML Analyzer] Full pipeline audit aborted due to error on ${testRunId}:`, err.message);
      sseManager.broadcast(testRunId, { status: 'failed', error: err.message });
      metricsCollector.cleanup(testRunId);
    }
  }

  /**
   * Helper to retrieve InfluxDB metrics history for Node-to-FastAPI forwarding
   */
  fetchTimeseriesMetrics(testRunId) {
    return new Promise((resolve, reject) => {
      if (!queryApi) {
        return reject(new Error('InfluxDB query client is offline'));
      }

      const fluxQuery = `
        from(bucket: "${bucket}")
          |> range(start: -24h)
          |> filter(fn: (r) => r["_measurement"] == "request_metrics")
          |> filter(fn: (r) => r["testRunId"] == "${testRunId}")
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> sort(columns: ["_time"], desc: false)
      `;

      const metrics = [];
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          metrics.push({
            timestamp: o._time,
            avgLatency: o.avg_latency,
            p50Latency: o.p50_latency,
            p95Latency: o.p95_latency,
            p99Latency: o.p99_latency,
            maxLatency: o.max_latency,
            throughput: o.throughput,
            errorRate: o.error_rate,
            totalRequests: o.total_requests,
            activeUsers: o.active_users
          });
        },
        error(err) {
          reject(err);
        },
        complete() {
          resolve(metrics);
        }
      });
    });
  }
}

module.exports = new MlAnalyzerService();
