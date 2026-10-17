import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, LoginCredentials, RegisterCredentials } from '../types/auth';
import { 
  getFirebaseServices, 
  isFirebaseConfigured, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  FirebaseClientConfig
} from '../lib/firebase';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  providerType: 'firebase' | 'sentinel-sovereign';
  isFirebaseReady: boolean;
  authView: 'login' | 'register' | 'forgot-password' | 'reset-password';
  setAuthView: (view: 'login' | 'register' | 'forgot-password' | 'reset-password') => void;
  resetToken: string | null;
  setResetToken: (token: string | null) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isFirebaseSetupOpen: boolean;
  setIsFirebaseSetupOpen: (open: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; debugToken?: string; error?: string }>;
  confirmPasswordReset: (token: string, newPass: string, confirmPass: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateDisplayName: (name: string) => Promise<{ success: boolean; error?: string }>;
  configureFirebase: (config: FirebaseClientConfig) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'sentinel_auth_session_token';
const REMEMBERED_EMAIL_KEY = 'sentinel_remembered_email';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isFirebaseSetupOpen, setIsFirebaseSetupOpen] = useState<boolean>(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState<boolean>(() => isFirebaseConfigured());
  const [providerType, setProviderType] = useState<'firebase' | 'sentinel-sovereign'>(() => {
    return isFirebaseConfigured() ? 'firebase' : 'sentinel-sovereign';
  });

  // Check URL query parameters for reset token or action code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || params.get('oobCode');
      if (token) {
        setResetToken(token);
        setAuthView('reset-password');
      }
    }
  }, []);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      setIsLoading(true);

      // Check if Firebase is configured
      if (isFirebaseConfigured()) {
        const { auth } = getFirebaseServices();
        if (auth) {
          const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
            if (!isMounted) return;
            if (fbUser) {
              setUser({
                uid: fbUser.uid,
                email: fbUser.email || '',
                displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Security Analyst',
                photoURL: fbUser.photoURL,
                emailVerified: fbUser.emailVerified,
                createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
                lastLoginAt: fbUser.metadata.lastSignInTime || new Date().toISOString(),
                role: 'SOC Analyst',
                provider: 'firebase'
              });
              setProviderType('firebase');
            } else {
              // No active Firebase user; check if Sovereign token exists
              checkSovereignSession();
            }
            setIsLoading(false);
          });
          return () => unsubscribe();
        }
      }

      // Check Sovereign Backend session
      await checkSovereignSession();
      if (isMounted) {
        setIsLoading(false);
      }
    };

    const checkSovereignSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        if (isMounted) setUser(null);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.user) {
            setUser(data.user);
            setProviderType('sentinel-sovereign');
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          sessionStorage.removeItem(TOKEN_STORAGE_KEY);
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.warn('[SENTINEL X] Session verification skipped:', err);
        if (isMounted) setUser(null);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Clear error helper
  const clearError = useCallback(() => setError(null), []);

  // Configure custom Firebase credentials at runtime
  const configureFirebase = useCallback((config: FirebaseClientConfig): boolean => {
    try {
      localStorage.setItem('sentinel_custom_firebase_config', JSON.stringify(config));
      setIsFirebaseReady(true);
      setProviderType('firebase');
      window.location.reload();
      return true;
    } catch {
      return false;
    }
  }, []);

  // Login implementation
  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    const { email, password, rememberMe } = credentials;

    // Handle remembered email securely (never stores password)
    if (rememberMe) {
      try {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } catch {}
    } else {
      try {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      } catch {}
    }

    // 1. Try Firebase if configured
    if (isFirebaseConfigured() && providerType === 'firebase') {
      const { auth } = getFirebaseServices();
      if (auth) {
        try {
          // Configure persistence
          await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const fbUser = userCredential.user;
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || email,
            displayName: fbUser.displayName || email.split('@')[0],
            photoURL: fbUser.photoURL,
            emailVerified: fbUser.emailVerified,
            createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
            lastLoginAt: fbUser.metadata.lastSignInTime || new Date().toISOString(),
            role: 'SOC Analyst',
            provider: 'firebase'
          });
          return { success: true };
        } catch (err: any) {
          let msg = 'Authentication failed. Please verify your credentials.';
          if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            msg = 'Invalid email address or password.';
          } else if (err.code === 'auth/too-many-requests') {
            msg = 'Too many failed login attempts. Please wait a moment before trying again.';
          } else if (err.code === 'auth/user-disabled') {
            msg = 'This analyst account has been suspended by SOC policy.';
          }
          setError(msg);
          return { success: false, error: msg };
        }
      }
    }

    // 2. Sovereign Server Auth implementation
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Invalid email address or password.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Store session token in appropriate browser storage
      if (rememberMe) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      } else {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      }

      setUser(data.user);
      setProviderType('sentinel-sovereign');
      return { success: true };
    } catch (err: any) {
      const networkMsg = 'Unable to reach the authentication service. Please check your connection.';
      setError(networkMsg);
      return { success: false, error: networkMsg };
    }
  }, [providerType]);

  // Register implementation
  const register = useCallback(async (credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    const { fullName, email, password, confirmPassword, acceptTerms } = credentials;

    if (!acceptTerms) {
      const err = 'You must agree to the Terms of Service and Privacy Policy to create an account.';
      setError(err);
      return { success: false, error: err };
    }

    // 1. Try Firebase if configured
    if (isFirebaseConfigured() && providerType === 'firebase') {
      const { auth } = getFirebaseServices();
      if (auth) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const fbUser = userCredential.user;
          // Set display name
          await updateProfile(fbUser, { displayName: fullName });
          // Send verification email
          try {
            await sendEmailVerification(fbUser);
          } catch {}

          setUser({
            uid: fbUser.uid,
            email: fbUser.email || email,
            displayName: fullName,
            photoURL: fbUser.photoURL,
            emailVerified: fbUser.emailVerified,
            createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
            lastLoginAt: fbUser.metadata.lastSignInTime || new Date().toISOString(),
            role: 'SOC Analyst',
            provider: 'firebase'
          });
          return { success: true };
        } catch (err: any) {
          let msg = 'Registration failed. Please check your information.';
          if (err.code === 'auth/email-already-in-use') {
            msg = 'An account with this email address already exists.';
          } else if (err.code === 'auth/weak-password') {
            msg = 'Password does not satisfy enterprise complexity requirements.';
          } else if (err.code === 'auth/invalid-email') {
            msg = 'The email address format is invalid.';
          }
          setError(msg);
          return { success: false, error: msg };
        }
      }
    }

    // 2. Sovereign Server Auth implementation
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, confirmPassword, acceptTerms })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Failed to register account.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Store session token
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setUser(data.user);
      setProviderType('sentinel-sovereign');
      return { success: true };
    } catch (err: any) {
      const networkMsg = 'Unable to connect to the authentication service.';
      setError(networkMsg);
      return { success: false, error: networkMsg };
    }
  }, [providerType]);

  // Logout implementation
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    // 1. Firebase signout if active
    if (providerType === 'firebase') {
      const { auth } = getFirebaseServices();
      if (auth) {
        try {
          await firebaseSignOut(auth);
        } catch (err) {
          console.warn('[SENTINEL X] Firebase signOut notice:', err);
        }
      }
    }

    // 2. Sovereign Server Auth signout
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
      } catch {}
    }

    // Clear tokens and application session state
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setAuthView('login');
    setIsLoading(false);
  }, [providerType]);

  // Request password reset link
  const requestPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; message: string; debugToken?: string; error?: string }> => {
    setError(null);

    // 1. Firebase password reset
    if (isFirebaseConfigured() && providerType === 'firebase') {
      const { auth } = getFirebaseServices();
      if (auth) {
        try {
          await sendPasswordResetEmail(auth, email);
          return {
            success: true,
            message: 'If an account associated with this email exists, password recovery instructions have been dispatched.'
          };
        } catch {
          // Section 4: Generic confirmation messaging that does not reveal whether an email address is registered
          return {
            success: true,
            message: 'If an account associated with this email exists, password recovery instructions have been dispatched.'
          };
        }
      }
    }

    // 2. Sovereign Server Auth password reset
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return {
        success: true,
        message: data.message || 'If an account associated with this email exists, password recovery instructions have been dispatched.',
        debugToken: data.debugToken
      };
    } catch {
      return {
        success: false,
        message: '',
        error: 'Network error occurred while requesting password recovery.'
      };
    }
  }, [providerType]);

  // Confirm password reset
  const confirmPasswordReset = useCallback(async (token: string, newPass: string, confirmPass: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: newPass, confirmPassword: confirmPass })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Failed to update password.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      return { success: true, message: data.message };
    } catch {
      const errorMsg = 'Failed to submit password update. Please verify your connection.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Update profile display name
  const updateDisplayName = useCallback(async (name: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters.' };
    }

    if (providerType === 'firebase') {
      const { auth } = getFirebaseServices();
      if (auth && auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, { displayName: name.trim() });
          setUser(prev => prev ? { ...prev, displayName: name.trim() } : null);
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      }
    }

    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) return { success: false, error: 'Unauthorized.' };

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        },
        body: JSON.stringify({ displayName: name.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update profile name.' };
      }
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Connection error while updating profile.' };
    }
  }, [providerType]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        error,
        providerType,
        isFirebaseReady,
        authView,
        setAuthView,
        resetToken,
        setResetToken,
        isProfileOpen,
        setIsProfileOpen,
        isFirebaseSetupOpen,
        setIsFirebaseSetupOpen,
        login,
        register,
        logout,
        requestPasswordReset,
        confirmPasswordReset,
        updateDisplayName,
        configureFirebase,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
