import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const testService = {
  startTest: (config) => api.post('/tests', config),
  listTests: (page = 1, limit = 10) => api.get(`/tests?page=${page}&limit=${limit}`),
  getTestDetails: (id) => api.get(`/tests/${id}`),
  stopTest: (id) => api.post(`/tests/${id}/stop`),
  getTestMetrics: (id) => api.get(`/tests/${id}/metrics`)
};

export const collectionService = {
  createCollection: (data) => api.post('/collections', data),
  listCollections: () => api.get('/collections'),
  getCollection: (id) => api.get(`/collections/${id}`),
  updateCollection: (id, data) => api.put(`/collections/${id}`, data),
  deleteCollection: (id) => api.delete(`/collections/${id}`),
  runCollection: (id, config) => api.post(`/collections/${id}/run`, { config }),
  importCollection: (postmanData) => api.post('/collections/import', postmanData),
  exportCollection: (id) => api.get(`/collections/${id}/export`)
};

export const mlService = {
  previewBody: (body, variables) => api.post('/ml/preview-body', { body, variables }),
  triggerAnalysis: (id, type, extra = {}) => api.post(`/ml/analyze/${id}`, { type, extra })
};

export default api;
