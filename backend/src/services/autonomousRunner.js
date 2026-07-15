const autocannon = require('autocannon');
const axios = require('axios');
const EventEmitter = require('events');
const TestRun = require('../models/TestRun');
const { expandTemplate } = require('./templateEngine');

class AutonomousRunnerService extends EventEmitter {
  constructor() {
    super();
    this.activeRunners = new Map(); // Store active autonomous tests
  }

  /**
   * Start an autonomous ramping load test
   * @param {Object} testRun - TestRun database instance
   * @returns {EventEmitter} Custom event emitter to mimic autocannon instance
   */
  startAutonomousTest(testRun) {
    const testId = testRun._id.toString();
    const emitter = new EventEmitter();
    
    // Ramping steps config
    const stepDuration = 10; // seconds per step
    const latencyThreshold = 3000; // ms average latency threshold for failure
    const errorThresholdRate = 10; // % error rate threshold for failure

    const state = {
      currentStepIdx: 0,
      activeUsers: 0,
      maxStableUsers: 0,
      failureStartsAt: 0,
      stepsCompleted: 0,
      aborted: false,
      activeAutocannon: null,
      cumulativeRequests: 0,
      cumulativeErrors: 0,
      cumulativeNon2xx: 0,
      latencies: []
    };

    this.activeRunners.set(testId, state);

    // Start ramping loop async
    const runRampingLoop = async () => {
      let connections = 10; // Start at 10 VUs
      let stepCount = 0;
      const maxSteps = 10;
      let previousConnections = 0;

      while (stepCount < maxSteps && !state.aborted) {
        state.activeUsers = connections;
        stepCount++;
        console.log(`[Autonomous Ramping] Starting Step ${stepCount} with ${connections} VUs`);

        try {
          const stepResult = await this.executeStep(testRun, connections, stepDuration, emitter, testId, state);
          state.stepsCompleted++;

          // Evaluate step health metrics
          const totalReqs = stepResult.requests.total || 1;
          const errs = stepResult.errors + stepResult.non2xx;
          const errorRate = (errs / totalReqs) * 100;
          const avgLatency = stepResult.latency.average;

          console.log(`[Autonomous Step Result] Concurrency: ${connections} VUs | Avg Latency: ${avgLatency.toFixed(1)}ms | Error Rate: ${errorRate.toFixed(1)}%`);

          // Query ML Service for dynamic recommendations and failure predictions
          let suggestedConnections = connections;
          let nextAction = 'HOLD';
          try {
            const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000';
            const avgMetrics = {
              avg_latency: avgLatency,
              p95_latency: stepResult.latency.p95 || avgLatency,
              throughput: stepResult.requests.average || 0,
              error_rate: errorRate,
              active_users: connections
            };
            
            // 1. Predict failure risk
            const predictionRes = await axios.post(`${ML_SERVICE_URL}/ml/predict/failure`, {
              test_run_id: testId,
              current_metrics: avgMetrics,
              historical_runs_count: 0
            });
            const failureResult = predictionRes.data;

            // 2. Get Advisor recommendations
            const advisorRes = await axios.post(`${ML_SERVICE_URL}/ml/advisor/recommend`, {
              current_metrics: avgMetrics,
              failure_prediction: failureResult,
              root_cause: { primary_cause: 'none', scores: {} }
            });
            const advisorResult = advisorRes.data;
            
            suggestedConnections = advisorResult.suggested_connections || connections;
            nextAction = advisorResult.recommendation || 'HOLD';
            console.log(`[Autonomous ML Advisor] Recommendation: ${nextAction} | Suggested Connections: ${suggestedConnections} VUs`);
          } catch (mlErr) {
            console.error('[Autonomous ML Advisor Error] Failed to get dynamic ML suggestions, falling back to heuristics:', mlErr.message);
            // Fallback heuristics: static progression
            const fallbackSteps = [10, 40, 80, 150, 260, 350, 450, 500];
            const nextIdx = fallbackSteps.indexOf(connections) + 1;
            suggestedConnections = nextIdx < fallbackSteps.length ? fallbackSteps[nextIdx] : connections;
          }

          if (errorRate > errorThresholdRate || avgLatency > latencyThreshold || nextAction === 'SCALE_DOWN') {
            // Breaking point detected!
            console.log(`[Autonomous Ramping] BREAKING POINT REACHED at ${connections} VUs!`);
            state.failureStartsAt = connections;
            state.maxStableUsers = previousConnections || 0;
            break;
          } else {
            // Stable step
            state.maxStableUsers = connections;
            previousConnections = connections;
            
            // Move to next suggested connections level
            if (suggestedConnections <= connections && nextAction === 'SCALE_UP') {
              // Ensure progress if advisor recommended scale up but connections didn't change
              connections = Math.min(500, connections + 50);
            } else {
              connections = suggestedConnections;
            }
          }
        } catch (err) {
          console.error(`[Autonomous Ramping] Step failed at ${connections} VUs:`, err.message);
          state.failureStartsAt = connections;
          state.maxStableUsers = previousConnections || 0;
          break;
        }
      }

      // Ramping Loop Finished
      this.activeRunners.delete(testId);

      if (state.aborted) {
        // Stop called by user
        return;
      }

      // Update breaking point details in DB
      try {
        const run = await TestRun.findById(testId);
        if (run) {
          run.breakingPoint = {
            maxStableUsers: state.maxStableUsers,
            failureStartsAt: state.failureStartsAt,
            recommendedCapacity: Math.round(state.maxStableUsers * 0.8),
            stepsCompleted: state.stepsCompleted
          };
          await run.save();
        }
      } catch (err) {
        console.error('Failed to save breaking point details to TestRun:', err.message);
      }

      // Compile final done stats
      const totalCount = state.cumulativeRequests || 1;
      const avgLat = state.latencies.reduce((a, b) => a + b, 0) / Math.max(1, state.latencies.length);
      state.latencies.sort((a, b) => a - b);
      const p50 = state.latencies[Math.floor(state.latencies.length * 0.5)] || 0;
      const p95 = state.latencies[Math.floor(state.latencies.length * 0.95)] || 0;
      const p99 = state.latencies[Math.floor(state.latencies.length * 0.99)] || 0;
      const maxLat = state.latencies[state.latencies.length - 1] || 0;

      emitter.emit('done', {
        testId,
        result: {
          requests: {
            total: state.cumulativeRequests,
            sent: state.cumulativeRequests - state.cumulativeErrors - state.cumulativeNon2xx,
            average: Math.round(state.cumulativeRequests / (state.stepsCompleted * stepDuration))
          },
          latency: {
            average: avgLat,
            p50,
            p95,
            p99,
            max: maxLat
          },
          errors: state.cumulativeErrors,
          non2xx: state.cumulativeNon2xx
        }
      });
    };

    runRampingLoop().catch(err => {
      console.error('[Autonomous Ramping Loop Error]', err.message);
      emitter.emit('error', { testId, error: err.message });
    });

    return emitter;
  }

  /**
   * Helper to execute a single stage using autocannon
   */
  executeStep(testRun, connections, duration, parentEmitter, testId, state) {
    return new Promise((resolve, reject) => {
      const { targetUrl, method, headers, body, apiKey } = testRun;
      
      const testHeaders = { ...headers };
      if (apiKey) {
        testHeaders['X-API-Key'] = apiKey;
        testHeaders['Authorization'] = `ApiKey ${apiKey}`;
      }

      const requestOptions = {
        method: method || 'GET',
        path: new URL(targetUrl).pathname + new URL(targetUrl).search,
        headers: testHeaders
      };

      const setupClient = (client) => {
        client.on('request', (req) => {
          if (body) req.body = expandTemplate(body, {});
        });
      };

      const options = {
        url: new URL(targetUrl).origin,
        connections: connections,
        duration: duration,
        workers: 1,
        requests: [requestOptions],
        setupClient: body ? setupClient : undefined
      };

      const instance = autocannon(options);
      state.activeAutocannon = instance;

      // Pipe live response logs upwards
      instance.on('response', (client, statusCode, resBytes, responseTime) => {
        state.latencies.push(responseTime);
        parentEmitter.emit('response', {
          testId,
          statusCode,
          responseTime,
          bytes: resBytes,
          timestamp: Date.now()
        });
      });

      // Pipe live ticks upwards
      instance.on('tick', (stats) => {
        parentEmitter.emit('tick', {
          testId,
          activeUsers: connections, // Override connection level dynamically
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
        state.cumulativeRequests += result.requests.total;
        state.cumulativeErrors += result.errors;
        state.cumulativeNon2xx += result.non2xx;
        state.activeAutocannon = null;
        resolve(result);
      });

      instance.on('error', (err) => {
        state.activeAutocannon = null;
        reject(err);
      });
    });
  }

  /**
   * Stop an active autonomous test
   * @param {string} testId 
   */
  stopAutonomousTest(testId) {
    const state = this.activeRunners.get(testId);
    if (!state) return false;

    state.aborted = true;
    if (state.activeAutocannon) {
      state.activeAutocannon.stop();
    }
    this.activeRunners.delete(testId);
    return true;
  }
}

module.exports = new AutonomousRunnerService();
