import React from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Cpu, Database, 
  Network, HardDrive, Share2, HelpCircle, CheckCircle, RefreshCw 
} from 'lucide-react';
import './AiDiagnosticPanel.css';

function AiDiagnosticPanel({ testRun }) {
  if (!testRun) return null;

  const { failurePrediction, rootCause, advisor, anomalies } = testRun;

  // If no ML metrics have been completed/saved yet
  const hasDiagnosticData = failurePrediction && rootCause && advisor;

  if (!hasDiagnosticData) {
    return (
      <div className="glass-panel diagnostic-loading-card">
        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--accent-cyan)', marginBottom: '12px' }} />
        <h3>AI Diagnostic Analysis In Progress</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Background algorithms are currently training anomaly baseline models and scoring root causes. Results will stream in momentarily.
        </p>
      </div>
    );
  }

  // Get Risk Level Styles
  const getRiskDetails = (riskLevel) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return { color: 'var(--accent-coral)', label: 'CRITICAL RISK', desc: 'Active system failure or severe saturation threat.' };
      case 'HIGH':
        return { color: 'var(--accent-amber)', label: 'HIGH RISK', desc: 'Elevated latencies or error rates indicate imminent degradation.' };
      case 'MEDIUM':
        return { color: '#f59e0b', label: 'MEDIUM RISK', desc: 'Performance is fluctuating. Minor resource contention detected.' };
      default:
        return { color: 'var(--accent-emerald)', label: 'LOW RISK', desc: 'System is running healthy within safe baseline parameters.' };
    }
  };

  const risk = getRiskDetails(failurePrediction.riskLevel);
  const probPercent = Math.round((failurePrediction.probability || 0) * 100);

  // Map cause name to icon
  const getCauseIcon = (cause) => {
    switch (cause) {
      case 'cpu': return <Cpu size={18} />;
      case 'database': return <Database size={18} />;
      case 'network': return <Network size={18} />;
      case 'memory': return <HardDrive size={18} />;
      case 'concurrency': return <Share2 size={18} />;
      default: return <HelpCircle size={18} />;
    }
  };

  const scores = rootCause.scores || {};

  return (
    <div className="ai-diagnostic-panel animate-fade-in" style={{ marginTop: '24px' }}>
      <div className="diagnostic-header">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert style={{ color: 'var(--accent-cyan)' }} /> AI Diagnostic & Performance Advisor
        </h2>
        <span className="ai-badge">AI INSIGHTS</span>
      </div>

      <div className="diagnostic-grid">
        {/* Risk & Advisor Card */}
        <div className="glass-panel risk-advisor-card">
          <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '16px' }}>
            <h3 className="section-title">Risk Assessment</h3>
            <div className="risk-meter-container" style={{ borderColor: risk.color }}>
              <div className="risk-level-tag" style={{ color: risk.color }}>{risk.label}</div>
              <div className="risk-percentage" style={{ color: risk.color }}>{probPercent}%</div>
              <div className="risk-bar-track">
                <div className="risk-bar-fill" style={{ width: `${probPercent}%`, backgroundColor: risk.color }} />
              </div>
            </div>
            <p className="risk-desc">{risk.desc}</p>
          </div>

          <div>
            <h3 className="section-title">AI Load Advisor</h3>
            <div className="advisor-rec-container">
              <span className={`advisor-rec-badge rec-${advisor.recommendation || 'HOLD'}`}>
                {advisor.recommendation || 'HOLD'}
              </span>
              <p className="advisor-rec-message">{advisor.message}</p>
            </div>

            <div className="advisor-actions">
              <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Recommended Tuning Actions:</h4>
              <ul className="actions-list">
                {(advisor.actions || []).map((action, idx) => (
                  <li key={idx}>
                    <CheckCircle size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{action}</span>
                  </li>
                ))}
                {(!advisor.actions || advisor.actions.length === 0) && (
                  <span style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)' }}>No tuning actions required.</span>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottlenecks Root Cause Card */}
        <div className="glass-panel bottlenecks-card">
          <h3 className="section-title">Resource Contention Bottlenecks</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Probability distribution of performance constraint attributions.
          </p>

          <div className="bottlenecks-list">
            {Object.entries(scores).map(([cause, score]) => {
              const scorePercent = Math.round((score || 0) * 100);
              const isPrimary = rootCause.primaryCause === cause;

              return (
                <div key={cause} className={`bottleneck-row ${isPrimary ? 'primary' : ''}`}>
                  <div className="bottleneck-label">
                    <span className="bottleneck-icon" style={{ color: isPrimary ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                      {getCauseIcon(cause)}
                    </span>
                    <span className="bottleneck-name">{cause.toUpperCase()}</span>
                  </div>
                  <div className="bottleneck-bar-container">
                    <div className="bottleneck-bar-fill" style={{ width: `${scorePercent}%`, backgroundColor: isPrimary ? 'var(--accent-cyan)' : 'var(--accent-purple)' }} />
                  </div>
                  <div className="bottleneck-score">{scorePercent}%</div>
                </div>
              );
            })}
          </div>

          {rootCause.explanation && (
            <div className="explanation-box">
              <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Diagnosis Details:</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{rootCause.explanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Anomalies Timeline Log */}
      <div className="glass-panel anomalies-log-card" style={{ marginTop: '24px' }}>
        <h3 className="section-title">Anomaly Events Timeline Log ({anomalies?.length || 0})</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Timeseries ticks flagged as statistical outliers compared to baseline loads.
        </p>

        <div className="anomalies-list">
          {(anomalies || []).map((anomaly, idx) => {
            const timeStr = new Date(anomaly.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <div key={idx} className="anomaly-item">
                <div className="anomaly-time">{timeStr}</div>
                <div className="anomaly-message">{anomaly.message}</div>
                <div className="anomaly-confidence">Confidence: {Math.round(anomaly.confidence * 100)}%</div>
              </div>
            );
          })}
          {(!anomalies || anomalies.length === 0) && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              No statistical performance anomalies detected. System behaved within healthy parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AiDiagnosticPanel;
