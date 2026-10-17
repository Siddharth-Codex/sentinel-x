import { Alert, DetectorConfig } from '../../../types/alerts';
import { FlowRecord } from '../../../types/network';
import { isPrivateIPv4 } from '../../validation/validator';
import { calculateMean, calculateStdDev, calculateZScore } from '../../statistics/math';
import { calculateConfidence, calculateSeverity, clampScore } from '../../scoring/scorer';

export function detectOutboundTrafficAnomalies(
  flows: FlowRecord[],
  config: DetectorConfig
): Alert[] {
  if (!config.enabled || flows.length === 0) return [];

  const alerts: Alert[] = [];

  // Group by internal host
  const hostOutbound = new Map<string, {
    totalBytesSent: number;
    totalBytesReceived: number;
    outboundFlows: FlowRecord[];
    externalDestinations: Set<string>;
  }>();

  for (const flow of flows) {
    const isSrcInternal = isPrivateIPv4(flow.source_ip);
    const isDstExternal = !isPrivateIPv4(flow.destination_ip);

    // Consider flow outbound if explicit direction is OUTBOUND or src is internal & dst is external
    const isOutbound = flow.direction === 'OUTBOUND' || (isSrcInternal && isDstExternal);

    if (isOutbound) {
      if (!hostOutbound.has(flow.source_ip)) {
        hostOutbound.set(flow.source_ip, {
          totalBytesSent: 0,
          totalBytesReceived: 0,
          outboundFlows: [],
          externalDestinations: new Set()
        });
      }
      const stat = hostOutbound.get(flow.source_ip)!;
      stat.totalBytesSent += flow.bytes_sent;
      stat.totalBytesReceived += flow.bytes_received;
      stat.outboundFlows.push(flow);
      stat.externalDestinations.add(flow.destination_ip);
    }
  }

  if (hostOutbound.size === 0) return [];

  // Calculate peer baseline for outbound volume
  const outboundVolumes = Array.from(hostOutbound.values()).map(h => h.totalBytesSent);
  const meanOutbound = calculateMean(outboundVolumes);
  const stdDevOutbound = calculateStdDev(outboundVolumes, meanOutbound);

  for (const [srcIp, stat] of hostOutbound.entries()) {
    const totalSent = stat.totalBytesSent;
    const totalRecv = stat.totalBytesReceived;
    const totalTraffic = totalSent + totalRecv;
    const outboundRatio = totalTraffic > 0 ? (totalSent / totalTraffic) : 0;

    const zScore = calculateZScore(totalSent, meanOutbound, stdDevOutbound);

    // Anomaly condition: high total outbound (> 5MB) AND (ratio >= 0.85 OR zScore >= 2.0)
    const isAnomalous = totalSent > 2000000 && (outboundRatio >= 0.85 || zScore >= 2.0);

    if (isAnomalous) {
      const mbSent = (totalSent / (1024 * 1024)).toFixed(2) + ' MB';
      const ratioPercent = Math.round(outboundRatio * 100);

      const anomalyScore = clampScore(65 + Math.min(30, zScore * 8 + (outboundRatio - 0.5) * 20));
      const severity = calculateSeverity(anomalyScore);
      const confidence = calculateConfidence({
        sampleSize: stat.outboundFlows.length,
        hasBaseline: hostOutbound.size >= 3,
        fieldCompletenessRate: 1.0
      });

      const earliestFlow = stat.outboundFlows[0];
      const destSummary = Array.from(stat.externalDestinations).slice(0, 3).join(', ');

      alerts.push({
        id: `ALT-OUTBOUND-${srcIp.replace(/\./g, '-')}`,
        detectorId: 'DET_OUTBOUND_SURGE',
        detectorName: 'Outbound Traffic Surge Detector',
        title: `Disproportionate outbound transfer from ${srcIp} (${mbSent}, ${ratioPercent}% upload ratio)`,
        description: `Internal endpoint ${srcIp} transmitted ${mbSent} to external hosts [${destSummary}]. Outbound traffic comprised ${ratioPercent}% of total endpoint bandwidth (Z-score: ${zScore.toFixed(2)}).`,
        timestamp: earliestFlow.timestamp,
        timestampMs: earliestFlow.timestampMs,
        source_ip: srcIp,
        anomalyScore,
        severity,
        confidence,
        status: 'OPEN',
        evidence: [
          {
            metricName: 'Total Outbound Volume',
            observedValue: mbSent,
            baselineValue: (meanOutbound / (1024 * 1024)).toFixed(2) + ' MB',
            zScore: Number(zScore.toFixed(2)),
            unit: 'MB',
            description: `Transmitted volume significantly outpaces baseline peer uploads.`
          },
          {
            metricName: 'Upload to Total Bandwidth Ratio',
            observedValue: `${ratioPercent}%`,
            threshold: '>= 80%',
            unit: '%',
            description: `Typical client browsing downloads far more than it uploads (ratio < 20%). A ${ratioPercent}% upload ratio indicates heavy data push.`
          },
          {
            metricName: 'External Destinations Contacted',
            observedValue: stat.externalDestinations.size,
            unit: 'hosts',
            description: `Traffic was addressed to ${stat.externalDestinations.size} external IP endpoints.`
          }
        ],
        supportingRecordIds: stat.outboundFlows.map(f => f.id).slice(0, 30),
        explanation: `Sustained high-volume outbound data flow where upload vastly outstrips download is consistent with data staging, archive upload, or cloud storage exfiltration.`,
        knownLimitations: `Developers pushing git commits, cloud backup agents, and video upload conferencing naturally yield inverted upload ratios.`,
        recommendedSteps: [
          `Review file system activity on ${srcIp} for compressed archives (.zip, .7z, .tar.gz) created prior to the transmission.`,
          `Check IP reputation and WHOIS ownership for destination endpoints [${destSummary}].`,
          `Interview the assigned host user regarding authorized cloud backup tasks.`
        ],
        tags: ['exfiltration', 'outbound-surge', 'data-transfer'],
        isSynthetic: flows.some(f => f.id.startsWith('flow-'))
      });
    }
  }

  return alerts;
}
