import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Download, 
  RotateCcw, 
  Bot, 
  FolderPlus
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { arrayToCsvRow } from '../lib/csv/sanitizer';

export const AlertIntelligence: React.FC = () => {
  const { 
    alerts, 
    setSelectedAlert, 
    createInvestigationFromAlert,
    setActiveTab,
    theme
  } = useSecurity();

  const isDark = theme === 'dark';

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [detectorFilter, setDetectorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'time' | 'severity'>('score');

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = !search ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.source_ip.toLowerCase().includes(search.toLowerCase()) ||
      (a.destination_ip && a.destination_ip.toLowerCase().includes(search.toLowerCase())) ||
      a.title.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesDetector = detectorFilter === 'ALL' || a.detectorId === detectorFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesDetector && matchesStatus;
  });

  // Sorting
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortBy === 'score') return b.anomalyScore - a.anomalyScore;
    if (sortBy === 'time') return b.timestampMs - a.timestampMs;
    const sevWeights: Record<string, number> = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFORMATIONAL: 1 };
    return (sevWeights[b.severity] || 0) - (sevWeights[a.severity] || 0);
  });

  const handleExportCsv = () => {
    const headers = ['Alert ID', 'Timestamp', 'Detector ID', 'Source IP', 'Destination IP', 'Score', 'Severity', 'Confidence', 'Status', 'Title'];
    const rows = sortedAlerts.map(a => arrayToCsvRow([
      a.id,
      a.timestamp,
      a.detectorId,
      a.source_ip,
      a.destination_ip || '',
      a.anomalyScore,
      a.severity,
      `${a.confidence}%`,
      a.status,
      a.title
    ]));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentinel_alerts_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSeverityFilter('ALL');
    setDetectorFilter('ALL');
    setStatusFilter('ALL');
  };

  const cardClass = isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Top Controls & Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-colors ${cardClass}`}>
        <div>
          <div className="flex items-center space-x-2 text-amber-500 mb-1">
            <AlertTriangle className="w-5 h-5" />
            <h2 className={`text-base font-bold tracking-tight ${textTitle}`}>Alert Intelligence Centre</h2>
          </div>
          <p className={`text-xs ${textMuted}`}>
            Search, triage, and investigate anomalies generated across 7 modular behavioral engines.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className={`px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
            }`}
          >
            <Download className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${cardClass}`}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID, IP, or keyword..."
              className={`pl-8 pr-3 py-1.5 border rounded-lg font-mono focus:outline-none focus:border-cyan-500 w-56 ${
                isDark 
                  ? 'bg-slate-900 border-slate-700/80 text-slate-200 placeholder-slate-500' 
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className={`px-2.5 py-1.5 border rounded-lg font-mono focus:outline-none ${
              isDark ? 'bg-slate-900 border-slate-700/80 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFORMATIONAL">Info</option>
          </select>

          {/* Detector Filter */}
          <select
            value={detectorFilter}
            onChange={e => setDetectorFilter(e.target.value)}
            className={`px-2.5 py-1.5 border rounded-lg font-mono focus:outline-none ${
              isDark ? 'bg-slate-900 border-slate-700/80 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">All Detectors</option>
            <option value="DET_CONN_COUNT">Unusual Connection Count</option>
            <option value="DET_PORT_ANOMALY">Port Scanning / Anomaly</option>
            <option value="DET_TRAFFIC_VOLUME">Traffic Volume Anomaly</option>
            <option value="DET_REPEATED_CONN">Repeated Beaconing Pattern</option>
            <option value="DET_OUTBOUND_SURGE">Outbound Data Surge</option>
            <option value="DET_RARE_PAIR">Rare Communication Pair</option>
            <option value="DET_MULTI_SIGNAL">Multi-Signal Correlation</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`px-2.5 py-1.5 border rounded-lg font-mono focus:outline-none ${
              isDark ? 'bg-slate-900 border-slate-700/80 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {/* Reset Filters */}
          {(search || severityFilter !== 'ALL' || detectorFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className={`flex items-center space-x-1 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className={`px-2.5 py-1.5 border rounded-lg font-mono focus:outline-none ${
              isDark ? 'bg-slate-900 border-slate-700/80 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <option value="score">Sort: Anomaly Score</option>
            <option value="severity">Sort: Severity</option>
            <option value="time">Sort: Timestamp</option>
          </select>
        </div>
      </div>

      {/* Main Alerts Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${cardClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className={`border-b ${isDark ? 'bg-[#0D111B] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
              <tr>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Detector</th>
                <th className="py-3 px-4">Source Device</th>
                <th className="py-3 px-4">Destination Target</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60 bg-slate-900/30' : 'divide-slate-100 bg-white'}`}>
              {sortedAlerts.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`py-12 text-center ${textMuted}`}>
                    No alert findings match your criteria.
                  </td>
                </tr>
              ) : (
                sortedAlerts.map(alert => (
                  <tr 
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`cursor-pointer transition-colors group ${
                      isDark ? 'hover:bg-slate-850/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-cyan-600 dark:text-cyan-400 group-hover:underline">
                      {alert.id}
                    </td>
                    <td className={`py-3 px-4 ${textMuted}`}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className={`py-3 px-4 font-bold ${textTitle}`}>
                      {alert.anomalyScore}
                    </td>
                    <td className={`py-3 px-4 truncate max-w-[160px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`} title={alert.detectorName}>
                      {alert.detectorName}
                    </td>
                    <td className={`py-3 px-4 ${isDark ? 'text-slate-200' : 'text-slate-800 font-medium'}`}>
                      {alert.source_ip}
                    </td>
                    <td className={`py-3 px-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {alert.destination_ip ? `${alert.destination_ip}:${alert.destination_port || ''}` : 'Multiple'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedAlert(alert);
                            setActiveTab('ai-analyst');
                          }}
                          className={`p-1.5 rounded border transition-colors ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700' : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                          }`}
                          title="Ask AI Security Analyst"
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => createInvestigationFromAlert(alert)}
                          className={`p-1.5 rounded border transition-colors ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200'
                          }`}
                          title="Open Case"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
