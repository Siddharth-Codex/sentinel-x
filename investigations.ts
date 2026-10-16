import { Severity } from './alerts';

export type InvestigationStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
export type InvestigationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface InvestigationNote {
  id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  timestampMs: number;
  type: 'ALERT' | 'NOTE' | 'STATUS_CHANGE' | 'EVIDENCE_ADDED';
  title: string;
  description: string;
  source?: string;
  destination?: string;
  severity?: Severity;
  alertId?: string;
  detectorId?: string;
  isObservedFact: boolean; // Direct fact vs heuristic association
  heuristicType?: 'SHARED_SRC' | 'SHARED_DST' | 'TIME_PROXIMITY' | 'PORT_CORRELATION' | 'AI_HYPOTHESIS';
  confidence: number;
}

export interface Investigation {
  id: string;
  title: string;
  description: string;
  status: InvestigationStatus;
  priority: InvestigationPriority;
  createdAt: string;
  updatedAt: string;
  leadInvestigator: string;
  relatedAlertIds: string[];
  affectedDevices: string[];
  notes: InvestigationNote[];
  timeline: TimelineEvent[];
  aiSummary?: string;
  disposition?: string;
}
