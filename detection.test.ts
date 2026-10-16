import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCsvContent } from '../lib/csv/parser.ts';
import { sanitizeCsvCell } from '../lib/csv/sanitizer.ts';
import { inferColumnMapping } from '../lib/csv/mapping.ts';
import { isValidIPv4, isValidPort, parseTimestamp, validateAndTransformRecords } from '../lib/validation/validator.ts';
import { calculateMean, calculateStdDev, calculateZScore, calculateMedian, calculateMAD } from '../lib/statistics/math.ts';
import { calculateSeverity, calculateConfidence } from '../lib/scoring/scorer.ts';
import { runDetectionPipeline } from '../lib/detection/engine.ts';
import { generateSyntheticDataset } from '../data/demoDataset.ts';
import { DEFAULT_DETECTOR_CONFIG } from '../data/defaultConfig.ts';

test('CSV Parser: parses basic CSV, quotes, commas inside quotes, escaped quotes', () => {
  const sample = `source_ip,destination_ip,protocol,notes
192.168.1.10,10.0.0.1,TCP,"standard, connection"
192.168.1.20,10.0.0.2,UDP,"escaped ""quote"" text"
`;
  const result = parseCsvContent(sample);
  assert.equal(result.headers.length, 4);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].notes, 'standard, connection');
  assert.equal(result.rows[1].notes, 'escaped "quote" text');
});

test('CSV Sanitizer: neutralizes formula injection', () => {
  assert.equal(sanitizeCsvCell('=SUM(A1:A10)'), "'=SUM(A1:A10)");
  assert.equal(sanitizeCsvCell('+cmd|'), "'+cmd|");
  assert.equal(sanitizeCsvCell('@test'), "'@test");
  assert.equal(sanitizeCsvCell('normal-text'), 'normal-text');
});

test('CSV Mapping: auto-detects standard network aliases', () => {
  const headers = ['src_ip', 'dst_ip', 'sport', 'dport', 'proto', 'time', 'bytes'];
  const mapping = inferColumnMapping(headers);
  assert.equal(mapping.source_ip, 'src_ip');
  assert.equal(mapping.destination_ip, 'dst_ip');
  assert.equal(mapping.source_port, 'sport');
  assert.equal(mapping.destination_port, 'dport');
  assert.equal(mapping.protocol, 'proto');
  assert.equal(mapping.timestamp, 'time');
  assert.equal(mapping.bytes_sent, 'bytes');
});

test('Validation: IP, Port, and Timestamp checks', () => {
  assert.equal(isValidIPv4('192.168.1.1'), true);
  assert.equal(isValidIPv4('256.1.1.1'), false);
  assert.equal(isValidIPv4('abc.def.ghi.jkl'), false);
  assert.equal(isValidIPv4('10.0.0.01'), false);

  assert.equal(isValidPort(80), true);
  assert.equal(isValidPort(65535), true);
  assert.equal(isValidPort(70000), false);
  assert.equal(isValidPort(-1), false);

  const parsed = parseTimestamp('2026-10-16T10:00:00Z');
  assert.ok(parsed !== null);
  assert.ok(parsed.ms > 0);
});

test('Statistics Math: mean, stddev, zScore, median, MAD', () => {
  const values = [10, 20, 30, 40, 50];
  assert.equal(calculateMean(values), 30);
  assert.equal(calculateMedian(values), 30);
  assert.ok(calculateStdDev(values) > 0);

  const z = calculateZScore(50, 30, 10);
  assert.equal(z, 2.0);

  const mad = calculateMAD([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.ok(mad >= 0);
});

test('Scoring: correctly categorizes severity', () => {
  assert.equal(calculateSeverity(90), 'CRITICAL');
  assert.equal(calculateSeverity(75), 'HIGH');
  assert.equal(calculateSeverity(50), 'MEDIUM');
  assert.equal(calculateSeverity(30), 'LOW');
  assert.equal(calculateSeverity(15), 'INFORMATIONAL');

  const conf = calculateConfidence({
    sampleSize: 20,
    hasBaseline: true,
    fieldCompletenessRate: 1.0
  });
  assert.ok(conf >= 80);
});

test('Detection Engine: successfully flags synthetic threat scenarios', () => {
  const flows = generateSyntheticDataset('standard');
  assert.ok(flows.length > 200);

  const result = runDetectionPipeline(flows, DEFAULT_DETECTOR_CONFIG);
  assert.ok(result.alerts.length >= 4);

  // Check that Port Scan on 192.168.1.105 is flagged
  const portScanAlert = result.alerts.find(a => a.source_ip === '192.168.1.105' && a.detectorId === 'DET_PORT_ANOMALY');
  assert.ok(portScanAlert !== undefined, 'Port scan alert must be generated');

  // Check that Beaconing from 192.168.1.140 is flagged
  const beaconAlert = result.alerts.find(a => a.source_ip === '192.168.1.140' && a.detectorId === 'DET_REPEATED_CONN');
  assert.ok(beaconAlert !== undefined, 'Beaconing alert must be generated');

  // Check that Outbound surge or high volume from 192.168.1.120 is flagged
  const surgeAlert = result.alerts.find(a => a.source_ip === '192.168.1.120');
  assert.ok(surgeAlert !== undefined, 'Data surge alert must be generated');

  // Check that Lateral fanout from 192.168.1.200 is flagged
  const fanoutAlert = result.alerts.find(a => a.source_ip === '192.168.1.200');
  assert.ok(fanoutAlert !== undefined, 'Lateral fanout alert must be generated');
});
