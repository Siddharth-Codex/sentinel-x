import React, { useState } from 'react';
import { X, Server, CheckCircle2, AlertTriangle, ExternalLink, Key, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getEnvFirebaseConfig, FirebaseClientConfig } from '../../lib/firebase';

interface FirebaseSetupModalProps {
  onClose: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({ onClose }) => {
  const { providerType, configureFirebase } = useAuth();
  const currentConfig = getEnvFirebaseConfig();

  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !projectId || !authDomain) return;

    const newConfig: FirebaseClientConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    configureFirebase(newConfig);
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const envSnippet = `# Firebase Web Client Configuration
VITE_FIREBASE_API_KEY="${apiKey || 'AIzaSy...'}"
VITE_FIREBASE_AUTH_DOMAIN="${authDomain || 'your-project.firebaseapp.com'}"
VITE_FIREBASE_PROJECT_ID="${projectId || 'your-project-id'}"
VITE_FIREBASE_STORAGE_BUCKET="${storageBucket || 'your-project.appspot.com'}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${messagingSenderId || '123456789'}"
VITE_FIREBASE_APP_ID="${appId || '1:123456789:web:abcdef'}"`;

  const copyEnvToClipboard = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#090E1A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0B1222]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Authentication Architecture & Setup</h2>
              <p className="text-xs text-slate-400">Configure Firebase or review Sovereign SOC Auth</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Active Provider Card */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#0C1427] flex items-start justify-between">
            <div>
              <div className="text-xs font-mono text-slate-400">CURRENT ACTIVE AUTH PROVIDER</div>
              <div className="text-base font-bold text-white mt-1 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{providerType === 'firebase' ? 'Firebase Authentication JavaScript SDK' : 'Sentinel-X Sovereign SOC Engine'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {providerType === 'firebase' 
                  ? 'Authenticated directly through Google Firebase Auth service.'
                  : 'Authenticated via cryptographically secure PBKDF2/SHA-512 Express backend with salted hashes and bearer session tokens.'}
              </p>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              How to Connect Your Firebase Project
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 leading-relaxed font-sans">
              <li>Create or open a project in the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center">Firebase Console <ExternalLink className="w-3 h-3 ml-0.5" /></a>.</li>
              <li>Under <strong>Build &gt; Authentication</strong>, click <strong>Get Started</strong> and enable the <strong>Email/Password</strong> sign-in method.</li>
              <li>Under <strong>Project Settings &gt; General &gt; Your Apps</strong>, add a <strong>Web App</strong> (click the <code>&lt;/&gt;</code> icon).</li>
              <li>Copy your Web configuration keys into the form below or into your <code>.env</code> file.</li>
            </ol>
          </div>

          {/* Quick Config Form */}
          <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200">Firebase Web App Credentials</span>
              <button
                type="button"
                onClick={copyEnvToClipboard}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEnv ? 'Copied .env template!' : 'Copy .env format'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">API Key *</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Auth Domain *</label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={e => setAuthDomain(e.target.value)}
                  placeholder="your-project.firebaseapp.com"
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Project ID *</label>
                <input
                  type="text"
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  placeholder="your-project-id"
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Storage Bucket</label>
                <input
                  type="text"
                  value={storageBucket}
                  onChange={e => setStorageBucket(e.target.value)}
                  placeholder="your-project.appspot.com"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Messaging Sender ID</label>
                <input
                  type="text"
                  value={messagingSenderId}
                  onChange={e => setMessagingSenderId(e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">App ID</label>
                <input
                  type="text"
                  value={appId}
                  onChange={e => setAppId(e.target.value)}
                  placeholder="1:1234567890:web:abcdef"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Configuration saved! Reloading authentication engine...</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-900/40 transition-all"
              >
                Save & Connect Firebase
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
