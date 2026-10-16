import React from 'react';
import { Severity } from '../../types/alerts';
import { useSecurity } from '../../context/SecurityContext';

interface SeverityBarProps {
  severityCounts: Record<Severity, number>;
  onSelectSeverity?: (severity: Severity) => void;
  selectedSeverity?: Severity | 'ALL';
}

export const SeverityBar: React.FC<SeverityBarProps> = ({ 
  severityCounts, 
  onSelectSeverity,
  selectedSeverity = 'ALL' 
}) => {
  const { theme } = useSecurity();
  const isDark = theme === 'dark';

  const categories: Array<{ id: Severity; label: string; color: string; bg: string }> = [
    { id: 'CRITICAL', label: 'Critical', color: isDark ? 'text-rose-400' : 'text-rose-600', bg: 'bg-rose-500' },
    { id: 'HIGH', label: 'High', color: isDark ? 'text-amber-400' : 'text-amber-600', bg: 'bg-amber-500' },
    { id: 'MEDIUM', label: 'Medium', color: isDark ? 'text-yellow-300' : 'text-amber-500', bg: 'bg-amber-400' },
    { id: 'LOW', label: 'Low', color: isDark ? 'text-sky-400' : 'text-sky-600', bg: 'bg-sky-500' },
    { id: 'INFORMATIONAL', label: 'Info', color: isDark ? 'text-slate-400' : 'text-slate-600', bg: 'bg-slate-400' }
  ];

  const total = Object.values(severityCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2">
      {categories.map(cat => {
        const count = severityCounts[cat.id] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const isSelected = selectedSeverity === cat.id;

        return (
          <div
            key={cat.id}
            onClick={() => onSelectSeverity && onSelectSeverity(cat.id)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isSelected 
                ? (isDark ? 'bg-slate-800/90 border-cyan-500' : 'bg-cyan-50 border-cyan-500 shadow-xs') 
                : (isDark ? 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300')
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className={`font-semibold ${cat.color}`}>{cat.label}</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-200'}`}>
              <div
                className={`h-full ${cat.bg} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
