import { Alert, DetectorConfig } from '../../../types/alerts';
import { FlowRecord } from '../../../types/network';
import { calculateConfidence, calculateSeverity, clampScore } from '../../scoring/scorer';

export function detectRareCommunicationPairs(
  flows: FlowRecord[],
  config: DetectorConfig
): Alert[] {
  if (!config.enabled || flows.length < 10) return [];

  const alerts: Alert[] = [];
  const pairCounts = new Map<string, {
    src: string;
    dst: string;
    port: number;
    protocol: string;
    count: number;
    flows: FlowRecord[];
  }>();

  for (const flow of flows) {
    const key = `${flow.source_ip}->${flow.destination_ip}`;
    if (!pairCounts.has(key)) {
      pairCounts.set(key, {
        src: flow.source_ip,
        dst: flow.destination_ip,
        port: flow.destination_port,
        protocol: flow.protocol,
        count: 0,
        flows: []
      });
    }
    const entry = pairCounts.get(key)!;
    entry.count++;
    entry.flows.push(flow);
  }

  const totalFlows = flows.length;
  // Look for pairs that occur in less than 0.5% of total flows AND involve uncommon protocols or high byte transfers
  for (const [, entry] of pairCounts.entries()) {
    const pairFrequency = entry.count / totalFlows;
    const isRare = entry.count <= 2 && pairFrequency <= 0.015;

    // Filter to interesting rare pairs (e.g. rare SSH, database port, or significant bytes)
    const hasUncommonPort = [22, 23, 1433, 3306, 5432, 4444, 8080, 8443, 9001].includes(entry.port);
    const hasHighBytes = entry.flows.some(f => f.bytes_sent > 50000);

    if (isRare && (hasUncommonPort || hasHighBytes)) {
      const anomalyScore = clampScore(52 + (hasUncommonPort ? 20 : 0) + (hasHighBytes ? 15 : 0));
      const severity = calculateSeverity(anomalyScore);
      const confidence = calculateConfidence({
        sampleSize: totalFlows,
        minSampleSizeForHighConfidence: 50,
        hasBaseline: true,
        fieldCompletenessRate: 1.0
      });

      const firstFlow = entry.flows[0];

      alerts.push({
        id: `ALT-RAREPAIR-${entry.src.replace(/\./g, '-')}-${entry.dst.replace(/\./g, '-')}`,
        detectorId: 'DET_RARE_PAIR',
        detectorName: 'Rare Communication Pair Detector',
        title: `Rare endpoint communication between ${entry.src} and ${entry.dst}:${entry.port}`,
        description: `Source ${entry.src} initiated an atypical connection with destination ${entry.dst} on port ${entry.port} (${entry.protocol}). This pair accounts for only ${(pairFrequency * 100).toFixed(2)}% of all observed flows.`,
        timestamp: firstFlow.timestamp,
        timestampMs: firstFlow.timestampMs,
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
            metricName: 'Observed Pair Frequency',
            observedValue: `${entry.count} flow(s)`,
            threshold: `< 2 occurrences (${(pairFrequency * 100).toFixed(2)}% of traffic)`,
            unit: 'flows',
            description: `Only ${entry.count} instance(s) observed across ${totalFlows} total network flow records in the dataset.`
          },
          {
            metricName: 'Destination Port Context',
            observedValue: `${entry.port} / ${entry.protocol}`,
            description: hasUncommonPort ? `Port ${entry.port} is typically restricted to administrative or internal database traffic.` : `Standard port with anomalous isolation.`
          }
        ],
        supportingRecordIds: entry.flows.map(f => f.id),
        explanation: `Isolated, low-frequency connections between hosts that do not regularly communicate may represent initial access attempts, lateral movement probing, or out-of-band data staging.`,
        knownLimitations: `Findings are computed relative to the currently loaded dataset window only. Endpoints with infrequent legitimate administrative routines may register as rare pairs.`,
        recommendedSteps: [
          `Verify whether network segmentation policies permit communication between ${entry.src} and ${entry.dst}.`,
          `Check if authentication credentials were exchanged during the session.`,
          `Ascertain whether ${entry.src} has historical justification for accessing port ${entry.port}.`
        ],
        tags: ['rare-pair', 'segmentation-audit', 'unusual-path'],
        isSynthetic: flows.some(f => f.id.startsWith('flow-'))
      });
    }
  }

  return alerts;
}
