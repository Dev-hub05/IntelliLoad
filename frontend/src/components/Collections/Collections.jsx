import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash, Play, Download, Upload, Edit, Save, 
  ArrowUp, ArrowDown, Settings, Code, FileCode, Check, AlertTriangle, X
} from 'lucide-react';
import { collectionService } from '../../services/api';
import './Collections.css';

function Collections() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [selectedCol, setSelectedCol] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [colBaseUrl, setColBaseUrl] = useState('');
  const [colGlobalHeaders, setColGlobalHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  const [colApiKey, setColApiKey] = useState('');
  const [colMode, setColMode] = useState('sequential');
  const [colEndpoints, setColEndpoints] = useState([]);

  // Import/Export / Run Modal State
  const [importJson, setImportJson] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [runConnections, setRunConnections] = useState(10);
  const [runDuration, setRunDuration] = useState(30);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await collectionService.listCollections();
      setCollections(res.data);
      if (res.data.length > 0 && !selectedCol) {
        setSelectedCol(res.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const selectCollection = (col) => {
    setSelectedCol(col);
    setIsEditing(false);
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedCol(null);
    setColName('');
    setColDesc('');
    setColBaseUrl('http://127.0.0.1:3002');
    setColGlobalHeaders([{ key: 'Content-Type', value: 'application/json' }]);
    setColApiKey('');
    setColMode('sequential');
    setColEndpoints([]);
  };

  const startEdit = () => {
    if (!selectedCol) return;
    setIsEditing(true);
    setIsCreating(false);
    setColName(selectedCol.name);
    setColDesc(selectedCol.description || '');
    setColBaseUrl(selectedCol.baseUrl);
    setColApiKey(selectedCol.apiKey || '');
    setColMode(selectedCol.executionMode || 'sequential');
    
    // Map headers
    const headersList = Object.entries(selectedCol.globalHeaders || {}).map(([key, value]) => ({ key, value }));
    setColGlobalHeaders(headersList.length > 0 ? headersList : [{ key: '', value: '' }]);
    
    setColEndpoints(selectedCol.endpoints || []);
  };

  const addGlobalHeader = () => {
    setColGlobalHeaders([...colGlobalHeaders, { key: '', value: '' }]);
  };

  const removeGlobalHeader = (index) => {
    setColGlobalHeaders(colGlobalHeaders.filter((_, i) => i !== index));
  };

  const handleGlobalHeaderChange = (index, field, val) => {
    const updated = [...colGlobalHeaders];
    updated[index][field] = val;
    setColGlobalHeaders(updated);
  };

  // Endpoint CRUD within current collection state
  const addEndpoint = () => {
    const newEp = {
      name: `New Endpoint ${colEndpoints.length + 1}`,
      url: '/api/v1/resource',
      method: 'GET',
      headers: {},
      body: '',
      order: colEndpoints.length,
      delayAfterMs: 0,
      extractors: []
    };
    setColEndpoints([...colEndpoints, newEp]);
  };

  const removeEndpoint = (index) => {
    const updated = colEndpoints.filter((_, i) => i !== index).map((ep, idx) => ({ ...ep, order: idx }));
    setColEndpoints(updated);
  };

  const updateEndpointField = (index, field, val) => {
    const updated = [...colEndpoints];
    updated[index][field] = val;
    setColEndpoints(updated);
  };

  const moveEndpoint = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === colEndpoints.length - 1) return;
    
    const updated = [...colEndpoints];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    
    // Recalculate order
    const final = updated.map((ep, idx) => ({ ...ep, order: idx }));
    setColEndpoints(final);
  };

  // Extractor Management within an Endpoint
  const addExtractor = (epIdx) => {
    const updated = [...colEndpoints];
    updated[epIdx].extractors = [
      ...(updated[epIdx].extractors || []),
      { variable: 'extracted_var', source: 'body', path: 'data.id' }
    ];
    setColEndpoints(updated);
  };

  const removeExtractor = (epIdx, extIdx) => {
    const updated = [...colEndpoints];
    updated[epIdx].extractors = updated[epIdx].extractors.filter((_, i) => i !== extIdx);
    setColEndpoints(updated);
  };

  const updateExtractorField = (epIdx, extIdx, field, val) => {
    const updated = [...colEndpoints];
    updated[epIdx].extractors[extIdx][field] = val;
    setColEndpoints(updated);
  };

  const saveCollection = async () => {
    if (!colName || !colBaseUrl) {
      setError('Name and Base URL are required.');
      return;
    }

    // Format global headers
    const headersObj = {};
    colGlobalHeaders.forEach(h => {
      if (h.key.trim()) headersObj[h.key.trim()] = h.value;
    });

    const payload = {
      name: colName,
      description: colDesc,
      baseUrl: colBaseUrl,
      globalHeaders: headersObj,
      apiKey: colApiKey,
      executionMode: colMode,
      endpoints: colEndpoints
    };

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      let saved;
      if (isCreating) {
        saved = await collectionService.createCollection(payload);
        setSuccess('Collection created successfully!');
      } else {
        saved = await collectionService.updateCollection(selectedCol._id, payload);
        setSuccess('Collection updated successfully!');
      }

      setIsEditing(false);
      setIsCreating(false);
      await fetchCollections();
      setSelectedCol(saved.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  const deleteCol = async (id) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) return;
    try {
      setLoading(true);
      await collectionService.deleteCollection(id);
      setSelectedCol(null);
      setIsEditing(false);
      setIsCreating(false);
      setSuccess('Collection deleted successfully.');
      await fetchCollections();
    } catch (err) {
      setError('Failed to delete collection');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const data = JSON.parse(importJson);
      const res = await collectionService.importCollection(data);
      setSuccess('Postman Collection imported successfully!');
      setShowImportModal(false);
      setImportJson('');
      await fetchCollections();
      setSelectedCol(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid JSON / format error during import.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (id) => {
    try {
      setLoading(true);
      const res = await collectionService.exportCollection(id);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(res.data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `${selectedCol.name}_postman_collection.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setSuccess('Collection exported successfully.');
    } catch (err) {
      setError('Failed to export collection');
    } finally {
      setLoading(false);
    }
  };

  const executeCollectionTest = async () => {
    if (!selectedCol) return;
    try {
      setLoading(true);
      setError('');
      const res = await collectionService.runCollection(selectedCol._id, {
        connections: runConnections,
        duration: runDuration
      });
      setShowRunModal(false);
      navigate(`/?runId=${res.data.testRun._id}`);
    } catch (err) {
      setError('Failed to trigger collection load test run');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="collections-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">API Collections</h1>
          <p className="page-subtitle">Configure request chaining pipelines, extraction rules, and run load tests.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowImportModal(true)} 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Upload size={16} /> Import Postman
          </button>
          <button 
            onClick={startCreate} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Create Collection
          </button>
        </div>
      </div>

      {error && <div className="banner banner-error"><AlertTriangle size={18} /><span>{error}</span><button onClick={() => setError('')}><X size={16} /></button></div>}
      {success && <div className="banner banner-success"><Check size={18} /><span>{success}</span><button onClick={() => setSuccess('')}><X size={16} /></button></div>}

      <div className="collections-layout">
        {/* Sidebar/List Section */}
        <div className="collections-list-panel glass-panel">
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>My Collections</h3>
          <div className="collections-list">
            {collections.map(c => (
              <div 
                key={c._id} 
                onClick={() => selectCollection(c)} 
                className={`collection-list-item ${selectedCol?._id === c._id ? 'active' : ''}`}
              >
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.endpoints?.length || 0} endpoints | {c.executionMode}
                </div>
              </div>
            ))}
            {collections.length === 0 && !loading && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: '0.9rem' }}>
                No collections found. Create one to get started!
              </div>
            )}
          </div>
        </div>

        {/* Details / Editor Section */}
        <div className="collections-detail-panel">
          {selectedCol || isCreating ? (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {isCreating ? 'New API Collection' : isEditing ? `Edit: ${colName}` : selectedCol.name}
                </h2>
                {!isEditing ? (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowRunModal(true)} className="btn btn-run" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Play size={16} fill="currentColor" /> Run Load Test
                    </button>
                    <button onClick={() => handleExport(selectedCol._id)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Download size={16} /> Export
                    </button>
                    <button onClick={startEdit} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Edit size={16} /> Edit
                    </button>
                    <button onClick={() => deleteCol(selectedCol._id)} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Trash size={16} /> Delete
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={saveCollection} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Save size={16} /> Save Changes
                    </button>
                    <button onClick={() => { setIsEditing(false); setIsCreating(false); if (selectedCol) selectCollection(selectedCol); }} className="btn btn-secondary">
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* General Collection Fields */}
              <div className="col-fields-grid">
                <div>
                  <label className="form-label">Collection Name</label>
                  <input 
                    type="text" 
                    value={colName} 
                    onChange={e => setColName(e.target.value)} 
                    disabled={!isEditing} 
                    className="form-input" 
                    placeholder="e.g. Identity & Payment API Flow"
                  />
                </div>
                <div>
                  <label className="form-label">Base URL Target</label>
                  <input 
                    type="text" 
                    value={colBaseUrl} 
                    onChange={e => setColBaseUrl(e.target.value)} 
                    disabled={!isEditing} 
                    className="form-input" 
                    placeholder="e.g. http://127.0.0.1:3002"
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Description</label>
                  <textarea 
                    value={colDesc} 
                    onChange={e => setColDesc(e.target.value)} 
                    disabled={!isEditing} 
                    className="form-input" 
                    rows={2} 
                    placeholder="Provide details about the request pipelines and chaining scenarios."
                  />
                </div>
                <div>
                  <label className="form-label">Execution Mode</label>
                  <select 
                    value={colMode} 
                    onChange={e => setColMode(e.target.value)} 
                    disabled={!isEditing} 
                    className="form-select"
                  >
                    <option value="sequential">Sequential (Run sequentially per Virtual User)</option>
                    <option value="parallel">Parallel (Execute all requests in parallel)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Global API Auth Key</label>
                  <input 
                    type="password" 
                    value={colApiKey} 
                    onChange={e => setColApiKey(e.target.value)} 
                    disabled={!isEditing} 
                    className="form-input" 
                    placeholder="X-API-Key placeholder (Auto-injected)"
                  />
                </div>
              </div>

              {/* Global Headers List */}
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Global Headers</h4>
                  {isEditing && (
                    <button type="button" onClick={addGlobalHeader} className="btn-link">
                      + Add Header
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {colGlobalHeaders.map((h, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={h.key} 
                        onChange={e => handleGlobalHeaderChange(idx, 'key', e.target.value)} 
                        disabled={!isEditing} 
                        className="form-input" 
                        placeholder="Header Key" 
                        style={{ flex: 1 }}
                      />
                      <input 
                        type="text" 
                        value={h.value} 
                        onChange={e => handleGlobalHeaderChange(idx, 'value', e.target.value)} 
                        disabled={!isEditing} 
                        className="form-input" 
                        placeholder="Value" 
                        style={{ flex: 1.5 }}
                      />
                      {isEditing && (
                        <button type="button" onClick={() => removeGlobalHeader(idx)} className="btn-icon-danger">
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {colGlobalHeaders.length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No global headers.</span>
                  )}
                </div>
              </div>

              {/* Endpoints Pipeline Builder */}
              <div style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>Request Pipeline Nodes</h3>
                  {isEditing && (
                    <button type="button" onClick={addEndpoint} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      + Add Pipeline Request Node
                    </button>
                  )}
                </div>

                <div className="endpoints-pipeline">
                  {colEndpoints.map((ep, epIdx) => (
                    <div key={epIdx} className="pipeline-node glass-panel">
                      <div className="node-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className="node-badge">{epIdx + 1}</span>
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={ep.name} 
                              onChange={e => updateEndpointField(epIdx, 'name', e.target.value)} 
                              className="node-name-input"
                            />
                          ) : (
                            <span style={{ fontWeight: '600' }}>{ep.name}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isEditing && (
                            <>
                              <button type="button" onClick={() => moveEndpoint(epIdx, 'up')} disabled={epIdx === 0} className="btn-icon-arrow"><ArrowUp size={16} /></button>
                              <button type="button" onClick={() => moveEndpoint(epIdx, 'down')} disabled={epIdx === colEndpoints.length - 1} className="btn-icon-arrow"><ArrowDown size={16} /></button>
                              <button type="button" onClick={() => removeEndpoint(epIdx)} className="btn-icon-danger"><Trash size={16} /></button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="node-body">
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                          <select 
                            value={ep.method} 
                            onChange={e => updateEndpointField(epIdx, 'method', e.target.value)} 
                            disabled={!isEditing} 
                            className="form-select node-method-select"
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                          <input 
                            type="text" 
                            value={ep.url} 
                            onChange={e => updateEndpointField(epIdx, 'url', e.target.value)} 
                            disabled={!isEditing} 
                            className="form-input" 
                            placeholder="e.g. /api/v1/auth/login" 
                            style={{ flex: 1 }}
                          />
                        </div>

                        {ep.method !== 'GET' && (
                          <div style={{ marginBottom: '12px' }}>
                            <label className="node-label">Body Payload Template (Supports variables like `{"{{auth_token}}"}`)</label>
                            <textarea 
                              value={ep.body || ''} 
                              onChange={e => updateEndpointField(epIdx, 'body', e.target.value)} 
                              disabled={!isEditing} 
                              rows={2} 
                              className="form-input code-font" 
                              placeholder='e.g. { "username": "admin", "session": "{{auth_session}}" }'
                            />
                          </div>
                        )}

                        <div className="node-meta-grid">
                          <div>
                            <label className="node-label">Post-execution Delay (ms)</label>
                            <input 
                              type="number" 
                              value={ep.delayAfterMs || 0} 
                              onChange={e => updateEndpointField(epIdx, 'delayAfterMs', parseInt(e.target.value) || 0)} 
                              disabled={!isEditing} 
                              className="form-input" 
                              min="0"
                            />
                          </div>
                        </div>

                        {/* Extractor Rules Sub-Panel */}
                        <div className="extractor-subpanel">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>Response Extractors</span>
                            {isEditing && (
                              <button type="button" onClick={() => addExtractor(epIdx)} className="btn-link" style={{ fontSize: '0.75rem' }}>
                                + Add Extractor
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(ep.extractors || []).map((ext, extIdx) => (
                              <div key={extIdx} className="extractor-row">
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Extract into:</span>
                                <input 
                                  type="text" 
                                  value={ext.variable} 
                                  onChange={e => updateExtractorField(epIdx, extIdx, 'variable', e.target.value)} 
                                  disabled={!isEditing} 
                                  className="form-input small-input" 
                                  placeholder="var_name" 
                                />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>from:</span>
                                <select 
                                  value={ext.source} 
                                  onChange={e => updateExtractorField(epIdx, epIdx, 'source', e.target.value)} 
                                  disabled={!isEditing} 
                                  className="form-select small-select"
                                >
                                  <option value="body">Body (JSON path)</option>
                                  <option value="header">Header Name</option>
                                </select>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>path/key:</span>
                                <input 
                                  type="text" 
                                  value={ext.path} 
                                  onChange={e => updateExtractorField(epIdx, extIdx, 'path', e.target.value)} 
                                  disabled={!isEditing} 
                                  className="form-input small-input-path" 
                                  placeholder="e.g. token or data.user.id" 
                                />
                                {isEditing && (
                                  <button type="button" onClick={() => removeExtractor(epIdx, extIdx)} className="btn-icon-danger-small">
                                    &times;
                                  </button>
                                )}
                              </div>
                            ))}
                            {(!ep.extractors || ep.extractors.length === 0) && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No extractors set for this node.</span>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                  {colEndpoints.length === 0 && (
                    <div style={{ border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No pipeline nodes defined. Edit the collection to build requests step-by-step.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel mock-card animate-fade-in" style={{ width: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Code size={48} className="mock-icon" />
              <h2>No Collection Selected</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Select an API collection from the sidebar to view details, or build a new pipeline collection flow.</p>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Upload size={20} /> Import Postman Collection</h3>
              <button onClick={() => setShowImportModal(false)} className="btn-icon-close"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Paste raw Postman Collection v2/v2.1 JSON structure below to import endpoints into IntelliLoad pipeline formats.
              </p>
              <textarea 
                value={importJson} 
                onChange={e => setImportJson(e.target.value)} 
                rows={10} 
                className="form-input code-font" 
                placeholder='{ "info": { "name": "Auth APIs", ... }, "item": [ ... ] }'
              />
            </div>
            <div className="modal-footer">
              <button onClick={handleImport} className="btn btn-primary" disabled={!importJson.trim()}>
                Import Collection
              </button>
              <button onClick={() => setShowImportModal(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Configuration Modal */}
      {showRunModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Play size={18} /> Execute Collection Load Test</h3>
              <button onClick={() => setShowRunModal(false)} className="btn-icon-close"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Virtual Users (Concurrency)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={runConnections} 
                    onChange={e => setRunConnections(parseInt(e.target.value))} 
                    style={{ flex: 1 }}
                  />
                  <span style={{ width: '48px', textAlign: 'right', fontWeight: 'bold' }}>{runConnections}</span>
                </div>
              </div>

              <div>
                <label className="form-label">Run Duration (Seconds)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input 
                    type="range" 
                    min="10" 
                    max="300" 
                    value={runDuration} 
                    onChange={e => setRunDuration(parseInt(e.target.value))} 
                    style={{ flex: 1 }}
                  />
                  <span style={{ width: '48px', textAlign: 'right', fontWeight: 'bold' }}>{runDuration}s</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={executeCollectionTest} className="btn btn-run">
                Launch Runner
              </button>
              <button onClick={() => setShowRunModal(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Collections;
