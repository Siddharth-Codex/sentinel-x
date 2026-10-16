import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FlowRecord } from '../../types/network';
import { useSecurity } from '../../context/SecurityContext';

interface ProtocolDonutProps {
  flows: FlowRecord[];
}

const COLORS: Record<string, string> = {
  HTTPS: '#0284c7',
  HTTP: '#06b6d4',
  DNS: '#10b981',
  TCP: '#6366f1',
  UDP: '#8b5cf6',
  SSH: '#f59e0b',
  SMB: '#e11d48',
  OTHER: '#64748b'
};

export const ProtocolDonut: React.FC<ProtocolDonutProps> = ({ flows }) => {
  const { theme } = useSecurity();
  const isDark = theme === 'dark';

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of flows) {
      counts[f.protocol] = (counts[f.protocol] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [flows]);

  if (data.length === 0) {
    return (
      <div className={`h-44 flex items-center justify-center text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        No protocol data available
      </div>
    );
  }

  return (
    <div className="w-full h-48 flex items-center">
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={36}
              outerRadius={58}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell 
                  key={entry.name} 
                  fill={COLORS[entry.name] || '#94A3B8'} 
                  stroke={isDark ? '#0D111B' : '#ffffff'} 
                  strokeWidth={2} 
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
                color: isDark ? '#F8FAFC' : '#0F172A',
                borderRadius: '0.5rem',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-1/2 space-y-1 overflow-y-auto max-h-40 pr-2">
        {data.map(item => (
          <div key={item.name} className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center space-x-1.5 truncate">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[item.name] || '#94A3B8' }} />
              <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>{item.name}</span>
            </span>
            <span className={`font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-900'}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
