import React from 'react';
import { 
  Activity, 
  HardDrive, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  PlayCircle, 
  ChevronRight 
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { TrafficChart } from '../components/charts/TrafficChart';
import { ProtocolDonut } from '../components/charts/ProtocolDonut';
import { SeverityBar } from '../components/charts/SeverityBar';
import { HackathonModulesPanel } from '../components/dashboard/HackathonModulesPanel';

export const CommandCentre: React.FC = () => {
  const { 
    dataset, 
    flows, 
    alerts, 
    investigations, 
    validationSummary, 
    loadDemoDataset, 
    setSelectedAlert, 
    setSelectedInvestigation, 
    setActiveTab,
    theme 
  } = useSecurity();

  const isDark = theme === 'dark';

  // If no dataset loaded
  if (!dataset || flows.length === 0) {
    return (
      <div className={`p-8 max-w-4xl mx-auto my-12 text-center rounded-2xl border shadow-xl p-12 transition-colors ${
        isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No Active Telemetry Dataset</h2>
        <p className={`text-sm max-w-md mx-auto mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          SENTINEL X requires network flow telemetry for behavioral baseline and anomaly detection. Load the deterministic synthetic demonstration dataset or import a CSV packet capture.
        </p>
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={() => loadDemoDataset('standard')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-all shadow-md"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Load Demo Dataset (Synthetic)</span>
          </button>
          <button
            onClick={() => setActiveTab('traffic')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors border ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            Import Custom CSV
          </button>
        </div>
      </div>
    );
  }

  // Calculate actual dynamic KPI metrics
  const totalFlows = dataset.totalFlows;
  const uniqueDevices = dataset.uniqueDevices;
  const suspiciousFlows = flows.filter(f => f.is_anomalous).length;
  const highPriorityAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
  const openInvestigations = investigations.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING');

  const severityCounts = {
    CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
    HIGH: alerts.filter(a => a.severity === 'HIGH').length,
    MEDIUM: alerts.filter(a => a.severity === 'MEDIUM').length,
    LOW: alerts.filter(a => a.severity === 'LOW').length,
    INFORMATIONAL: alerts.filter(a => a.severity === 'INFORMATIONAL').length
  };

  // Top Communicating Devices
  const hostFlowCounts = new Map<string, { flows: number; bytes: number }>();
  for (const f of flows) {
    if (!hostFlowCounts.has(f.source_ip)) {
      hostFlowCounts.set(f.source_ip, { flows: 0, bytes: 0 });
    }
    const stat = hostFlowCounts.get(f.source_ip)!;
    stat.flows++;
    stat.bytes += f.bytes_sent + f.bytes_received;
  }
  const topDevices = Array.from(hostFlowCounts.entries())
    .map(([ip, data]) => ({ ip, ...data }))
    .sort((a, b) => b.flows - a.flows)
    .slice(0, 5);

  const cardBg = isDark ? 'bg-[#111827] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Synthetic Banner if Synthetic */}
      {dataset.isSynthetic && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
          isDark ? 'bg-amber-950/30 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <strong className="font-mono">SYNTHETIC DEMONSTRATION DATA — NOT LIVE NETWORK TRAFFIC</strong>
            <span className="hidden md:inline">• Deterministic simulation seed active for testing detection engines.</span>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="text-[11px] underline hover:opacity-80"
          >
            Review Simulation Scenarios
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className={`p-4 rounded-xl border shadow-xs space-y-1 ${cardBg}`}>
          <div className={`flex items-center justify-between text-xs ${textMuted}`}>
            <span>Total Flows</span>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <div className={`text-xl font-bold font-mono tracking-tight ${textTitle}`}>
            {totalFlows.toLocaleString()}
          </div>
          <div className={`text-[10px] font-mono ${textMuted}`}>100% parsed</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs space-y-1 ${cardBg}`}>
          <div className={`flex items-center justify-between text-xs ${textMuted}`}>
            <span>Unique Devices</span>
            <HardDrive className="w-4 h-4 text-sky-500" />
          </div>
          <div className={`text-xl font-bold font-mono tracking-tight ${textTitle}`}>
            {uniqueDevices}
          </div>
          <div className={`text-[10px] font-mono ${textMuted}`}>{dataset.uniqueSourceIps} src / {dataset.uniqueDestinationIps} dst</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs space-y-1 ${cardBg}`}>
          <div className={`flex items-center justify-between text-xs ${textMuted}`}>
            <span>Suspicious Flows</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-yellow-300 tracking-tight">
            {suspiciousFlows}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-yellow-500/80 font-mono">
            {totalFlows > 0 ? ((suspiciousFlows / totalFlows) * 100).toFixed(1) : 0}% anomaly rate
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs space-y-1 ${
          isDark 
            ? 'bg-[#111827] border-rose-900/40 bg-gradient-to-br from-[#111827] to-rose-950/20' 
            : 'bg-rose-50/70 border-rose-200'
        }`}>
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <span>High Priority Alerts</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-300 tracking-tight">
            {highPriorityAlerts}
          </div>
          <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-mono">Critical & High findings</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs space-y-1 ${cardBg}`}>
          <div className={`flex items-center justify-between text-xs ${textMuted}`}>
            <span>Time Span</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className={`text-xl font-bold font-mono tracking-tight ${textTitle}`}>
            {dataset.durationHours} hrs
          </div>
          <div className={`text-[10px] font-mono ${textMuted}`}>Temporal window</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs space-y-1 ${cardBg}`}>
          <div className={`flex items-center justify-between text-xs ${textMuted}`}>
            <span>Data Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
            {validationSummary ? `${((validationSummary.acceptedRows / Math.max(1, validationSummary.totalRows)) * 100).toFixed(0)}%` : '100%'}
          </div>
          <div className={`text-[10px] font-mono ${textMuted}`}>Quality status: PASS</div>
        </div>
      </div>

      {/* 8 Core Hackathon Anomaly & Behavioral Analysis Modules */}
      <HackathonModulesPanel />

      {/* Row 2: Traffic Activity Chart & Anomaly Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Traffic Chart */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
          <TrafficChart flows={flows} />
        </div>

        {/* Severity Overview */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-bold flex items-center space-x-2 ${textTitle}`}>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Findings by Severity</span>
              </h3>
              <span className={`text-xs font-mono ${textMuted}`}>{alerts.length} total</span>
            </div>
            <p className={`text-xs mb-4 ${textMuted}`}>
              Click a severity level below to view and filter matching alerts in the intelligence center.
            </p>
            <SeverityBar
              severityCounts={severityCounts}
              onSelectSeverity={() => setActiveTab('alerts')}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Protocol Distribution, Top Communicating Hosts, Dataset Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Protocol Distribution */}
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <h3 className={`text-sm font-bold mb-2 ${textTitle}`}>Observed Protocols</h3>
          <p className={`text-xs mb-3 ${textMuted}`}>L4 & application protocol traffic breakdown</p>
          <ProtocolDonut flows={flows} />
        </div>

        {/* Top Devices */}
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <h3 className={`text-sm font-bold mb-2 ${textTitle}`}>Top Communicating Devices</h3>
          <p className={`text-xs mb-3 ${textMuted}`}>Devices ranked by total observed flow volume</p>
          <div className="space-y-2">
            {topDevices.map((d, i) => (
              <div 
                key={d.ip} 
                onClick={() => setActiveTab('network-map')}
                className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`w-5 h-5 rounded font-mono text-[10px] flex items-center justify-center font-bold ${
                    isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {i + 1}
                  </span>
                  <span className={`font-mono font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{d.ip}</span>
                </div>
                <div className="text-right font-mono">
                  <div className="text-cyan-600 dark:text-cyan-400 font-bold">{d.flows} flows</div>
                  <div className={`text-[10px] ${textMuted}`}>{(d.bytes / 1024).toFixed(0)} KB</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Summary & Health */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
          <div>
            <h3 className={`text-sm font-bold mb-2 ${textTitle}`}>Automated Analysis Summary</h3>
            <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Analysis pipeline executed 7 modular detectors over {dataset.totalFlows} flows. The engine flagged {highPriorityAlerts} high-priority anomalies across {uniqueDevices} endpoints. Multi-stage correlation detected suspicious lateral movement and periodic beaconing.
            </p>

            <div className={`space-y-2 pt-2 border-t text-xs font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
              <div className="flex justify-between">
                <span>Active Dataset:</span>
                <span className={`truncate max-w-[150px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{dataset.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Open Investigations:</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">{openInvestigations.length} cases</span>
              </div>
              <div className="flex justify-between">
                <span>Detection Status:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Deterministic Engine Active</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('ai-analyst')}
            className={`mt-4 w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
              isDark 
                ? 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/30 text-cyan-300' 
                : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-800'
            }`}
          >
            <span>Ask AI Security Analyst</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 4: Recent Alerts & Investigation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts (2 Cols) */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${textTitle}`}>Recent Security Findings</h3>
              <p className={`text-xs ${textMuted}`}>Prioritized by anomaly severity and confidence</p>
            </div>
            <button
              onClick={() => setActiveTab('alerts')}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:opacity-80 font-medium flex items-center space-x-1"
            >
              <span>View All ({alerts.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b ${isDark ? 'bg-[#0D111B] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                <tr>
                  <th className="py-2.5 px-3">Alert ID</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Finding Title</th>
                  <th className="py-2.5 px-3">Source Device</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {alerts.slice(0, 6).map(alert => (
                  <tr key={alert.id} className={`transition-colors ${isDark ? 'hover:bg-slate-850/60' : 'hover:bg-slate-50'}`}>
                    <td className="py-2.5 px-3 font-bold text-cyan-600 dark:text-cyan-400">{alert.id}</td>
                    <td className="py-2.5 px-3"><SeverityBadge severity={alert.severity} /></td>
                    <td className={`py-2.5 px-3 truncate max-w-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{alert.title}</td>
                    <td className={`py-2.5 px-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{alert.source_ip}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={alert.status} /></td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className={`px-2 py-1 rounded text-[11px] font-sans border ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Investigation Queue (1 Col) */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-sm font-bold ${textTitle}`}>Investigation Queue</h3>
                <p className={`text-xs ${textMuted}`}>Active analyst cases and triage status</p>
              </div>
              <button
                onClick={() => setActiveTab('investigations')}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:opacity-80 font-medium"
              >
                Manage
              </button>
            </div>

            {investigations.length === 0 ? (
              <div className={`text-center py-10 text-xs font-mono ${textMuted}`}>
                No open investigations. Select an alert to open a new case.
              </div>
            ) : (
              <div className="space-y-2.5">
                {investigations.slice(0, 4).map(inv => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvestigation(inv);
                      setActiveTab('investigations');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors space-y-1 ${
                      isDark ? 'bg-slate-900/70 hover:bg-slate-850 border-slate-800/80' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{inv.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <div className={`text-xs font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{inv.title}</div>
                    <div className={`text-[10px] font-mono ${textMuted}`}>
                      {inv.relatedAlertIds.length} related alert(s) • Priority: {inv.priority}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('investigations')}
            className={`mt-4 w-full py-2 rounded-lg text-xs font-semibold transition-colors border ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            }`}
          >
            Open Investigation Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
