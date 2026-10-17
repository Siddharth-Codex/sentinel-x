import { ColumnMapping } from '../../types/network';

const ALIASES: Record<keyof ColumnMapping, string[]> = {
  timestamp: ['timestamp', 'time', 'datetime', 'date', '@timestamp', 'start_time', 'flow_time', 'record_time'],
  source_ip: ['source_ip', 'src_ip', 'srcip', 'source', 'src', 's_ip', 'client_ip', 'src_addr', 'source_address', 'ip_src'],
  destination_ip: ['destination_ip', 'dst_ip', 'dstip', 'dest_ip', 'destination', 'dst', 'd_ip', 'server_ip', 'dst_addr', 'dest_address', 'ip_dst'],
  source_port: ['source_port', 'src_port', 'srcport', 'sport', 's_port', 'client_port', 'port_src'],
  destination_port: ['destination_port', 'dst_port', 'dstport', 'dest_port', 'dport', 'd_port', 'server_port', 'port_dst'],
  protocol: ['protocol', 'proto', 'ip_proto', 'transport_protocol', 'l4_protocol'],
  duration_seconds: ['duration_ms', 'duration_seconds', 'duration', 'dur', 'flow_duration', 'duration_sec'],
  bytes_sent: ['src_bytes', 'bytes_sent', 'bytes_out', 'out_bytes', 'bytes', 'sbytes', 'tx_bytes', 'sent_bytes'],
  bytes_received: ['dst_bytes', 'bytes_received', 'bytes_in', 'in_bytes', 'dbytes', 'rx_bytes', 'recv_bytes', 'received_bytes'],
  packets_sent: ['src_packets', 'packets_sent', 'pkts_sent', 'packets_out', 'spkts', 'tx_packets', 'sent_packets'],
  packets_received: ['dst_packets', 'packets_received', 'pkts_recv', 'packets_in', 'dpkts', 'rx_packets', 'received_packets'],
  connection_state: ['connection_state', 'conn_state', 'state', 'status', 'flags', 'flag'],
  application_protocol: ['application_protocol', 'app_protocol', 'app', 'service', 'application', 'proto_app'],
  direction: ['direction', 'dir', 'flow_direction', 'flow_dir']
};

export function inferColumnMapping(availableHeaders: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};
  const lowerHeaders = availableHeaders.map(h => ({ original: h, lower: h.toLowerCase().trim() }));

  for (const [standardKey, aliasList] of Object.entries(ALIASES) as [keyof ColumnMapping, string[]][]) {
    // Exact match first
    const exactMatch = lowerHeaders.find(h => h.lower === standardKey);
    if (exactMatch) {
      mapping[standardKey] = exactMatch.original;
      continue;
    }

    // Alias list match
    const aliasMatch = lowerHeaders.find(h => aliasList.includes(h.lower));
    if (aliasMatch) {
      mapping[standardKey] = aliasMatch.original;
      continue;
    }

    // Substring match
    const partialMatch = lowerHeaders.find(h => 
      aliasList.some(alias => h.lower.includes(alias) || alias.includes(h.lower))
    );
    if (partialMatch) {
      mapping[standardKey] = partialMatch.original;
    }
  }

  return mapping;
}

export function validateRequiredMappings(mapping: Partial<ColumnMapping>): { isComplete: boolean; missing: string[] } {
  const required: (keyof ColumnMapping)[] = [
    'timestamp',
    'source_ip',
    'destination_ip',
    'source_port',
    'destination_port',
    'protocol'
  ];

  const missing = required.filter(key => !mapping[key]);
  return {
    isComplete: missing.length === 0,
    missing
  };
}
