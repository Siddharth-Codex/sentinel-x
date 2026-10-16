/**
 * Statistical calculations for network anomaly detection.
 * Designed to safely handle small sample sizes, zero variance, and skewed distributions.
 */

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

export function calculateVariance(values: number[], mean?: number): number {
  if (values.length < 2) return 0;
  const m = mean !== undefined ? mean : calculateMean(values);
  const squaredDiffs = values.map(v => Math.pow(v - m, 2));
  return squaredDiffs.reduce((acc, v) => acc + v, 0) / (values.length - 1);
}

export function calculateStdDev(values: number[], mean?: number): number {
  const variance = calculateVariance(values, mean);
  return Math.sqrt(variance);
}

export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev <= 0.000001) return 0;
  return (value - mean) / stdDev;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function calculatePercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  if (p <= 0) return Math.min(...values);
  if (p >= 100) return Math.max(...values);
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (upper >= sorted.length) return sorted[sorted.length - 1];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Median Absolute Deviation (MAD) is robust against extreme outliers.
 */
export function calculateMAD(values: number[], median?: number): number {
  if (values.length === 0) return 0;
  const med = median !== undefined ? median : calculateMedian(values);
  const absoluteDeviations = values.map(v => Math.abs(v - med));
  return calculateMedian(absoluteDeviations);
}

/**
 * Modified Z-Score based on median and MAD (Iglewicz and Hoaglin)
 * Score = 0.6745 * (x - median) / MAD
 */
export function calculateModifiedZScore(value: number, median: number, mad: number): number {
  if (mad <= 0.000001) return 0;
  return (0.6745 * (value - median)) / mad;
}
