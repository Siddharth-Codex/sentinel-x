import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  Download, 
  PlayCircle, 
  Search, 
  Table 
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { ProtocolBadge } from '../components/common/Badge';

export const TrafficAnalysis: React.FC = () => {
  const { 
    dataset, 
    flows, 
    validationSummary, 
    importCsvData, 
    loadDemoDataset, 
    clearAllData,
    addNotification,
    theme
  } = useSecurity();

  const isDark = theme === 'dark';
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [protoFilter, setProtoFilter] = useState('ALL');
  const [anomalousOnly, setAnomalousOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const res = importCsvData(text, file.name);
      if (!res.success) {
        addNotification('CSV Validation Error', res.error || 'Failed to parse CSV', 'warning');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Filter flows for preview table
  const filteredFlows = flows.filter(flow => {
    const matchesSearch = !searchFilter || 
      flow.source_ip.includes(searchFilter) || 
      flow.destination_ip.includes(searchFilter) ||
      String(flow.source_port).includes(searchFilter) ||
      String(flow.destination_port).includes(searchFilter);

    const matchesProto = protoFilter === 'ALL' || flow.protocol === protoFilter;
    const matchesAnomalous = !anomalousOnly || flow.is_anomalous;

    return matchesSearch && matchesProto && matchesAnomalous;
  });

  const totalPages = Math.ceil(filteredFlows.length / pageSize) || 1;
  const paginatedFlows = filteredFlows.slice((page - 1) * pageSize, page * pageSize);

  const downloadValidationReport = () => {
    if (!validationSummary) return;
    const reportHeaders = ['Row', 'Field', 'Value', 'Message', 'Severity'];
    const rows = validationSummary.errors.map(e => 
      [e.row, e.field, `"${(e.value || '').replace(/"/g, '""')}"`, `"${e.message.replace(/"/g, '""')}"`, e.severity].join(',')
    );
    const csvStr = [reportHeaders.join(','), ...rows].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardClass = isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Top Action & Ingestion Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Drop Zone */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
            dragOver 
              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20' 
              : (isDark ? 'border-slate-800 bg-[#111827] hover:border-slate-700' : 'border-slate-300 bg-white hover:border-cyan-500 shadow-sm')
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            accept=".csv,text/csv"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className={`text-sm font-bold mb-1 ${textTitle}`}>Drag & Drop Network CSV</h3>
          <p className={`text-xs max-w-xs mb-3 ${textMuted}`}>
            Upload standard network flow logs (NetFlow, IPFIX, Zeek, or custom CSV).
          </p>
          <button className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
          }`}>
            Browse File
          </button>
        </div>

        {/* Demo Dataset Controls */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between ${cardClass}`}>
          <div>
            <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 mb-2">
              <PlayCircle className="w-5 h-5" />
              <h3 className={`text-sm font-bold ${textTitle}`}>Instant Synthetic Scenarios</h3>
            </div>
            <p className={`text-xs leading-relaxed mb-4 ${textMuted}`}>
              Explore deterministically simulated attack vectors without needing an external dataset capture.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => loadDemoDataset('standard')}
                className={`w-full py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-between transition-colors ${
                  isDark ? 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300' : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-900'
                }`}
              >
                <span>Load Standard Dataset (~280 flows)</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isDark ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-white text-cyan-800 border-cyan-200 shadow-xs'
                }`}>Recommended</span>
              </button>
              <button
                onClick={() => loadDemoDataset('small')}
                className={`w-full py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors ${
                  isDark ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>Load Fast Profile (~60 flows)</span>
                <span className={`text-[10px] font-mono ${textMuted}`}>Quick run</span>
              </button>
            </div>
          </div>

          {dataset && (
            <div className={`pt-4 border-t flex items-center justify-between text-xs ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
              <span className={`font-mono ${textMuted}`}>Current: {dataset.totalFlows} flows</span>
              <button
                onClick={() => {
                  if (confirm('Clear current dataset and all active anomaly findings?')) {
                    clearAllData();
                  }
                }}
                className="text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Dataset</span>
              </button>
            </div>
          )}
        </div>

        {/* Ingestion & Validation Summary */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between ${cardClass}`}>
          <div>
            <h3 className={`text-sm font-bold mb-2 ${textTitle}`}>Data Integrity & Validation</h3>
            {validationSummary ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className={`p-2 rounded-lg border ${
                    isDark ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Accepted</div>
                    <div className={`text-base font-bold ${textTitle}`}>{validationSummary.acceptedRows}</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${
                    isDark ? 'bg-yellow-950/30 border-yellow-800/40' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="text-[10px] text-yellow-600 dark:text-yellow-400">Warnings</div>
                    <div className={`text-base font-bold ${textTitle}`}>{validationSummary.acceptedWithWarnings}</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${
                    isDark ? 'bg-rose-950/30 border-rose-800/40' : 'bg-rose-50 border-rose-200'
                  }`}>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400">Rejected</div>
                    <div className={`text-base font-bold ${textTitle}`}>{validationSummary.rejectedRows}</div>
                  </div>
                </div>

                {validationSummary.errors.length > 0 && (
                  <div className={`text-xs ${textMuted}`}>
                    <span>{validationSummary.errors.length} validation issues logged.</span>
                  </div>
                )}
              </div>
            ) : (
              <p className={`text-xs leading-relaxed ${textMuted}`}>
                Deterministic synthetic dataset loaded with 100% compliant RFC-1918 / RFC-5737 structures.
              </p>
            )}
          </div>

          {validationSummary && validationSummary.errors.length > 0 && (
            <button
              onClick={downloadValidationReport}
              className={`mt-4 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Validation Report (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* Flow Records Preview Table */}
      <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${cardClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className={`text-sm font-bold flex items-center space-x-2 ${textTitle}`}>
              <Table className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Ingested Flow Records ({filteredFlows.length})</span>
            </h3>
            <p className={`text-xs ${textMuted}`}>Raw packet and flow telemetry parsed from dataset</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => { setSearchFilter(e.target.value); setPage(1); }}
                placeholder="Filter by IP or Port..."
                className={`pl-8 pr-3 py-1 border rounded-lg text-xs font-mono focus:outline-none focus:border-cyan-500 w-48 ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700/80 text-slate-200 placeholder-slate-500' 
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Protocol Filter */}
            <select
              value={protoFilter}
              onChange={e => { setProtoFilter(e.target.value); setPage(1); }}
              className={`px-2.5 py-1 border rounded-lg text-xs font-mono focus:outline-none ${
                isDark 
                  ? 'bg-slate-900 border-slate-700/80 text-slate-300' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="HTTPS">HTTPS</option>
              <option value="HTTP">HTTP</option>
              <option value="DNS">DNS</option>
              <option value="SSH">SSH</option>
              <option value="SMB">SMB</option>
            </select>

            {/* Anomalous Only Toggle */}
            <button
              onClick={() => { setAnomalousOnly(!anomalousOnly); setPage(1); }}
              className={`px-3 py-1 rounded-lg border text-xs font-mono transition-colors ${
                anomalousOnly 
                  ? (isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold' : 'bg-rose-50 text-rose-700 border-rose-300 font-bold')
                  : (isDark ? 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')
              }`}
            >
              Anomalous Only
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <table className="w-full text-left text-xs font-mono">
            <thead className={`border-b ${isDark ? 'bg-[#0D111B] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
              <tr>
                <th className="py-2.5 px-3">Flow ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Source IP : Port</th>
                <th className="py-2.5 px-3">Destination IP : Port</th>
                <th className="py-2.5 px-3">Proto</th>
                <th className="py-2.5 px-3">Direction</th>
                <th className="py-2.5 px-3 text-right">Bytes Sent</th>
                <th className="py-2.5 px-3 text-right">Bytes Recv</th>
                <th className="py-2.5 px-3 text-right">Duration</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60 bg-slate-900/30' : 'divide-slate-100 bg-white'}`}>
              {paginatedFlows.length === 0 ? (
                <tr>
                  <td colSpan={10} className={`py-8 text-center ${textMuted}`}>
                    No flow records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedFlows.map(flow => (
                  <tr 
                    key={flow.id} 
                    className={`transition-colors ${
                      flow.is_anomalous 
                        ? (isDark ? 'bg-rose-950/15 hover:bg-rose-950/25' : 'bg-rose-50/50 hover:bg-rose-50') 
                        : (isDark ? 'hover:bg-slate-850/40' : 'hover:bg-slate-50')
                    }`}
                  >
                    <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 font-bold">{flow.id}</td>
                    <td className={`py-2 px-3 ${textMuted}`}>{new Date(flow.timestamp).toLocaleTimeString()}</td>
                    <td className={`py-2 px-3 ${isDark ? 'text-slate-200' : 'text-slate-800 font-medium'}`}>{flow.source_ip}:{flow.source_port}</td>
                    <td className={`py-2 px-3 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{flow.destination_ip}:{flow.destination_port}</td>
                    <td className="py-2 px-3"><ProtocolBadge protocol={flow.protocol} /></td>
                    <td className={`py-2 px-3 text-[11px] ${textMuted}`}>{flow.direction || 'INTERNAL'}</td>
                    <td className={`py-2 px-3 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{flow.bytes_sent.toLocaleString()}</td>
                    <td className={`py-2 px-3 text-right ${textMuted}`}>{flow.bytes_received.toLocaleString()}</td>
                    <td className={`py-2 px-3 text-right ${textMuted}`}>{flow.duration_seconds}s</td>
                    <td className="py-2 px-3 text-center">
                      {flow.is_anomalous ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
                          FLAGGED
                        </span>
                      ) : (
                        <span className={`text-[10px] ${textMuted}`}>Normal</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`flex items-center justify-between text-xs font-mono ${textMuted}`}>
          <span>Page {page} of {totalPages} ({filteredFlows.length} total records)</span>
          <div className="flex space-x-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`px-2.5 py-1 rounded border disabled:opacity-40 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs'
              }`}
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`px-2.5 py-1 rounded border disabled:opacity-40 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
