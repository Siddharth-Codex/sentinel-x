import { Investigation } from '../../types/investigations';
import { AllDetectorsConfig } from '../../types/alerts';
import { DEFAULT_DETECTOR_CONFIG } from '../../data/defaultConfig';

const KEYS = {
  INVESTIGATIONS: 'sentinel_x_investigations_v1',
  SETTINGS: 'sentinel_x_settings_v1',
  ALERT_DISPOSITIONS: 'sentinel_x_alert_dispositions_v1',
  USER_PREFS: 'sentinel_x_user_prefs_v1'
};

// In-memory fallback if localStorage is disabled or throws QuotaExceededError
const memoryStore: Record<string, string> = {};

function safeGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (err) {
    console.warn('localStorage read error, using fallback:', err);
  }
  return memoryStore[key] || null;
}

function safeSet(key: string, value: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return true;
    }
  } catch (err) {
    console.warn('localStorage write error, fallback to memory:', err);
    memoryStore[key] = value;
  }
  memoryStore[key] = value;
  return false;
}

export function loadSavedInvestigations(): Investigation[] {
  const raw = safeGet(KEYS.INVESTIGATIONS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveInvestigations(investigations: Investigation[]): boolean {
  return safeSet(KEYS.INVESTIGATIONS, JSON.stringify(investigations));
}

export function loadSavedSettings(): AllDetectorsConfig {
  const raw = safeGet(KEYS.SETTINGS);
  if (!raw) return DEFAULT_DETECTOR_CONFIG;
  try {
    return { ...DEFAULT_DETECTOR_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DETECTOR_CONFIG;
  }
}

export function saveSettings(settings: AllDetectorsConfig): boolean {
  return safeSet(KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadAlertDispositions(): Record<string, { status: string; note?: string }> {
  const raw = safeGet(KEYS.ALERT_DISPOSITIONS);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveAlertDispositions(dispositions: Record<string, { status: string; note?: string }>): boolean {
  return safeSet(KEYS.ALERT_DISPOSITIONS, JSON.stringify(dispositions));
}

export function clearAllLocalData(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(KEYS.INVESTIGATIONS);
      window.localStorage.removeItem(KEYS.SETTINGS);
      window.localStorage.removeItem(KEYS.ALERT_DISPOSITIONS);
      window.localStorage.removeItem(KEYS.USER_PREFS);
    }
  } catch (err) {
    console.warn('Error clearing localStorage:', err);
  }
  for (const k of Object.keys(memoryStore)) {
    delete memoryStore[k];
  }
}
