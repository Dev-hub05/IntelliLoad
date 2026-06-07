const mongoose = require('mongoose');

const ExtractorSchema = new mongoose.Schema({
  variable: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    enum: ['body', 'header'],
    required: true
  },
  path: {
    type: String,
    required: true,
    trim: true // e.g. "data.token" for JSON path
  }
}, { _id: false });

const EndpointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE'],
    required: true
  },
  headers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  body: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  delayAfterMs: {
    type: Number,
    default: 0
  },
  extractors: [ExtractorSchema]
}, { timestamps: true });

module.exports = {
  EndpointSchema,
  Endpoint: mongoose.model('Endpoint', EndpointSchema)
};
