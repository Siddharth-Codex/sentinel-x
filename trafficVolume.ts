import { Alert, DetectorConfig } from '../../../types/alerts';
import { FlowRecord } from '../../../types/network';
import { calculateMAD, calculateMean, calculateMedian, calculateModifiedZScore, calculateStdDev, calculateZScore } from '../../statistics/math';
import { calculateConfidence, calculateSeverity, clampScore } from '../../scoring/scorer';

export function detectTrafficVolumeAnomalies(
  flows: FlowRecord[],
  config: DetectorConfig
): Alert[] {
  if (!config.enabled || flows.length === 0) return [];

  const alerts: Alert[] = [];
  const bytesSentList = flows.map(f => f.bytes_sent).filter(b => b > 0);

  // Require minimum sample size
  if (bytesSentList.length < 5) return [];

  const meanBytes = calculateMean(bytesSentList);
  const stdDevBytes = calculateStdDev(bytesSentList, meanBytes);
  const medianBytes = calculateMedian(bytesSentList);
  const madBytes = calculateMAD(bytesSentList, medianBytes);

  const zThreshold = config.volumeZScoreThreshold || 3.0;

  // Group by (src, dst) to aggregate multi-flow volume anomalies
  const pairAgg = new Map<string, {
    src: string;
    dst: string;
    flows: FlowRecord[];
    totalBytesSent: number;
    maxSingleFlowBytes: number;
    maxFlowRecord?: FlowRecord;
  }>();

  for (const flow of flows) {
    const key = `${flow.source_ip}->${flow.destination_ip}`;
    if (!pairAgg.has(key)) {
      pairAgg.set(key, {
        src: flow.source_ip,
        dst: flow.destination_ip,
        flows: [],
        totalBytesSent: 0,
        maxSingleFlowBytes: 0
      });
    }
    const entry = pairAgg.get(key)!;
    entry.flows.push(flow);
    entry.totalBytesSent += flow.bytes_sent;
    if (flow.bytes_sent > entry.maxSingleFlowBytes) {
      entry.maxSingleFlowBytes = flow.bytes_sent;
      entry.maxFlowRecord = flow;
    }
  }

  for (const [, entry] of pairAgg.entries()) {
    const topFlow = entry.maxFlowRecord;
    if (!topFlow) continue;

    const stdZ = calculateZScore(topFlow.bytes_sent, meanBytes, stdDevBytes);
    const modZ = calculateModifiedZScore(topFlow.bytes_sent, medianBytes, madBytes);

    // Consider anomalous if standard zScore >= threshold OR robust modified zScore >= threshold * 1.5
    const isAnomalous = (stdDevBytes > 0 && stdZ >= zThreshold) || (madBytes > 0 && modZ >= zThreshold * 1.5);

    if (isAnomalous && topFlow.bytes_sent > 100000) { // minimum 100KB to prevent low-byte false alarms
      const anomalyScore = clampScore(60 + Math.min(38, (stdZ - zThreshold) * 12 + 10));
      const severity = calculateSeverity(anomalyScore);
      const confidence = calculateConfidence({
        sampleSize: bytesSentList.length,
        minSampleSizeForHighConfidence: 20,
        hasBaseline: true,
        fieldCompletenessRate: 1.0
      });

      const formattedBytes = (topFlow.bytes_sent / (1024 * 1024)).toFixed(2) + ' MB';
      const formattedMean = (meanBytes / 1024).toFixed(1) + ' KB';

      alerts.push({
        id: `ALT-VOL-${topFlow.id}`,
        detectorId: 'DET_TRAFFIC_VOLUME',
        detectorName: 'Traffic Volume Anomaly Detector',
        title: `Extreme payload volume of ${formattedBytes} sent from ${entry.src} to ${entry.dst}`,
        description: `Flow ${topFlow.id} transmitted ${formattedBytes} in a single session, exhibiting a Z-score of ${stdZ.toFixed(2)} against the baseline dataset average of ${formattedMean}.`,
        timestamp: topFlow.timestamp,
        timestampMs: topFlow.timestampMs,
        source_ip: entry.src,
        destination_ip: entry.dst,
        destination_port: topFlow.destination_port,
        protocol: topFlow.protocol,
        anomalyScore,
        severity,
        confidence,
        status: 'OPEN',
        evidence: [
          {
            metricName: 'Bytes Sent in Flow',
            observedValue: formattedBytes,
            baselineValue: formattedMean,
            threshold: (zThreshold * stdDevBytes + meanBytes) / 1024 + ' KB',
            zScore: Number(stdZ.toFixed(2)),
            unit: 'bytes',
            description: `Single flow byte transfer of ${topFlow.bytes_sent} bytes (Z-score: ${stdZ.toFixed(2)}, Robust modified Z-score: ${modZ.toFixed(2)}).`
          },
          {
            metricName: 'Aggregated Pair Volume',
            observedValue: (entry.totalBytesSent / (1024 * 1024)).toFixed(2) + ' MB',
            unit: 'MB',
            description: `Cumulative volume between this endpoint pair totaled ${(entry.totalBytesSent / (1024 * 1024)).toFixed(2)} MB over ${entry.flows.length} flows.`
          }
        ],
        supportingRecordIds: entry.flows.map(f => f.id).slice(0, 20),
        explanation: `Sudden massive byte transfers can indicate bulk database extraction, unauthorised remote file transfers, or large patch/backup distribution.`,
        knownLimitations: `Scheduled enterprise backups, OS updates, and legitimate media streaming commonly generate large statistical volume deviations.`,
        recommendedSteps: [
          `Validate whether a scheduled backup or data synchronisation job was running at ${topFlow.timestamp}.`,
          `Check whether the destination ${entry.dst} is an internal corporate file repository or an external cloud target.`,
          `Inspect the endpoint protocol and TLS certificate name if encryption was negotiated.`
        ],
        tags: ['data-volume', 'exfiltration-risk', 'statistical-outlier'],
        isSynthetic: flows.some(f => f.id.startsWith('flow-'))
      });
    }
  }

  return alerts;
}
