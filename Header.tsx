import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Bell, 
  RotateCcw, 
  PlayCircle, 
  Database,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    dataset, 
    alerts, 
    loadDemoDataset, 
    resetToDefaults, 
    notifications, 
    unreadNotificationCount,
    markNotificationRead,
    clearNotifications,
    setIsSearchOpen,
    setActiveTab,
    setSelectedAlert,
    theme,
    toggleTheme
  } = useSecurity();

  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'command-centre': return 'Command Centre';
      case 'traffic': return 'Traffic Analysis & Ingestion';
      case 'network-map': return 'Interactive Network Map';
      case 'alerts': return 'Alert Intelligence Centre';
      case 'storyline': return 'Attack Storyline & Correlation';
      case 'investigations': return 'Investigation Workspace';
      case 'ai-analyst': return 'AI Security Analyst Workstation';
      case 'reports': return 'Incident Reports & Export';
      case 'settings': return 'Platform Settings & Rules';
      default: return 'Threat Intelligence';
    }
  };

  const isDark = theme === 'dark';

  return (
    <header className={`h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md transition-colors duration-200 ${
      isDark ? 'bg-[#0D111B]/95 border-b border-slate-800/80 text-white' : 'bg-white/95 border-b border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Left: Brand & Page Context */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 via-sky-600/30 to-blue-700/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.25)]">
            <ShieldAlert className="w-5 h-5 text-cyan-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className={`font-extrabold text-base tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>SENTINEL</span>
              <span className="font-black text-base text-cyan-500">X</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                isDark ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
              }`}>v2.4-SOC</span>
            </div>
          </div>
        </div>

        <div className={`hidden lg:flex items-center space-x-2 text-xs pl-4 border-l ${
          isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
        }`}>
          <span>SOC Platform</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-cyan-600 dark:text-cyan-300 font-semibold">{getPageTitle(activeTab)}</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={() => setIsSearchOpen(true)}
          className={`w-full h-9 rounded-lg px-3 flex items-center justify-between text-xs transition-all group ${
            isDark 
              ? 'bg-slate-900/80 hover:bg-slate-850 border border-slate-700/70 hover:border-cyan-500/50 text-slate-400' 
              : 'bg-slate-100 hover:bg-slate-150 border border-slate-200 hover:border-cyan-500/50 text-slate-500'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-500" />
            <span>Search alerts, endpoints, ports, or investigations...</span>
          </div>
          <kbd className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-300 text-slate-600 shadow-xs'
          }`}>
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Dataset Status Banner */}
        {dataset && (
          <div className={`hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-md text-xs font-mono border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <Database className="w-3.5 h-3.5 text-cyan-500" />
            <span className="font-semibold">{dataset.totalFlows} flows</span>
            {dataset.isSynthetic ? (
              <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                Synthetic Demo
              </span>
            ) : (
              <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                User Capture
              </span>
            )}
          </div>
        )}

        {/* Quick Demo Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => loadDemoDataset('standard')}
            title="Load standard deterministic synthetic demo dataset"
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
              isDark 
                ? 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/40' 
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-200'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Load Demo</span>
          </button>

          <button
            onClick={resetToDefaults}
            title="Reset platform demo state and default detector configuration"
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors border ${
              isDark 
                ? 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700/60' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* Theme Switcher Toggle (White / Dark) */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-colors ${
              isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 shadow-xs'
            }`}
            title={isDark ? "Switch to White Theme" : "Switch to Dark Theme"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Event Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 border ${
              isDark ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm">SOC Event Stream</span>
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {notifications.length}
                  </span>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No active notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.alertId) {
                          const alert = alerts.find(a => a.id === n.alertId);
                          if (alert) setSelectedAlert(alert);
                        }
                        if (n.linkTab) setActiveTab(n.linkTab);
                        setShowNotifications(false);
                      }}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isDark
                          ? (n.read ? 'bg-slate-900/40 border-slate-800/40 text-slate-400' : 'bg-slate-800/80 border-slate-700 text-slate-200')
                          : (n.read ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-cyan-50/50 border-cyan-200 text-slate-800')
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-cyan-600 dark:text-cyan-300">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                      </div>
                      <p className="mt-1 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
