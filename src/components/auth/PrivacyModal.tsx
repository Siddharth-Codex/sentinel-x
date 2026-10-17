import React from 'react';
import { X, Lock } from 'lucide-react';

interface PrivacyModalProps {
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[#090E1A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0B1222]">
          <div className="flex items-center space-x-2.5">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">SENTINEL X Privacy Policy</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Your operational privacy and telemetry security are core tenets of the <strong>SENTINEL X</strong> architecture.
          </p>

          <h3 className="font-bold text-white text-sm pt-2">1. Credential Security</h3>
          <p>
            Passwords are never stored in plain text. Passwords undergo high-iteration cryptographic derivation (PBKDF2 with SHA-512 and unique 32-byte salts) or are handled directly by Google Firebase Auth. Client applications never retain plain passwords in browser storage.
          </p>

          <h3 className="font-bold text-white text-sm pt-2">2. Network Flow Telemetry Isolation</h3>
          <p>
            Network telemetry, packet statistics, and CSV logs imported into the platform are processed locally or within the designated tenant perimeter. Exported datasets and reports enforce strict formula injection sanitization (CWE-1236).
          </p>

          <h3 className="font-bold text-white text-sm pt-2">3. Session & Remember-Me Mechanics</h3>
          <p>
            The Remember-Me feature securely records only the authorized email address in the user's browser local storage. Session tokens expire after predetermined security windows and can be revoked immediately upon logout.
          </p>

          <h3 className="font-bold text-white text-sm pt-2">4. Zero Third-Party Advertising</h3>
          <p>
            SENTINEL X contains zero analytics trackers, third-party advertising pixels, or telemetry brokers.
          </p>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 flex justify-end bg-[#0B1222]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
