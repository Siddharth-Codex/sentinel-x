import { Alert, DetectorConfig } from '../../../types/alerts';
import { calculateSeverity, clampScore } from '../../scoring/scorer';

export function correlateMultiSignalAlerts(
  baseAlerts: Alert[],
  config: DetectorConfig
): Alert[] {
  if (!config.enabled || baseAlerts.length < 2) return [];

  const correlatedAlerts: Alert[] = [];
  // Group alerts by source IP
  const hostAlerts = new Map<string, Alert[]>();

  for (const alert of baseAlerts) {
    if (alert.detectorId === 'DET_MULTI_SIGNAL') continue;
    if (!hostAlerts.has(alert.source_ip)) {
      hostAlerts.set(alert.source_ip, []);
    }
    hostAlerts.get(alert.source_ip)!.push(alert);
  }

  for (const [srcIp, alerts] of hostAlerts.entries()) {
    // Unique detectors triggered for this host
    const detectorSet = new Set(alerts.map(a => a.detectorId));

    if (detectorSet.size >= 2) {
      // Host triggered at least two separate detection mechanisms!
      const triggeredNames = Array.from(detectorSet).map(d => {
        const matching = alerts.find(a => a.detectorId === d);
        return matching?.detectorName || d;
      });

      // Combine scores: max score + bonus for multi-signal verification
      const maxScore = Math.max(...alerts.map(a => a.anomalyScore));
      const compositeScore = clampScore(maxScore + (detectorSet.size - 1) * 12);
      const severity = calculateSeverity(compositeScore, 1.15); // Multi-signal multiplier

      const allSupportingIds = Array.from(new Set(alerts.flatMap(a => a.supportingRecordIds)));
      const earliestTimestamp = alerts.reduce((min, a) => a.timestampMs < min.timestampMs ? a : min, alerts[0]);

      correlatedAlerts.push({
        id: `ALT-CORR-${srcIp.replace(/\./g, '-')}`,
        detectorId: 'DET_MULTI_SIGNAL',
        detectorName: 'Multi-Signal Correlation Engine',
        title: `Correlated multi-stage anomalous activity on ${srcIp} (${detectorSet.size} distinct detectors)`,
        description: `Correlated evidence observed on ${srcIp} involving ${detectorSet.size} distinct anomaly categories: [${triggeredNames.join(', ')}]. Cross-detector correlation significantly elevates operational threat priority.`,
        timestamp: earliestTimestamp.timestamp,
        timestampMs: earliestTimestamp.timestampMs,
        source_ip: srcIp,
        anomalyScore: compositeScore,
        severity: severity === 'HIGH' && compositeScore >= 80 ? 'CRITICAL' : severity,
        confidence: Math.min(98, Math.max(...alerts.map(a => a.confidence)) + 15),
        status: 'OPEN',
        evidence: [
          {
            metricName: 'Distinct Detectors Triggered',
            observedValue: detectorSet.size,
            threshold: '>= 2 detectors',
            unit: 'detectors',
            description: `Triggered independent detectors: ${triggeredNames.join('; ')}`
          },
          {
            metricName: 'Underlying Component Alerts',
            observedValue: alerts.length,
            unit: 'alerts',
            description: `Composite of alert IDs: ${alerts.map(a => a.id).join(', ')}`
          },
          {
            metricName: 'Composite Anomaly Score',
            observedValue: compositeScore,
            threshold: 70,
            description: `Score elevated based on cross-signal validation bonus.`
          }
        ],
        supportingRecordIds: allSupportingIds.slice(0, 50),
        explanation: `When a single network entity exhibits both lateral reconnaissance (such as port enumeration or wide connection fan-out) alongside high-volume outbound data flow or periodic beaconing, the probability of an active multi-stage incident increases substantially.`,
        knownLimitations: `Legitimate penetration testing drills or heavy multi-purpose admin systems can generate multiple concurrent anomaly signatures.`,
        recommendedSteps: [
          `Initiate an incident response case immediately for ${srcIp}.`,
          `Quarantine or isolate host from internal subnets while retaining memory image.`,
          `Analyze all related alert IDs (${alerts.map(a => a.id).join(', ')}) in the Attack Storyline view.`,
          `Review endpoint process creation logs corresponding to the timeframe ${earliestTimestamp.timestamp}.`
        ],
        tags: ['multi-stage', 'correlated-threat', 'high-priority', 'composite-incident'],
        isSynthetic: alerts.some(a => a.isSynthetic)
      });
    }
  }

  return correlatedAlerts;
}
