import React, { useState } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Key,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ResetPasswordPage: React.FC = () => {
  const { confirmPasswordReset, resetToken, setAuthView, error, clearError } = useAuth();

  const [tokenInput, setTokenInput] = useState(resetToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!tokenInput.trim()) {
      errors.token = 'A valid reset recovery token is required.';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (!hasMinLength || !hasNumber || !hasSpecial) {
      errors.newPassword = 'Password must meet all complexity requirements.';
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await confirmPasswordReset(tokenInput.trim(), newPassword, confirmPassword);
      if (res.success) {
        setSuccessMessage(res.message || 'Password successfully updated.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#090E1D]/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
      <div className="space-y-1.5 text-center sm:text-left">
        <div className="flex items-center space-x-2 text-cyan-400">
          <Key className="w-5 h-5" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">Credential Update</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Choose a New Password
        </h2>
        <p className="text-xs text-slate-400">
          Enter your recovery token and select a new secure password satisfying enterprise SOC standards.
        </p>
      </div>

      {error && (
        <div 
          role="alert"
          className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2.5 animate-shake"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">{error}</div>
        </div>
      )}

      {successMessage ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold text-sm text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Password Updated Successfully</span>
            </div>
            <p className="leading-relaxed">{successMessage}</p>
            <p className="text-[11px] text-emerald-400/80 font-mono">
              All previous sessions have been invalidated. Please sign in with your updated credentials.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              clearError();
              setAuthView('login');
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <span>Proceed to Login</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Recovery Token */}
          <div className="space-y-1">
            <label htmlFor="reset-token" className="block text-xs font-mono font-medium text-slate-300">
              Recovery Token
            </label>
            <input
              id="reset-token"
              type="text"
              required
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                if (fieldErrors.token) setFieldErrors(prev => ({ ...prev, token: '' }));
              }}
              placeholder="rst_..."
              className={`w-full px-3 py-2 rounded-xl bg-[#070B16] border text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                fieldErrors.token ? 'border-rose-500' : 'border-slate-700/80 focus:border-cyan-500'
              }`}
            />
            {fieldErrors.token && (
              <p className="text-[11px] text-rose-400 font-mono mt-0.5">{fieldErrors.token}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label htmlFor="new-password" className="block text-xs font-mono font-medium text-slate-300">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (fieldErrors.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: '' }));
                }}
                placeholder="••••••••••••"
                className={`w-full pl-9 pr-10 py-2 rounded-xl bg-[#070B16] border text-xs sm:text-sm font-sans text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                  fieldErrors.newPassword ? 'border-rose-500' : 'border-slate-700/80 focus:border-cyan-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-3 gap-1 pt-1 font-mono text-[10px]">
              <span className={`flex items-center space-x-1 ${hasMinLength ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <Check className="w-3 h-3" />
                <span>8+ chars</span>
              </span>
              <span className={`flex items-center space-x-1 ${hasNumber ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <Check className="w-3 h-3" />
                <span>1 number</span>
              </span>
              <span className={`flex items-center space-x-1 ${hasSpecial ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <Check className="w-3 h-3" />
                <span>1 symbol</span>
              </span>
            </div>
            {fieldErrors.newPassword && (
              <p className="text-[11px] text-rose-400 font-mono mt-0.5">{fieldErrors.newPassword}</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1">
            <label htmlFor="confirm-new-password" className="block text-xs font-mono font-medium text-slate-300">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                placeholder="••••••••••••"
                className={`w-full pl-9 pr-10 py-2 rounded-xl bg-[#070B16] border text-xs sm:text-sm font-sans text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                  fieldErrors.confirmPassword ? 'border-rose-500' : 'border-slate-700/80 focus:border-cyan-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] text-rose-400 font-mono mt-0.5">{fieldErrors.confirmPassword}</p>
            )}
            {passwordsMatch && (
              <p className="text-[11px] text-emerald-400 font-mono mt-0.5 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Passwords match</span>
              </p>
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
                <span>Updating Credentials...</span>
              </>
            ) : (
              <span>Confirm & Set New Password</span>
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
            <span>Cancel and Return to Login</span>
          </button>
        </form>
      )}
    </div>
  );
};
