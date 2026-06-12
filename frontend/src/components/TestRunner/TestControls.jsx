import React from 'react';
import { Play, Square, Loader2, Info } from 'lucide-react';

function TestControls({ 
  status, 
  duration, 
  connections, 
  elapsedSeconds, 
  onStart, 
  onStop, 
  loading 
}) {
  const percentComplete = Math.min(100, Math.round((elapsedSeconds / duration) * 100)) || 0;
  const isRunning = status === 'running';

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        
        {/* Left Side: Test Status & Meta details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isRunning ? (
            <div style={{ position: 'relative', display: 'flex' }}>
              <span className="animate-pulse-glow" style={{
                width: '12px',
                height: '12px',
                backgroundColor: 'var(--accent-cyan)',
                borderRadius: '50%'
              }}></span>
            </div>
          ) : (
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: status === 'completed' ? 'var(--accent-emerald)' : 'var(--text-muted)',
              borderRadius: '50%'
            }}></div>
          )}
          
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Test Status
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', textTransform: 'capitalize', color: isRunning ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
              {status}
            </h2>
          </div>
        </div>

        {/* Middle Side: Progress Bar for active running tests */}
        {isRunning && (
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ramping Load Progress</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
                {elapsedSeconds}s / {duration}s ({percentComplete}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${percentComplete}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
                transition: 'width 1s linear'
              }}></div>
            </div>
          </div>
        )}

        {/* Right Side: Command Controls Trigger */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {isRunning ? (
            <button 
              onClick={onStop}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'rgba(255, 107, 107, 0.15)',
                color: 'var(--accent-coral)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-coral-glow)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.15)'}
            >
              <Square size={16} fill="var(--accent-coral)" />
              <span>Abort Session</span>
            </button>
          ) : (
            <button 
              onClick={onStart}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'var(--accent-cyan-glow)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if(!loading) e.currentTarget.style.background = 'rgba(0, 212, 255, 0.25)' }}
              onMouseLeave={(e) => { if(!loading) e.currentTarget.style.background = 'var(--accent-cyan-glow)' }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} fill="var(--accent-cyan)" />
              )}
              <span>Initialize Load</span>
            </button>
          )}
        </div>
      </div>
      
      {isRunning && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '10px 14px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
          <Info size={14} style={{ color: 'var(--accent-purple)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Generating load with <strong>{connections} concurrent virtual users</strong>. Live metrics are pushed via SSE.
          </span>
        </div>
      )}
    </div>
  );
}

export default TestControls;
