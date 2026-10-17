import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FlowRecord, DatasetMetadata, ValidationSummary, ColumnMapping } from '../types/network';
import { Alert, AlertStatus, AllDetectorsConfig } from '../types/alerts';
import { Investigation, InvestigationPriority, InvestigationStatus } from '../types/investigations';
import { generateSyntheticDataset } from '../data/demoDataset';
import { DEFAULT_DETECTOR_CONFIG } from '../data/defaultConfig';
import { runDetectionPipeline } from '../lib/detection/engine';
import { parseCsvContent } from '../lib/csv/parser';
import { inferColumnMapping, validateRequiredMappings } from '../lib/csv/mapping';
import { validateAndTransformRecords } from '../lib/validation/validator';
import { 
  loadSavedInvestigations, 
  saveInvestigations, 
  loadSavedSettings, 
  saveSettings, 
  loadAlertDispositions, 
  saveAlertDispositions,
  clearAllLocalData 
} from '../lib/storage/persistence';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
  alertId?: string;
  linkTab?: string;
}

interface SecurityContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dataset: DatasetMetadata | null;
  flows: FlowRecord[];
  alerts: Alert[];
  investigations: Investigation[];
  settings: AllDetectorsConfig;
  validationSummary: ValidationSummary | null;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  isAnalyzing: boolean;
  selectedAlert: Alert | null;
  selectedInvestigation: Investigation | null;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  
  // Actions
  loadDemoDataset: (mode?: 'standard' | 'small') => void;
  importCsvData: (csvText: string, fileName?: string, overrideMapping?: Partial<ColumnMapping>) => { success: boolean; error?: string };
  reRunAnalysis: () => void;
  setSelectedAlert: (alert: Alert | null) => void;
  setSelectedInvestigation: (inv: Investigation | null) => void;
  updateAlertStatus: (alertId: string, status: AlertStatus, note?: string) => void;
  createInvestigationFromAlert: (alert: Alert) => string;
  createManualInvestigation: (title: string, description: string, relatedAlertIds?: string[], priority?: InvestigationPriority) => string;
  addInvestigationNote: (invId: string, content: string) => void;
  updateInvestigationStatus: (invId: string, status: InvestigationStatus) => void;
  updateSettings: (newSettings: AllDetectorsConfig) => void;
  resetToDefaults: () => void;
  clearAllData: () => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (title: string, message: string, type?: AppNotification['type'], alertId?: string, linkTab?: string) => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('command-centre');
  const [dataset, setDataset] = useState<DatasetMetadata | null>(null);
  const [flows, setFlows] = useState<FlowRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [settings, setSettings] = useState<AllDetectorsConfig>(DEFAULT_DETECTOR_CONFIG);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sentinel_x_theme');
      if (saved === 'dark') return 'dark';
    }
    return 'light'; // Default to pristine white theme
  });

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('sentinel_x_theme', newTheme);
    } catch {}
    if (typeof document !== 'undefined') {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const addNotification = useCallback((
    title: string, 
    message: string, 
    type: AppNotification['type'] = 'info', 
    alertId?: string, 
    linkTab?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
      read: false,
      alertId,
      linkTab
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 24)]);
  }, []);

  const executeAnalysis = useCallback((records: FlowRecord[], currentSettings: AllDetectorsConfig, isSynthetic = false) => {
    setIsAnalyzing(true);
    try {
      const result = runDetectionPipeline(records, currentSettings);
      
      // Apply saved dispositions (e.g. false positives, resolved)
      const savedDispositions = loadAlertDispositions();
      const updatedAlerts = result.alerts.map(alert => {
        if (savedDispositions[alert.id]) {
          return {
            ...alert,
            status: savedDispositions[alert.id].status as AlertStatus,
            investigationNotes: savedDispositions[alert.id].note 
              ? [savedDispositions[alert.id].note!] 
              : alert.investigationNotes
          };
        }
        return alert;
      });

      setAlerts(updatedAlerts);

      // Compute metadata
      const srcIps = new Set(records.map(r => r.source_ip));
      const dstIps = new Set(records.map(r => r.destination_ip));
      const allDevices = new Set([...srcIps, ...dstIps]);
      const timestamps = records.map(r => r.timestampMs);
      const minTime = timestamps.length ? Math.min(...timestamps) : Date.now();
      const maxTime = timestamps.length ? Math.max(...timestamps) : Date.now();
      const durationHours = Math.max(0.1, parseFloat(((maxTime - minTime) / 3600000).toFixed(2)));
      const totalBytes = records.reduce((acc, r) => acc + r.bytes_sent + r.bytes_received, 0);

      const protoCounts: Record<string, number> = {};
      for (const r of records) {
        protoCounts[r.protocol] = (protoCounts[r.protocol] || 0) + 1;
      }

      setDataset({
        id: `ds-${Date.now()}`,
        name: isSynthetic ? 'SENTINEL-X SYNTHETIC DEMO DATASET' : 'IMPORTED NETWORK CAPTURE',
        isSynthetic,
        importedAt: new Date().toISOString(),
        totalFlows: records.length,
        uniqueSourceIps: srcIps.size,
        uniqueDestinationIps: dstIps.size,
        uniqueDevices: allDevices.size,
        timeRangeStart: new Date(minTime).toISOString(),
        timeRangeEnd: new Date(maxTime).toISOString(),
        durationHours,
        totalBytes,
        protocolsDetected: protoCounts
      });

      if (result.severityCounts.CRITICAL > 0 || result.severityCounts.HIGH > 0) {
        addNotification(
          'Critical Threat Identified',
          `Analysis flagged ${result.severityCounts.CRITICAL} Critical and ${result.severityCounts.HIGH} High severity alerts.`,
          'alert',
          result.alerts[0]?.id,
          'alerts'
        );
      } else {
        addNotification(
          'Analysis Completed',
          `Successfully processed ${records.length} flows. ${result.alerts.length} findings generated.`,
          'success'
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [addNotification]);

  // Load Initial Demo Data on first boot if no data loaded
  useEffect(() => {
    const savedSettings = loadSavedSettings();
    setSettings(savedSettings);

    const savedInvs = loadSavedInvestigations();
    setInvestigations(savedInvs);

    // Bootstrap deterministic demo dataset
    const demoFlows = generateSyntheticDataset('standard');
    setFlows(demoFlows);
    executeAnalysis(demoFlows, savedSettings, true);
  }, [executeAnalysis]);

  const loadDemoDataset = useCallback((mode: 'standard' | 'small' = 'standard') => {
    const demoFlows = generateSyntheticDataset(mode);
    setFlows(demoFlows);
    setValidationSummary(null);
    executeAnalysis(demoFlows, settings, true);
    addNotification('Demo Dataset Loaded', `Loaded deterministic synthetic dataset (${mode} profile: ${demoFlows.length} flows).`, 'info');
  }, [settings, executeAnalysis, addNotification]);

  const importCsvData = useCallback((csvText: string, fileName = 'uploaded_flows.csv', overrideMapping?: Partial<ColumnMapping>) => {
    try {
      const parsed = parseCsvContent(csvText);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        return { success: false, error: 'The provided CSV file contains no readable headers or data rows.' };
      }

      const inferred = inferColumnMapping(parsed.headers);
      const activeMapping: Partial<ColumnMapping> = { ...inferred, ...overrideMapping };

      const check = validateRequiredMappings(activeMapping);
      if (!check.isComplete) {
        return {
          success: false,
          error: `Missing required column mappings for: ${check.missing.join(', ')}. Please map columns in the import panel.`
        };
      }

      const validated = validateAndTransformRecords(parsed.rows, activeMapping as ColumnMapping);
      setValidationSummary(validated.summary);

      if (validated.records.length === 0) {
        return {
          success: false,
          error: `All ${validated.summary.rejectedRows} records were rejected due to validation errors (e.g. invalid IP addresses, ports, or dates).`
        };
      }

      setFlows(validated.records);
      executeAnalysis(validated.records, settings, false);

      addNotification(
        'CSV Import Successful',
        `Imported ${fileName}: ${validated.records.length} records accepted (${validated.summary.acceptedWithWarnings} with warnings, ${validated.summary.rejectedRows} rejected).`,
        'success'
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to parse CSV file.' };
    }
  }, [settings, executeAnalysis, addNotification]);

  const reRunAnalysis = useCallback(() => {
    if (flows.length > 0) {
      executeAnalysis(flows, settings, dataset?.isSynthetic ?? false);
    }
  }, [flows, settings, dataset, executeAnalysis]);

  const updateAlertStatus = useCallback((alertId: string, status: AlertStatus, note?: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { 
      ...a, 
      status, 
      investigationNotes: note ? [...(a.investigationNotes || []), note] : a.investigationNotes 
    } : a));

    const savedDispositions = loadAlertDispositions();
    savedDispositions[alertId] = { status, note };
    saveAlertDispositions(savedDispositions);

    addNotification('Alert Updated', `Alert ${alertId} status marked as ${status}.`, 'info');
  }, [addNotification]);

  const createInvestigationFromAlert = useCallback((alert: Alert): string => {
    const newId = `INV-${Date.now().toString().slice(-6)}`;
    const newInv: Investigation = {
      id: newId,
      title: `Investigation: ${alert.title}`,
      description: `Formally opened investigation initiated from finding [${alert.id}]. Detector: ${alert.detectorName}. Risk score: ${alert.anomalyScore}/100.`,
      status: 'INVESTIGATING',
      priority: alert.severity === 'CRITICAL' ? 'CRITICAL' : alert.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leadInvestigator: 'Tier-2 SOC Analyst',
      relatedAlertIds: [alert.id],
      affectedDevices: alert.destination_ip ? [alert.source_ip, alert.destination_ip] : [alert.source_ip],
      notes: [
        {
          id: `note-${Date.now()}`,
          author: 'System Auto-Triage',
          timestamp: new Date().toISOString(),
          content: `Investigation created from alert ${alert.id}. Primary anomaly evidence: ${alert.evidence[0]?.description || alert.description}`
        }
      ],
      timeline: [
        {
          id: `tl-1`,
          timestamp: alert.timestamp,
          timestampMs: alert.timestampMs,
          type: 'ALERT',
          title: alert.title,
          description: alert.description,
          source: alert.source_ip,
          destination: alert.destination_ip,
          severity: alert.severity,
          alertId: alert.id,
          detectorId: alert.detectorId,
          isObservedFact: true,
          confidence: alert.confidence
        }
      ]
    };

    const updated = [newInv, ...investigations];
    setInvestigations(updated);
    saveInvestigations(updated);

    // Update alert status
    updateAlertStatus(alert.id, 'INVESTIGATING');

    addNotification('Investigation Created', `Opened case ${newId} for alert ${alert.id}.`, 'info', alert.id, 'investigations');
    setSelectedInvestigation(newInv);
    setActiveTab('investigations');
    return newId;
  }, [investigations, updateAlertStatus, addNotification]);

  const createManualInvestigation = useCallback((
    title: string, 
    description: string, 
    relatedAlertIds: string[] = [], 
    priority: InvestigationPriority = 'HIGH'
  ): string => {
    const newId = `INV-${Date.now().toString().slice(-6)}`;
    const newInv: Investigation = {
      id: newId,
      title,
      description,
      status: 'OPEN',
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leadInvestigator: 'SOC Analyst',
      relatedAlertIds,
      affectedDevices: [],
      notes: [],
      timeline: []
    };

    const updated = [newInv, ...investigations];
    setInvestigations(updated);
    saveInvestigations(updated);
    addNotification('Investigation Created', `Created case ${newId}: ${title}`, 'info', undefined, 'investigations');
    return newId;
  }, [investigations, addNotification]);

  const addInvestigationNote = useCallback((invId: string, content: string) => {
    setInvestigations(prev => {
      const updated = prev.map(inv => {
        if (inv.id === invId) {
          const newNote = {
            id: `note-${Date.now()}`,
            author: 'Investigator',
            timestamp: new Date().toISOString(),
            content
          };
          const newTl = {
            id: `tl-${Date.now()}`,
            timestamp: new Date().toISOString(),
            timestampMs: Date.now(),
            type: 'NOTE' as const,
            title: 'Investigator Note Appended',
            description: content,
            isObservedFact: true,
            confidence: 100
          };
          return {
            ...inv,
            updatedAt: new Date().toISOString(),
            notes: [...inv.notes, newNote],
            timeline: [...inv.timeline, newTl]
          };
        }
        return inv;
      });
      saveInvestigations(updated);
      return updated;
    });
    addNotification('Note Added', `Appended note to investigation ${invId}.`, 'info');
  }, [addNotification]);

  const updateInvestigationStatus = useCallback((invId: string, status: InvestigationStatus) => {
    setInvestigations(prev => {
      const updated = prev.map(inv => inv.id === invId ? { ...inv, status, updatedAt: new Date().toISOString() } : inv);
      saveInvestigations(updated);
      return updated;
    });
    addNotification('Investigation Updated', `Investigation ${invId} marked as ${status}.`, 'info');
  }, [addNotification]);

  const updateSettings = useCallback((newSettings: AllDetectorsConfig) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    // Re-run with new thresholds
    if (flows.length > 0) {
      executeAnalysis(flows, newSettings, dataset?.isSynthetic ?? false);
    }
    addNotification('Settings Applied', 'Detector sensitivity and threshold configurations updated.', 'info');
  }, [flows, dataset, executeAnalysis, addNotification]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_DETECTOR_CONFIG);
    saveSettings(DEFAULT_DETECTOR_CONFIG);
    loadDemoDataset('standard');
    addNotification('State Reset', 'Restored default detector configurations and baseline demo dataset.', 'info');
  }, [loadDemoDataset, addNotification]);

  const clearAllData = useCallback(() => {
    clearAllLocalData();
    setDataset(null);
    setFlows([]);
    setAlerts([]);
    setInvestigations([]);
    setValidationSummary(null);
    setSelectedAlert(null);
    setSelectedInvestigation(null);
    addNotification('Data Cleared', 'All network flows, local alerts, and case notes have been removed.', 'warning');
  }, [addNotification]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <SecurityContext.Provider value={{
      activeTab,
      setActiveTab,
      dataset,
      flows,
      alerts,
      investigations,
      settings,
      validationSummary,
      notifications,
      unreadNotificationCount,
      isAnalyzing,
      selectedAlert,
      selectedInvestigation,
      globalSearchQuery,
      setGlobalSearchQuery,
      isSearchOpen,
      setIsSearchOpen,
      theme,
      setTheme,
      toggleTheme,
      loadDemoDataset,
      importCsvData,
      reRunAnalysis,
      setSelectedAlert,
      setSelectedInvestigation,
      updateAlertStatus,
      createInvestigationFromAlert,
      createManualInvestigation,
      addInvestigationNote,
      updateInvestigationStatus,
      updateSettings,
      resetToDefaults,
      clearAllData,
      markNotificationRead,
      clearNotifications,
      addNotification
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
