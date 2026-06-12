import React from 'react';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

function EndpointForm({ 
  url, 
  setUrl, 
  method, 
  setMethod, 
  headers, 
  setHeaders, 
  apiKey, 
  setApiKey 
}) {
  const handleHeaderChange = (index, field, value) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index) => {
    const updated = headers.filter((_, idx) => idx !== index);
    setHeaders(updated);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
        API Endpoint Configuration
      </h3>

      {/* Target URL and Method */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: '120px', flex: '0 0 150px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Method</label>
          <select 
            value={method} 
            onChange={(e) => setMethod(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div style={{ flex: '1', minWidth: '250px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Target URL</label>
          <input 
            type="text" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://localhost:3002/api/data"
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* API Key Authentication */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
          Auth API Key (Auto-injected in X-API-Key and Authorization headers)
        </label>
        <input 
          type="password" 
          value={apiKey} 
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter API Key / Bearer Token"
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
      </div>

      {/* Dynamic Headers Setup */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Custom Headers</label>
          <button 
            type="button" 
            onClick={addHeader}
            style={{
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            + Add Header
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {headers.map((h, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="text" 
                value={h.key} 
                onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                placeholder="Header Name (e.g. Content-Type)"
                style={{
                  flex: '1',
                  padding: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <input 
                type="text" 
                value={h.value} 
                onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                placeholder="Value"
                style={{
                  flex: '1.5',
                  padding: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button 
                type="button" 
                onClick={() => removeHeader(index)}
                style={{
                  padding: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-coral)',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                &times;
              </button>
            </div>
          ))}
          {headers.length === 0 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No custom headers defined.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default EndpointForm;
