import { Alert, Severity } from './alerts';
import { Investigation } from './investigations';
import { DatasetMetadata } from './network';

export interface ReportConfig {
  title: string;
  author: string;
  includeExecutiveSummary: boolean;
  includeKpiMetrics: boolean;
  includeDetectionMethodology: boolean;
  includeFindingsTable: boolean;
  includeLimitations: boolean;
  includeDefensiveSteps: boolean;
  selectedSeverityLevels: Severity[];
  selectedInvestigationIds: string[];
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

export interface IncidentReportData {
  reportId: string;
  generatedAt: string;
  config: ReportConfig;
  dataset: DatasetMetadata;
  totalFlowsAnalysed: number;
  anomaliesDetected: number;
  alerts: Alert[];
  investigations: Investigation[];
  highPriorityCount: number;
  criticalCount: number;
  topRiskDevices: Array<{ ip: string; alertCount: number; riskScore: number }>;
  detectionMethodsUsed: string[];
  knownLimitations: string[];
  investigatorNotes: string[];
  finalDisposition?: string;
}
