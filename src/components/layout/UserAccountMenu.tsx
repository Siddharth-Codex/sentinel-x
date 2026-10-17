import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  ShieldCheck, 
  ChevronDown, 
  Settings, 
  Server,
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserAccountMenu: React.FC = () => {
  const { user, logout, setIsProfileOpen, setIsFirebaseSetupOpen, providerType } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center space-x-2.5 p-1.5 pl-2 rounded-xl border border-slate-700/60 hover:border-cyan-500/50 bg-slate-900/60 hover:bg-slate-850 transition-all text-left focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
          {initials}
        </div>
        <div className="hidden md:block leading-tight">
          <div className="text-xs font-bold text-slate-100 flex items-center space-x-1">
            <span className="truncate max-w-[110px]">{user.displayName || 'Analyst'}</span>
          </div>
          <div className="text-[10px] font-mono text-cyan-400 truncate max-w-[110px]">
            {user.role}
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#090E1D] border border-slate-700/90 shadow-2xl py-2 z-50 text-xs animate-fade-in divide-y divide-slate-800/80">
          {/* User Header */}
          <div className="px-4 py-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm truncate">{user.displayName || 'Security Analyst'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">{user.email}</div>
            <div className="pt-1 flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
              <Server className="w-3 h-3 text-cyan-400" />
              <span>Provider: {user.provider === 'firebase' ? 'Firebase Auth' : 'Sentinel Sovereign'}</span>
            </div>
          </div>

          {/* Action Links */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsProfileOpen(true);
              }}
              className="w-full px-4 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center space-x-2.5 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Account & Security Profile</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                setIsFirebaseSetupOpen(true);
              }}
              className="w-full px-4 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center space-x-2.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-sky-400" />
              <span>Authentication Settings</span>
            </button>
          </div>

          {/* Logout Option */}
          <div className="py-1">
            <button
              onClick={async () => {
                setIsOpen(false);
                await logout();
              }}
              className="w-full px-4 py-2 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 flex items-center space-x-2.5 transition-colors font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Platform</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
