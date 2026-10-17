import React, { useState } from 'react';
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset, setAuthView, setResetToken, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    clearError();

    const emailTrim = email.trim();
    if (!emailTrim) {
      setEmailError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestPasswordReset(emailTrim);
      if (res.success) {
        setSuccessMessage(res.message);
        if (res.debugToken) {
          setDebugToken(res.debugToken);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#090E1D]/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
      <div className="space-y-1.5 text-center sm:text-left">
        <div className="flex items-center space-x-2 text-cyan-400">
          <KeyRound className="w-5 h-5" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">Security Recovery</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Reset Your Password
        </h2>
        <p className="text-xs text-slate-400">
          Enter your registered email address to receive password recovery instructions and a secure one-time token.
        </p>
      </div>

      {successMessage ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold text-sm text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Recovery Request Dispatched</span>
            </div>
            <p className="leading-relaxed">
              {successMessage}
            </p>
            <p className="text-[11px] text-emerald-400/80 font-mono pt-1">
              • Secure recovery links expire in 60 minutes.<br />
              • Check your spam or corporate quarantine filter if needed.
            </p>
          </div>

          {debugToken && (
            <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-xs text-cyan-200 space-y-2 font-mono">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                Local Environment Recovery Token:
              </div>
              <div className="p-2 rounded bg-black/60 border border-cyan-800 text-[11px] break-all select-all">
                {debugToken}
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetToken(debugToken);
                  setAuthView('reset-password');
                }}
                className="text-xs font-sans font-bold text-cyan-300 hover:text-white underline flex items-center space-x-1"
              >
                <span>Proceed to Reset Form with this token</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              clearError();
              setAuthView('login');
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Analyst Login</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="reset-email" className="block text-xs font-mono font-medium text-slate-300">
              Registered Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                placeholder="analyst@enterprise.corp"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070B16] border text-xs sm:text-sm font-sans text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                  emailError ? 'border-rose-500' : 'border-slate-700/80 focus:border-cyan-500'
                }`}
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-rose-400 font-mono mt-1">{emailError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Dispatching Recovery Token...</span>
              </>
            ) : (
              <span>Send Recovery Instructions</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              clearError();
              setAuthView('login');
            }}
            className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center space-x-1.5 transition-colors font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </form>
      )}
    </div>
  );
};
