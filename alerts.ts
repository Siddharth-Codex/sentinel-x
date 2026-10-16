export type DetectorId = 
  | 'DET_CONN_COUNT'      // Detector A: Unusual connection count
  | 'DET_PORT_ANOMALY'    // Detector B: Unusual destination port behaviour
  | 'DET_TRAFFIC_VOLUME'  // Detector C: Traffic volume anomalies
  | 'DET_REPEATED_CONN'   // Detector D: Repeated connection patterns (beaconing)
  | 'DET_OUTBOUND_SURGE'  // Detector E: Outbound traffic anomalies
  | 'DET_RARE_PAIR'       // Detector F: New or rare communication pairs
  | 'DET_MULTI_SIGNAL';   // Detector G: Multi-signal correlation

export type Severity = 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';

export interface AnomalyEvidence {
  metricName: string;
  observedValue: number | string;
  baselineValue?: number | string;
  threshold?: number | string;
  deviationPercent?: number;
  zScore?: number;
  unit?: string;
  description: string;
}

export interface Alert {
  id: string;
  detectorId: DetectorId;
  detectorName: string;
  title: string;
  description: string;
  timestamp: string;
  timestampMs: number;
  source_ip: string;
  destination_ip?: string;
  destination_port?: number;
  protocol?: string;
  anomalyScore: number;     // 0 - 100
  severity: Severity;
  confidence: number;       // 0 - 100
  status: AlertStatus;
  evidence: AnomalyEvidence[];
  supportingRecordIds: string[];
  explanation: string;
  knownLimitations: string;
  recommendedSteps: string[];
  investigationNotes?: string[];
  investigationId?: string;
  tags: string[];
  isSynthetic: boolean;
}

export interface DetectorConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  // Configurable thresholds
  connectionCountMultiplier: number; // e.g. 2.5x baseline
  volumeZScoreThreshold: number;     // e.g. 3.0 z-score
  portScanMinUniquePorts: number;    // e.g. 8 ports
  repeatedConnIntervalJitterMax: number; // ms jitter tolerance for beaconing (e.g. 500ms)
  repeatedConnMinCount: number;      // e.g. 6 periodic hits
  outboundRatioThreshold: number;    // e.g. 80% outbound
  rarePairHistoricalRatio: number;   // e.g. < 0.01% of all traffic
}

export interface AllDetectorsConfig {
  DET_CONN_COUNT: DetectorConfig;
  DET_PORT_ANOMALY: DetectorConfig;
  DET_TRAFFIC_VOLUME: DetectorConfig;
  DET_REPEATED_CONN: DetectorConfig;
  DET_OUTBOUND_SURGE: DetectorConfig;
  DET_RARE_PAIR: DetectorConfig;
  DET_MULTI_SIGNAL: DetectorConfig;
  scoringWeights: {
    anomalyScoreWeight: number;
    volumeWeight: number;
    rarePairWeight: number;
    multiSignalBonus: number;
  };
}
