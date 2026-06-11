const express = require('express');
const router = express.Router();
const { expandTemplate } = require('../services/templateEngine');
const { enqueueAnalysis } = require('../queues/mlQueue');

// 1. Stub variable expansion helper
router.post('/preview-body', (req, res) => {
  try {
    const { body, variables } = req.body;
    const expanded = expandTemplate(body || '', variables || {});
    res.json({
      original: body,
      expanded
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Trigger ML Anomaly/Prediction jobs manually
router.post('/analyze/:id', async (req, res) => {
  try {
    const testId = req.params.id;
    const { type } = req.body; // 'anomaly-detect', 'failure-predict', 'root-cause-score', 'generate-report'

    if (!['anomaly-detect', 'failure-predict', 'root-cause-score', 'generate-report'].includes(type)) {
      return res.status(400).json({ error: 'Invalid analysis task type.' });
    }

    const job = await enqueueAnalysis(testId, type, req.body.extra || {});
    res.status(202).json({
      message: 'Analysis job queued successfully',
      jobId: job.id,
      type
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
