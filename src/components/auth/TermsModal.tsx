import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[#090E1A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0B1222]">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">SENTINEL X Terms of Service</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            Welcome to <strong>SENTINEL X — AI Network Threat Intelligence Platform</strong>. By accessing or using this security operations workspace, you agree to comply with and be bound by the following Terms of Service.
          </p>

          <h3 className="font-bold text-white text-sm pt-2">1. Authorized Defensive Scope</h3>
          <p>
            SENTINEL X is strictly provided for authorized network monitoring, defensive behavioral analytics, threat hunting, and security incident triage. You agree to upload and analyze only telemetry, packet captures, and network flows for systems and networks that you own or have explicit legal authorization to audit.
          </p>

          <h3 className="font-bold text-white text-sm pt-2">2. Identity & Access Control</h3>
          <p>
            Users are responsible for safeguarding their authentication credentials. All SOC actions, alert updates, and forensic investigative notes performed under an authenticated identity are cryptographically logged to that user record.
          </p>

          <h3 className="font-bold text-white text-sm pt-2">3. Prohibited Usage</h3>
          <p>
            Users may not attempt to reverse engineer, bypass security access rules, inject malicious payloads into telemetry parsers, or conduct denial-of-service operations against the SENTINEL X infrastructure.
          </p>

          <h3 className="font-bold text-white text-sm pt-2">4. Disclaimers</h3>
          <p>
            Detection engines and AI analyst recommendations are assistive tools designed for Tier-2 and Tier-3 SOC practitioners. Final incident containment and remediation decisions remain the responsibility of authorized human security operators.
          </p>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 flex justify-end bg-[#0B1222]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
