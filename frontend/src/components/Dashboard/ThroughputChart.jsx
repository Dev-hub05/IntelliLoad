import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function ThroughputChart({ data }) {
  const formatXAxis = (tickItem) => {
    if (!tickItem) return '';
    const date = new Date(tickItem);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', minHeight: '350px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
        Throughput (RPS) vs Active VUs
      </h3>
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis} 
              stroke="var(--text-secondary)" 
              style={{ fontSize: '0.75rem' }} 
            />
            <YAxis 
              yAxisId="left"
              stroke="var(--accent-cyan)" 
              style={{ fontSize: '0.75rem' }} 
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="var(--accent-purple)" 
              style={{ fontSize: '0.75rem' }} 
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
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="throughput" 
              name="Throughput (req/s)"
              stroke="var(--accent-cyan)" 
              fillOpacity={1} 
              fill="url(#colorThroughput)" 
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="activeUsers" 
              name="Active VUs"
              stroke="var(--accent-purple)" 
              fillOpacity={1} 
              fill="url(#colorUsers)" 
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ThroughputChart;
