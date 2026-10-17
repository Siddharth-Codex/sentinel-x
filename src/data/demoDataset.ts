import { FlowRecord } from '../types/network';

export interface DemoScenarioInfo {
  name: string;
  description: string;
  expectedAlerts: string[];
  keyEndpoints: string[];
}

export const DEMO_SCENARIOS: DemoScenarioInfo[] = [
  {
    name: 'Multi-Stage Host Compromise & Reconnaissance',
    description: 'Workstation 192.168.1.105 scans database server 10.0.0.50 across 12 distinct ports seeking vulnerable administrative services.',
    expectedAlerts: ['Vertical Port Scan', 'Multi-Signal Correlation'],
    keyEndpoints: ['192.168.1.105', '10.0.0.50']
  },
  {
    name: 'Command & Control Beaconing',
    description: 'Infected endpoint 192.168.1.140 beacons out to external IP 198.51.100.45:4444 every 5 seconds with negligible jitter.',
    expectedAlerts: ['Repeated Connection Pattern (Beaconing)', 'Suspicious Signature Port 4444'],
    keyEndpoints: ['192.168.1.140', '198.51.100.45']
  },
  {
    name: 'Bulk Data Exfiltration Surge',
    description: 'Finance host 192.168.1.120 transfers 18.4 MB of staged archive data to an unclassified external cloud endpoint 203.0.113.88.',
    expectedAlerts: ['Outbound Traffic Surge', 'Extreme Payload Volume'],
    keyEndpoints: ['192.168.1.120', '203.0.113.88']
  },
  {
    name: 'Internal Lateral Sweep (Fan-Out)',
    description: 'Host 192.168.1.200 attempts connections to 16 disparate internal subnet hosts in a lateral movement sweep.',
    expectedAlerts: ['Unusual Connection Count'],
    keyEndpoints: ['192.168.1.200']
  }
];

// Seeded pseudorandom number generator for strictly deterministic synthetic data
function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateSyntheticDataset(mode: 'standard' | 'small' = 'standard'): FlowRecord[] {
  const flows: FlowRecord[] = [];
  const rand = pseudoRandom(42);

  // Reference base timestamp: 2026-10-16 10:00:00 UTC
  const baseTimeMs = 1792144800000;
  let flowSeq = 1;

  const internalHosts = [
    '192.168.1.10', '192.168.1.15', '192.168.1.22', '192.168.1.33',
    '192.168.1.45', '192.168.1.55', '192.168.1.70', '192.168.1.88'
  ];

  const internalServers = [
    '10.0.0.10', // Active Directory / DNS
    '10.0.0.20', // Internal Intranet Web Server
    '10.0.0.50', // Core Database Server
    '10.0.0.80'  // Internal Git & CI/CD
  ];

  const externalServers = [
    '142.250.190.46', // Google Cloud Services
    '151.101.65.140', // CDN / Edge Provider
    '20.112.52.29',   // Azure Web Host
    '104.16.132.229'  // Cloudflare CDN
  ];

  const normalCount = mode === 'small' ? 40 : 220;

  // 1. Generate Normal Background Traffic
  for (let i = 0; i < normalCount; i++) {
    const src = internalHosts[Math.floor(rand() * internalHosts.length)];
    const isInternal = rand() < 0.6;
    const dst = isInternal
      ? internalServers[Math.floor(rand() * internalServers.length)]
      : externalServers[Math.floor(rand() * externalServers.length)];

    let dstPort = 443;
    let proto: FlowRecord['protocol'] = 'TCP';
    const portChoice = rand();
    if (portChoice < 0.35) {
      dstPort = 443; // HTTPS
      proto = 'HTTPS';
    } else if (portChoice < 0.6) {
      dstPort = 80;  // HTTP
      proto = 'HTTP';
    } else if (portChoice < 0.8) {
      dstPort = 53;  // DNS
      proto = 'DNS';
    } else if (portChoice < 0.9) {
      dstPort = 445; // SMB
      proto = 'SMB';
    } else {
      dstPort = 22;  // SSH
      proto = 'SSH';
    }

    const timeOffset = Math.floor(rand() * 3600 * 1000); // within 1 hour
    const timestampMs = baseTimeMs + timeOffset;
    const bytesSent = Math.floor(rand() * 4500) + 350;
    const bytesReceived = Math.floor(rand() * 25000) + 1200;

    flows.push({
      id: `flow-${flowSeq++}`,
      timestamp: new Date(timestampMs).toISOString(),
      timestampMs,
      source_ip: src,
      destination_ip: dst,
      source_port: 49152 + Math.floor(rand() * 15000),
      destination_port: dstPort,
      protocol: proto,
      duration_seconds: parseFloat((rand() * 5 + 0.1).toFixed(2)),
      bytes_sent: bytesSent,
      bytes_received: bytesReceived,
      packets_sent: Math.floor(bytesSent / 120) + 2,
      packets_received: Math.floor(bytesReceived / 500) + 3,
      direction: isInternal ? 'INTERNAL' : 'OUTBOUND',
      connection_state: 'ESTABLISHED'
    });
  }

  // 2. Scenario 1: Vertical Port Scan from 192.168.1.105 against Database 10.0.0.50
  const scanPorts = [21, 22, 23, 25, 80, 110, 135, 139, 443, 445, 1433, 3306, 3389, 5432, 8080];
  const scanBaseTime = baseTimeMs + 600000; // 10 mins into capture
  for (let i = 0; i < scanPorts.length; i++) {
    const port = scanPorts[i];
    const timestampMs = scanBaseTime + i * 250; // fast burst every 250ms
    flows.push({
      id: `flow-${flowSeq++}`,
      timestamp: new Date(timestampMs).toISOString(),
      timestampMs,
      source_ip: '192.168.1.105',
      destination_ip: '10.0.0.50',
      source_port: 52000 + i,
      destination_port: port,
      protocol: 'TCP',
      duration_seconds: 0.05,
      bytes_sent: 64,
      bytes_received: port === 3306 || port === 80 || port === 443 ? 128 : 0,
      packets_sent: 2,
      packets_received: port === 3306 || port === 80 || port === 443 ? 2 : 0,
      direction: 'INTERNAL',
      connection_state: port === 3306 ? 'ESTABLISHED' : 'RESET'
    });
  }

  // 3. Scenario 2: Command & Control Beaconing from 192.168.1.140 to 198.51.100.45:4444
  const beaconCount = mode === 'small' ? 8 : 16;
  const beaconBaseTime = baseTimeMs + 1200000;
  for (let i = 0; i < beaconCount; i++) {
    const timestampMs = beaconBaseTime + i * 5000 + (Math.floor(rand() * 150) - 75); // 5 sec interval with tiny jitter
    flows.push({
      id: `flow-${flowSeq++}`,
      timestamp: new Date(timestampMs).toISOString(),
      timestampMs,
      source_ip: '192.168.1.140',
      destination_ip: '198.51.100.45',
      source_port: 54100,
      destination_port: 4444,
      protocol: 'TCP',
      duration_seconds: 0.12,
      bytes_sent: 256,
      bytes_received: 64,
      packets_sent: 3,
      packets_received: 2,
      direction: 'OUTBOUND',
      connection_state: 'ESTABLISHED'
    });
  }

  // 4. Scenario 3: Bulk Data Exfiltration from 192.168.1.120 to External Cloud Host 203.0.113.88
  const exfilTime = baseTimeMs + 2400000;
  flows.push({
    id: `flow-${flowSeq++}`,
    timestamp: new Date(exfilTime).toISOString(),
    timestampMs: exfilTime,
    source_ip: '192.168.1.120',
    destination_ip: '203.0.113.88',
    source_port: 55432,
    destination_port: 443,
    protocol: 'HTTPS',
    duration_seconds: 84.5,
    bytes_sent: 18450000, // 18.45 MB upload!
    bytes_received: 12400,
    packets_sent: 12500,
    packets_received: 150,
    direction: 'OUTBOUND',
    connection_state: 'ESTABLISHED'
  });

  // 5. Scenario 4: Lateral Sweep / Unusual Connection Count from 192.168.1.200
  const sweepTargets = [
    '192.168.1.10', '192.168.1.15', '192.168.1.22', '192.168.1.33',
    '192.168.1.45', '192.168.1.55', '192.168.1.70', '192.168.1.88',
    '192.168.1.91', '192.168.1.92', '192.168.1.93', '192.168.1.94',
    '192.168.1.95', '192.168.1.96', '192.168.1.97', '192.168.1.98'
  ];
  const sweepTime = baseTimeMs + 1800000;
  for (let i = 0; i < sweepTargets.length; i++) {
    const dst = sweepTargets[i];
    const timestampMs = sweepTime + i * 400;
    flows.push({
      id: `flow-${flowSeq++}`,
      timestamp: new Date(timestampMs).toISOString(),
      timestampMs,
      source_ip: '192.168.1.200',
      destination_ip: dst,
      source_port: 50100 + i,
      destination_port: 445,
      protocol: 'SMB',
      duration_seconds: 0.2,
      bytes_sent: 450,
      bytes_received: 120,
      packets_sent: 4,
      packets_received: 2,
      direction: 'INTERNAL',
      connection_state: 'ESTABLISHED'
    });
  }

  // 6. Scenario 5: Rare Communication Pair with Admin Tool port
  const rareTime = baseTimeMs + 2100000;
  flows.push({
    id: `flow-${flowSeq++}`,
    timestamp: new Date(rareTime).toISOString(),
    timestampMs: rareTime,
    source_ip: '192.168.1.115',
    destination_ip: '10.0.0.60',
    source_port: 53120,
    destination_port: 9001,
    protocol: 'TCP',
    duration_seconds: 14.2,
    bytes_sent: 95000,
    bytes_received: 4200,
    packets_sent: 80,
    packets_received: 30,
    direction: 'INTERNAL',
    connection_state: 'ESTABLISHED'
  });

  // Sort all flows chronologically
  flows.sort((a, b) => a.timestampMs - b.timestampMs);

  return flows;
}
