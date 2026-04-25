import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Trash2, Bot, User, Info, Play, Mic, Volume2, ChevronDown, ChevronRight } from 'lucide-react';
import type { Message, Scenario, VoiceConfig } from '../types';
import { AVAILABLE_VOICES } from '../hooks/useTextToSpeech';

interface ChatProps {
  messages: Message[];
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  onStopStreaming: () => void;
  onClearMessages: () => void;
  selectedModel: string;
  isConnected: boolean;
  // Scenario & trigger support
  scenarios: Scenario[];
  activeScenarioId: string | null;
  onActivateScenario: (id: string | null) => void;
  onFireTrigger: (scenarioId: string, triggerId: string) => void;
  // Voice support
  voiceReady: boolean;
  onSpeakResponse?: (text: string) => void;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
  // STT support
  sttListening?: boolean;
  sttTranscribing?: boolean;
  onStartListening?: (onTranscript: (text: string) => void) => void;
  onStopListening?: () => void;
  // Voice config
  voiceConfig?: VoiceConfig;
  onVoiceConfigChange?: (config: VoiceConfig) => void;
}

export function Chat({
  messages, isStreaming,
  onSendMessage, onStopStreaming, onClearMessages,
  isConnected,
  scenarios, activeScenarioId, onActivateScenario, onFireTrigger,
  voiceReady, onSpeakResponse, isSpeaking, onStopSpeaking,
  sttListening, sttTranscribing, onStartListening, onStopListening,
  voiceConfig, onVoiceConfigChange,
}: ChatProps) {
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showScenarioBar, setShowScenarioBar] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastAssistantRef = useRef<string>('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-speak new assistant messages when voice is enabled
  useEffect(() => {
    if (!voiceEnabled || !onSpeakResponse) return;
    const lastMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.content);
    if (lastMsg && lastMsg.content && lastMsg.id !== lastAssistantRef.current && !isStreaming) {
      lastAssistantRef.current = lastMsg.id;
      onSpeakResponse(lastMsg.content);
    }
  }, [messages, isStreaming, voiceEnabled, onSpeakResponse]);

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    onSendMessage(input);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);
  const voiceAvailable = voiceReady;

  // Voice toggle: controls both listening (STT) and speaking (TTS)
  const handleVoiceToggle = useCallback(() => {
    if (voiceEnabled) {
      // Turn off: stop listening and speaking
      onStopListening?.();
      if (isSpeaking) onStopSpeaking?.();
      setVoiceEnabled(false);
    } else {
      // Turn on: start listening
      setVoiceEnabled(true);
      onStartListening?.((text: string) => {
        if (text.trim()) {
          onSendMessage(text.trim());
        }
      });
    }
  }, [voiceEnabled, onStartListening, onStopListening, onSendMessage, isSpeaking, onStopSpeaking]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-text-primary">AINA Chat</span>
          <span className="text-[10px] text-text-muted">
            {messages.filter(m => m.role !== 'system').length} messages
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Voice selector + toggle */}
          {voiceAvailable && onStartListening && (
            <div className="flex items-center gap-1">
              <select
                value={voiceConfig?.voiceId || ''}
                onChange={e => {
                  const voice = AVAILABLE_VOICES.find(v => v.id === e.target.value);
                  if (voice && voiceConfig && onVoiceConfigChange) {
                    onVoiceConfigChange({ ...voiceConfig, voiceId: voice.id });
                  }
                }}
                className="bg-bg-tertiary border border-border rounded px-1.5 py-1 text-[10px] text-text-secondary focus:outline-none focus:border-accent max-w-24"
              >
                {AVAILABLE_VOICES.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <button
                onClick={handleVoiceToggle}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                  voiceEnabled
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {voiceEnabled ? <Mic className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                {voiceEnabled ? (sttListening ? 'Listening...' : 'Voice On') : 'Voice'}
              </button>
            </div>
          )}
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="flex items-center gap-1 px-2 py-1 bg-warning/20 text-warning rounded text-[10px] font-medium"
            >
              <Square className="w-3 h-3" /> Stop
            </button>
          )}
          {isStreaming && (
            <button
              onClick={onStopStreaming}
              className="flex items-center gap-1 px-2 py-1 bg-danger/20 text-danger rounded text-[10px] font-medium hover:bg-danger/30"
            >
              <Square className="w-3 h-3" /> Stop
            </button>
          )}
          <button
            onClick={onClearMessages}
            className="flex items-center gap-1 px-2 py-1 text-text-muted hover:text-text-secondary text-[10px]"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-bg-tertiary mb-3" />
            <h3 className="text-sm font-semibold text-text-secondary mb-1">Test AINA here</h3>
            <p className="text-[11px] text-text-muted mb-4 max-w-xs">
              Type a driver question to see how the LLM responds with your current prompt configuration.
            </p>
            {!isConnected && (
              <div className="flex items-center gap-2 text-[11px] text-warning bg-warning/10 px-3 py-2 rounded-lg">
                <Info className="w-4 h-4 shrink-0" />
                Enter your OpenRouter API key to start chatting
              </div>
            )}
          </div>
        )}

        {messages.map(msg => {
          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 max-w-md">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Info className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-semibold text-accent">System Event</span>
                  </div>
                  <p className="text-[11px] text-text-secondary">{msg.content}</p>
                </div>
              </div>
            );
          }

          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
              )}
              <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
                <div
                  className={`px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                    isUser
                      ? 'bg-accent text-white rounded-br-sm'
                      : 'bg-bg-tertiary/60 text-text-primary rounded-bl-sm'
                  }`}
                >
                  {msg.content || (
                    <div className="flex items-center gap-1.5">
                      <div className="typing-dot w-1.5 h-1.5 rounded-full bg-text-muted" />
                      <div className="typing-dot w-1.5 h-1.5 rounded-full bg-text-muted" />
                      <div className="typing-dot w-1.5 h-1.5 rounded-full bg-text-muted" />
                    </div>
                  )}
                </div>
                {!isUser && msg.model && msg.content && (
                  <div className="text-[9px] text-text-muted mt-0.5 px-1">
                    {msg.model.split('/').pop()} &middot; {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
              {isUser && (
                <div className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-text-secondary" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scenario & Trigger bar */}
      <div className="border-t border-border shrink-0">
        <button
          onClick={() => setShowScenarioBar(!showScenarioBar)}
          className="w-full flex items-center gap-1.5 px-4 py-1.5 text-[10px] text-text-muted hover:text-text-secondary"
        >
          {showScenarioBar ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Scenario & Triggers
          {activeScenario && <span className="text-accent ml-1">({activeScenario.name})</span>}
        </button>

        {showScenarioBar && (
          <div className="px-4 pb-2 space-y-1.5">
            {/* Scenario quick-select */}
            <div className="flex flex-wrap gap-1">
              {scenarios.map(s => (
                <button
                  key={s.id}
                  onClick={() => onActivateScenario(activeScenarioId === s.id ? null : s.id)}
                  className={`px-2 py-1 rounded text-[10px] transition-colors ${
                    activeScenarioId === s.id
                      ? 'bg-accent/20 text-accent border border-accent/40'
                      : 'bg-bg-tertiary/40 text-text-muted hover:text-text-secondary border border-transparent'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Triggers for active scenario */}
            {activeScenario && activeScenario.triggers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {activeScenario.triggers.map(trigger => (
                  <button
                    key={trigger.id}
                    onClick={() => onFireTrigger(activeScenario.id, trigger.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                  >
                    <Play className="w-2.5 h-2.5" />
                    {trigger.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        {/* Transcribing indicator */}
        {sttTranscribing && (
          <div className="text-[10px] text-amber-400 mb-1.5 px-1">Transcribing speech...</div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={sttListening ? 'Listening...' : isConnected ? 'Type a driver question... (Enter to send)' : 'Enter API key first...'}
            disabled={!isConnected || isStreaming}
            rows={1}
            className="flex-1 bg-bg-tertiary/40 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary resize-none focus:outline-none focus:border-accent placeholder:text-text-muted disabled:opacity-50 max-h-32"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming || !isConnected}
            className="p-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
