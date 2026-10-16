import { Alert, DetectorConfig } from '../../../types/alerts';
import { FlowRecord } from '../../../types/network';
import { calculateMean, calculateStdDev, calculateZScore } from '../../statistics/math';
import { calculateConfidence, calculateSeverity, clampScore } from '../../scoring/scorer';

export function detectUnusualConnectionCount(
  flows: FlowRecord[],
  config: DetectorConfig
): Alert[] {
  if (!config.enabled || flows.length === 0) return [];

  const alerts: Alert[] = [];
  // Group flows by source IP
  const hostStats = new Map<string, { destinations: Set<string>; flowIds: string[]; timestamps: number[] }>();

  for (const flow of flows) {
    if (!hostStats.has(flow.source_ip)) {
      hostStats.set(flow.source_ip, {
        destinations: new Set(),
        flowIds: [],
        timestamps: []
      });
    }
    const stat = hostStats.get(flow.source_ip)!;
    stat.destinations.add(flow.destination_ip);
    stat.flowIds.push(flow.id);
    stat.timestamps.push(flow.timestampMs);
  }

  // Calculate baseline metrics across all source hosts
  const hostDestCounts = Array.from(hostStats.values()).map(s => s.destinations.size);
  if (hostDestCounts.length === 0) return [];

  const meanDestCount = calculateMean(hostDestCounts);
  const stdDevDestCount = calculateStdDev(hostDestCounts, meanDestCount);

  for (const [srcIp, stat] of hostStats.entries()) {
    const uniqueDests = stat.destinations.size;
    const zScore = calculateZScore(uniqueDests, meanDestCount, stdDevDestCount);

    // Dynamic threshold: at least multiplier * mean, or high zScore (> 2.0)
    const threshold = Math.max(3, Math.round(meanDestCount * config.connectionCountMultiplier));
    const isAnomalous = uniqueDests > threshold && (stdDevDestCount === 0 || zScore >= 1.8);

    if (isAnomalous) {
      // Calculate anomaly score
      const scoreRatio = uniqueDests / Math.max(1, threshold);
      const anomalyScore = clampScore(50 + Math.min(48, (scoreRatio - 1) * 30 + zScore * 6));
      const severity = calculateSeverity(anomalyScore);
      const confidence = calculateConfidence({
        sampleSize: stat.flowIds.length,
        hasBaseline: hostStats.size >= 3,
        fieldCompletenessRate: 1.0
      });

      const earliestTime = new Date(Math.min(...stat.timestamps)).toISOString();

      alerts.push({
        id: `ALT-CONN-${srcIp.replace(/\./g, '-')}`,
        detectorId: 'DET_CONN_COUNT',
        detectorName: 'Unusual Connection Count Detector',
        title: `Host ${srcIp} contacted anomalous number of unique endpoints (${uniqueDests})`,
        description: `Source device ${srcIp} initiated connections to ${uniqueDests} unique destination IP addresses within the analysed window, substantially exceeding the peer baseline average of ${meanDestCount.toFixed(1)}.`,
        timestamp: earliestTime,
        timestampMs: Math.min(...stat.timestamps),
        source_ip: srcIp,
        anomalyScore,
        severity,
        confidence,
        status: 'OPEN',
        evidence: [
          {
            metricName: 'Unique Destination Count',
            observedValue: uniqueDests,
            baselineValue: meanDestCount.toFixed(1),
            threshold,
            zScore: Number(zScore.toFixed(2)),
            unit: 'endpoints',
            description: `Observed ${uniqueDests} unique destinations against network average of ${meanDestCount.toFixed(1)} (Z-score: ${zScore.toFixed(2)}).`
          },
          {
            metricName: 'Total Initiated Flows',
            observedValue: stat.flowIds.length,
            unit: 'flows',
            description: `Host generated ${stat.flowIds.length} total flow records during observation.`
          }
        ],
        supportingRecordIds: stat.flowIds.slice(0, 50),
        explanation: `A single device connecting to a wide array of destinations in an abbreviated timeframe is characteristic of reconnaissance, lateral host sweeps, or an automated network inventory agent.`,
        knownLimitations: `Network scanning, vulnerability assessment scanners, web proxies, and central monitoring relays normally maintain high destination fan-out.`,
        recommendedSteps: [
          `Verify device function (e.g., determine if ${srcIp} is an approved vulnerability scanner or central gateway).`,
          `Inspect the port distribution of the destinations to verify if identical ports were targeted across all endpoints.`,
          `Check endpoint authentication logs on ${srcIp} around ${earliestTime}.`
        ],
        tags: ['lateral-movement', 'reconnaissance', 'fan-out'],
        isSynthetic: flows.some(f => f.id.startsWith('flow-'))
      });
    }
  }

  return alerts;
}
