import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Copy, 
  Check
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { consultAISecurityAnalyst, AIAnalysisResponse } from '../lib/ai/client';
import { SeverityBadge } from '../components/common/Badge';
import { Alert } from '../types/alerts';

interface ChatMessage {
  id: string;
  sender: 'user' | 'analyst';
  content: string;
  analysis?: AIAnalysisResponse;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "Why was this flow flagged by the detection engine?",
  "What benign or false-positive explanations are plausible?",
  "What defensive investigation steps should the SOC take next?",
  "What telemetry or log evidence is currently missing?",
  "Summarise the threat scope and risk magnitude."
];

export const AISecurityAnalyst: React.FC = () => {
  const { alerts, selectedAlert, setSelectedAlert, flows, theme } = useSecurity();
  const isDark = theme === 'dark';

  const [activeAlert, setActiveAlert] = useState<Alert | null>(
    selectedAlert || alerts[0] || null
  );

  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAlert) {
      setActiveAlert(selectedAlert);
    }
  }, [selectedAlert]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0 && activeAlert) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'analyst',
          content: `Hello Investigator. I am ready to analyze anomaly **${activeAlert.id}** (${activeAlert.title}). You can ask me technical questions regarding the anomaly score, plausible benign explanations, or recommended defensive triage playbooks.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  }, [activeAlert, messages.length]);

  const handleSendMessage = async (promptText: string) => {
    if (!promptText.trim() || !activeAlert || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: promptText.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const supporting = flows.filter(f => activeAlert.supportingRecordIds.includes(f.id));
      const res = await consultAISecurityAnalyst({
        alert: activeAlert,
        supportingFlows: supporting,
        prompt: promptText.trim()
      });

      const analystMsg: ChatMessage = {
        id: `analyst-${Date.now()}`,
        sender: 'analyst',
        content: res.summary,
        analysis: res,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, analystMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'analyst',
          content: 'Unable to communicate with the analysis model. Falling back to rule-based heuristics.',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cardClass = isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Top Banner with Model Status */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-colors ${cardClass}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold tracking-tight ${textTitle}`}>AI Security Analyst Workstation</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-cyan-50 text-cyan-800 border-cyan-200'
              }`}>
                Gemini 3.8 Flash & Deterministic Engine
              </span>
            </div>
            <p className={`text-xs ${textMuted}`}>
              Interactive cyber threat analysis grounded in verified network flow evidence and defensive playbooks.
            </p>
          </div>
        </div>

        {/* Selected Alert Picker */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className={textMuted}>Focus Alert:</span>
          <select
            value={activeAlert?.id || ''}
            onChange={e => {
              const matched = alerts.find(a => a.id === e.target.value);
              if (matched) {
                setActiveAlert(matched);
                setSelectedAlert(matched);
              }
            }}
            className={`px-2.5 py-1.5 border rounded-lg focus:outline-none ${
              isDark ? 'bg-slate-900 border-slate-700 text-cyan-300' : 'bg-white border-slate-200 text-cyan-800'
            }`}
          >
            {alerts.map(a => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.source_ip} ({a.severity})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context Card for Active Alert */}
        {activeAlert && (
          <div className={`p-5 rounded-2xl border shadow-sm space-y-4 h-fit ${cardClass}`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-xs font-mono uppercase font-bold ${textMuted}`}>
                Investigation Context
              </span>
              <SeverityBadge severity={activeAlert.severity} />
            </div>

            <div className="space-y-1">
              <div className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold">{activeAlert.id}</div>
              <h4 className={`text-sm font-bold leading-snug ${textTitle}`}>{activeAlert.title}</h4>
              <p className={`text-xs leading-relaxed pt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{activeAlert.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] block ${textMuted}`}>Anomaly Score</span>
                <strong className={`text-base ${textTitle}`}>{activeAlert.anomalyScore}</strong>/100
              </div>
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] block ${textMuted}`}>Confidence</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-base">{activeAlert.confidence}%</strong>
              </div>
            </div>

            <div className={`space-y-2 pt-2 border-t text-xs font-mono ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className={`flex justify-between ${textMuted}`}>
                <span>Source Device:</span>
                <span className={`font-medium ${textTitle}`}>{activeAlert.source_ip}</span>
              </div>
              {activeAlert.destination_ip && (
                <div className={`flex justify-between ${textMuted}`}>
                  <span>Destination:</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-medium">{activeAlert.destination_ip}:{activeAlert.destination_port || ''}</span>
                </div>
              )}
              <div className={`flex justify-between ${textMuted}`}>
                <span>Detector:</span>
                <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeAlert.detectorName.split(' ')[0]}</span>
              </div>
            </div>

            {/* Evidence Quick Snippet */}
            <div className={`space-y-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-[10px] font-mono uppercase font-bold ${textMuted}`}>
                Observed Evidence
              </span>
              {activeAlert.evidence.map((ev, idx) => (
                <div key={idx} className={`p-2 rounded border text-[11px] font-mono ${
                  isDark ? 'bg-slate-900/60 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className={`flex justify-between ${textMuted}`}>
                    <span>{ev.metricName}</span>
                    <strong className="text-cyan-600 dark:text-cyan-300">{String(ev.observedValue)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right 2 Columns: Analyst Workstation Chat Stream */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm flex flex-col justify-between h-[660px] ${cardClass}`}>
          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-center space-x-1.5 mb-1 px-1 text-[10px] font-mono ${textMuted}`}>
                  <span>{msg.sender === 'user' ? 'SOC Investigator' : 'AI Security Analyst'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed space-y-3 ${
                    msg.sender === 'user'
                      ? (isDark 
                          ? 'bg-cyan-950/40 text-cyan-100 border border-cyan-800/60 rounded-tr-none' 
                          : 'bg-cyan-50 text-cyan-900 border border-cyan-300 rounded-tr-none')
                      : (isDark 
                          ? 'bg-slate-900/80 text-slate-200 border border-slate-800 rounded-tl-none' 
                          : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none')
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Render Structured Response Sections if available */}
                  {msg.analysis && (
                    <div className={`space-y-3 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      {/* Engine source badge */}
                      <div className={`flex items-center justify-between text-[10px] font-mono pb-1 ${textMuted}`}>
                        <span className="flex items-center space-x-1 text-cyan-600 dark:text-cyan-400 font-semibold">
                          <Sparkles className="w-3 h-3" />
                          <span>{msg.analysis.modelUsed}</span>
                        </span>
                        <button
                          onClick={() => handleCopy(msg.id, JSON.stringify(msg.analysis, null, 2))}
                          className="hover:opacity-80 flex items-center space-x-1"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>Copy Analysis</span>
                        </button>
                      </div>

                      {/* Threat Assessment */}
                      <div className={`p-3 rounded-xl border space-y-1 ${
                        isDark ? 'bg-slate-950/60 border-slate-800/80 text-slate-300' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                      }`}>
                        <div className="text-[10px] font-mono uppercase text-rose-600 dark:text-rose-400 font-bold">
                          Threat Mechanism Evaluation
                        </div>
                        <p className="leading-relaxed">{msg.analysis.threatAssessment}</p>
                      </div>

                      {/* Benign Alternative Hypotheses */}
                      {msg.analysis.benignExplanations.length > 0 && (
                        <div className={`p-3 rounded-xl border space-y-1.5 ${
                          isDark ? 'bg-slate-950/60 border-slate-800/80 text-slate-300' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                        }`}>
                          <div className="text-[10px] font-mono uppercase text-amber-600 dark:text-yellow-400 font-bold">
                            Plausible Benign Hypotheses
                          </div>
                          <ul className="list-disc pl-4 space-y-1">
                            {msg.analysis.benignExplanations.map((exp, i) => (
                              <li key={i}>{exp}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommended Defensive Actions */}
                      {msg.analysis.recommendedDefensiveSteps.length > 0 && (
                        <div className={`p-3 rounded-xl border space-y-1.5 ${
                          isDark ? 'bg-slate-950/60 border-slate-800/80 text-slate-300' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                        }`}>
                          <div className="text-[10px] font-mono uppercase text-cyan-700 dark:text-cyan-300 font-bold">
                            Recommended Defensive Triage Steps
                          </div>
                          <ol className="list-decimal pl-4 space-y-1">
                            {msg.analysis.recommendedDefensiveSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 p-2">
                <Bot className="w-4 h-4 animate-spin" />
                <span>AI Analyst evaluating network evidence and telemetry context...</span>
              </div>
            )}
          </div>

          {/* Bottom Area: Suggestions and Input Box */}
          <div className={`pt-4 border-t space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            {/* Suggested Query Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors ${
                    isDark 
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-cyan-500/40' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs hover:border-cyan-400'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage(inputPrompt);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={e => setInputPrompt(e.target.value)}
                placeholder="Ask technical question about the selected anomaly (e.g. 'Why was this flagged?')..."
                className={`flex-1 px-3.5 py-2.5 border rounded-xl text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700/80 text-slate-200 placeholder-slate-500' 
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || loading}
                className={`px-4 py-2.5 border rounded-xl text-xs font-bold flex items-center space-x-1.5 disabled:opacity-40 transition-colors ${
                  isDark 
                    ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40' 
                    : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                }`}
              >
                <span>Inquire</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
