import { Alert, DetectorConfig } from '../../../types/alerts';
import { FlowRecord } from '../../../types/network';
import { calculateConfidence, calculateSeverity, clampScore } from '../../scoring/scorer';

const SUSPICIOUS_PORT_MAP: Record<number, string> = {
  4444: 'Metasploit default listener',
  1337: 'Elite trojan / bind shell port',
  31337: 'Back Orifice backdoor',
  5555: 'Android ADB remote access',
  6667: 'IRC C2 communication channel',
  9001: 'Tor default relay / C2 proxy',
  3389: 'RDP remote desktop (high risk across untrusted zone)'
};

export function detectUnusualPortBehaviour(
  flows: FlowRecord[],
  config: DetectorConfig
): Alert[] {
  if (!config.enabled || flows.length === 0) return [];

  const alerts: Alert[] = [];

  // Group by (source_ip, destination_ip) -> destination_ports
  const pairPortMap = new Map<string, {
    src: string;
    dst: string;
    ports: Set<number>;
    flowIds: string[];
    timestamps: number[];
  }>();

  // Also collect known suspicious port encounters
  const suspiciousHits = new Map<string, {
    src: string;
    dst: string;
    port: number;
    reason: string;
    flowIds: string[];
    timestamps: number[];
  }>();

  for (const flow of flows) {
    const pairKey = `${flow.source_ip}->${flow.destination_ip}`;
    if (!pairPortMap.has(pairKey)) {
      pairPortMap.set(pairKey, {
        src: flow.source_ip,
        dst: flow.destination_ip,
        ports: new Set(),
        flowIds: [],
        timestamps: []
      });
    }
    const entry = pairPortMap.get(pairKey)!;
    entry.ports.add(flow.destination_port);
    entry.flowIds.push(flow.id);
    entry.timestamps.push(flow.timestampMs);

    // Check suspicious port list
    if (SUSPICIOUS_PORT_MAP[flow.destination_port]) {
      const susKey = `${flow.source_ip}->${flow.destination_port}`;
      if (!suspiciousHits.has(susKey)) {
        suspiciousHits.set(susKey, {
          src: flow.source_ip,
          dst: flow.destination_ip,
          port: flow.destination_port,
          reason: SUSPICIOUS_PORT_MAP[flow.destination_port],
          flowIds: [],
          timestamps: []
        });
      }
      const hit = suspiciousHits.get(susKey)!;
      hit.flowIds.push(flow.id);
      hit.timestamps.push(flow.timestampMs);
    }
  }

  // 1. Check for Vertical Port Scanning (many ports on one target)
  const minScanPorts = config.portScanMinUniquePorts || 8;
  for (const [, entry] of pairPortMap.entries()) {
    if (entry.ports.size >= minScanPorts) {
      const anomalyScore = clampScore(65 + Math.min(30, (entry.ports.size - minScanPorts) * 4));
      const severity = calculateSeverity(anomalyScore);
      const confidence = calculateConfidence({
        sampleSize: entry.ports.size,
        minSampleSizeForHighConfidence: 10,
        hasBaseline: true,
        fieldCompletenessRate: 1.0
      });

      const earliestTime = new Date(Math.min(...entry.timestamps)).toISOString();
      const portArray = Array.from(entry.ports).sort((a, b) => a - b);
      const samplePorts = portArray.slice(0, 10).join(', ') + (portArray.length > 10 ? '...' : '');

      alerts.push({
        id: `ALT-PORTSCAN-${entry.src.replace(/\./g, '-')}-${entry.dst.replace(/\./g, '-')}`,
        detectorId: 'DET_PORT_ANOMALY',
        detectorName: 'Port Behaviour & Scanning Detector',
        title: `Rapid port enumeration from ${entry.src} against ${entry.dst} (${entry.ports.size} ports)`,
        description: `Source ${entry.src} queried ${entry.ports.size} distinct destination ports on destination host ${entry.dst}. Sample ports tested: [${samplePorts}].`,
        timestamp: earliestTime,
        timestampMs: Math.min(...entry.timestamps),
        source_ip: entry.src,
        destination_ip: entry.dst,
        anomalyScore,
        severity,
        confidence,
        status: 'OPEN',
        evidence: [
          {
            metricName: 'Unique Destination Ports',
            observedValue: entry.ports.size,
            threshold: minScanPorts,
            unit: 'ports',
            description: `Host connected to ${entry.ports.size} unique ports on ${entry.dst}, exceeding scanning threshold of ${minScanPorts}.`
          },
          {
            metricName: 'Probed Port Sample',
            observedValue: samplePorts,
            description: `Subset of ports observed: ${samplePorts}`
          }
        ],
        supportingRecordIds: entry.flowIds.slice(0, 50),
        explanation: `Sequential or distributed destination port probing is a hallmark of service enumeration, network vulnerability auditing, or automated penetration testing.`,
        knownLimitations: `Network monitoring utilities or multi-channel microservice discovery proxies can legitimately connect to high numbers of dynamic ports.`,
        recommendedSteps: [
          `Review the state of ports probed to determine if any services responded with open/established connections.`,
          `Correlate with local host process logs on ${entry.src} to determine which binary initiated the connection burst.`,
          `Check whether ${entry.dst} hosts sensitive database or management consoles.`
        ],
        tags: ['reconnaissance', 'port-scan', 'vertical-enumeration'],
        isSynthetic: flows.some(f => f.id.startsWith('flow-'))
      });
    }
  }

  // 2. Suspicious signature ports
  for (const [, hit] of suspiciousHits.entries()) {
    const anomalyScore = 78;
    const severity = calculateSeverity(anomalyScore);
    const confidence = calculateConfidence({
      sampleSize: hit.flowIds.length,
      hasBaseline: true,
      fieldCompletenessRate: 1.0
    });
    const earliestTime = new Date(Math.min(...hit.timestamps)).toISOString();

    alerts.push({
      id: `ALT-SUSPORT-${hit.src.replace(/\./g, '-')}-${hit.port}`,
      detectorId: 'DET_PORT_ANOMALY',
      detectorName: 'Unusual Destination Port Detector',
      title: `Flow to known high-risk signature port ${hit.port} (${hit.reason})`,
      description: `Traffic originating from ${hit.src} addressed destination port ${hit.port} (${hit.reason}) on ${hit.dst}.`,
      timestamp: earliestTime,
      timestampMs: Math.min(...hit.timestamps),
      source_ip: hit.src,
      destination_ip: hit.dst,
      destination_port: hit.port,
      anomalyScore,
      severity,
      confidence,
      status: 'OPEN',
      evidence: [
        {
          metricName: 'Destination Port',
          observedValue: hit.port,
          description: `Associated with signature: ${hit.reason}`
        },
        {
          metricName: 'Observed Flow Occurrences',
          observedValue: hit.flowIds.length,
          unit: 'flows',
          description: `Observed ${hit.flowIds.length} flows targeting this destination port.`
        }
      ],
      supportingRecordIds: hit.flowIds.slice(0, 30),
      explanation: `Port ${hit.port} is non-standard for normal web or enterprise operations and is frequently utilized by remote access tools or reverse shells.`,
      knownLimitations: `Custom internal enterprise microservices occasionally bind to arbitrary high port numbers.`,
      recommendedSteps: [
        `Isolate endpoint ${hit.src} pending forensic verification if payload inspection confirms unauthorized shell access.`,
        `Inspect network gateway logs for outbound protocol payload matching known C2 signatures.`
      ],
      tags: ['c2-port', 'suspicious-port', 'trojan-indicator'],
      isSynthetic: flows.some(f => f.id.startsWith('flow-'))
    });
  }

  return alerts;
}
