import React from 'react';
import { User, ShieldAlert, Cpu, AlertOctagon, ZapOff } from 'lucide-react';

const PROFILES = [
  {
    id: 'light',
    name: 'Light Load',
    connections: 10,
    duration: 30,
    description: '10 VUs for 30s. Baseline check.',
    icon: User,
    color: 'var(--accent-emerald)'
  },
  {
    id: 'medium',
    name: 'Medium Load',
    connections: 50,
    duration: 60,
    description: '50 VUs for 60s. Standard stress.',
    icon: Cpu,
    color: 'var(--accent-cyan)'
  },
  {
    id: 'heavy',
    name: 'Heavy Load',
    connections: 100,
    duration: 60,
    description: '100 VUs for 60s. High capacity validation.',
    icon: ShieldAlert,
    color: 'var(--accent-amber)'
  },
  {
    id: 'stress',
    name: 'Stress Ramping',
    connections: 500,
    duration: 120,
    description: '500 VUs for 120s. Extreme load profiling.',
    icon: AlertOctagon,
    color: 'var(--accent-coral)'
  },
  {
    id: 'custom',
    name: 'Custom Profile',
    connections: 50,
    duration: 60,
    description: 'Set custom user counts and run times.',
    icon: ZapOff,
    color: 'var(--accent-purple)'
  }
];

function LoadProfileSelector({ 
  selectedProfile, 
  setSelectedProfile, 
  customConnections, 
  setCustomConnections, 
  customDuration, 
  setCustomDuration 
}) {
  const isCustom = selectedProfile === 'custom';

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
        Target Load Profile
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {PROFILES.map(p => {
          const Icon = p.icon;
          const isSelected = selectedProfile === p.id;
          return (
            <div 
              key={p.id} 
              onClick={() => setSelectedProfile(p.id)}
              className="glass-panel-interactive"
              style={{
                padding: '16px',
                cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
                border: isSelected ? `2px solid ${p.color}` : '1px solid var(--glass-border)',
                background: isSelected ? 'rgba(255,255,255,0.02)' : 'var(--bg-glass)',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `rgba(${p.color === 'var(--accent-emerald)' ? '16, 185, 129' : p.color === 'var(--accent-cyan)' ? '0, 212, 255' : p.color === 'var(--accent-amber)' ? '245, 158, 11' : p.color === 'var(--accent-coral)' ? '255, 107, 107' : '139, 92, 246'}, 0.1)`,
                color: p.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <Icon size={20} />
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>{p.name}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.description}</p>
            </div>
          );
        })}
      </div>

      {isCustom && (
        <div className="animate-fade-in" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Concurrent Connections (Max 500)
            </label>
            <input 
              type="number" 
              value={customConnections}
              onChange={(e) => setCustomConnections(Math.min(500, Math.max(1, parseInt(e.target.value) || 0)))}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Duration (Seconds)
            </label>
            <input 
              type="number" 
              value={customDuration}
              onChange={(e) => setCustomDuration(Math.max(5, parseInt(e.target.value) || 0))}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { PROFILES };
export default LoadProfileSelector;
