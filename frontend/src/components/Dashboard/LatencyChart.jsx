import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function LatencyChart({ data }) {
  // Format timestamps into seconds/minutes elapsed or raw time
  const formatXAxis = (tickItem) => {
    if (!tickItem) return '';
    const date = new Date(tickItem);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', minHeight: '350px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
        Response Time Latency (ms)
      </h3>
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis} 
              stroke="var(--text-secondary)" 
              style={{ fontSize: '0.75rem' }} 
            />
            <YAxis 
              stroke="var(--text-secondary)" 
              style={{ fontSize: '0.75rem' }} 
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--bg-secondary)', 
                borderColor: 'var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem'
              }}
              labelFormatter={(label) => `Time: ${formatXAxis(label)}`}
            />
            <Legend 
              wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }}
            />
            <Line 
              type="monotone" 
              dataKey="avgLatency" 
              name="Avg Latency"
              stroke="var(--accent-cyan)" 
              strokeWidth={2}
              dot={false} 
              isAnimationActive={false} 
            />
            <Line 
              type="monotone" 
              dataKey="p50Latency" 
              name="Median (P50)"
              stroke="var(--accent-emerald)" 
              strokeWidth={1.5}
              dot={false} 
              isAnimationActive={false} 
            />
            <Line 
              type="monotone" 
              dataKey="p95Latency" 
              name="P95 Latency"
              stroke="var(--accent-amber)" 
              strokeWidth={1.5}
              dot={false} 
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default LatencyChart;
