const express = require('express');
const router = express.Router();
const TestRun = require('../models/TestRun');
const loadGenerator = require('../services/loadGenerator');
const metricsCollector = require('../services/metricsCollector');
const sseManager = require('../sse/sseManager');
const { queryApi, bucket } = require('../config/influx');

// 1. Create and Start a Load Test
router.post('/', async (req, res) => {
  try {
    const { name, targetUrl, method, headers, apiKey, body, config } = req.body;

    const testRun = new TestRun({
      name,
      targetUrl,
      method: method || 'GET',
      headers: headers || {},
      apiKey: apiKey || '',
      body: body || '',
      config: {
        connections: config?.connections || 10,
        duration: config?.duration || 30,
        rampUpTime: config?.rampUpTime || 0,
        pattern: config?.pattern || 'steady'
      },
      status: 'pending'
    });

    await testRun.save();
    const testId = testRun._id.toString();

    // Initialize metrics buffers for this test run
    metricsCollector.initTest(testId);

    // Start load generation
    const instance = loadGenerator.startTest(testRun);
    
    // Wire up events
    instance.on('response', (data) => {
      metricsCollector.recordResponse(data);
    });

    instance.on('tick', (tickStats) => {
      metricsCollector.processTick(testId, tickStats);
    });

    instance.on('done', async (doneData) => {
      const { result } = doneData;
      
      // Update TestRun with final stats
      const run = await TestRun.findById(testId);
      if (run) {
        run.status = 'completed';
        run.completedAt = new Date();
        run.summary = {
          totalRequests: result.requests.total,
          successfulRequests: result.requests.sent, // Estimate successful
          failedRequests: result.errors + result.non2xx,
          avgLatency: result.latency.average,
          p50Latency: result.latency.p50,
          p95Latency: result.latency.p95,
          p99Latency: result.latency.p99,
          maxLatency: result.latency.max,
          avgThroughput: result.requests.average,
          errorRate: ((result.errors + result.non2xx) / Math.max(1, result.requests.total)) * 100
        };
        await run.save();
      }

      metricsCollector.cleanup(testId);
      console.log(`Test ${testId} complete. Summary saved.`);
    });

    instance.on('error', async (errData) => {
      const run = await TestRun.findById(testId);
      if (run) {
        run.status = 'failed';
        run.completedAt = new Date();
        await run.save();
      }
      metricsCollector.cleanup(testId);
      console.error(`Test ${testId} encountered an error: ${errData.error}`);
    });

    testRun.status = 'running';
    testRun.startedAt = new Date();
    await testRun.save();

    res.status(201).json({
      message: 'Load test started successfully',
      testRun
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. List all Test Runs (Paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    
    const skip = (page - 1) * limit;

    const runs = await TestRun.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TestRun.countDocuments();

    res.json({
      runs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Details of a Test Run
router.get('/:id', async (req, res) => {
  try {
    const run = await TestRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({ error: 'Test run not found' });
    }
    res.json(run);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Force Stop a Running Test
router.post('/:id/stop', async (req, res) => {
  try {
    const run = await TestRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({ error: 'Test run not found' });
    }

    if (run.status !== 'running') {
      return res.status(400).json({ error: 'Test is not currently running' });
    }

    const stopped = loadGenerator.stopTest(req.params.id);
    if (stopped) {
      run.status = 'stopped';
      run.completedAt = new Date();
      await run.save();
      
      metricsCollector.cleanup(req.params.id);
      return res.json({ message: 'Test stopped successfully', testRun: run });
    } else {
      return res.status(500).json({ error: 'Failed to stop running test engine' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Query InfluxDB Historical Metrics for a Test Run
router.get('/:id/metrics', async (req, res) => {
  const testId = req.params.id;
  
  if (!queryApi) {
    return res.status(503).json({ error: 'Time-series database client is offline' });
  }

  try {
    // Flux query extracting p95, avg, throughput over the test run duration
    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: -24h)
        |> filter(fn: (r) => r["_measurement"] == "request_metrics")
        |> filter(fn: (r) => r["testRunId"] == "${testId}")
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
        console.error('Flux query execution error:', err.message);
        res.status(500).json({ error: err.message });
      },
      complete() {
        res.json(metrics);
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. SSE Live Stream Endpoint (subscribes to Redis/Metrics ticks)
router.get('/:id/stream', (req, res) => {
  const testId = req.params.id;
  sseManager.register(testId, req, res);
});

module.exports = router;
