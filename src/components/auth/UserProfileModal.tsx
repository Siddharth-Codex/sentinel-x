import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Server,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UserProfileModalProps {
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose }) => {
  const { user, updateDisplayName, logout, providerType, isFirebaseReady } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!user) return null;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim().length < 2) {
      setMessage({ text: 'Display name must be at least 2 characters.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const res = await updateDisplayName(displayName.trim());
      if (res.success) {
        setMessage({ text: 'Profile name successfully updated.', type: 'success' });
        setIsEditing(false);
      } else {
        setMessage({ text: res.error || 'Failed to update name.', type: 'error' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formattedCreated = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'N/A';

  const formattedLastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Current session';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-xl bg-[#090E1A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0B1222]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-mono">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Analyst Account Profile</h2>
              <p className="text-xs text-slate-400">Authenticated SOC Operator Identity</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {message && (
            <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Account Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0C1427] space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Account Role</span>
              <div className="text-sm font-bold text-cyan-400 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>{user.role}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0C1427] space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Auth Provider</span>
              <div className="text-sm font-bold text-slate-200 flex items-center space-x-1.5">
                <Server className="w-4 h-4 text-sky-400" />
                <span>{user.provider === 'firebase' ? 'Firebase Auth' : 'Sentinel Sovereign'}</span>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#0C1427] space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200">Identity Details</span>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline"
                >
                  Edit Name
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveName} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>
                <div className="flex items-center space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayName(user.displayName);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center space-x-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Display Name:</span>
                  </span>
                  <span className="font-semibold text-slate-100">{user.displayName || 'Security Analyst'}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Address:</span>
                  </span>
                  <span className="font-mono text-slate-200">{user.email}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Account Created:</span>
                  </span>
                  <span className="font-mono text-slate-300">{formattedCreated}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Last Sign-In:</span>
                  </span>
                  <span className="font-mono text-slate-300">{formattedLastLogin}</span>
                </div>
              </div>
            )}
          </div>

          {/* Security & Access Guard */}
          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 text-[11px] text-slate-400 font-mono space-y-1">
            <div className="text-slate-300 font-bold flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-500" />
              <span>Cryptographic Compliance</span>
            </div>
            <div>
              Account session tokens are bound to your active browser context and verified on each operational telemetry request.
            </div>
          </div>
        </div>

        {/* Footer with Logout */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-[#0B1222]">
          <button
            onClick={async () => {
              onClose();
              await logout();
            }}
            className="flex items-center space-x-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Platform</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
