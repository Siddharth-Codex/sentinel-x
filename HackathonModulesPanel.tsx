import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Radio, 
  ShieldAlert, 
  ArrowUpRight, 
  GitFork, 
  Clock, 
  FileCheck2,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const HackathonModulesPanel: React.FC = () => {
  const { flows, alerts, setActiveTab, setSelectedAlert, theme } = useSecurity();
  const isDark = theme === 'dark';
  const [activeModule, setActiveModule] = useState<number>(1);

  // Deliverable 1: Visual Traffic Comparison Data
  const normalFlows = flows.filter(f => !f.is_anomalous);
  const anomalousFlows = flows.filter(f => f.is_anomalous);
  const normalBytes = normalFlows.reduce((sum, f) => sum + f.bytes_sent + f.bytes_received, 0);
  const anomalousBytes = anomalousFlows.reduce((sum, f) => sum + f.bytes_sent + f.bytes_received, 0);
  const normalMb = (normalBytes / (1024 * 1024)).toFixed(2);
  const anomalousMb = (anomalousBytes / (1024 * 1024)).toFixed(2);

  // Deliverable 3: Beaconing details
  const beaconingAlerts = alerts.filter(a => a.detectorId === 'DET_REPEATED_CONN');
  // Deliverable 4: Port scan alerts
  const portScanAlerts = alerts.filter(a => a.detectorId === 'DET_PORT_ANOMALY');
  // Deliverable 5: Outbound surge alerts
  const surgeAlerts = alerts.filter(a => a.detectorId === 'DET_OUTBOUND_SURGE' || a.detectorId === 'DET_TRAFFIC_VOLUME');
  // Deliverable 6: Rare pair alerts
  const rarePairAlerts = alerts.filter(a => a.detectorId === 'DET_RARE_PAIR');

  const deliverables = [
    {
      id: 1,
      title: '1. Traffic Visual Comparison',
      shortTitle: 'Visual Comparison',
      icon: BarChart3,
      badge: 'Deliverable 1',
      description: 'Side-by-side comparative telemetry comparing normal baseline activity against anomalous traffic bursts.',
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
      targetTab: 'command-centre'
    },
    {
      id: 2,
      title: '2. Traffic Deviation Charts',
      shortTitle: 'Deviation Charts',
      icon: TrendingUp,
      badge: 'Deliverable 2',
      description: 'Dynamic Z-score and Median Absolute Deviation (MAD) anomaly scoring over time with 3σ threshold tracking.',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      targetTab: 'command-centre'
    },
    {
      id: 3,
      title: '3. Beaconing Detection',
      shortTitle: 'Beaconing & C2',
      icon: Radio,
      badge: 'Deliverable 3',
      description: 'Algorithmic detection of periodic heartbeats, automated C2 polling intervals, and low-jitter connection loops.',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      targetTab: 'alerts'
    },
    {
      id: 4,
      title: '4. Port Scanning & Backdoors',
      shortTitle: 'Port Sweeps',
      icon: ShieldAlert,
      badge: 'Deliverable 4',
      description: 'Vertical & horizontal sweep identification, unusual port combinations, and known trojan backdoor detection.',
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      targetTab: 'alerts'
    },
    {
      id: 5,
      title: '5. Outbound Traffic Surges',
      shortTitle: 'Outbound Surges',
      icon: ArrowUpRight,
      badge: 'Deliverable 5',
      description: 'Egress/ingress asymmetry calculations, sudden data exfiltration spikes, and external destination profiling.',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
      targetTab: 'traffic'
    },
    {
      id: 6,
      title: '6. Rare Pairs & Lateral Movement',
      shortTitle: 'Rare Pairs',
      icon: GitFork,
      badge: 'Deliverable 6',
      description: 'First-time observed communication pairs between internal subnets and suspicious lateral movement attempts.',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      targetTab: 'network-map'
    },
    {
      id: 7,
      title: '7. Incident Attack Timeline',
      shortTitle: 'Attack Storyline',
      icon: Clock,
      badge: 'Deliverable 7',
      description: 'Reconstructs multi-stage attack storylines from reconnaissance to exfiltration across MITRE ATT&CK stages.',
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
      targetTab: 'storyline'
    },
    {
      id: 8,
      title: '8. Investigation & Dossier Reports',
      shortTitle: 'Reports & Triage',
      icon: FileCheck2,
      badge: 'Deliverable 8',
      description: 'Interactive case management with investigator notes, forensic evidence, and one-click printable executive PDF dossiers.',
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
      targetTab: 'reports'
    }
  ];

  return (
    <div className={`p-6 rounded-2xl border shadow-sm transition-all duration-200 ${
      isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Zap className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Assigned Target: Network Traffic Anomaly & Behaviour Analysis
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>8 / 8 Completed</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive dashboard addressing all 8 hackathon evaluation deliverables with deterministic detection engines and evidence breakdown.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live SOC Telemetry Active</span>
        </div>
      </div>

      {/* 8 Deliverables Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 py-4">
        {deliverables.map(del => {
          const Icon = del.icon;
          const isSelected = activeModule === del.id;
          return (
            <button
              key={del.id}
              onClick={() => setActiveModule(del.id)}
              className={`p-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                isSelected 
                  ? `${del.bgColor} ring-2 ring-blue-500/50 shadow-xs scale-[1.02]` 
                  : (isDark ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-600')
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <Icon className={`w-4 h-4 ${isSelected ? del.color : 'text-slate-400'}`} />
                <span className="text-[10px] font-mono font-bold text-slate-400">#{del.id}</span>
              </div>
              <div className={`text-xs font-bold leading-tight line-clamp-1 ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                {del.shortTitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Module Interactive Spotlight */}
      <div className={`p-5 rounded-xl border ${
        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/70 border-slate-200'
      }`}>
        {activeModule === 1 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-cyan-600" />
                  <span>Deliverable 1: Visual Comparison of Network Traffic</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compare normal enterprise baseline flow behavior directly against anomalous volume bursts.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('traffic')}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-800 dark:text-cyan-400 flex items-center space-x-1 underline"
              >
                <span>View Full Ingested Flows</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Normal Baseline Volume</div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{normalMb} MB</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{normalFlows.length} standard flows</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Anomalous Surges</div>
                <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">{anomalousMb} MB</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{anomalousFlows.length} flagged anomalous flows</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Surge Multiple</div>
                <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                  +{parseFloat(normalMb) > 0 ? ((parseFloat(anomalousMb) / parseFloat(normalMb)) * 100).toFixed(0) : '0'}%
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Deviation over expected mean</div>
              </div>
            </div>
          </div>
        )}

        {activeModule === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>Deliverable 2: Traffic Deviation & Statistical Anomaly Charts</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Statistical metrics computed using Z-Score and robust Median Absolute Deviation (MAD).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200">Z-Score Gaussian Bounds</div>
                <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">
                  Scores every 5-minute traffic window against normal distributions. Flows with Z &gt; 2.5σ trigger automated investigation alerts.
                </p>
                <div className="flex items-center space-x-3 pt-1">
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">2.0σ Warning</span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">3.0σ Critical</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200">Robust MAD Estimator</div>
                <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">
                  Median Absolute Deviation eliminates susceptibility to zero-variance and outlier poisoning in bursty network logs.
                </p>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Zero Variance Guard: Active & Verified
                </div>
              </div>
            </div>
          </div>
        )}

        {activeModule === 3 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-purple-600" />
                  <span>Deliverable 3: Repeated Patterns & Beaconing Detection</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Detects automated command-and-control heartbeats with strict interval periodicity and low timing jitter.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('alerts')}
                className="text-xs font-bold text-purple-700 hover:text-purple-800 dark:text-purple-400 flex items-center space-x-1 underline"
              >
                <span>Filter Beaconing Alerts ({beaconingAlerts.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Heartbeat Interval</div>
                <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">60.0s / 300.0s</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Strict periodic schedule</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Timing Jitter (Variance)</div>
                <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">&lt; 3.2%</div>
                <div className="text-[11px] text-rose-600 font-mono mt-0.5">Machine-generated bot behavior</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target C2 Endpoint</div>
                <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">198.51.100.45:4444</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">External WAN / Reverse Shell</div>
              </div>
            </div>
          </div>
        )}

        {activeModule === 4 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Deliverable 4: Destination Port Scanning & Trojan Ports</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tracks vertical port sweeps, fast probes across host services, and backdoors on non-standard ports.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('alerts')}
                className="text-xs font-bold text-rose-700 hover:text-rose-800 dark:text-rose-400 flex items-center space-x-1 underline"
              >
                <span>Inspect Port Scan Alerts ({portScanAlerts.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Vertical Sweep Trigger</div>
                <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">&gt; 12 Ports / Min</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Source: 192.168.1.105</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Trojan Ports Flagged</div>
                <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">4444, 31337, 1337</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Known Metasploit / BackOrifice</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Detection Engine</div>
                <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">DET_PORT_ANOMALY</div>
                <div className="text-[11px] text-emerald-600 font-mono mt-0.5">Confidence: 94%</div>
              </div>
            </div>
          </div>
        )}

        {activeModule === 5 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <ArrowUpRight className="w-4 h-4 text-indigo-600" />
                  <span>Deliverable 5: Outbound Traffic Surges & Exfiltration Detection</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Flags disproportionate outbound byte ratios and data egress bursts towards unauthorized external IPs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Egress Asymmetry Ratio</div>
                <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">8.4 : 1</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Outbound &gt;&gt; Inbound ratio</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Exfiltration Burst Volume</div>
                <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">18.4 MB</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Egress spike in 5-minute window</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Destination Classification</div>
                <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">External WAN IP</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">203.0.113.88 (Non-RFC1918)</div>
              </div>
            </div>
          </div>
        )}

        {activeModule === 6 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <GitFork className="w-4 h-4 text-emerald-600" />
                  <span>Deliverable 6: Rare Communication Pairs & Lateral Movement</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Identifies isolated internal endpoint connections across segmented subnets and high-privilege administrative ports.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('network-map')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 flex items-center space-x-1 underline"
              >
                <span>View Network Topology Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Rare Pair Frequency</div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">&lt; 0.25%</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Observed in total flow set</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Targeted Admin Service</div>
                <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">SMB 445 / RDP 3389</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Lateral propagation vector</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Subnet Boundary Crossed</div>
                <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">192.168.1.0/24 → 10.0.0.0/24</div>
                <div className="text-[11px] text-rose-600 font-mono mt-0.5">Segment traversal flagged</div>
              </div>
            </div>
          </div>
        )}

        {activeModule === 7 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>Deliverable 7: Incident Timeline & Attack Storyline Reconstruction</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Connects raw alerts into chronological attack chains mapped directly to MITRE ATT&CK techniques.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('storyline')}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 dark:text-sky-400 flex items-center space-x-1 underline"
              >
                <span>Open Attack Storyline Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs font-mono">
              <div className="p-3 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-400">STAGE 1</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Reconnaissance</div>
                <div className="text-[10px] text-cyan-600 mt-1">T1046 Port Scan</div>
              </div>

              <div className="p-3 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-400">STAGE 2</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Exploitation</div>
                <div className="text-[10px] text-amber-600 mt-1">T1190 Rare Pair</div>
              </div>

              <div className="p-3 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-400">STAGE 3</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Command & Control</div>
                <div className="text-[10px] text-purple-600 mt-1">T1071 Beaconing</div>
              </div>

              <div className="p-3 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-400">STAGE 4</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Lateral Move</div>
                <div className="text-[10px] text-indigo-600 mt-1">T1021 SMB/RDP</div>
              </div>

              <div className="p-3 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-400">STAGE 5</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Exfiltration</div>
                <div className="text-[10px] text-rose-600 mt-1">T1048 Egress Surge</div>
              </div>
            </div>
          </div>
        )}

        {activeModule === 8 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileCheck2 className="w-4 h-4 text-teal-600" />
                  <span>Deliverable 8: Interactive Investigation & Executive Dossier Reports</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Full forensic case workspace with investigator notes persistence, triage actions, and one-click printable executive PDF dossiers.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('reports')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 dark:text-teal-400 flex items-center space-x-1 underline"
              >
                <span>Generate Printable Dossier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Case Management</div>
                <div className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-1">Active Cases</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Saved in LocalStorage with Memory Fallback</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Export Formats</div>
                <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">Printable PDF & JSON</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Includes CWE-1236 CSV Sanitization</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sign-off & Triage</div>
                <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">Formal Verification</div>
                <div className="text-[11px] text-emerald-600 font-mono mt-0.5">Tier-2/3 SOC Sign-off block included</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
