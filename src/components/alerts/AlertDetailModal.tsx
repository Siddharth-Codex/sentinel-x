import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Bot, 
  FolderPlus, 
  CheckCircle, 
  AlertOctagon, 
  FileText, 
  Copy, 
  ExternalLink,
  Info,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Alert, AlertStatus } from '../../types/alerts';
import { useSecurity } from '../../context/SecurityContext';
import { SeverityBadge, StatusBadge, ProtocolBadge } from '../common/Badge';

interface AlertDetailModalProps {
  alert: Alert | null;
  onClose: () => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({ alert, onClose }) => {
  const { 
    updateAlertStatus, 
    createInvestigationFromAlert, 
    setActiveTab, 
    setSelectedAlert,
    flows,
    theme
  } = useSecurity();

  const isDark = theme === 'dark';
  const [activeTab, setModalTab] = useState<'evidence' | 'records' | 'recommendations'>('evidence');
  const [copied, setCopied] = useState(false);

  if (!alert) return null;

  // Retrieve matching raw flow records
  const supportingFlows = flows.filter(f => alert.supportingRecordIds.includes(f.id));

  const handleCopyAlert = () => {
    navigator.clipboard.writeText(JSON.stringify(alert, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenAiAnalyst = () => {
    setSelectedAlert(alert);
    setActiveTab('ai-analyst');
    onClose();
  };

  const handleCreateInvestigation = () => {
    createInvestigationFromAlert(alert);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border ${
          isDark ? 'bg-[#111827] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-start justify-between ${
          isDark ? 'bg-[#0D111B] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                isDark ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60' : 'text-cyan-800 bg-cyan-50 border-cyan-200'
              }`}>
                {alert.id}
              </span>
              <SeverityBadge severity={alert.severity} />
              <StatusBadge status={alert.status} />
              <span className="text-xs font-mono text-slate-500">
                Score: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{alert.anomalyScore}</strong>/100
              </span>
              <span className="text-xs font-mono text-slate-500">
                Confidence: <strong className="text-emerald-600 dark:text-emerald-400">{alert.confidence}%</strong>
              </span>
            </div>
            <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{alert.title}</h2>
            <div className="flex items-center space-x-4 text-xs font-mono text-slate-500 pt-1">
              <span>Detector: <strong className="text-cyan-600 dark:text-cyan-300">{alert.detectorName}</strong></span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{new Date(alert.timestamp).toLocaleString()}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyAlert}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="Copy Alert JSON"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className={`px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateInvestigation}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-colors border ${
                isDark ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
              }`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Open Investigation Case</span>
            </button>

            <button
              onClick={handleOpenAiAnalyst}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-colors border ${
                isDark ? 'bg-blue-600/20 hover:bg-blue-600/30 text-sky-300 border-blue-500/40' : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-cyan-500" />
              <span>Consult AI Analyst</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 text-[11px] font-mono mr-1">Status:</span>
            <button
              onClick={() => updateAlertStatus(alert.id, 'INVESTIGATING')}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors border ${
                alert.status === 'INVESTIGATING' 
                  ? (isDark ? 'bg-cyan-500/30 text-cyan-200 border-cyan-500' : 'bg-cyan-100 text-cyan-800 border-cyan-400 font-bold') 
                  : (isDark ? 'bg-slate-800 text-slate-400 border-transparent hover:text-white' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200')
              }`}
            >
              Investigating
            </button>
            <button
              onClick={() => updateAlertStatus(alert.id, 'RESOLVED')}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors border ${
                alert.status === 'RESOLVED' 
                  ? (isDark ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500' : 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold') 
                  : (isDark ? 'bg-slate-800 text-slate-400 border-transparent hover:text-white' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200')
              }`}
            >
              Resolved
            </button>
            <button
              onClick={() => updateAlertStatus(alert.id, 'FALSE_POSITIVE')}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors border ${
                alert.status === 'FALSE_POSITIVE' 
                  ? (isDark ? 'bg-slate-700 text-slate-200 border-slate-600' : 'bg-slate-200 text-slate-800 border-slate-400 font-bold') 
                  : (isDark ? 'bg-slate-800 text-slate-400 border-transparent hover:text-white' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200')
              }`}
            >
              False Positive
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className={`px-6 flex border-b ${isDark ? 'border-slate-800 bg-[#0E1424]' : 'border-slate-200 bg-slate-50'}`}>
          <button
            onClick={() => setModalTab('evidence')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'evidence' 
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Evidence & Metrics ({alert.evidence.length})
          </button>
          <button
            onClick={() => setModalTab('records')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'records' 
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Supporting Flow Records ({supportingFlows.length})
          </button>
          <button
            onClick={() => setModalTab('recommendations')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'recommendations' 
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            SOC Recommendations ({alert.recommendedSteps.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {/* Evidence cards */}
              <div>
                <h4 className="text-xs font-mono uppercase text-slate-500 font-bold mb-3 flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Structured Evidence Points</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {alert.evidence.map((ev, idx) => (
                    <div key={idx} className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">{ev.metricName}</span>
                        {ev.zScore !== undefined && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            isDark ? 'bg-blue-500/10 text-sky-400 border-blue-500/20' : 'bg-sky-50 text-sky-700 border-sky-200 font-bold'
                          }`}>
                            Z: {ev.zScore}
                          </span>
                        )}
                      </div>
                      <div className={`text-base font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {String(ev.observedValue)} {ev.unit || ''}
                      </div>
                      {ev.baselineValue !== undefined && (
                        <div className={`text-[11px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t ${
                          isDark ? 'border-slate-800' : 'border-slate-200'
                        }`}>
                          <span>Baseline: {String(ev.baselineValue)}</span>
                          {ev.threshold !== undefined && <span>Threshold: {String(ev.threshold)}</span>}
                        </div>
                      )}
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">{ev.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Explanation */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-xs font-mono uppercase text-cyan-700 dark:text-cyan-300 font-bold flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Anomaly Technical Mechanics</span>
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{alert.explanation}</p>
              </div>

              {/* Known Limitations */}
              <div className={`p-4 rounded-xl border space-y-1.5 ${
                isDark ? 'bg-slate-900/30 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-xs font-mono uppercase text-slate-500 font-bold">
                  Detector Known Limitations & Benign Edge Cases
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">{alert.knownLimitations}</p>
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Displaying {supportingFlows.length} underlying network flow records captured in this finding.</span>
              </div>
              <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <table className="w-full text-left text-xs font-mono">
                  <thead className={`border-b ${isDark ? 'bg-[#0D111B] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    <tr>
                      <th className="py-2.5 px-3">Flow ID</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Source IP</th>
                      <th className="py-2.5 px-3">Destination IP:Port</th>
                      <th className="py-2.5 px-3">Protocol</th>
                      <th className="py-2.5 px-3 text-right">Bytes Sent</th>
                      <th className="py-2.5 px-3 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/60 bg-slate-900/40' : 'divide-slate-200 bg-white'}`}>
                    {supportingFlows.map(f => (
                      <tr key={f.id} className={isDark ? 'hover:bg-slate-800/50 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                        <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 font-bold">{f.id}</td>
                        <td className="py-2 px-3 text-slate-500">{new Date(f.timestamp).toLocaleTimeString()}</td>
                        <td className={`py-2 px-3 ${isDark ? 'text-slate-200' : 'text-slate-800 font-medium'}`}>{f.source_ip}</td>
                        <td className={`py-2 px-3 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{f.destination_ip}:{f.destination_port}</td>
                        <td className="py-2 px-3"><ProtocolBadge protocol={f.protocol} /></td>
                        <td className={`py-2 px-3 text-right ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{f.bytes_sent.toLocaleString()} B</td>
                        <td className="py-2 px-3 text-right text-slate-500">{f.duration_seconds}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase text-slate-500 font-bold">
                Prescribed Tier-2 / Tier-3 Triage Playbook
              </h4>
              <div className="space-y-2.5">
                {alert.recommendedSteps.map((step, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border flex items-start space-x-3 ${
                    isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      {idx + 1}
                    </span>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
