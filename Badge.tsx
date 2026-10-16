import React from 'react';
import { Severity, AlertStatus } from '../../types/alerts';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  const styles: Record<Severity, string> = {
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 dark:shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    HIGH: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 dark:shadow-[0_0_10px_rgba(245,158,11,0.12)]',
    MEDIUM: 'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/25',
    LOW: 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25',
    INFORMATIONAL: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-600/30'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wider uppercase font-mono border ${styles[severity] || styles.INFORMATIONAL} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
      {severity}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: AlertStatus; className?: string }> = ({ status, className = '' }) => {
  const styles: Record<AlertStatus, string> = {
    OPEN: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
    INVESTIGATING: 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/40',
    RESOLVED: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
    FALSE_POSITIVE: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/40'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono border ${styles[status] || styles.OPEN} ${className}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const ProtocolBadge: React.FC<{ protocol: string; className?: string }> = ({ protocol, className = '' }) => {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-cyan-50 text-cyan-800 border border-cyan-200 dark:bg-slate-800/80 dark:text-cyan-300 dark:border-slate-700/60 ${className}`}>
      {protocol}
    </span>
  );
};
