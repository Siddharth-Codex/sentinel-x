import { 
  ColumnMapping, 
  FlowRecord, 
  Protocol, 
  RawCsvRow, 
  ValidationErrorItem, 
  ValidationSummary 
} from '../../types/network';

export function isValidIPv4(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;

  for (const part of parts) {
    if (!/^\d+$/.test(part)) return false;
    const num = parseInt(part, 10);
    if (num < 0 || num > 255) return false;
    // Check leading zeros e.g. "01" is invalid unless "0"
    if (part.length > 1 && part.startsWith('0')) return false;
  }
  return true;
}

export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 0 && port <= 65535;
}

export function parseProtocol(rawProto: string): Protocol {
  if (!rawProto) return 'OTHER';
  const upper = rawProto.trim().toUpperCase();
  if (['TCP', 'UDP', 'ICMP', 'DNS', 'HTTP', 'HTTPS', 'SSH', 'FTP', 'SMB'].includes(upper)) {
    return upper as Protocol;
  }
  if (upper === '6') return 'TCP';
  if (upper === '17') return 'UDP';
  if (upper === '1') return 'ICMP';
  return 'OTHER';
}

export function parseTimestamp(rawTime: string): { iso: string; ms: number } | null {
  if (!rawTime || !rawTime.trim()) return null;
  const trimmed = rawTime.trim();

  // Try numeric epoch
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const num = parseFloat(trimmed);
    const ms = num < 10000000000 ? Math.round(num * 1000) : Math.round(num);
    const date = new Date(ms);
    if (!isNaN(date.getTime())) {
      return { iso: date.toISOString(), ms: date.getTime() };
    }
  }

  // Try standard date string
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return { iso: date.toISOString(), ms: date.getTime() };
  }

  return null;
}

export function validateAndTransformRecords(
  rows: RawCsvRow[],
  mapping: ColumnMapping
): { records: FlowRecord[]; summary: ValidationSummary } {
  const records: FlowRecord[] = [];
  const errors: ValidationErrorItem[] = [];
  let acceptedRows = 0;
  let acceptedWithWarnings = 0;
  let rejectedRows = 0;

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +1 for 1-based, +1 for header
    let hasFatalError = false;
    let hasWarning = false;

    // Check Source IP
    const rawSrcIp = row[mapping.source_ip]?.trim() || '';
    if (!rawSrcIp) {
      errors.push({
        row: rowNum,
        field: 'source_ip',
        value: rawSrcIp,
        message: 'Missing required source IP address',
        severity: 'error'
      });
      hasFatalError = true;
    } else if (!isValidIPv4(rawSrcIp)) {
      errors.push({
        row: rowNum,
        field: 'source_ip',
        value: rawSrcIp,
        message: `Malformed IPv4 address '${rawSrcIp}'`,
        severity: 'error'
      });
      hasFatalError = true;
    }

    // Check Destination IP
    const rawDstIp = row[mapping.destination_ip]?.trim() || '';
    if (!rawDstIp) {
      errors.push({
        row: rowNum,
        field: 'destination_ip',
        value: rawDstIp,
        message: 'Missing required destination IP address',
        severity: 'error'
      });
      hasFatalError = true;
    } else if (!isValidIPv4(rawDstIp)) {
      errors.push({
        row: rowNum,
        field: 'destination_ip',
        value: rawDstIp,
        message: `Malformed IPv4 address '${rawDstIp}'`,
        severity: 'error'
      });
      hasFatalError = true;
    }

    // Check Ports
    const rawSrcPort = parseInt(row[mapping.source_port] || '0', 10);
    if (isNaN(rawSrcPort) || !isValidPort(rawSrcPort)) {
      errors.push({
        row: rowNum,
        field: 'source_port',
        value: String(row[mapping.source_port]),
        message: `Invalid source port (must be 0-65535)`,
        severity: 'error'
      });
      hasFatalError = true;
    }

    const rawDstPort = parseInt(row[mapping.destination_port] || '0', 10);
    if (isNaN(rawDstPort) || !isValidPort(rawDstPort)) {
      errors.push({
        row: rowNum,
        field: 'destination_port',
        value: String(row[mapping.destination_port]),
        message: `Invalid destination port (must be 0-65535)`,
        severity: 'error'
      });
      hasFatalError = true;
    }

    // Check Timestamp
    const rawTime = row[mapping.timestamp] || '';
    const parsedTime = parseTimestamp(rawTime);
    if (!parsedTime) {
      errors.push({
        row: rowNum,
        field: 'timestamp',
        value: rawTime,
        message: `Unparseable timestamp '${rawTime}'`,
        severity: 'error'
      });
      hasFatalError = true;
    }

    // Check Protocol
    const rawProto = row[mapping.protocol] || '';
    const protocol = parseProtocol(rawProto);
    if (!rawProto) {
      errors.push({
        row: rowNum,
        field: 'protocol',
        value: '',
        message: 'Protocol missing, defaulted to OTHER',
        severity: 'warning'
      });
      hasWarning = true;
    }

    if (hasFatalError) {
      rejectedRows++;
      return;
    }

    // Optional fields with safe fallbacks and warning checks
    let bytesSent = 0;
    if (mapping.bytes_sent && row[mapping.bytes_sent] !== undefined) {
      const val = parseFloat(row[mapping.bytes_sent]);
      if (!isNaN(val) && val >= 0) {
        bytesSent = val;
      } else {
        errors.push({
          row: rowNum,
          field: 'bytes_sent',
          value: row[mapping.bytes_sent],
          message: 'Invalid bytes_sent value, defaulting to 0',
          severity: 'warning'
        });
        hasWarning = true;
      }
    }

    let bytesReceived = 0;
    if (mapping.bytes_received && row[mapping.bytes_received] !== undefined) {
      const val = parseFloat(row[mapping.bytes_received]);
      if (!isNaN(val) && val >= 0) {
        bytesReceived = val;
      } else {
        hasWarning = true;
      }
    }

    let durationSeconds = 0;
    if (mapping.duration_seconds && row[mapping.duration_seconds] !== undefined) {
      const val = parseFloat(row[mapping.duration_seconds]);
      if (!isNaN(val) && val >= 0) {
        durationSeconds = val;
      }
    }

    let packetsSent = 1;
    if (mapping.packets_sent && row[mapping.packets_sent] !== undefined) {
      const val = parseInt(row[mapping.packets_sent], 10);
      if (!isNaN(val) && val >= 0) {
        packetsSent = val;
      }
    }

    let packetsReceived = 0;
    if (mapping.packets_received && row[mapping.packets_received] !== undefined) {
      const val = parseInt(row[mapping.packets_received], 10);
      if (!isNaN(val) && val >= 0) {
        packetsReceived = val;
      }
    }

    // Determine direction heuristic if not explicitly set
    let direction = row[mapping.direction || ''] as FlowRecord['direction'];
    if (!direction) {
      const isSrcPrivate = isPrivateIPv4(rawSrcIp);
      const isDstPrivate = isPrivateIPv4(rawDstIp);
      if (isSrcPrivate && isDstPrivate) direction = 'INTERNAL';
      else if (isSrcPrivate && !isDstPrivate) direction = 'OUTBOUND';
      else if (!isSrcPrivate && isDstPrivate) direction = 'INBOUND';
      else direction = 'UNKNOWN';
    }

    const flowRecord: FlowRecord = {
      id: `flow-${index + 1}`,
      timestamp: parsedTime!.iso,
      timestampMs: parsedTime!.ms,
      source_ip: rawSrcIp,
      destination_ip: rawDstIp,
      source_port: rawSrcPort,
      destination_port: rawDstPort,
      protocol,
      duration_seconds: durationSeconds,
      bytes_sent: bytesSent,
      bytes_received: bytesReceived,
      packets_sent: packetsSent,
      packets_received: packetsReceived,
      direction,
      application_protocol: row[mapping.application_protocol || ''] || undefined,
      connection_state: (row[mapping.connection_state || ''] as FlowRecord['connection_state']) || 'ESTABLISHED'
    };

    records.push(flowRecord);
    acceptedRows++;
    if (hasWarning) {
      acceptedWithWarnings++;
    }
  });

  return {
    records,
    summary: {
      totalRows: rows.length,
      acceptedRows,
      acceptedWithWarnings,
      rejectedRows,
      errors,
      missingFields: [],
      inferredMappings: mapping,
      isValid: rejectedRows === 0 && records.length > 0
    }
  };
}

export function isPrivateIPv4(ip: string): boolean {
  if (!isValidIPv4(ip)) return false;
  const parts = ip.split('.').map(p => parseInt(p, 10));
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;
  // RFC 5737 Test-Net (e.g. 198.51.100.0/24, 203.0.113.0/24)
  return false;
}
