import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, setAuthView, error, clearError, providerType } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Check for remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('sentinel_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {}
  }, []);

  const validate = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    const emailTrim = email.trim();
    if (!emailTrim) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await login({
        email: email.trim(),
        password,
        rememberMe
      });

      if (!res.success) {
        // Clear password on failed attempt for security while retaining email
        setPassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#090E1D]/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
      {/* Card Header */}
      <div className="space-y-1.5 text-center sm:text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Analyst Authentication</span>
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
            {providerType === 'firebase' ? 'Firebase' : 'Sovereign'}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Sign in with your enterprise credentials to access active network operations.
        </p>
      </div>

      {/* Global Error Alert */}
      {error && (
        <div 
          role="alert"
          className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2.5 animate-shake"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">{error}</div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <div className="space-y-1">
          <label 
            htmlFor="auth-email" 
            className="block text-xs font-mono font-medium text-slate-300"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'auth-email-error' : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              placeholder="analyst@enterprise.corp"
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070B16] border text-xs sm:text-sm font-sans text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                emailError 
                  ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500' 
                  : 'border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
              }`}
            />
          </div>
          {emailError && (
            <p id="auth-email-error" className="text-[11px] text-rose-400 font-mono mt-1">
              {emailError}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label 
              htmlFor="auth-password" 
              className="block text-xs font-mono font-medium text-slate-300"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => {
                clearError();
                setAuthView('forgot-password');
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="auth-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              aria-required="true"
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'auth-password-error' : undefined}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              placeholder="••••••••••••"
              className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#070B16] border text-xs sm:text-sm font-sans text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                passwordError 
                  ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500' 
                  : 'border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordError && (
            <p id="auth-password-error" className="text-[11px] text-rose-400 font-mono mt-1">
              {passwordError}
            </p>
          )}
        </div>

        {/* Remember Me Option */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 focus:ring-1"
            />
            <span className="text-xs text-slate-300 font-sans">Remember my email</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">24hr Token TTL</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Verifying Identity...</span>
            </>
          ) : (
            <>
              <span>Authenticate & Enter SOC</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Register Switcher */}
      <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
        <span>Need platform credentials? </span>
        <button
          type="button"
          onClick={() => {
            clearError();
            setAuthView('register');
          }}
          className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 ml-1 transition-colors"
        >
          Create an analyst account
        </button>
      </div>
    </div>
  );
};
