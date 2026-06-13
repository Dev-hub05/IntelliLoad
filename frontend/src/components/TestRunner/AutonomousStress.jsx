import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, Play, Pause, RefreshCw, AlertTriangle, CheckCircle, 
  Activity, ShieldAlert, Cpu, BarChart3, Settings, ShieldCheck, X
} from 'lucide-react';
import { testService } from '../../services/api';
import useSSE from '../../hooks/useSSE';
import './AutonomousStress.css';

function AutonomousStress() {
  const navigate = useNavigate();

  // Config Form State
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  const [apiKey, setApiKey] = useState('');
  const [body, setBody] = useState('');
  
  // Ramping Customizations
  const [latencyLimit, setLatencyLimit] = useState(3000);
  const [errorLimit, setErrorLimit] = useState(10);

  // Execution State
  const [activeTestId, setActiveTestId] = useState(null);
  const [testStatus, setTestStatus] = useState('idle'); // idle, running, completed, stopped, failed
  const [breakingPoint, setBreakingPoint] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // SSE stream hook
  const { metrics, connected } = useSSE(activeTestId);

  // Aggregated live state
  const [maxStableUsers, setMaxStableUsers] = useState(0);
  const [failureStartsAt, setFailureStartsAt] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [liveLatency, setLiveLatency] = useState(0);
  const [liveThroughput, setLiveThroughput] = useState(0);
  const [liveErrorRate, setLiveErrorRate] = useState(0);

  useEffect(() => {
    if (metrics) {
      setActiveUsers(metrics.activeUsers || 0);
      setLiveLatency(metrics.avgLatency || 0);
      setLiveThroughput(metrics.throughput || 0);
      
      const total = metrics.totalRequests || 1;
      const rate = ((metrics.errors + metrics.non2xx) / total) * 100;
      setLiveErrorRate(rate);

      // Dynamically calculate live breaking point heuristics as we ramp
      if (rate > errorLimit || metrics.avgLatency > latencyLimit) {
        if (!failureStartsAt) {
          setFailureStartsAt(metrics.activeUsers);
        }
      } else {
        setMaxStableUsers(metrics.activeUsers);
      }
    }
  }, [metrics, errorLimit, latencyLimit, failureStartsAt]);

  // Handle SSE streaming completion / done trigger
  useEffect(() => {
    if (activeTestId && !connected && testStatus === 'running') {
      // Stream disconnected, check database for final results
      pollFinalResults();
    }
  }, [connected, activeTestId]);

  const pollFinalResults = async () => {
    try {
      const res = await testService.getTestDetails(activeTestId);
      const data = res.data;
      if (data.status === 'completed' || data.status === 'stopped' || data.status === 'failed') {
        setTestStatus(data.status);
        if (data.breakingPoint) {
          setBreakingPoint(data.breakingPoint);
        }
      }
    } catch (err) {
      console.error('Failed to poll final test run status:', err);
    }
  };

  const handleHeaderChange = (index, field, val) => {
    const updated = [...headers];
    updated[index][field] = val;
    setHeaders(updated);
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index) => {
    setHeaders(headers.filter((_, idx) => idx !== index));
  };

  const launchStressTest = async (e) => {
    e.preventDefault();
    if (!url) {
      setError('Target URL is required to start failure discovery.');
      return;
    }

    setTestStatus('running');
    setError('');
    setBreakingPoint(null);
    setMaxStableUsers(0);
    setFailureStartsAt(0);

    const formattedHeaders = {};
    headers.forEach(h => {
      if (h.key.trim()) formattedHeaders[h.key.trim()] = h.value;
    });

    try {
      const res = await testService.startTest({
        name: `Autonomous Stress Test: ${new URL(url).pathname}`,
        targetUrl: url,
        method,
        headers: formattedHeaders,
        apiKey,
        body,
        config: {
          connections: 500, // Maximum cap
          duration: 120,    // Overall maximum timeout
          pattern: 'autonomous'
        }
      });
      
      setActiveTestId(res.data.testRun._id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start autonomous stress test');
      setTestStatus('idle');
    }
  };

  const stopTest = async () => {
    if (!activeTestId) return;
    try {
      await testService.stopTest(activeTestId);
      setTestStatus('stopped');
      pollFinalResults();
    } catch (err) {
      setError('Failed to halt running stress test');
    }
  };

  const resetTest = () => {
    setActiveTestId(null);
    setTestStatus('idle');
    setBreakingPoint(null);
    setMaxStableUsers(0);
    setFailureStartsAt(0);
    setActiveUsers(0);
    setLiveLatency(0);
    setLiveThroughput(0);
    setLiveErrorRate(0);
  };

  // Health assessment
  const getHealthStatus = () => {
    if (liveErrorRate > errorLimit || liveLatency > latencyLimit) {
      return { label: 'CRITICAL FAILURE', color: 'var(--accent-coral)', icon: <ShieldAlert className="animate-pulse" /> };
    }
    if (liveErrorRate > errorLimit / 2 || liveLatency > latencyLimit / 2) {
      return { label: 'DEGRADED PERFORMANCE', color: 'var(--accent-amber)', icon: <AlertTriangle /> };
    }
    return { label: 'STABLE HEALTH', color: 'var(--accent-emerald)', icon: <ShieldCheck /> };
  };

  const health = getHealthStatus();

  return (
    <div className="autonomous-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Flame size={28} style={{ color: 'var(--accent-coral)' }} /> Autonomous Stress Testing
        </h1>
        <p className="page-subtitle">Progressively scale connection loads automatically to pinpoint the exact breaking point and safe capacity limits.</p>
      </div>

      {error && <div className="banner banner-error"><AlertTriangle size={18} /><span>{error}</span><button onClick={() => setError('')}><X size={16} /></button></div>}

      {testStatus === 'idle' ? (
        <form onSubmit={launchStressTest} style={{ maxWidth: '850px' }}>
          {/* Target URL and Method */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
              Stress Target Configuration
            </h3>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ width: '150px' }}>
                <label className="form-label">Method</label>
                <select value={method} onChange={e => setMethod(e.target.value)} className="form-select">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <label className="form-label">Target URL</label>
                <input 
                  type="text" 
                  value={url} 
                  onChange={e => setUrl(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g. http://localhost:3002/api/checkout"
                />
              </div>
            </div>

            {/* Auth Key */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Auth API Key (Authorization / X-API-Key)</label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)} 
                className="form-input" 
                placeholder="Paste Auth Token"
              />
            </div>

            {/* Headers */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Custom Headers</label>
                <button type="button" onClick={addHeader} className="btn-link">+ Add Header</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {headers.map((h, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={h.key} 
                      onChange={e => handleHeaderChange(idx, 'key', e.target.value)} 
                      className="form-input" 
                      placeholder="Header Name" 
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="text" 
                      value={h.value} 
                      onChange={e => handleHeaderChange(idx, 'value', e.target.value)} 
                      className="form-input" 
                      placeholder="Value" 
                      style={{ flex: 1.5 }}
                    />
                    <button type="button" onClick={() => removeHeader(idx)} className="btn-icon-danger">
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            {method !== 'GET' && (
              <div>
                <label className="form-label">Body Template</label>
                <textarea 
                  value={body} 
                  onChange={e => setBody(e.target.value)} 
                  className="form-input code-font" 
                  rows={4} 
                  placeholder='{ "userId": "123", "items": [] }'
                />
              </div>
            )}
          </div>

          {/* Success Criteria Limits */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
              Failure Threshold Controls
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Set latency and error rate limits. The discovery engine will abort connection scaling when limits are breached.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label className="form-label">Latency Limit threshold (ms)</label>
                <input 
                  type="number" 
                  value={latencyLimit} 
                  onChange={e => setLatencyLimit(parseInt(e.target.value) || 1000)} 
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Error Rate Limit (%)</label>
                <input 
                  type="number" 
                  value={errorLimit} 
                  onChange={e => setErrorLimit(parseInt(e.target.value) || 5)} 
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px' }}>
              <Flame size={18} fill="currentColor" /> Launch Failure Discovery
            </button>
          </div>
        </form>
      ) : (
        <div className="stress-running-layout">
          {/* Live Progress Card */}
          <div className="glass-panel progress-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>Ramping Discovery Status</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Test Run ID: {activeTestId}</p>
              </div>
              {testStatus === 'running' ? (
                <button onClick={stopTest} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}>
                  <Pause size={14} fill="currentColor" /> Halt Progression
                </button>
              ) : (
                <button onClick={resetTest} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}>
                  <RefreshCw size={14} /> Run Another Discovery
                </button>
              )}
            </div>

            {/* Health Shield / Status */}
            <div className="health-status-bar" style={{ borderColor: health.color, background: `rgba(${health.color === 'var(--accent-coral)' ? '255, 107, 107' : health.color === 'var(--accent-amber)' ? '245, 158, 11' : '16, 185, 129'}, 0.04)` }}>
              <div style={{ color: health.color, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.9rem' }}>
                {health.icon} <span>{health.label}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {testStatus === 'running' ? 'Active scaling loop execution' : `Discovery cycle ${testStatus}`}
              </div>
            </div>

            {/* Realtime dials */}
            <div className="dials-grid">
              <div className="dial-card glass-panel">
                <Cpu size={24} style={{ color: 'var(--accent-purple)', marginBottom: '8px' }} />
                <div className="dial-value">{activeUsers}</div>
                <div className="dial-label">Active Users (VUs)</div>
              </div>
              <div className="dial-card glass-panel">
                <Activity size={24} style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }} />
                <div className="dial-value">{liveLatency.toFixed(0)} ms</div>
                <div className="dial-label">Avg Response Time</div>
              </div>
              <div className="dial-card glass-panel">
                <BarChart3 size={24} style={{ color: 'var(--accent-emerald)', marginBottom: '8px' }} />
                <div className="dial-value">{liveThroughput.toFixed(0)} rps</div>
                <div className="dial-label">Current Throughput</div>
              </div>
              <div className="dial-card glass-panel">
                <AlertTriangle size={24} style={{ color: 'var(--accent-coral)', marginBottom: '8px' }} />
                <div className="dial-value">{liveErrorRate.toFixed(1)} %</div>
                <div className="dial-label">Error Rate</div>
              </div>
            </div>

            {/* Live Progress Bar Ramping */}
            <div style={{ marginTop: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span>Ramping Progress: {activeUsers} / 500 VUs</span>
                <span className="animate-pulse" style={{ color: 'var(--accent-cyan)' }}>{testStatus === 'running' ? 'Scanning...' : 'Scan Complete'}</span>
              </div>
              <div className="ramping-bar-track">
                <div className="ramping-bar-fill" style={{ width: `${(activeUsers / 500) * 100}%`, background: health.color }} />
              </div>
            </div>
          </div>

          {/* Final Report Card */}
          {breakingPoint && (
            <div className="glass-panel report-card animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '24px' }}>
                <CheckCircle size={32} style={{ color: 'var(--accent-emerald)' }} />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Breaking Point Discovery Report</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>System load advisory limits identified</p>
                </div>
              </div>

              <div className="report-metrics-grid">
                <div className="report-metric-box">
                  <div className="report-metric-title">Max Stable Concurrency</div>
                  <div className="report-metric-value text-emerald">{breakingPoint.maxStableUsers}</div>
                  <div className="report-metric-desc">Concurrent users supported without degradation</div>
                </div>

                <div className="report-metric-box">
                  <div className="report-metric-title">Failure Starts At</div>
                  <div className="report-metric-value text-coral">{breakingPoint.failureStartsAt}</div>
                  <div className="report-metric-desc">Thresholds breached, failures began scaling</div>
                </div>

                <div className="report-metric-box" style={{ gridColumn: 'span 2', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                  <div className="report-metric-title">Recommended Capacity Limit</div>
                  <div className="report-metric-value text-purple">{breakingPoint.recommendedCapacity}</div>
                  <div className="report-metric-desc">Safe operational boundary (80% of max stable capacity)</div>
                </div>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Operational Advisory</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  During progressive connections scaling, the target API sustained clean operations up to **{breakingPoint.maxStableUsers} concurrent users**. 
                  Beyond this point, request queueing and response backlogs caused average latencies to rise above **{latencyLimit}ms** and error rates to climb. 
                  To maintain high quality of service, we advise implementing rate limits or request throttling at a safe capacity ceiling of **{breakingPoint.recommendedCapacity} concurrent users**.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AutonomousStress;
