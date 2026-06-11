const mongoose = require('mongoose');

const EndpointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' },
  headers: { type: mongoose.Schema.Types.Mixed, default: {} },
  body: { type: String, default: '' },
  order: { type: Number, required: true },
  delayAfterMs: { type: Number, default: 0 },
  extractors: [{
    variable: { type: String, required: true },
    source: { type: String, enum: ['body', 'header'], default: 'body' },
    path: { type: String, required: true } // JSON Path, e.g., 'data.token' or header name
  }]
});

const CollectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  baseUrl: { type: String, required: true },
  globalHeaders: { type: mongoose.Schema.Types.Mixed, default: {} },
  apiKey: { type: String, default: '' },
  executionMode: { type: String, enum: ['sequential', 'parallel'], default: 'sequential' },
  endpoints: [EndpointSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Collection', CollectionSchema);
