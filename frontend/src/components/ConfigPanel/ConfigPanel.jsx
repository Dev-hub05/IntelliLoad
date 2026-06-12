import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EndpointForm from './EndpointForm';
import LoadProfileSelector, { PROFILES } from './LoadProfileSelector';
import BodyTemplateEditor from './BodyTemplateEditor';
import { testService } from '../../services/api';
import { Play, Loader2 } from 'lucide-react';

function ConfigPanel() {
  const navigate = useNavigate();

  // Core API details state
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  const [apiKey, setApiKey] = useState('');
  const [body, setBody] = useState('');

  // Load configuration profiling state
  const [selectedProfile, setSelectedProfile] = useState('light');
  const [customConnections, setCustomConnections] = useState(50);
  const [customDuration, setCustomDuration] = useState(60);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartTest = async (e) => {
    e.preventDefault();
    if (!url) {
      setError('Target URL is required to start a test.');
      return;
    }

    setLoading(true);
    setError('');

    // Format headers into a single key-value object
    const formattedHeaders = {};
    headers.forEach(h => {
      if (h.key.trim()) formattedHeaders[h.key.trim()] = h.value;
    });

    // Extract connections and duration details
    let connections = 10;
    let duration = 30;
    
    if (selectedProfile === 'custom') {
      connections = customConnections;
      duration = customDuration;
    } else {
      const profile = PROFILES.find(p => p.id === selectedProfile);
      if (profile) {
        connections = profile.connections;
        duration = profile.duration;
      }
    }

    try {
      const response = await testService.startTest({
        name: `Load Test: ${new URL(url).pathname}`,
        targetUrl: url,
        method,
        headers: formattedHeaders,
        apiKey,
        body,
        config: {
          connections,
          duration,
          pattern: 'steady'
        }
      });

      const testRunId = response.data.testRun._id;
      // Navigate to the Dashboard or Live Test runner page
      navigate(`/?runId=${testRunId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start load test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Configure Performance Test</h1>
        <p className="page-subtitle">Configure endpoints, mock data variables, and concurrent load levels.</p>
      </div>

      {error && (
        <div className="glass-panel" style={{
          padding: '16px',
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.2)',
          color: 'var(--accent-coral)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleStartTest}>
        {/* API Details Panel */}
        <EndpointForm 
          url={url} 
          setUrl={setUrl} 
          method={method} 
          setMethod={setMethod} 
          headers={headers} 
          setHeaders={setHeaders} 
          apiKey={apiKey} 
          setApiKey={setApiKey} 
        />

        {/* Dynamic Body Template Variables */}
        {method !== 'GET' && (
          <BodyTemplateEditor body={body} setBody={setBody} />
        )}

        {/* Target Load Presets Selector */}
        <LoadProfileSelector 
          selectedProfile={selectedProfile}
          setSelectedProfile={setSelectedProfile}
          customConnections={customConnections}
          setCustomConnections={setCustomConnections}
          customDuration={customDuration}
          setCustomDuration={setCustomDuration}
        />

        {/* Submit Launcher Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
          <button 
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(0, 212, 255, 0.2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Play size={18} fill="#ffffff" />
            )}
            <span>Launch Performance Test</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default ConfigPanel;
