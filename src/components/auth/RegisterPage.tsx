import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register, setAuthView, error, clearError, providerType } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Password rules checks
  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    const emailTrim = email.trim();
    if (!emailTrim) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errors.email = 'Please provide a valid work or personal email.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (!hasMinLength || !hasNumber || !hasSpecial) {
      errors.password = 'Password must meet all enterprise complexity requirements.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!acceptTerms) {
      errors.terms = 'You must agree to the Terms of Service and Privacy Policy.';
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
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        acceptTerms
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#090E1D]/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="space-y-1.5 text-center sm:text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Register Analyst Account</span>
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
            {providerType === 'firebase' ? 'Firebase' : 'Sovereign'}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Provision your credentials to join active network threat monitoring operations.
        </p>
      </div>

      {/* Global Error */}
      {error && (
        <div 
          role="alert"
          className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2.5 animate-shake"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {/* Full Name */}
        <div className="space-y-1">
          <label htmlFor="reg-name" className="block text-xs font-mono font-medium text-slate-300">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              id="reg-name"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: '' }));
              }}
              placeholder="Alex Vance, CISSP"
              className={`w-full pl-9 pr-3 py-2 rounded-xl bg-[#070B16] border text-xs sm:text-sm font-sans text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                fieldErrors.fullName ? 'border-rose-500' : 'border-slate-700/80 focus:border-cyan-500'
              }`}
            />
          </div>
          {fieldErrors.fullName && (
            <p className="text-[11px] text-rose-400 font-mono mt-0.5">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Work Email */}
        <div className="space-y-1">
          <label htmlFor="reg-email" className="block text-xs font-mono font-medium text-slate-300">
            Work or Personal Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
              }}
              placeholder="alex.vance@enterprise.corp"
              className={`w-full pl-9 pr-3 py-2 rounded-xl bg-[#070B16] border text-xs sm:text-sm font-sans text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                fieldErrors.email ? 'border-rose-500' : 'border-slate-700/80 focus:border-cyan-500'
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-[11px] text-rose-400 font-mono mt-0.5">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="reg-password" className="block text-xs font-mono font-medium text-slate-300">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="reg-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
              }}
              placeholder="••••••••••••"
              className={`w-full pl-9 pr-10 py-2 rounded-xl bg-[#070B16] border text-xs sm:text-sm font-sans text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                fieldErrors.password ? 'border-rose-500' : 'border-slate-700/80 focus:border-cyan-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Requirements Checklist */}
          <div className="grid grid-cols-3 gap-1 pt-1.5 font-mono text-[10px]">
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
          {fieldErrors.password && (
            <p className="text-[11px] text-rose-400 font-mono mt-0.5">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label htmlFor="reg-confirm" className="block text-xs font-mono font-medium text-slate-300">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="reg-confirm"
              name="confirmPassword"
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

        {/* Terms Agreement Checkbox */}
        <div className="pt-1">
          <label className="flex items-start space-x-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                if (fieldErrors.terms) setFieldErrors(prev => ({ ...prev, terms: '' }));
              }}
              className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 focus:ring-1"
            />
            <span className="text-xs text-slate-300 font-sans leading-snug">
              I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong> for authorized defensive network monitoring operations.
            </span>
          </label>
          {fieldErrors.terms && (
            <p className="text-[11px] text-rose-400 font-mono mt-1 pl-6">{fieldErrors.terms}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Creating Analyst Account...</span>
            </>
          ) : (
            <>
              <span>Create Account & Access SOC</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to login */}
      <div className="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400">
        <span>Already have operational access? </span>
        <button
          type="button"
          onClick={() => {
            clearError();
            setAuthView('login');
          }}
          className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 ml-1 transition-colors"
        >
          Sign in here
        </button>
      </div>
    </div>
  );
};
