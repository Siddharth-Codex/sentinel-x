import { Alert, DetectorConfig } from '../../../types/alerts';
import { FlowRecord } from '../../../types/network';
import { calculateMean, calculateStdDev } from '../../statistics/math';
import { calculateConfidence, calculateSeverity, clampScore } from '../../scoring/scorer';

export function detectRepeatedConnectionPatterns(
  flows: FlowRecord[],
  config: DetectorConfig
): Alert[] {
  if (!config.enabled || flows.length === 0) return [];

  const alerts: Alert[] = [];
  const minRepeats = config.repeatedConnMinCount || 5;
  const maxJitterMs = config.repeatedConnIntervalJitterMax || 2500; // 2.5s jitter threshold

  // Group by (source_ip, destination_ip, destination_port)
  const patternMap = new Map<string, {
    src: string;
    dst: string;
    port: number;
    protocol: string;
    flows: FlowRecord[];
  }>();

  for (const flow of flows) {
    const key = `${flow.source_ip}->${flow.destination_ip}:${flow.destination_port}`;
    if (!patternMap.has(key)) {
      patternMap.set(key, {
        src: flow.source_ip,
        dst: flow.destination_ip,
        port: flow.destination_port,
        protocol: flow.protocol,
        flows: []
      });
    }
    patternMap.get(key)!.flows.push(flow);
  }

  for (const [, entry] of patternMap.entries()) {
    if (entry.flows.length < minRepeats) continue;

    // Sort flows chronologically
    const sortedFlows = [...entry.flows].sort((a, b) => a.timestampMs - b.timestampMs);
    const intervals: number[] = [];

    for (let i = 1; i < sortedFlows.length; i++) {
      const delta = sortedFlows[i].timestampMs - sortedFlows[i - 1].timestampMs;
      if (delta > 0) {
        intervals.push(delta);
      }
    }

    if (intervals.length < minRepeats - 1) continue;

    const meanInterval = calculateMean(intervals);
    const stdDevInterval = calculateStdDev(intervals, meanInterval);

    // If mean interval is regular (> 1s and < 3600s) and jitter (stdDev) is low
    // Low jitter ratio: stdDev / mean < 0.25 OR stdDev < maxJitterMs
    const isPeriodic = (meanInterval >= 1000 && meanInterval <= 300000) &&
                       ((stdDevInterval / meanInterval < 0.25) || stdDevInterval <= maxJitterMs);

    if (isPeriodic) {
      const intervalSec = (meanInterval / 1000).toFixed(1);
      const jitterSec = (stdDevInterval / 1000).toFixed(2);
      
      const regularityScore = Math.max(0, 1 - (stdDevInterval / meanInterval));
      const anomalyScore = clampScore(65 + regularityScore * 25 + Math.min(10, (entry.flows.length - minRepeats) * 2));
      const severity = calculateSeverity(anomalyScore);
      const confidence = calculateConfidence({
        sampleSize: entry.flows.length,
        minSampleSizeForHighConfidence: 10,
        hasBaseline: true,
        fieldCompletenessRate: 1.0,
        consistencyScore: regularityScore
      });

      alerts.push({
        id: `ALT-BEACON-${entry.src.replace(/\./g, '-')}-${entry.dst.replace(/\./g, '-')}`,
        detectorId: 'DET_REPEATED_CONN',
        detectorName: 'Repeated Pattern & Beaconing Detector',
        title: `Automated periodic beaconing from ${entry.src} to ${entry.dst}:${entry.port} (~${intervalSec}s cadence)`,
        description: `Host ${entry.src} generated ${entry.flows.length} highly repetitive connections to ${entry.dst}:${entry.port} at an average recurrence interval of ${intervalSec}s (jitter: ±${jitterSec}s).`,
        timestamp: sortedFlows[0].timestamp,
        timestampMs: sortedFlows[0].timestampMs,
        source_ip: entry.src,
        destination_ip: entry.dst,
        destination_port: entry.port,
        protocol: entry.protocol,
        anomalyScore,
        severity,
        confidence,
        status: 'OPEN',
        evidence: [
          {
            metricName: 'Observed Recurrence Interval',
            observedValue: `${intervalSec} seconds`,
            unit: 'seconds',
            description: `Consistent cadence observed across ${intervals.length} consecutive connection cycles.`
          },
          {
            metricName: 'Interval Jitter (Std Dev)',
            observedValue: `±${jitterSec} seconds`,
            threshold: `< ${maxJitterMs / 1000} seconds`,
            unit: 'seconds',
            description: `Extremely low timing deviation indicates scripted or programmatic execution rather than human interaction.`
          },
          {
            metricName: 'Total Repetitions',
            observedValue: entry.flows.length,
            threshold: minRepeats,
            unit: 'flows',
            description: `Total connection count in the periodic series.`
          }
        ],
        supportingRecordIds: sortedFlows.map(f => f.id).slice(0, 50),
        explanation: `Strict, low-jitter periodic polling is a classic indicator of malware Command & Control (C2) heartbeat beaconing, keeping communications alive or checking for staged tasks.`,
        knownLimitations: `NTP synchronization, telemetry heartbeats, health-check probes, and push-notification web sockets also generate periodic intervals.`,
        recommendedSteps: [
          `Inspect DNS records to see which domain name resolved to ${entry.dst}.`,
          `Check process persistence mechanisms on ${entry.src} (scheduled tasks, cron jobs, registry run keys).`,
          `Analyze the HTTP/TLS payload to determine if request content contains base64 or encrypted telemetry.`
        ],
        tags: ['c2-beacon', 'heartbeat', 'automated-traffic'],
        isSynthetic: flows.some(f => f.id.startsWith('flow-'))
      });
    }
  }

  return alerts;
}
