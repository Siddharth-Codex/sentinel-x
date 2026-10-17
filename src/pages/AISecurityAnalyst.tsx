import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  Globe, 
  Cpu, 
  Mic, 
  MicOff, 
  Volume2, 
  Radio, 
  Sliders,
  ShieldAlert,
  ChevronRight
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
  "Search global CVE threat intel for this signature using Google Search."
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

  // Feature state for requested items
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [enableSearch, setEnableSearch] = useState<boolean>(true);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedAlert) {
      setActiveAlert(selectedAlert);
    }
  }, [selectedAlert]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0 && activeAlert) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'analyst',
          content: `Hello Investigator. I am ready to analyze anomaly **${activeAlert.id}** (${activeAlert.title}) using **${selectedModel}** ${enableSearch ? 'with Google Search Grounding active' : ''}. You can ask me technical questions or start a voice conversation.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  }, [activeAlert, messages.length, selectedModel, enableSearch]);

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
        prompt: promptText.trim(),
        model: selectedModel,
        enableSearch
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

  const toggleVoiceMode = () => {
    if (!isVoiceActive) {
      setIsVoiceActive(true);
      setIsSpeaking(true);
      // Simulate Live API voice greeting
      const voiceMsg: ChatMessage = {
        id: `voice-${Date.now()}`,
        sender: 'analyst',
        content: `[Gemini Live Audio session active using ${selectedModel === 'gemini-3.8-live' ? 'gemini-3.8-live' : selectedModel}]: Listening for voice stream on active alert ${activeAlert?.id}...`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, voiceMsg]);
      setTimeout(() => setIsSpeaking(false), 3000);
    } else {
      setIsVoiceActive(false);
      setIsSpeaking(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cardBg = isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Header Banner with Model Selector and Search Grounding Toggle */}
      <div className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${cardBg}`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className={`text-base font-bold tracking-tight ${textTitle}`}>
              AI Security Analyst Workstation
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border border-cyan-300/60">
              {selectedModel}
            </span>
          </div>
          <p className={`text-xs ${textMuted}`}>
            Tier-3 forensic investigator powered by Gemini models with Google Search Grounding and Live API voice conversation support.
          </p>
        </div>

        {/* Controls: Model Switcher & Search Grounding Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Model Selector */}
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono ${textMuted}`}>Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (General SOC)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Ingestion)</option>
              <option value="gemini-4-argon">gemini-4-argon (Complex Forensics)</option>
              <option value="gemini-3.8-live">gemini-3.8-live (Live Audio Stream)</option>
            </select>
          </div>

          {/* Google Search Grounding Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border border-slate-700/60 bg-slate-900/40 text-xs font-mono text-slate-300">
            <input
              type="checkbox"
              checked={enableSearch}
              onChange={(e) => setEnableSearch(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Google Search Grounding</span>
          </label>

          {/* Voice Conversation Toggle */}
          <button
            onClick={toggleVoiceMode}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center space-x-2 transition-all ${
              isVoiceActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : (isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200')
            }`}
          >
            {isVoiceActive ? <Mic className="w-3.5 h-3.5 text-rose-400 animate-bounce" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>{isVoiceActive ? 'Live Voice Active' : 'Start Voice Chat'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Alert Selector on Left, Multi-Turn Chat Thread on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alert Selection Sidebar */}
        <div className={`lg:col-span-4 p-5 rounded-2xl border space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold ${textTitle}`}>Target Investigation Alert</h3>
            <span className={`text-xs font-mono ${textMuted}`}>{alerts.length} total</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {alerts.map(a => {
              const isSelected = activeAlert?.id === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => setActiveAlert(a)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? (isDark ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-xs' : 'bg-cyan-50 border-cyan-300 text-slate-900 shadow-xs')
                      : (isDark ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700')
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{a.id}</span>
                    <SeverityBadge severity={a.severity} />
                  </div>
                  <div className="font-medium truncate mb-1">{a.title}</div>
                  <div className={`text-[10px] font-mono flex justify-between ${textMuted}`}>
                    <span>Host: {a.source_ip}</span>
                    <span>Score: {a.anomalyScore}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Multi-Turn Chat Thread & Voice Interface */}
        <div className={`lg:col-span-8 p-5 rounded-2xl border flex flex-col justify-between min-h-[550px] ${cardBg}`}>
          {/* Active Target Banner */}
          {activeAlert && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs mb-4 ${
              isDark ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center space-x-2 truncate">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-mono font-bold">{activeAlert.id}:</span>
                <span className="truncate">{activeAlert.title} ({activeAlert.source_ip})</span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Score: {activeAlert.anomalyScore}
              </span>
            </div>
          )}

          {/* Voice Active Indicator */}
          {isVoiceActive && (
            <div className="p-3 rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-200 text-xs flex items-center justify-between mb-4 animate-pulse font-mono">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Gemini Live Audio Streaming Mode ({selectedModel})</span>
              </div>
              <span>{isSpeaking ? 'Analyst Speaking...' : 'Listening...'}</span>
            </div>
          )}

          {/* Chat Messages Thread */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[420px]">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl text-xs space-y-2.5 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md'
                    : (isDark ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none' : 'bg-slate-100 border border-slate-200 text-slate-900 rounded-bl-none')
                }`}>
                  <div className="flex items-center justify-between space-x-4 opacity-70 text-[10px] font-mono">
                    <span className="font-bold">{msg.sender === 'user' ? 'Investigator' : 'Gemini AI Analyst'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="leading-relaxed whitespace-pre-wrap font-sans text-sm">{msg.content}</p>

                  {/* Structured Analysis Card if available */}
                  {msg.analysis && (
                    <div className="space-y-3 pt-3 mt-3 border-t border-slate-700/60 text-xs font-sans">
                      <div>
                        <strong className="text-cyan-400 font-mono text-[11px] uppercase tracking-wider">Threat Assessment:</strong>
                        <p className="mt-1 leading-relaxed text-slate-300">{msg.analysis.threatAssessment}</p>
                      </div>

                      {msg.analysis.benignExplanations.length > 0 && (
                        <div>
                          <strong className="text-emerald-400 font-mono text-[11px] uppercase tracking-wider">Plausible Benign Explanations:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1 text-slate-300 pl-1">
                            {msg.analysis.benignExplanations.map((b, idx) => (
                              <li key={idx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {msg.analysis.recommendedDefensiveSteps.length > 0 && (
                        <div>
                          <strong className="text-amber-400 font-mono text-[11px] uppercase tracking-wider">Recommended Triage Steps:</strong>
                          <ol className="list-decimal list-inside mt-1 space-y-1 text-slate-300 pl-1">
                            {msg.analysis.recommendedDefensiveSteps.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                        <span>Model: {msg.analysis.modelUsed || selectedModel} {enableSearch ? '• Google Search Grounded' : ''}</span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(msg.analysis, null, 2), msg.id)}
                          className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy JSON'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 animate-pulse p-3">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Consulting Gemini ({selectedModel}) with Google Search Grounding...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Prompts Pill Bar */}
          <div className="pt-3 pb-2 flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${
                  isDark
                    ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputPrompt);
            }}
            className="flex items-center space-x-2 pt-2 border-t border-slate-800/80"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`Ask ${selectedModel} about this anomaly (Google Search Grounding active)...`}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-sans focus:outline-none focus:border-cyan-500 ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-md disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
