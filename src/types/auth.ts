export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  role: 'SOC Analyst' | 'Security Engineer' | 'Threat Hunter' | 'Incident Responder' | 'Administrator';
  provider: 'firebase' | 'sentinel-sovereign';
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  providerType: 'firebase' | 'sentinel-sovereign';
  isFirebaseConfigured: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
