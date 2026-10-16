import { Severity } from '../../types/alerts';

/**
 * Transparent scoring system separating:
 * 1. Anomaly Score (0-100): How statistically/heuristically divergent the behavior is.
 * 2. Risk Severity: Operational priority based on anomaly magnitude, asset context, and impact.
 * 3. Confidence (0-100): Quality, depth, and consistency of the supporting evidence.
 */

export function calculateSeverity(anomalyScore: number, contextMultiplier = 1.0): Severity {
  const adjustedScore = anomalyScore * contextMultiplier;
  if (adjustedScore >= 85) return 'CRITICAL';
  if (adjustedScore >= 70) return 'HIGH';
  if (adjustedScore >= 45) return 'MEDIUM';
  if (adjustedScore >= 25) return 'LOW';
  return 'INFORMATIONAL';
}

export function calculateConfidence(factors: {
  sampleSize: number;
  minSampleSizeForHighConfidence?: number;
  hasBaseline: boolean;
  fieldCompletenessRate: number; // 0 to 1
  consistencyScore?: number; // 0 to 1
}): number {
  const minSamples = factors.minSampleSizeForHighConfidence || 15;
  const sampleFactor = Math.min(1.0, factors.sampleSize / minSamples);
  const baselineFactor = factors.hasBaseline ? 1.0 : 0.65;
  const completenessFactor = Math.max(0.2, factors.fieldCompletenessRate);
  const consistencyFactor = factors.consistencyScore !== undefined ? factors.consistencyScore : 0.8;

  const rawConfidence = (sampleFactor * 0.35 + baselineFactor * 0.25 + completenessFactor * 0.2 + consistencyFactor * 0.2) * 100;
  return Math.min(100, Math.max(10, Math.round(rawConfidence)));
}

export function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}
