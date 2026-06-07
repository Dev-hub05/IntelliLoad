const mongoose = require('mongoose');
const { EndpointSchema } = require('./Endpoint');

const CollectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  baseUrl: {
    type: String,
    required: true,
    trim: true
  },
  globalHeaders: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  apiKey: {
    type: String,
    default: ''
  },
  executionMode: {
    type: String,
    enum: ['sequential', 'parallel'],
    default: 'sequential'
  },
  endpoints: [EndpointSchema]
}, { timestamps: true });

module.exports = mongoose.model('Collection', CollectionSchema);
