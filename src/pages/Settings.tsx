import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Trash2, 
  Bot, 
  CheckCircle2
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { AllDetectorsConfig } from '../types/alerts';

export const Settings: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetToDefaults, 
    clearAllData,
    theme
  } = useSecurity();

  const isDark = theme === 'dark';

  const [localSettings, setLocalSettings] = useState<AllDetectorsConfig>(settings);
  const [healthStatus, setHealthStatus] = useState<{
    geminiConfigured: boolean;
    status: string;
  } | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Check server health and Gemini configuration status
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setHealthStatus(data))
      .catch(() => setHealthStatus({ geminiConfigured: false, status: 'offline' }));
  }, []);

  const handleToggleDetector = (detectorKey: keyof AllDetectorsConfig) => {
    if (detectorKey === 'scoringWeights') return;
    const current = localSettings[detectorKey];
    const updated = {
      ...localSettings,
      [detectorKey]: {
        ...current,
        enabled: !current.enabled
      }
    };
    setLocalSettings(updated);
    updateSettings(updated);
  };

  const handleUpdateThreshold = (
    detectorKey: keyof AllDetectorsConfig,
    field: string,
    value: number
  ) => {
    if (detectorKey === 'scoringWeights') return;
    const current = localSettings[detectorKey];
    const updated = {
      ...localSettings,
      [detectorKey]: {
        ...current,
        [field]: value
      }
    };
    setLocalSettings(updated);
    updateSettings(updated);
  };

  const cardClass = isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-colors ${cardClass}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold tracking-tight ${textTitle}`}>Platform Settings & Behavioral Rules</h2>
            <p className={`text-xs ${textMuted}`}>
              Configure detection thresholds, toggle modular analysis engines, and manage local storage states.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset all detector sensitivity thresholds and scoring rules to factory defaults?')) {
              resetToDefaults();
            }
          }}
          className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
            isDark 
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* AI Integration & Server Status */}
      <div className={`p-6 rounded-2xl border shadow-sm space-y-4 transition-colors ${cardClass}`}>
        <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className={`text-sm font-bold ${textTitle}`}>AI Security Analyst Integration Architecture</h3>
          </div>
          {healthStatus?.geminiConfigured ? (
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 text-xs font-mono font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>GEMINI LIVE API READY</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/40 text-xs font-mono font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>DETERMINISTIC FALLBACK ACTIVE</span>
            </span>
          )}
        </div>

        <div className={`text-xs leading-relaxed space-y-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <p>
            SENTINEL X implements a zero-leak server-side AI architecture. In accordance with strict security standards, API keys are never exposed in frontend code, client bundles, or browser localStorage.
          </p>
          <div className={`p-3 rounded-xl border font-mono text-[11px] space-y-1 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className={`font-bold ${textTitle}`}>Server Environment Variable:</div>
            <code className="text-cyan-600 dark:text-cyan-300 font-semibold">GEMINI_API_KEY=your_gemini_api_key_here</code>
            <div className={`pt-1 text-[11px] ${textMuted}`}>
              Configured in <span className={textTitle}>.env</span> on the server host. When absent or in offline demo mode, SENTINEL X seamlessly executes deterministic SOC threat playbooks without crashing.
            </div>
          </div>
        </div>
      </div>

      {/* Detector Engine Rules Configuration */}
      <div className={`p-6 rounded-2xl border shadow-sm space-y-6 transition-colors ${cardClass}`}>
        <div>
          <h3 className={`text-sm font-bold mb-1 ${textTitle}`}>Modular Anomaly Detectors & Thresholds</h3>
          <p className={`text-xs ${textMuted}`}>
            Adjusting thresholds triggers instant pipeline re-computation across loaded network flows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Detector A */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-xs font-bold block ${textTitle}`}>Unusual Connection Count (DET_CONN_COUNT)</span>
                <span className={`text-[11px] ${textMuted}`}>Flags hosts with anomalous destination fan-out.</span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.DET_CONN_COUNT.enabled}
                onChange={() => handleToggleDetector('DET_CONN_COUNT')}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>
            {localSettings.DET_CONN_COUNT.enabled && (
              <div className="space-y-1 text-xs font-mono">
                <div className={`flex justify-between ${textMuted}`}>
                  <span>Peer Mean Multiplier:</span>
                  <span className="text-cyan-600 dark:text-cyan-300 font-bold">{localSettings.DET_CONN_COUNT.connectionCountMultiplier}x</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="4.0"
                  step="0.1"
                  value={localSettings.DET_CONN_COUNT.connectionCountMultiplier}
                  onChange={e => handleUpdateThreshold('DET_CONN_COUNT', 'connectionCountMultiplier', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            )}
          </div>

          {/* Detector B */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-xs font-bold block ${textTitle}`}>Port Scanning & Anomaly (DET_PORT_ANOMALY)</span>
                <span className={`text-[11px] ${textMuted}`}>Detects vertical port sweeps and trojan ports.</span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.DET_PORT_ANOMALY.enabled}
                onChange={() => handleToggleDetector('DET_PORT_ANOMALY')}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>
            {localSettings.DET_PORT_ANOMALY.enabled && (
              <div className="space-y-1 text-xs font-mono">
                <div className={`flex justify-between ${textMuted}`}>
                  <span>Min Probed Ports Threshold:</span>
                  <span className="text-cyan-600 dark:text-cyan-300 font-bold">{localSettings.DET_PORT_ANOMALY.portScanMinUniquePorts} ports</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="20"
                  step="1"
                  value={localSettings.DET_PORT_ANOMALY.portScanMinUniquePorts}
                  onChange={e => handleUpdateThreshold('DET_PORT_ANOMALY', 'portScanMinUniquePorts', parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500"
                />
              </div>
            )}
          </div>

          {/* Detector C */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-xs font-bold block ${textTitle}`}>Traffic Volume Anomaly (DET_TRAFFIC_VOLUME)</span>
                <span className={`text-[11px] ${textMuted}`}>Statistical outlier detection on bytes sent.</span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.DET_TRAFFIC_VOLUME.enabled}
                onChange={() => handleToggleDetector('DET_TRAFFIC_VOLUME')}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>
            {localSettings.DET_TRAFFIC_VOLUME.enabled && (
              <div className="space-y-1 text-xs font-mono">
                <div className={`flex justify-between ${textMuted}`}>
                  <span>Z-Score Threshold:</span>
                  <span className="text-cyan-600 dark:text-cyan-300 font-bold">{localSettings.DET_TRAFFIC_VOLUME.volumeZScoreThreshold} σ</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="5.0"
                  step="0.2"
                  value={localSettings.DET_TRAFFIC_VOLUME.volumeZScoreThreshold}
                  onChange={e => handleUpdateThreshold('DET_TRAFFIC_VOLUME', 'volumeZScoreThreshold', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            )}
          </div>

          {/* Detector D */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-xs font-bold block ${textTitle}`}>Repeated Beaconing Patterns (DET_REPEATED_CONN)</span>
                <span className={`text-[11px] ${textMuted}`}>Flags low-jitter periodic C2 callbacks.</span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.DET_REPEATED_CONN.enabled}
                onChange={() => handleToggleDetector('DET_REPEATED_CONN')}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>
            {localSettings.DET_REPEATED_CONN.enabled && (
              <div className="space-y-1 text-xs font-mono">
                <div className={`flex justify-between ${textMuted}`}>
                  <span>Max Timing Jitter Tolerance:</span>
                  <span className="text-cyan-600 dark:text-cyan-300 font-bold">±{localSettings.DET_REPEATED_CONN.repeatedConnIntervalJitterMax} ms</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="250"
                  value={localSettings.DET_REPEATED_CONN.repeatedConnIntervalJitterMax}
                  onChange={e => handleUpdateThreshold('DET_REPEATED_CONN', 'repeatedConnIntervalJitterMax', parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Storage and Data Controls */}
      <div className={`p-6 rounded-2xl border shadow-sm space-y-4 transition-colors ${cardClass}`}>
        <h3 className={`text-sm font-bold ${textTitle}`}>Browser Storage & Cache Controls</h3>
        <p className={`text-xs leading-relaxed ${textMuted}`}>
          SENTINEL X stores case investigations, notes, and local custom thresholds inside your browser's private localStorage. Telemetry is never uploaded to third-party tracking services.
        </p>
        <div className="pt-2 flex items-center space-x-3">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to completely clear all local investigations and reset the demo data?')) {
                clearAllData();
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800/40 text-xs font-bold flex items-center space-x-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge Local Storage & Cached Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
