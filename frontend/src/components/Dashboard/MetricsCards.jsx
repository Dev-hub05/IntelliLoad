import React from 'react';
import { Clock, Zap, CheckCircle2, Users } from 'lucide-react';

function MetricsCards({ currentMetrics }) {
  const cards = [
    {
      title: 'Average Latency',
      value: currentMetrics ? `${Math.round(currentMetrics.avgLatency)} ms` : '-- ms',
      subtext: currentMetrics ? `P95: ${Math.round(currentMetrics.p95Latency)} ms` : '-- ms',
      icon: Clock,
      color: 'var(--accent-cyan)'
    },
    {
      title: 'Throughput',
      value: currentMetrics ? `${Math.round(currentMetrics.throughput)} req/s` : '-- req/s',
      subtext: currentMetrics ? `Total: ${currentMetrics.totalRequests.toLocaleString()}` : 'Total: 0',
      icon: Zap,
      color: 'var(--accent-amber)'
    },
    {
      title: 'Success Rate',
      value: currentMetrics ? `${(100 - currentMetrics.errorRate).toFixed(2)} %` : '100.00 %',
      subtext: currentMetrics ? `Errors: ${currentMetrics.errorCount}` : 'Errors: 0',
      icon: CheckCircle2,
      color: currentMetrics && currentMetrics.errorRate > 5 ? 'var(--accent-coral)' : 'var(--accent-emerald)'
    },
    {
      title: 'Active VUs',
      value: currentMetrics ? `${currentMetrics.activeUsers}` : '0',
      subtext: 'Virtual Users',
      icon: Users,
      color: 'var(--accent-purple)'
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              background: `rgba(${card.color === 'var(--accent-cyan)' ? '0, 212, 255' : card.color === 'var(--accent-emerald)' ? '16, 185, 129' : card.color === 'var(--accent-coral)' ? '255, 107, 107' : card.color === 'var(--accent-amber)' ? '245, 158, 11' : '139, 92, 246'}, 0.1)`,
              color: card.color
            }}>
              <Icon size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{card.title}</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>{card.value}</span>
              <span style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MetricsCards;
