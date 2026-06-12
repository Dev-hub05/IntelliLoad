import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSSE } from '../../hooks/useSSE';
import { testService } from '../../services/api';
import MetricsCards from './MetricsCards';
import LatencyChart from './LatencyChart';
import ThroughputChart from './ThroughputChart';
import ErrorTrendChart from './ErrorTrendChart';
import TestControls from '../TestRunner/TestControls';
import { Play } from 'lucide-react';

function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRunId = searchParams.get('runId');

  // Local state for active test execution tracking
  const [testRun, setTestRun] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [chartData, setChartData] = useState([]);
  
  // Real-time server-sent event (SSE) updates subscription
  const { metrics: sseMetrics, connected } = useSSE(activeRunId);

  // Load test run meta details on load or parameter changes
  useEffect(() => {
    if (!activeRunId) {
      setTestRun(null);
      setChartData([]);
      setElapsedSeconds(0);
      return;
    }

    const fetchTestDetails = async () => {
      try {
        const response = await testService.getTestDetails(activeRunId);
        setTestRun(response.data);
        
        // If the test has already finished, pull historical metrics
        if (response.data.status === 'completed' || response.data.status === 'failed') {
          const historical = await testService.getTestMetrics(activeRunId);
          setChartData(historical.data);
        }
      } catch (err) {
        console.error('Failed to load test run details:', err.message);
      }
    };

    fetchTestDetails();
  }, [activeRunId]);

  // Tick elapsed seconds while test status is running
  useEffect(() => {
    let interval = null;
    if (testRun && testRun.status === 'running') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          if (next >= testRun.config.duration) {
            clearInterval(interval);
            // Re-fetch details to save completed status
            testService.getTestDetails(activeRunId).then(res => setTestRun(res.data));
          }
          return next;
        });
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [testRun]);

  // Append new SSE metric points to chart buffers
  useEffect(() => {
    if (!sseMetrics) return;

    setChartData(prev => {
      const updated = [...prev, sseMetrics];
      // Limit to trailing 120 datapoints (2 minutes rolling window)
      return updated.length > 120 ? updated.slice(-120) : updated;
    });

    // Sync status if completed
    if (testRun && testRun.status === 'running' && sseMetrics.totalRequests >= testRun.config.connections * testRun.config.duration) {
      testService.getTestDetails(activeRunId).then(res => setTestRun(res.data));
    }
  }, [sseMetrics]);

  const handleStopTest = async () => {
    if (!activeRunId) return;
    try {
      const response = await testService.stopTest(activeRunId);
      setTestRun(response.data.testRun);
    } catch (err) {
      console.error('Failed to abort test session:', err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Metrics Dashboard</h1>
          <p className="page-subtitle">
            {testRun ? `Analyzing execution run: ${testRun.name}` : 'Select or configure a test run to start analyzing metrics.'}
          </p>
        </div>
      </div>

      {testRun ? (
        <>
          {/* Action trigger/abort controls bar */}
          <TestControls 
            status={testRun.status}
            duration={testRun.config.duration}
            connections={testRun.config.connections}
            elapsedSeconds={elapsedSeconds}
            onStop={handleStopTest}
          />

          {/* Aggregate Stat Cards */}
          <MetricsCards currentMetrics={sseMetrics || (chartData.length > 0 ? chartData[chartData.length - 1] : null)} />

          {/* Recharts Live Charts layouts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            <LatencyChart data={chartData} />
            <ThroughputChart data={chartData} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            <ErrorTrendChart data={chartData} />
          </div>
        </>
      ) : (
        <div className="mock-page">
          <div className="glass-panel mock-card">
            <Play size={48} className="mock-icon" />
            <h2>No Active Test Session</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Configure and launch a load test first to view dynamic charts and telemetry details.
            </p>
            <button 
              onClick={() => window.location.href = '/configure'}
              style={{
                padding: '12px 24px',
                background: 'var(--accent-cyan-glow)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Configure New Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
