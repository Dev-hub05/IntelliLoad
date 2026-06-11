const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');

// 1. Create a Collection
router.post('/', async (req, res) => {
  try {
    const { name, description, baseUrl, globalHeaders, apiKey, executionMode, endpoints } = req.body;
    
    const collection = new Collection({
      name,
      description,
      baseUrl,
      globalHeaders: globalHeaders || {},
      apiKey: apiKey || '',
      executionMode: executionMode || 'sequential',
      endpoints: (endpoints || []).map((ep, idx) => ({
        ...ep,
        order: ep.order !== undefined ? ep.order : idx
      }))
    });

    await collection.save();
    res.status(201).json(collection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. List all Collections
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 });
    res.json(collections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Details of a Collection
router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json(collection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update a Collection
router.put('/:id', async (req, res) => {
  try {
    const { name, description, baseUrl, globalHeaders, apiKey, executionMode, endpoints } = req.body;

    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    collection.name = name || collection.name;
    collection.description = description !== undefined ? description : collection.description;
    collection.baseUrl = baseUrl || collection.baseUrl;
    collection.globalHeaders = globalHeaders || collection.globalHeaders;
    collection.apiKey = apiKey !== undefined ? apiKey : collection.apiKey;
    collection.executionMode = executionMode || collection.executionMode;
    
    if (endpoints) {
      collection.endpoints = endpoints.map((ep, idx) => ({
        ...ep,
        order: ep.order !== undefined ? ep.order : idx
      }));
    }

    await collection.save();
    res.json(collection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete a Collection
router.delete('/:id', async (req, res) => {
  try {
    const collection = await Collection.findByIdAndDelete(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ message: 'Collection deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Import from JSON/Postman format
router.post('/import', async (req, res) => {
  try {
    const { name, description, item } = req.body; // Basic Postman format structure
    
    if (!name || !item || !Array.isArray(item)) {
      return res.status(400).json({ error: 'Invalid Postman collection format' });
    }

    const endpoints = item.map((postmanItem, idx) => {
      const request = postmanItem.request;
      
      // Parse Headers
      const headers = {};
      if (request.header && Array.isArray(request.header)) {
        request.header.forEach(h => {
          if (!h.disabled) headers[h.key] = h.value;
        });
      }

      // Parse Body
      let body = '';
      if (request.body && request.body.mode === 'raw') {
        body = request.body.raw;
      }

      // Parse URL
      let urlPath = '';
      if (typeof request.url === 'string') {
        urlPath = request.url;
      } else if (request.url && Array.isArray(request.url.path)) {
        urlPath = '/' + request.url.path.join('/');
      }

      return {
        name: postmanItem.name || `Endpoint ${idx + 1}`,
        url: urlPath,
        method: request.method || 'GET',
        headers,
        body,
        order: idx,
        delayAfterMs: 0,
        extractors: []
      };
    });

    const collection = new Collection({
      name,
      description: description || 'Imported Postman Collection',
      baseUrl: 'http://127.0.0.1:3002', // Default target to our mock API
      executionMode: 'sequential',
      endpoints
    });

    await collection.save();
    res.status(201).json(collection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Export Collection as JSON
router.get('/:id/export', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Convert to Postman v2.1.0-like JSON schema
    const postmanJson = {
      info: {
        name: collection.name,
        description: collection.description,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: collection.endpoints.map(ep => ({
        name: ep.name,
        request: {
          method: ep.method,
          header: Object.entries(ep.headers).map(([key, value]) => ({ key, value, type: 'text' })),
          body: ep.body ? { mode: 'raw', raw: ep.body } : undefined,
          url: {
            raw: `${collection.baseUrl}${ep.url}`,
            host: [new URL(collection.baseUrl).hostname],
            path: ep.url.split('/').filter(p => p)
          }
        }
      }))
    };

    res.json(postmanJson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Run load test against collection
router.post('/:id/run', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const { config } = req.body;
    const connections = config?.connections || 10;
    const duration = config?.duration || 30; // seconds

    const TestRun = require('../models/TestRun');
    const collectionRunner = require('../services/collectionRunner');

    // Create a new TestRun log mapping back to this collection
    const testRun = new TestRun({
      name: `Collection Test: ${collection.name}`,
      targetUrl: collection.baseUrl,
      collectionId: collection._id,
      config: {
        connections,
        duration,
        pattern: 'steady'
      },
      status: 'running',
      startedAt: new Date()
    });

    await testRun.save();
    const testRunId = testRun._id.toString();

    // Spawn execution async so the API endpoint returns 201 immediately
    collectionRunner.runCollection(collection, connections, duration, testRunId)
      .then(async () => {
        const run = await TestRun.findById(testRunId);
        if (run) {
          run.status = 'completed';
          run.completedAt = new Date();
          // Summary statistics are compiled during collection ticks
          await run.save();
        }
      })
      .catch(async (err) => {
        console.error(`Collection runner error for ${testRunId}:`, err.message);
        const run = await TestRun.findById(testRunId);
        if (run) {
          run.status = 'failed';
          run.completedAt = new Date();
          await run.save();
        }
      });

    res.status(201).json({
      message: 'Collection load test execution started',
      testRun
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
