import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, Check, AlertTriangle, ArrowUpDown, ChevronRight, 
  TrendingUp, TrendingDown, Clock, Activity, BarChart3, AlertCircle, Calendar, Link
} from 'lucide-react';
import { testService } from '../../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './CompareRuns.css';

function CompareRuns() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [selectedRunIds, setSelectedRunIds] = useState([]);
  
  // Selected Runs details state
  const [runA, setRunA] = useState(null);
  const [runB, setRunB] = useState(null);
  const [metricsA, setMetricsA] = useState([]);
  const [metricsB, setMetricsB] = useState([]);
  const [alignedMetrics, setAlignedMetrics] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRunsList();
  }, []);

  const fetchRunsList = async () => {
    try {
      setLoading(true);
      const res = await testService.listTests(1, 50); // Get recent 50 runs
      // Filter out only completed, failed or stopped runs
      const completedRuns = (res.data.runs || []).filter(r => r.status !== 'pending' && r.status !== 'running');
      setRuns(completedRuns);
    } catch (err) {
      setError('Failed to fetch historical test runs');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRun = (runId) => {
    let updated;
    if (selectedRunIds.includes(runId)) {
      updated = selectedRunIds.filter(id => id !== runId);
    } else {
      if (selectedRunIds.length >= 2) {
        // Replace the second one or shift
        updated = [selectedRunIds[1], runId];
      } else {
        updated = [...selectedRunIds, runId];
      }
    }
    setSelectedRunIds(updated);
  };

  useEffect(() => {
    if (selectedRunIds.length === 2) {
      loadComparisonDetails(selectedRunIds[0], selectedRunIds[1]);
    } else {
      setRunA(null);
      setRunB(null);
      setMetricsA([]);
      setMetricsB([]);
      setAlignedMetrics([]);
    }
  }, [selectedRunIds]);

  const loadComparisonDetails = async (idA, idB) => {
    try {
      setLoadingMetrics(true);
      setError('');
      
      const [resDetailsA, resDetailsB, resMetricsA, resMetricsB] = await Promise.all([
        testService.getTestDetails(idA),
        testService.getTestDetails(idB),
        testService.getTestMetrics(idA).catch(() => ({ data: [] })),
        testService.getTestMetrics(idB).catch(() => ({ data: [] }))
      ]);

      const dataA = resDetailsA.data;
      const dataB = resDetailsB.data;
      
      setRunA(dataA);
      setRunB(dataB);
      setMetricsA(resMetricsA.data);
      setMetricsB(resMetricsB.data);

      alignTimeMetrics(dataA, dataB, resMetricsA.data, resMetricsB.data);
    } catch (err) {
      setError('Failed to load performance metrics for comparison');
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Align metrics timeline by relative elapsed seconds
  const alignTimeMetrics = (detailsA, detailsB, rawMetricsA, rawMetricsB) => {
    if (rawMetricsA.length === 0 && rawMetricsB.length === 0) {
      setAlignedMetrics([]);
      return;
    }

    const startA = new Date(detailsA.startedAt).getTime();
    const startB = new Date(detailsB.startedAt).getTime();

    // Map to relative seconds
    const mappedA = rawMetricsA.map(m => ({
      elapsedSec: Math.round((new Date(m.timestamp).getTime() - startA) / 1000),
      avgLatency: m.avgLatency,
      throughput: m.throughput,
      errorRate: m.errorRate
    }));

    const mappedB = rawMetricsB.map(m => ({
      elapsedSec: Math.round((new Date(m.timestamp).getTime() - startB) / 1000),
      avgLatency: m.avgLatency,
      throughput: m.throughput,
      errorRate: m.errorRate
    }));

    const maxSec = Math.max(
      mappedA.length > 0 ? mappedA[mappedA.length - 1].elapsedSec : 0,
      mappedB.length > 0 ? mappedB[mappedB.length - 1].elapsedSec : 0,
      detailsA.config?.duration || 30,
      detailsB.config?.duration || 30
    );

    const aligned = [];
    for (let s = 0; s <= maxSec; s += 2) {
      // Find closest metrics
      const closestA = mappedA.find(m => m.elapsedSec === s) || 
                       mappedA.find(m => Math.abs(m.elapsedSec - s) <= 1) || 
                       null;
      const closestB = mappedB.find(m => m.elapsedSec === s) || 
                       mappedB.find(m => Math.abs(m.elapsedSec - s) <= 1) || 
                       null;

      if (closestA || closestB) {
        aligned.push({
          second: `${s}s`,
          elapsedSec: s,
          avgLatencyA: closestA ? Math.round(closestA.avgLatency) : null,
          avgLatencyB: closestB ? Math.round(closestB.avgLatency) : null,
          throughputA: closestA ? Math.round(closestA.throughput) : null,
          throughputB: closestB ? Math.round(closestB.throughput) : null
        });
      }
    }
    setAlignedMetrics(aligned);
  };

  // Metric Difference Helper
  const getPercentDelta = (valA, valB, lowerIsBetter = true) => {
    if (valA === undefined || valB === undefined || valA === null || valB === null) return null;
    if (valA === 0) return valB === 0 ? { val: 0, text: '0%', status: 'neutral' } : { val: 100, text: '+100%', status: lowerIsBetter ? 'bad' : 'good' };
    
    const diff = ((valB - valA) / valA) * 100;
    const sign = diff >= 0 ? '+' : '';
    const text = `${sign}${diff.toFixed(1)}%`;
    
    let status = 'neutral';
    if (diff > 0) {
      status = lowerIsBetter ? 'bad' : 'good';
    } else if (diff < 0) {
      status = lowerIsBetter ? 'good' : 'bad';
    }

    return { val: diff, text, status };
  };

  const deltaLatency = runA && runB ? getPercentDelta(runA.summary?.avgLatency, runB.summary?.avgLatency, true) : null;
  const deltaThroughput = runA && runB ? getPercentDelta(runA.summary?.avgThroughput, runB.summary?.avgThroughput, false) : null;
  const deltaErrors = runA && runB ? getPercentDelta(runA.summary?.errorRate, runB.summary?.errorRate, true) : null;
  const deltaRequests = runA && runB ? getPercentDelta(runA.summary?.totalRequests, runB.summary?.totalRequests, false) : null;

  return (
    <div className="compare-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={28} style={{ color: 'var(--accent-purple)' }} /> Compare Performance Runs
        </h1>
        <p className="page-subtitle">Select two completed test runs to perform a side-by-side performance delta analysis and view overlay timeseries trends.</p>
      </div>

      {error && <div className="banner banner-error"><AlertTriangle size={18} /><span>{error}</span></div>}

      <div className="compare-layout">
        {/* Runs Selection Panel */}
        <div className="compare-selection-panel glass-panel">
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>Select 2 Runs to Compare</h3>
          <div className="compare-list">
            {runs.map(r => {
              const isSelected = selectedRunIds.includes(r._id);
              const isSelectedA = selectedRunIds[0] === r._id;
              const isSelectedB = selectedRunIds[1] === r._id;
              
              return (
                <div 
                  key={r._id} 
                  onClick={() => handleSelectRun(r._id)} 
                  className={`compare-list-item ${isSelected ? 'selected' : ''}`}
                  style={isSelectedA ? { borderColor: 'var(--accent-cyan)' } : isSelectedB ? { borderColor: 'var(--accent-purple)' } : {}}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {r.name}
                    </span>
                    {isSelected && (
                      <span className={`run-badge ${isSelectedA ? 'badge-a' : 'badge-b'}`}>
                        {isSelectedA ? 'Run A' : 'Run B'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(r.createdAt).toLocaleDateString()}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {r.config?.connections} VUs | {r.config?.duration}s</span>
                  </div>
                </div>
              );
            })}
            {runs.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No completed test runs found.</div>
            )}
          </div>
        </div>

        {/* Comparison Details Dashboard */}
        <div className="compare-details-panel">
          {selectedRunIds.length === 2 && runA && runB ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Profile Config comparison */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>Configuration Comparison</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div style={{ borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '16px' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: '700' }}>Run A Details</div>
                    <h4 style={{ fontSize: '1.1rem', marginTop: '6px', fontWeight: '600' }}>{runA.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Target: {runA.targetUrl}</p>
                    <div className="config-grid-mini">
                      <div><span>Method:</span> {runA.method}</div>
                      <div><span>Concurrency:</span> {runA.config?.connections} VUs</div>
                      <div><span>Duration:</span> {runA.config?.duration}s</div>
                      <div><span>Pattern:</span> {runA.config?.pattern}</div>
                    </div>
                  </div>

                  <div style={{ borderLeft: '3px solid var(--accent-purple)', paddingLeft: '16px' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-purple)', fontWeight: '700' }}>Run B Details</div>
                    <h4 style={{ fontSize: '1.1rem', marginTop: '6px', fontWeight: '600' }}>{runB.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Target: {runB.targetUrl}</p>
                    <div className="config-grid-mini">
                      <div><span>Method:</span> {runB.method}</div>
                      <div><span>Concurrency:</span> {runB.config?.connections} VUs</div>
                      <div><span>Duration:</span> {runB.config?.duration}s</div>
                      <div><span>Pattern:</span> {runB.config?.pattern}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Delta Delta Metric Grid */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Performance Delta Matrix (A &rarr; B)</h3>
                
                <div className="compare-matrix-grid">
                  <div className="matrix-card">
                    <div className="matrix-title">Average Latency</div>
                    <div className="matrix-comparison">
                      <span>{runA.summary?.avgLatency?.toFixed(1)}ms</span> &rarr; <span>{runB.summary?.avgLatency?.toFixed(1)}ms</span>
                    </div>
                    {deltaLatency && (
                      <div className={`matrix-delta ${deltaLatency.status}`}>
                        {deltaLatency.status === 'good' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                        <span>{deltaLatency.text}</span>
                      </div>
                    )}
                  </div>

                  <div className="matrix-card">
                    <div className="matrix-title">Avg Throughput</div>
                    <div className="matrix-comparison">
                      <span>{runA.summary?.avgThroughput?.toFixed(0)} rps</span> &rarr; <span>{runB.summary?.avgThroughput?.toFixed(0)} rps</span>
                    </div>
                    {deltaThroughput && (
                      <div className={`matrix-delta ${deltaThroughput.status}`}>
                        {deltaThroughput.status === 'good' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{deltaThroughput.text}</span>
                      </div>
                    )}
                  </div>

                  <div className="matrix-card">
                    <div className="matrix-title">Error Rate</div>
                    <div className="matrix-comparison">
                      <span>{runA.summary?.errorRate?.toFixed(2)}%</span> &rarr; <span>{runB.summary?.errorRate?.toFixed(2)}%</span>
                    </div>
                    {deltaErrors && (
                      <div className={`matrix-delta ${deltaErrors.status}`}>
                        {deltaErrors.status === 'good' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                        <span>{deltaErrors.text}</span>
                      </div>
                    )}
                  </div>

                  <div className="matrix-card">
                    <div className="matrix-title">Total Requests</div>
                    <div className="matrix-comparison">
                      <span>{runA.summary?.totalRequests}</span> &rarr; <span>{runB.summary?.totalRequests}</span>
                    </div>
                    {deltaRequests && (
                      <div className={`matrix-delta ${deltaRequests.status}`}>
                        {deltaRequests.status === 'good' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{deltaRequests.text}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeseries Overlay Charts */}
              {loadingMetrics ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Loading overlay data...</p>
                </div>
              ) : alignedMetrics.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                  
                  {/* Latency Comparison */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>Latency Overlay (ms)</h3>
                    <div style={{ width: '100%', height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={alignedMetrics}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                          <XAxis dataKey="second" stroke="var(--text-secondary)" style={{ fontSize: '0.75rem' }} />
                          <YAxis stroke="var(--text-secondary)" style={{ fontSize: '0.75rem' }} />
                          <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)' }} />
                          <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '8px' }} />
                          <Line type="monotone" dataKey="avgLatencyA" name={runA.name} stroke="var(--accent-cyan)" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="avgLatencyB" name={runB.name} stroke="var(--accent-purple)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Throughput Comparison */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>Throughput Overlay (rps)</h3>
                    <div style={{ width: '100%', height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={alignedMetrics}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                          <XAxis dataKey="second" stroke="var(--text-secondary)" style={{ fontSize: '0.75rem' }} />
                          <YAxis stroke="var(--text-secondary)" style={{ fontSize: '0.75rem' }} />
                          <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)' }} />
                          <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '8px' }} />
                          <Line type="monotone" dataKey="throughputA" name={runA.name} stroke="var(--accent-cyan)" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="throughputB" name={runB.name} stroke="var(--accent-purple)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No time-series details available to generate overlay charts.
                </div>
              )}

              {/* Breaking point / ML comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* Breaking Points */}
                {(runA.breakingPoint?.maxStableUsers || runB.breakingPoint?.maxStableUsers) && (
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>Breaking Point Differences</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Metric</span>
                        <span style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 'bold' }}>Run A</span>
                        <span style={{ color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 'bold' }}>Run B</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>Max Stable Users</span>
                        <span style={{ fontWeight: '600' }}>{runA.breakingPoint?.maxStableUsers || 'N/A'}</span>
                        <span style={{ fontWeight: '600' }}>{runB.breakingPoint?.maxStableUsers || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>Failure Begins At</span>
                        <span style={{ fontWeight: '600' }}>{runA.breakingPoint?.failureStartsAt || 'N/A'}</span>
                        <span style={{ fontWeight: '600' }}>{runB.breakingPoint?.failureStartsAt || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>Recommended Cap</span>
                        <span style={{ fontWeight: '600' }}>{runA.breakingPoint?.recommendedCapacity || 'N/A'}</span>
                        <span style={{ fontWeight: '600' }}>{runB.breakingPoint?.recommendedCapacity || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ML Predictions */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>ML Failure Prediction Risk</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>Run A Risk:</span>
                      <span className={`risk-badge risk-${runA.failurePrediction?.riskLevel || 'LOW'}`}>
                        {runA.failurePrediction?.riskLevel || 'LOW'} ({((runA.failurePrediction?.probability || 0) * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontWeight: 'bold' }}>Run B Risk:</span>
                      <span className={`risk-badge risk-${runB.failurePrediction?.riskLevel || 'LOW'}`}>
                        {runB.failurePrediction?.riskLevel || 'LOW'} ({((runB.failurePrediction?.probability || 0) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel mock-card animate-fade-in" style={{ width: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Layers size={48} className="mock-icon" />
              <h2>No Run Selected</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Select exactly two historical completed runs from the sidebar to overlay metrics and analyze delta variations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompareRuns;
