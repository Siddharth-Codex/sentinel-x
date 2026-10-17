import React from 'react';
import { X, HelpCircle, Terminal, Key, ShieldAlert } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[#090E1A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0B1222]">
          <div className="flex items-center space-x-2.5">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">SOC Analyst Help & Documentation</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-cyan-200">
            <strong>Getting Started with Sentinel X:</strong> If this is your first time accessing the platform, click <em>Create Account</em> to register your analyst credentials with an 8+ character password.
          </div>

          <h3 className="font-bold text-white text-sm pt-2 flex items-center space-x-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>Password Requirements</span>
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
            <li>Minimum of 8 characters.</li>
            <li>At least one numerical digit (0–9).</li>
            <li>At least one special symbol (e.g. !@#$%^&*).</li>
          </ul>

          <h3 className="font-bold text-white text-sm pt-2 flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <span>Dual Authentication Engine</span>
          </h3>
          <p>
            The platform supports both <strong>Google Firebase Auth</strong> (via the official Firebase SDK) and the built-in <strong>Sentinel Sovereign Cryptographic Engine</strong> (using PBKDF2/SHA-512 password hashing on the server). You can connect to an existing Firebase cloud project at any time via the <em>Provider</em> settings in the header.
          </p>

          <h3 className="font-bold text-white text-sm pt-2 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Password Recovery</span>
          </h3>
          <p>
            If you forget your password, click <em>Forgot Password</em>. Recovery tokens expire after 60 minutes for security compliance.
          </p>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 flex justify-end bg-[#0B1222]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
