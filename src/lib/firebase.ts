import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser
} from 'firebase/auth';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

// Read configuration from environment variables
export const getEnvFirebaseConfig = (): FirebaseClientConfig | null => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (apiKey && authDomain && projectId) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
    };
  }

  // Check if saved in localStorage for developer configuration testing
  if (typeof window !== 'undefined') {
    try {
      const savedConfig = localStorage.getItem('sentinel_custom_firebase_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      }
    } catch {}
  }

  return null;
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

export const isFirebaseConfigured = (): boolean => {
  const config = getEnvFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
};

export const getFirebaseServices = (): { app: FirebaseApp | null; auth: Auth | null } => {
  const config = getEnvFirebaseConfig();

  if (!config) {
    return { app: null, auth: null };
  }

  try {
    if (!cachedApp) {
      cachedApp = getApps().length > 0 ? getApp() : initializeApp(config);
    }
    if (!cachedAuth && cachedApp) {
      cachedAuth = getAuth(cachedApp);
    }
    return { app: cachedApp, auth: cachedAuth };
  } catch (err) {
    console.warn('[SENTINEL X] Firebase initialization notice:', err);
    return { app: null, auth: null };
  }
};

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
};

export type { FirebaseUser };
