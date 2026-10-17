import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { SeverityBadge } from '../components/common/Badge';
import { arrayToCsvRow } from '../lib/csv/sanitizer';
import { Severity } from '../types/alerts';

export const Reports: React.FC = () => {
  const { dataset, flows, alerts, theme } = useSecurity();
  const isDark = theme === 'dark';

  const [reportTitle, setReportTitle] = useState('SENTINEL X Threat Intelligence Incident Dossier');
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([
    'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'
  ]);
  const [includeMethodology, setIncludeMethodology] = useState(true);
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeDefensiveSteps, setIncludeDefensiveSteps] = useState(true);
  const [finalDisposition, setFinalDisposition] = useState('Escalated to Tier-2 SOC forensics for host endpoint verification.');

  // Filter alerts by selected severities
  const includedAlerts = alerts.filter(a => selectedSeverities.includes(a.severity));
  const highPriorityCount = includedAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;

  const handleToggleSeverity = (sev: Severity) => {
    if (selectedSeverities.includes(sev)) {
      setSelectedSeverities(selectedSeverities.filter(s => s !== sev));
    } else {
      setSelectedSeverities([...selectedSeverities, sev]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportAlertsCsv = () => {
    const headers = ['Alert ID', 'Timestamp', 'Detector', 'Source IP', 'Destination IP', 'Score', 'Severity', 'Confidence', 'Status', 'Title'];
    const rows = includedAlerts.map(a => arrayToCsvRow([
      a.id,
      a.timestamp,
      a.detectorName,
      a.source_ip,
      a.destination_ip || '',
      a.anomalyScore,
      a.severity,
      `${a.confidence}%`,
      a.status,
      a.title
    ]));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentinel_findings_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFlowsCsv = () => {
    const headers = ['Flow ID', 'Timestamp', 'Source IP', 'Port', 'Destination IP', 'Port', 'Protocol', 'Bytes Sent', 'Bytes Recv', 'Duration', 'Flagged'];
    const rows = flows.slice(0, 500).map(f => arrayToCsvRow([
      f.id,
      f.timestamp,
      f.source_ip,
      f.source_port,
      f.destination_ip,
      f.destination_port,
      f.protocol,
      f.bytes_sent,
      f.bytes_received,
      f.duration_seconds,
      f.is_anomalous ? 'YES' : 'NO'
    ]));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentinel_flows_export_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cardClass = isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm print:hidden transition-colors ${cardClass}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold tracking-tight ${textTitle}`}>Incident Report Generation Centre</h2>
            <p className={`text-xs ${textMuted}`}>
              Generate comprehensive SOC forensic dossiers, export CSV data, or create printable PDF reports.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportAlertsCsv}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Export Findings (CSV)</span>
          </button>
          <button
            onClick={handleExportFlowsCsv}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Export Flows (CSV)</span>
          </button>
          <button
            onClick={handlePrint}
            className={`px-4 py-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              isDark 
                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40' 
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Configuration Controls (hidden when printing) */}
      <div className={`p-5 rounded-2xl border space-y-4 print:hidden transition-colors ${cardClass}`}>
        <h3 className={`text-xs font-mono uppercase font-bold ${textMuted}`}>Report Scope & Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className={`block mb-1 ${textMuted}`}>Dossier Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              className={`w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:border-cyan-500 text-xs font-sans ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            />
          </div>

          <div>
            <label className={`block mb-1 ${textMuted}`}>Severity Inclusions</label>
            <div className="flex flex-wrap gap-1">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'] as Severity[]).map(s => (
                <button
                  key={s}
                  onClick={() => handleToggleSeverity(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    selectedSeverities.includes(s)
                      ? (isDark ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-cyan-50 border-cyan-400 text-cyan-800')
                      : (isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-500')
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`block ${textMuted}`}>Report Sections</label>
            <div className={`flex items-center space-x-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMethodology}
                  onChange={e => setIncludeMethodology(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700"
                />
                <span>Methodology</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEvidence}
                  onChange={e => setIncludeEvidence(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700"
                />
                <span>Evidence</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDefensiveSteps}
                  onChange={e => setIncludeDefensiveSteps(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700"
                />
                <span>Playbooks</span>
              </label>
            </div>
          </div>

          <div>
            <label className={`block mb-1 ${textMuted}`}>Final SOC Disposition</label>
            <input
              type="text"
              value={finalDisposition}
              onChange={e => setFinalDisposition(e.target.value)}
              className={`w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:border-cyan-500 text-xs font-sans ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Printable Report Canvas Document */}
      <div className={`p-8 md:p-12 rounded-2xl border shadow-xl space-y-8 print:bg-white print:text-black print:border-none print:shadow-none print:p-0 transition-colors ${
        isDark ? 'bg-[#0F1420] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        {/* Document Header */}
        <div className={`flex items-start justify-between pb-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} print:border-slate-300`}>
          <div>
            <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 font-extrabold text-xl tracking-wider mb-1">
              <span>SENTINEL</span>
              <span className={textTitle}>X</span>
              <span className={`text-xs font-mono font-normal px-2 py-0.5 rounded border ${
                isDark ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                THREAT INTELLIGENCE
              </span>
            </div>
            <h1 className={`text-xl font-bold ${textTitle} print:text-black`}>{reportTitle}</h1>
            <p className={`text-xs font-mono mt-1 ${textMuted}`}>
              Generated: {new Date().toUTCString()} • Authorized SOC Operational Artifact
            </p>
          </div>

          <div className={`text-right text-xs font-mono space-y-1 ${textMuted}`}>
            <div>Classification: <strong className="text-amber-600 dark:text-amber-400 font-bold">TLP:AMBER+STRICT</strong></div>
            <div>Dataset ID: <span className={textTitle}>{dataset?.id || 'N/A'}</span></div>
            <div>Engine Version: <span>v2.4-SOC</span></div>
          </div>
        </div>

        {/* Executive Summary & KPIs */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border print:bg-slate-100 print:border-slate-300 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className={`text-[10px] font-mono uppercase ${textMuted}`}>Flows Examined</div>
            <div className={`text-lg font-bold font-mono ${textTitle} print:text-black`}>{dataset?.totalFlows || 0}</div>
          </div>
          <div>
            <div className={`text-[10px] font-mono uppercase ${textMuted}`}>Distinct Endpoints</div>
            <div className={`text-lg font-bold font-mono ${textTitle} print:text-black`}>{dataset?.uniqueDevices || 0}</div>
          </div>
          <div>
            <div className={`text-[10px] font-mono uppercase ${textMuted}`}>Total Findings</div>
            <div className={`text-lg font-bold font-mono ${textTitle} print:text-black`}>{includedAlerts.length}</div>
          </div>
          <div>
            <div className={`text-[10px] font-mono uppercase ${textMuted}`}>High Risk & Critical</div>
            <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 print:text-rose-600">{highPriorityCount}</div>
          </div>
        </div>

        {/* Dataset Description */}
        <div className="space-y-2 text-xs">
          <h3 className="font-mono font-bold uppercase text-cyan-600 dark:text-cyan-400 print:text-blue-800 text-sm">
            1. Telemetry Scope & Observation Window
          </h3>
          <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'} print:text-slate-700`}>
            The dataset evaluated ({dataset?.name}) encompasses {dataset?.totalFlows} network flow sessions spanning {dataset?.durationHours} hours. Telemetry includes IPv4 header fields, bidirectional bytes, packet volumes, and transport protocols.
            {dataset?.isSynthetic && ' Note: Telemetry consists of verified synthetic demonstration flows; no live production corporate systems were monitored.'}
          </p>
        </div>

        {/* Detection Methodology */}
        {includeMethodology && (
          <div className="space-y-2 text-xs">
            <h3 className="font-mono font-bold uppercase text-cyan-600 dark:text-cyan-400 print:text-blue-800 text-sm">
              2. Behavioral Detection Methodology
            </h3>
            <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'} print:text-slate-700`}>
              SENTINEL X applies 7 deterministic statistical and heuristic detection algorithms:
              Unusual Connection Count (Z-score deviation on endpoint destination fan-out), Destination Port Scanning (multi-port probing and trojan signature matching), Traffic Volume Anomalies (robust median absolute deviation for data transfer spikes), Repeated Beaconing Patterns (temporal jitter and recurrence cadence), Outbound Traffic Surge (asymmetric upload ratios), Rare Communication Pairs, and Multi-Signal Kill-Chain Correlation.
            </p>
          </div>
        )}

        {/* Key Findings Table */}
        <div className="space-y-3">
          <h3 className="font-mono font-bold uppercase text-cyan-600 dark:text-cyan-400 print:text-blue-800 text-sm">
            3. Prioritized Anomaly Findings
          </h3>
          <div className={`overflow-x-auto rounded-xl border print:border-slate-300 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-700'
              } print:bg-slate-200 print:border-slate-300 print:text-black`}>
                <tr>
                  <th className="py-2.5 px-3">Alert ID</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Detector</th>
                  <th className="py-2.5 px-3">Source Device</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Summary Description</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'} print:divide-slate-300`}>
                {includedAlerts.map(a => (
                  <tr key={a.id} className="print:text-black">
                    <td className="py-2.5 px-3 font-bold text-cyan-600 dark:text-cyan-400 print:text-blue-800">{a.id}</td>
                    <td className="py-2.5 px-3"><SeverityBadge severity={a.severity} /></td>
                    <td className={`py-2.5 px-3 ${isDark ? 'text-slate-300' : 'text-slate-700'} print:text-black`}>{a.detectorName.split(' ')[0]}</td>
                    <td className={`py-2.5 px-3 font-medium ${textTitle} print:text-black`}>{a.source_ip}</td>
                    <td className={`py-2.5 px-3 font-bold ${textTitle}`}>{a.anomalyScore}</td>
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 print:text-emerald-700">{a.confidence}%</td>
                    <td className={`py-2.5 px-3 max-w-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} print:text-black`}>{a.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prescribed Defensive Steps */}
        {includeDefensiveSteps && (
          <div className="space-y-3 text-xs">
            <h3 className="font-mono font-bold uppercase text-cyan-600 dark:text-cyan-400 print:text-blue-800 text-sm">
              4. Prescribed Triage Playbook & Defensive Steps
            </h3>
            <div className="space-y-2">
              <div className={`p-3 rounded-lg border print:bg-slate-50 print:border-slate-300 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <strong className={`block mb-1 ${textTitle} print:text-black`}>• Host Isolation & Memory Preservation</strong>
                <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'} print:text-slate-700`}>
                  Isolate endpoints exhibiting correlated high-severity indicators (e.g. 192.168.1.105, 192.168.1.120) from internal subnets while capturing volatile memory dumps.
                </p>
              </div>
              <div className={`p-3 rounded-lg border print:bg-slate-50 print:border-slate-300 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <strong className={`block mb-1 ${textTitle} print:text-black`}>• Gateway Firewall & C2 Egress Blocking</strong>
                <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'} print:text-slate-700`}>
                  Implement egress filtering for observed non-standard external destinations (198.51.100.45:4444, 203.0.113.88). Check domain reputation and DNS resolution logs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Final Disposition & Sign-off */}
        <div className={`pt-6 border-t flex flex-wrap justify-between items-end gap-6 text-xs font-mono ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        } print:border-slate-300`}>
          <div className="space-y-1">
            <div className={textMuted}>Final Investigator Disposition:</div>
            <div className={`font-semibold text-sm ${textTitle} print:text-black`}>{finalDisposition}</div>
          </div>

          <div className="space-y-2 text-right">
            <div className={textMuted}>Authorized Investigator Signature Block</div>
            <div className={`h-8 border-b border-dashed w-48 ml-auto ${isDark ? 'border-slate-700' : 'border-slate-300'} print:border-black`} />
            <div className={textMuted}>Lead Forensic Analyst, Tier-3 SOC</div>
          </div>
        </div>
      </div>
    </div>
  );
};
