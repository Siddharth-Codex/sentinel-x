import React, { useState } from 'react';
import { 
  FileSearch, 
  Plus, 
  MessageSquare, 
  Send, 
  Download
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { InvestigationPriority, InvestigationStatus } from '../types/investigations';
import { SeverityBadge } from '../components/common/Badge';

export const Investigations: React.FC = () => {
  const { 
    investigations, 
    selectedInvestigation, 
    setSelectedInvestigation,
    addInvestigationNote,
    updateInvestigationStatus,
    createManualInvestigation,
    alerts,
    setSelectedAlert,
    theme
  } = useSecurity();

  const isDark = theme === 'dark';

  const [activeInvId, setActiveInvId] = useState<string>(
    selectedInvestigation?.id || investigations[0]?.id || ''
  );

  const [newNoteContent, setNewNoteContent] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');
  const [newCasePriority, setNewCasePriority] = useState<InvestigationPriority>('HIGH');

  const currentInv = investigations.find(i => i.id === activeInvId) || investigations[0];

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !currentInv) return;
    addInvestigationNote(currentInv.id, newNoteContent.trim());
    setNewNoteContent('');
  };

  const handleCreateNewCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle.trim()) return;
    const newId = createManualInvestigation(newCaseTitle, newCaseDesc, [], newCasePriority);
    setActiveInvId(newId);
    setShowCreateModal(false);
    setNewCaseTitle('');
    setNewCaseDesc('');
  };

  const handleExportCase = () => {
    if (!currentInv) return;
    const blob = new Blob([JSON.stringify(currentInv, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investigation_${currentInv.id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardClass = isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-colors ${cardClass}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <FileSearch className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold tracking-tight ${textTitle}`}>Investigation Case Workspace</h2>
            <p className={`text-xs ${textMuted}`}>
              Manage threat escalation cases, maintain investigator notes, and document triage dispositions.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className={`px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
            isDark 
              ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40' 
              : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation Case</span>
        </button>
      </div>

      {investigations.length === 0 ? (
        <div className={`p-12 text-center border rounded-2xl text-xs font-mono space-y-3 ${cardClass} ${textMuted}`}>
          <p>No active investigation cases in local workspace.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            }`}
          >
            Create Your First Case
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Case List */}
          <div className="space-y-3">
            <div className={`text-xs font-mono uppercase font-bold px-1 ${textMuted}`}>
              Active Cases ({investigations.length})
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {investigations.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => setActiveInvId(inv.id)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all space-y-1.5 ${
                    currentInv?.id === inv.id
                      ? (isDark ? 'bg-slate-800/90 border-cyan-400 shadow-xl' : 'bg-cyan-50/80 border-cyan-400 shadow-xs')
                      : (isDark ? 'bg-[#111827] border-slate-800 hover:bg-slate-850/80' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs')
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{inv.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                      isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <h4 className={`font-semibold truncate ${textTitle}`}>{inv.title}</h4>
                  <div className={`flex items-center justify-between text-[11px] font-mono ${textMuted}`}>
                    <span>Priority: <strong className="text-amber-600 dark:text-amber-400">{inv.priority}</strong></span>
                    <span>{inv.notes.length} note(s)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 2 Columns: Detailed Investigation Dossier */}
          {currentInv && (
            <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm space-y-6 ${cardClass}`}>
              {/* Case Header & Status Controls */}
              <div className={`flex flex-wrap items-start justify-between gap-3 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center space-x-2">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      isDark ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60' : 'text-cyan-800 bg-cyan-50 border-cyan-200'
                    }`}>
                      {currentInv.id}
                    </span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      Priority: {currentInv.priority}
                    </span>
                    <span className={`text-xs font-mono ${textMuted}`}>
                      Opened {new Date(currentInv.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className={`text-lg font-bold ${textTitle}`}>{currentInv.title}</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{currentInv.description}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportCase}
                    className={`p-2 rounded-lg border transition-colors ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    title="Export Case JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <select
                    value={currentInv.status}
                    onChange={e => updateInvestigationStatus(currentInv.id, e.target.value as InvestigationStatus)}
                    className={`px-2.5 py-1.5 border rounded-lg text-xs font-mono focus:outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-cyan-300' : 'bg-white border-slate-200 text-cyan-800'
                    }`}
                  >
                    <option value="OPEN">Status: OPEN</option>
                    <option value="INVESTIGATING">Status: INVESTIGATING</option>
                    <option value="RESOLVED">Status: RESOLVED</option>
                    <option value="FALSE_POSITIVE">Status: FALSE POSITIVE</option>
                  </select>
                </div>
              </div>

              {/* Linked Alerts */}
              <div>
                <h4 className={`text-xs font-mono uppercase font-bold mb-2 ${textMuted}`}>
                  Linked Incident Alerts ({currentInv.relatedAlertIds.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentInv.relatedAlertIds.map(alertId => {
                    const matchedAlert = alerts.find(a => a.id === alertId);
                    return (
                      <div
                        key={alertId}
                        onClick={() => matchedAlert && setSelectedAlert(matchedAlert)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                          isDark 
                            ? 'bg-slate-900/80 hover:bg-slate-850 border-slate-800' 
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{alertId}</span>
                          <div className={`truncate text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {matchedAlert?.title || 'External finding reference'}
                          </div>
                        </div>
                        {matchedAlert && <SeverityBadge severity={matchedAlert.severity} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Case Notes History */}
              <div className="space-y-3">
                <h4 className={`text-xs font-mono uppercase font-bold flex items-center space-x-1.5 ${textMuted}`}>
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Investigator Notes & Incident Diary</span>
                </h4>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {currentInv.notes.map(note => (
                    <div key={note.id} className={`p-3 rounded-xl border space-y-1 ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-semibold text-cyan-600 dark:text-cyan-300">{note.author}</span>
                        <span className={textMuted}>{new Date(note.timestamp).toLocaleString()}</span>
                      </div>
                      <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{note.content}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note Input Form */}
                <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                    placeholder="Document forensic observations, triage steps, or containment notes..."
                    className={`flex-1 px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700/80 text-slate-200 placeholder-slate-500' 
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!newNoteContent.trim()}
                    className={`px-4 py-2 border rounded-lg text-xs font-semibold flex items-center space-x-1 disabled:opacity-40 transition-colors ${
                      isDark 
                        ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40' 
                        : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Append</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border ${cardClass}`}>
            <h3 className={`text-base font-bold ${textTitle}`}>Create Investigation Case</h3>
            <form onSubmit={handleCreateNewCase} className="space-y-3">
              <div>
                <label className={`text-xs font-mono block mb-1 ${textMuted}`}>Case Title</label>
                <input
                  type="text"
                  required
                  value={newCaseTitle}
                  onChange={e => setNewCaseTitle(e.target.value)}
                  placeholder="e.g. Lateral Movement on Subnet 192.168.1.0/24"
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:border-cyan-500 ${
                    isDark 
                      ? 'bg-slate-900 border-slate-700 text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className={`text-xs font-mono block mb-1 ${textMuted}`}>Description</label>
                <textarea
                  rows={3}
                  value={newCaseDesc}
                  onChange={e => setNewCaseDesc(e.target.value)}
                  placeholder="Summary of incident scope and suspected threat mechanics..."
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:border-cyan-500 ${
                    isDark 
                      ? 'bg-slate-900 border-slate-700 text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className={`text-xs font-mono block mb-1 ${textMuted}`}>Priority</label>
                <select
                  value={newCasePriority}
                  onChange={e => setNewCasePriority(e.target.value as InvestigationPriority)}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    isDark ? 'bg-slate-800 text-slate-400 hover:text-white border-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    isDark 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30' 
                      : 'bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100'
                  }`}
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
