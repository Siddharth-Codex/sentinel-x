import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Share2, 
  AlertTriangle, 
  GitFork, 
  FileSearch, 
  Bot, 
  FileText, 
  Sliders, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  LogOut,
  User
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, alerts, investigations, theme } = useSecurity();
  const { user, logout, setIsProfileOpen } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const openAlertsCount = alerts.filter(a => a.status === 'OPEN').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'OPEN').length;
  const activeInvsCount = investigations.filter(i => i.status === 'INVESTIGATING' || i.status === 'OPEN').length;

  const isDark = theme === 'dark';

  const navItems = [
    { id: 'command-centre', label: 'Command Centre', icon: LayoutDashboard },
    { id: 'traffic', label: 'Traffic Analysis', icon: Activity },
    { id: 'network-map', label: 'Network Map', icon: Share2 },
    { 
      id: 'alerts', 
      label: 'Alert Intelligence', 
      icon: AlertTriangle,
      badge: openAlertsCount > 0 ? openAlertsCount : undefined,
      badgeCritical: criticalCount > 0
    },
    { id: 'storyline', label: 'Attack Storyline', icon: GitFork },
    { 
      id: 'investigations', 
      label: 'Investigations', 
      icon: FileSearch,
      badge: activeInvsCount > 0 ? activeInvsCount : undefined
    },
    { id: 'ai-analyst', label: 'AI Security Analyst', icon: Bot, isAi: true },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Sliders }
  ];

  return (
    <aside 
      className={`flex flex-col justify-between transition-all duration-300 z-20 ${
        isDark ? 'bg-[#0D111B] border-r border-slate-800/80' : 'bg-white border-r border-slate-200 shadow-xs'
      } ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Top: Nav list */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-4 px-2">
          {!collapsed && (
            <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Operations
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1 rounded transition-colors ml-auto ${
              isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center rounded-lg px-3 py-2.5 text-xs font-medium transition-all group relative ${
                  isActive
                    ? (isDark
                        ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900 text-cyan-300 border-l-2 border-cyan-400 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                        : 'bg-cyan-50/90 text-cyan-900 border-l-2 border-cyan-600 font-semibold shadow-xs')
                    : (isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive 
                    ? (isDark ? 'text-cyan-400' : 'text-cyan-600') 
                    : (isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-700')
                }`} />

                {!collapsed && (
                  <span className="ml-3 truncate">{item.label}</span>
                )}

                {/* Badge if present */}
                {!collapsed && item.badge !== undefined && (
                  <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    item.badgeCritical 
                      ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                      : (isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200')
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* AI pill indicator */}
                {!collapsed && item.isAi && (
                  <span className={`ml-auto px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${
                    isDark ? 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                  }`}>
                    GEMINI
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom status badge and Logout */}
      <div className={`p-3 border-t space-y-2 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
        {!collapsed ? (
          <>
            <div className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Engine Status</span>
                </span>
                <span className="text-emerald-500 font-mono text-[10px] font-bold">ACTIVE</span>
              </div>
              <div className={`text-[10px] font-mono flex justify-between ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>7 Modular Detectors</span>
                <span>v2.4-SOC</span>
              </div>
            </div>

            {user && (
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center space-x-2 text-left truncate flex-1 hover:opacity-80 transition-opacity"
                  title="View Profile"
                >
                  <div className="w-6 h-6 rounded-md bg-cyan-900/60 text-cyan-300 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 border border-cyan-700/50">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="truncate text-xs">
                    <div className={`font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{user.displayName || 'Analyst'}</div>
                    <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 truncate">{user.role}</div>
                  </div>
                </button>
                <button
                  onClick={() => logout()}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors ml-1"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" title="Engine Active" />
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
