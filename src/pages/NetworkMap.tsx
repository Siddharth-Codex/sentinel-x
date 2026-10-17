import React from 'react';
import { Share2, Info, ShieldAlert, Laptop } from 'lucide-react';
import { NetworkGraph } from '../components/network/NetworkGraph';
import { useSecurity } from '../context/SecurityContext';

export const NetworkMap: React.FC = () => {
  const { dataset, alerts, flows, theme } = useSecurity();
  const isDark = theme === 'dark';

  const flaggedEndpoints = new Set(alerts.map(a => a.source_ip)).size;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-colors ${
        isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Interactive Network Topology Map</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Visualizes observed communication pathways, subnet clusters, and threat concentrations in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <Laptop className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-slate-500">Endpoints:</span>
            <strong className={isDark ? 'text-white' : 'text-slate-900'}>{dataset?.uniqueDevices || 0}</strong>
          </div>
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-rose-50 border-rose-200'
          }`}>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-slate-500">Flagged Hosts:</span>
            <strong className="text-rose-600 dark:text-rose-300">{flaggedEndpoints}</strong>
          </div>
        </div>
      </div>

      {/* Main Interactive Graph Canvas */}
      <NetworkGraph />

      {/* Instructions & Help */}
      <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs transition-colors ${
        isDark ? 'bg-slate-900/40 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Graph Interaction Tips:</span>
          <p className="leading-relaxed">
            • <strong>Pan & Zoom</strong>: Drag canvas to pan across subnet segments, scroll mouse wheel to zoom in or out.
            <br />
            • <strong>Inspect Devices</strong>: Click any node to reveal its unique destinations, port distribution, and attached threat alerts.
            <br />
            • <strong>Inspect Links</strong>: Click any directed communication edge to view transferred byte volume and protocols.
          </p>
        </div>
      </div>
    </div>
  );
};
