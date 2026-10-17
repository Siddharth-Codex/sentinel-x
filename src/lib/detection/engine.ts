import { Alert, AllDetectorsConfig } from '../../types/alerts';
import { FlowRecord } from '../../types/network';
import { detectUnusualConnectionCount } from './detectors/connectionCount';
import { detectUnusualPortBehaviour } from './detectors/portAnomaly';
import { detectTrafficVolumeAnomalies } from './detectors/trafficVolume';
import { detectRepeatedConnectionPatterns } from './detectors/repeatedPatterns';
import { detectOutboundTrafficAnomalies } from './detectors/outboundTraffic';
import { detectRareCommunicationPairs } from './detectors/rarePairs';
import { correlateMultiSignalAlerts } from './detectors/multiSignal';

export interface AnalysisRunResult {
  alerts: Alert[];
  durationMs: number;
  totalFlows: number;
  anomalousFlowCount: number;
  severityCounts: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    INFORMATIONAL: number;
  };
  detectorCounts: Record<string, number>;
  topRiskDevices: Array<{ ip: string; alertCount: number; maxScore: number }>;
}

export function runDetectionPipeline(
  flows: FlowRecord[],
  config: AllDetectorsConfig
): AnalysisRunResult {
  const startTime = performance.now();
  const baseAlerts: Alert[] = [];

  // Run Detector A: Unusual Connection Count
  if (config.DET_CONN_COUNT.enabled) {
    baseAlerts.push(...detectUnusualConnectionCount(flows, config.DET_CONN_COUNT));
  }

  // Run Detector B: Unusual Port Behaviour
  if (config.DET_PORT_ANOMALY.enabled) {
    baseAlerts.push(...detectUnusualPortBehaviour(flows, config.DET_PORT_ANOMALY));
  }

  // Run Detector C: Traffic Volume Anomalies
  if (config.DET_TRAFFIC_VOLUME.enabled) {
    baseAlerts.push(...detectTrafficVolumeAnomalies(flows, config.DET_TRAFFIC_VOLUME));
  }

  // Run Detector D: Repeated Connection Patterns
  if (config.DET_REPEATED_CONN.enabled) {
    baseAlerts.push(...detectRepeatedConnectionPatterns(flows, config.DET_REPEATED_CONN));
  }

  // Run Detector E: Outbound Traffic Anomalies
  if (config.DET_OUTBOUND_SURGE.enabled) {
    baseAlerts.push(...detectOutboundTrafficAnomalies(flows, config.DET_OUTBOUND_SURGE));
  }

  // Run Detector F: Rare Communication Pairs
  if (config.DET_RARE_PAIR.enabled) {
    baseAlerts.push(...detectRareCommunicationPairs(flows, config.DET_RARE_PAIR));
  }

  // Run Detector G: Multi-Signal Correlation (aggregates previous detectors)
  let correlatedAlerts: Alert[] = [];
  if (config.DET_MULTI_SIGNAL.enabled) {
    correlatedAlerts = correlateMultiSignalAlerts(baseAlerts, config.DET_MULTI_SIGNAL);
  }

  const allAlerts = [...correlatedAlerts, ...baseAlerts];

  // Tag underlying flows as anomalous if they are in supportingRecordIds
  const anomalousFlowIdSet = new Set<string>();
  for (const alert of allAlerts) {
    for (const id of alert.supportingRecordIds) {
      anomalousFlowIdSet.add(id);
    }
  }

  for (const flow of flows) {
    if (anomalousFlowIdSet.has(flow.id)) {
      flow.is_anomalous = true;
    }
  }

  // Sort alerts by severity priority (CRITICAL > HIGH > MEDIUM > LOW > INFORMATIONAL) then anomalyScore desc
  const severityWeight: Record<string, number> = {
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    INFORMATIONAL: 1
  };

  allAlerts.sort((a, b) => {
    const diff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
    if (diff !== 0) return diff;
    return b.anomalyScore - a.anomalyScore;
  });

  const severityCounts = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFORMATIONAL: 0
  };

  const detectorCounts: Record<string, number> = {};
  const hostScores = new Map<string, { count: number; maxScore: number }>();

  for (const alert of allAlerts) {
    severityCounts[alert.severity] = (severityCounts[alert.severity] || 0) + 1;
    detectorCounts[alert.detectorId] = (detectorCounts[alert.detectorId] || 0) + 1;

    if (!hostScores.has(alert.source_ip)) {
      hostScores.set(alert.source_ip, { count: 0, maxScore: 0 });
    }
    const hostStat = hostScores.get(alert.source_ip)!;
    hostStat.count++;
    if (alert.anomalyScore > hostStat.maxScore) {
      hostStat.maxScore = alert.anomalyScore;
    }
  }

  const topRiskDevices = Array.from(hostScores.entries())
    .map(([ip, data]) => ({ ip, alertCount: data.count, maxScore: data.maxScore }))
    .sort((a, b) => b.maxScore - a.maxScore || b.alertCount - a.alertCount)
    .slice(0, 10);

  const durationMs = Math.round(performance.now() - startTime);

  return {
    alerts: allAlerts,
    durationMs,
    totalFlows: flows.length,
    anomalousFlowCount: anomalousFlowIdSet.size,
    severityCounts,
    detectorCounts,
    topRiskDevices
  };
}
