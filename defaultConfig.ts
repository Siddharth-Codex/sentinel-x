import { AllDetectorsConfig } from '../types/alerts';

export const DEFAULT_DETECTOR_CONFIG: AllDetectorsConfig = {
  DET_CONN_COUNT: {
    enabled: true,
    sensitivity: 'medium',
    connectionCountMultiplier: 2.2,
    volumeZScoreThreshold: 2.8,
    portScanMinUniquePorts: 6,
    repeatedConnIntervalJitterMax: 2000,
    repeatedConnMinCount: 5,
    outboundRatioThreshold: 0.8,
    rarePairHistoricalRatio: 0.015
  },
  DET_PORT_ANOMALY: {
    enabled: true,
    sensitivity: 'medium',
    connectionCountMultiplier: 2.2,
    volumeZScoreThreshold: 2.8,
    portScanMinUniquePorts: 6,
    repeatedConnIntervalJitterMax: 2000,
    repeatedConnMinCount: 5,
    outboundRatioThreshold: 0.8,
    rarePairHistoricalRatio: 0.015
  },
  DET_TRAFFIC_VOLUME: {
    enabled: true,
    sensitivity: 'medium',
    connectionCountMultiplier: 2.2,
    volumeZScoreThreshold: 2.8,
    portScanMinUniquePorts: 6,
    repeatedConnIntervalJitterMax: 2000,
    repeatedConnMinCount: 5,
    outboundRatioThreshold: 0.8,
    rarePairHistoricalRatio: 0.015
  },
  DET_REPEATED_CONN: {
    enabled: true,
    sensitivity: 'medium',
    connectionCountMultiplier: 2.2,
    volumeZScoreThreshold: 2.8,
    portScanMinUniquePorts: 6,
    repeatedConnIntervalJitterMax: 2000,
    repeatedConnMinCount: 5,
    outboundRatioThreshold: 0.8,
    rarePairHistoricalRatio: 0.015
  },
  DET_OUTBOUND_SURGE: {
    enabled: true,
    sensitivity: 'medium',
    connectionCountMultiplier: 2.2,
    volumeZScoreThreshold: 2.8,
    portScanMinUniquePorts: 6,
    repeatedConnIntervalJitterMax: 2000,
    repeatedConnMinCount: 5,
    outboundRatioThreshold: 0.8,
    rarePairHistoricalRatio: 0.015
  },
  DET_RARE_PAIR: {
    enabled: true,
    sensitivity: 'medium',
    connectionCountMultiplier: 2.2,
    volumeZScoreThreshold: 2.8,
    portScanMinUniquePorts: 6,
    repeatedConnIntervalJitterMax: 2000,
    repeatedConnMinCount: 5,
    outboundRatioThreshold: 0.8,
    rarePairHistoricalRatio: 0.015
  },
  DET_MULTI_SIGNAL: {
    enabled: true,
    sensitivity: 'high',
    connectionCountMultiplier: 2.2,
    volumeZScoreThreshold: 2.8,
    portScanMinUniquePorts: 6,
    repeatedConnIntervalJitterMax: 2000,
    repeatedConnMinCount: 5,
    outboundRatioThreshold: 0.8,
    rarePairHistoricalRatio: 0.015
  },
  scoringWeights: {
    anomalyScoreWeight: 1.0,
    volumeWeight: 1.2,
    rarePairWeight: 0.8,
    multiSignalBonus: 1.25
  }
};
