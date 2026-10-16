import React, { useState, useMemo } from 'react';
import { 
  GitFork, 
  Clock, 
  Download, 
  HelpCircle, 
  Bot
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { SeverityBadge } from '../components/common/Badge';
import { Alert } from '../types/alerts';

interface StorylineGroup {
  id: string;
  primaryDevice: string;
  alerts: Alert[];
  heuristicLinks: Array<{
    sourceAlertId: string;
    targetAlertId: string;
    linkType: 'SHARED_SRC' | 'PORT_CORRELATION' | 'TIME_PROXIMITY' | 'MULTI_STAGE';
    description: string;
    confidence: number;
  }>;
}

export const AttackStoryline: React.FC = () => {
  const { alerts, setSelectedAlert, createInvestigationFromAlert, setActiveTab, theme } = useSecurity();
  const isDark = theme === 'dark';
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [activeStoryAlert, setActiveStoryAlert] = useState<Alert | null>(null);

  // Group alerts into correlation chains
  const storylineGroups = useMemo<StorylineGroup[]>(() => {
    if (alerts.length === 0) return [];

    const hostMap = new Map<string, Alert[]>();
    for (const a of alerts) {
      if (!hostMap.has(a.source_ip)) {
        hostMap.set(a.source_ip, []);
      }
      hostMap.get(a.source_ip)!.push(a);
    }

    const groups: StorylineGroup[] = [];

    let groupCounter = 1;
    for (const [srcIp, hostAlerts] of hostMap.entries()) {
      const sorted = [...hostAlerts].sort((a, b) => a.timestampMs - b.timestampMs);
      const links: StorylineGroup['heuristicLinks'] = [];

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        const timeDiffSec = Math.abs(curr.timestampMs - prev.timestampMs) / 1000;
        let linkType: StorylineGroup['heuristicLinks'][0]['linkType'] = 'SHARED_SRC';
        let desc = `Common source IP address ${srcIp}`;
        let conf = 70;

        if (prev.detectorId === 'DET_PORT_ANOMALY' && (curr.detectorId === 'DET_OUTBOUND_SURGE' || curr.detectorId === 'DET_TRAFFIC_VOLUME')) {
          linkType = 'MULTI_STAGE';
          desc = 'Reconnaissance port scan followed by high-volume data movement';
          conf = 88;
        } else if (prev.detectorId === 'DET_CONN_COUNT' && curr.detectorId === 'DET_REPEATED_CONN') {
          linkType = 'MULTI_STAGE';
          desc = 'Horizontal fan-out followed by recurring command-and-control beaconing';
          conf = 85;
        } else if (timeDiffSec < 300) {
          linkType = 'TIME_PROXIMITY';
          desc = `Rapid sequence: ${timeDiffSec.toFixed(0)} seconds interval`;
          conf = 78;
        }

        links.push({
          sourceAlertId: prev.id,
          targetAlertId: curr.id,
          linkType,
          description: desc,
          confidence: conf
        });
      }

      groups.push({
        id: `CHAIN-${groupCounter++}`,
        primaryDevice: srcIp,
        alerts: sorted,
        heuristicLinks: links
      });
    }

    return groups.sort((a, b) => b.alerts.length - a.alerts.length);
  }, [alerts]);

  const activeGroup = storylineGroups[selectedGroupIndex] || storylineGroups[0];

  const handleExportStoryline = () => {
    if (!activeGroup) return;
    const content = {
      correlationGroupId: activeGroup.id,
      primaryDevice: activeGroup.primaryDevice,
      events: activeGroup.alerts,
      heuristicLinks: activeGroup.heuristicLinks,
      disclaimer: "SENTINEL X CORRELATION HEURISTICS — Not a guaranteed proof of attack; requires forensic host validation."
    };
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyline_${activeGroup.primaryDevice}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardClass = isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-colors ${cardClass}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold tracking-tight ${textTitle}`}>Attack Storyline & Event Correlation</h2>
            <p className={`text-xs ${textMuted}`}>
              Chronologically correlates disjointed anomalies into coherent incident timelines based on shared endpoints, timing, and signatures.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportStoryline}
            className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
            }`}
          >
            <Download className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Export Timeline JSON</span>
          </button>
        </div>
      </div>

      {storylineGroups.length === 0 ? (
        <div className={`p-12 text-center border rounded-2xl text-xs font-mono ${cardClass} ${textMuted}`}>
          No correlation timelines available. Load the synthetic demo dataset or upload a CSV capture.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Chain Selection List */}
          <div className="space-y-3">
            <div className={`text-xs font-mono uppercase font-bold px-1 ${textMuted}`}>
              Correlated Incident Tracks ({storylineGroups.length})
            </div>
            <div className="space-y-2">
              {storylineGroups.map((group, idx) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setSelectedGroupIndex(idx);
                    setActiveStoryAlert(null);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedGroupIndex === idx
                      ? (isDark 
                          ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900 border-cyan-500/80 shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                          : 'bg-cyan-50/80 border-cyan-400 shadow-xs')
                      : (isDark 
                          ? 'bg-[#111827] border-slate-800 hover:bg-slate-850' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs')
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className={`font-bold ${textTitle}`}>{group.primaryDevice}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                      isDark ? 'bg-slate-800 text-cyan-300 border-slate-700' : 'bg-white text-cyan-800 border-cyan-200'
                    }`}>
                      {group.alerts.length} event(s)
                    </span>
                  </div>
                  <div className={`text-[11px] truncate ${textMuted}`}>
                    {group.alerts.map(a => a.detectorName.split(' ')[0]).join(' → ')}
                  </div>
                </button>
              ))}
            </div>

            {/* Heuristic Notice */}
            <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
              isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className={`flex items-center space-x-1.5 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                <HelpCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Relationship Methodology</span>
              </div>
              <p className="leading-snug">
                Solid lines indicate <strong>Directly Observed Facts</strong> (same IP/ports). Dashed lines indicate <strong>Heuristic Hypotheses</strong> based on multi-stage Kill Chain timing.
              </p>
            </div>
          </div>

          {/* Right 3 Cols: Interactive Chronological Storyline */}
          <div className={`lg:col-span-3 p-6 rounded-2xl border shadow-sm space-y-6 ${cardClass}`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h3 className={`text-sm font-bold font-mono ${textTitle}`}>
                  Timeline Sequence: {activeGroup.primaryDevice}
                </h3>
                <p className={`text-xs ${textMuted}`}>
                  {activeGroup.alerts.length} sequenced anomaly events across temporal horizon
                </p>
              </div>

              {activeGroup.alerts.length > 1 && (
                <button
                  onClick={() => {
                    const topAlert = activeGroup.alerts[0];
                    createInvestigationFromAlert(topAlert);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    isDark 
                      ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40' 
                      : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                  }`}
                >
                  Promote Sequence to Incident Case
                </button>
              )}
            </div>

            {/* Timeline Events Vertical Stepper */}
            <div className={`relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 ${
              isDark ? 'before:bg-slate-800' : 'before:bg-slate-200'
            }`}>
              {activeGroup.alerts.map((alert, i) => {
                const isSelected = activeStoryAlert?.id === alert.id;
                const link = activeGroup.heuristicLinks[i - 1];

                return (
                  <div key={alert.id} className="relative group">
                    {/* Stepper Node Dot */}
                    <div 
                      className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        alert.severity === 'CRITICAL' 
                          ? 'border-rose-500 bg-rose-500 text-white' 
                          : alert.severity === 'HIGH' 
                          ? 'border-amber-500 bg-amber-500 text-white' 
                          : 'border-cyan-500 bg-cyan-500 text-white'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    {/* Preceding Heuristic Link Description if not first */}
                    {link && (
                      <div className={`mb-3 -mt-4 pl-2 py-1 border-l-2 border-dashed text-[11px] font-mono flex items-center space-x-1.5 ${
                        isDark ? 'border-cyan-500/40 text-cyan-400/90' : 'border-cyan-400 text-cyan-800'
                      }`}>
                        <span className={`text-[10px] px-1 rounded border font-bold ${
                          isDark ? 'bg-cyan-950 border-cyan-800 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-800'
                        }`}>
                          {link.linkType.replace('_', ' ')}
                        </span>
                        <span>{link.description} (Confidence: {link.confidence}%)</span>
                      </div>
                    )}

                    {/* Main Event Card */}
                    <div 
                      onClick={() => setActiveStoryAlert(alert)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? (isDark ? 'bg-slate-800/90 border-cyan-400 shadow-xl' : 'bg-cyan-50/50 border-cyan-500 shadow-md')
                          : (isDark ? 'bg-slate-900/70 border-slate-800 hover:bg-slate-850/80 hover:border-slate-700' : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300')
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{alert.id}</span>
                          <SeverityBadge severity={alert.severity} />
                          <span className={`text-xs font-mono ${textMuted}`}>
                            Score: <strong className={textTitle}>{alert.anomalyScore}</strong>
                          </span>
                        </div>
                        <span className={`text-xs font-mono flex items-center space-x-1 ${textMuted}`}>
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </span>
                      </div>

                      <h4 className={`text-sm font-bold mb-1.5 ${textTitle}`}>{alert.title}</h4>
                      <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{alert.description}</p>

                      <div className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs font-mono ${
                        isDark ? 'border-slate-800/80' : 'border-slate-200'
                      }`}>
                        <span className={textMuted}>
                          Detector: <strong className="text-cyan-600 dark:text-cyan-300">{alert.detectorName}</strong>
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlert(alert);
                            }}
                            className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            Inspect Evidence
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlert(alert);
                              setActiveTab('ai-analyst');
                            }}
                            className={`px-2 py-1 rounded text-[11px] border flex items-center space-x-1 transition-colors ${
                              isDark 
                                ? 'bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border-cyan-800' 
                                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-200'
                            }`}
                          >
                            <Bot className="w-3 h-3" />
                            <span>AI Breakdown</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
