export type Protocol = 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'HTTP' | 'HTTPS' | 'SSH' | 'FTP' | 'SMB' | 'OTHER';

export type ConnectionState = 'ESTABLISHED' | 'SYN_SENT' | 'SYN_RECV' | 'FIN_WAIT' | 'CLOSED' | 'RESET' | 'UNKNOWN';

export type TrafficDirection = 'INBOUND' | 'OUTBOUND' | 'INTERNAL' | 'UNKNOWN';

export interface FlowRecord {
  id: string;
  timestamp: string; // ISO 8601 string
  timestampMs: number;
  source_ip: string;
  destination_ip: string;
  source_port: number;
  destination_port: number;
  protocol: Protocol;
  duration_seconds: number;
  bytes_sent: number;
  bytes_received: number;
  packets_sent: number;
  packets_received: number;
  connection_state?: ConnectionState;
  application_protocol?: string;
  direction?: TrafficDirection;
  is_anomalous?: boolean;
}

export interface RawCsvRow {
  [columnName: string]: string;
}

export interface ColumnMapping {
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  source_port: string;
  destination_port: string;
  protocol: string;
  duration_seconds?: string;
  bytes_sent?: string;
  bytes_received?: string;
  packets_sent?: string;
  packets_received?: string;
  connection_state?: string;
  application_protocol?: string;
  direction?: string;
}

export interface ValidationErrorItem {
  row: number;
  field: string;
  value: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationSummary {
  totalRows: number;
  acceptedRows: number;
  acceptedWithWarnings: number;
  rejectedRows: number;
  errors: ValidationErrorItem[];
  missingFields: string[];
  inferredMappings: Partial<ColumnMapping>;
  isValid: boolean;
}

export interface DatasetMetadata {
  id: string;
  name: string;
  isSynthetic: boolean;
  importedAt: string;
  totalFlows: number;
  uniqueSourceIps: number;
  uniqueDestinationIps: number;
  uniqueDevices: number;
  timeRangeStart: string;
  timeRangeEnd: string;
  durationHours: number;
  totalBytes: number;
  protocolsDetected: Record<string, number>;
  sourceFileName?: string;
  fileSizeBytes?: number;
}
