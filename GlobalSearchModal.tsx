import React, { useState, useEffect } from 'react';
import { Search, X, AlertTriangle, Shield, HardDrive, ArrowRight } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { SeverityBadge } from '../common/Badge';

export const GlobalSearchModal: React.FC = () => {
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    alerts, 
    investigations, 
    flows, 
    setSelectedAlert, 
    setSelectedInvestigation,
    setActiveTab,
    theme
  } = useSecurity();

  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');

  // Close on ESC, or open on Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchingAlerts = trimmed
    ? alerts.filter(a => 
        a.id.toLowerCase().includes(trimmed) ||
        a.source_ip.toLowerCase().includes(trimmed) ||
        (a.destination_ip && a.destination_ip.toLowerCase().includes(trimmed)) ||
        a.title.toLowerCase().includes(trimmed) ||
        a.detectorName.toLowerCase().includes(trimmed)
      ).slice(0, 5)
    : [];

  const matchingInvestigations = trimmed
    ? investigations.filter(inv =>
        inv.id.toLowerCase().includes(trimmed) ||
        inv.title.toLowerCase().includes(trimmed) ||
        inv.affectedDevices.some(d => d.toLowerCase().includes(trimmed))
      ).slice(0, 4)
    : [];

  const matchingEndpoints = trimmed
    ? Array.from(new Set(flows.flatMap(f => [f.source_ip, f.destination_ip])))
        .filter(ip => ip.toLowerCase().includes(trimmed))
        .slice(0, 4)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border ${
          isDark ? 'bg-[#111827] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className={`flex items-center px-4 py-3.5 border-b ${
          isDark ? 'border-slate-800 bg-[#0D111B]' : 'border-slate-200 bg-slate-50'
        }`}>
          <Search className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search alerts, endpoints (e.g. 192.168.1.105), ports, investigations..."
            className={`w-full bg-transparent border-none text-sm focus:outline-none ${
              isDark ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
            }`}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => setIsSearchOpen(false)}
            className={`ml-3 px-2 py-0.5 text-xs rounded border ${
              isDark ? 'text-slate-400 bg-slate-800 border-slate-700 hover:text-white' : 'text-slate-500 bg-white border-slate-200 hover:text-slate-900'
            }`}
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!trimmed && (
            <div className="text-center py-8 text-xs text-slate-400">
              Type an IP address, Alert ID, port, or keyword to instantly query platform telemetry.
            </div>
          )}

          {/* Alerts section */}
          {matchingAlerts.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold px-2 mb-1.5 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Matching Alerts ({matchingAlerts.length})</span>
              </div>
              <div className="space-y-1">
                {matchingAlerts.map(alert => (
                  <button
                    key={alert.id}
                    onClick={() => {
                      setSelectedAlert(alert);
                      setActiveTab('alerts');
                      setIsSearchOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between group transition-colors ${
                      isDark 
                        ? 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{alert.id}</span>
                        <SeverityBadge severity={alert.severity} />
                        <span className={`text-xs truncate max-w-sm ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>{alert.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Src: {alert.source_ip} {alert.destination_ip && `→ Dst: ${alert.destination_ip}`}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Investigations section */}
          {matchingInvestigations.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold px-2 mb-1.5 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-500" />
                <span>Investigations ({matchingInvestigations.length})</span>
              </div>
              <div className="space-y-1">
                {matchingInvestigations.map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvestigation(inv);
                      setActiveTab('investigations');
                      setIsSearchOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between group transition-colors ${
                      isDark 
                        ? 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{inv.id}: </span>
                      <span className={`text-xs ${isDark ? 'text-slate-200' : 'text-slate-800 font-medium'}`}>{inv.title}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Endpoints section */}
          {matchingEndpoints.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold px-2 mb-1.5 flex items-center space-x-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                <span>Observed Devices / Endpoints ({matchingEndpoints.length})</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {matchingEndpoints.map(ip => (
                  <button
                    key={ip}
                    onClick={() => {
                      setActiveTab('network-map');
                      setIsSearchOpen(false);
                    }}
                    className={`text-left p-2 rounded-lg border text-xs font-mono transition-colors ${
                      isDark 
                        ? 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-200 hover:text-cyan-300' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 hover:text-cyan-700'
                    }`}
                  >
                    {ip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {trimmed && matchingAlerts.length === 0 && matchingInvestigations.length === 0 && matchingEndpoints.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">
              No matching records found for "{trimmed}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
