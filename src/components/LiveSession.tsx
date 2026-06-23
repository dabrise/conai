import { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, User, Info, Mic, MicOff, Volume2, Settings2, AudioLines } from 'lucide-react';
import type { LiveSessionMode, LiveSessionState, Scenario, LLMParams, VoiceConfig, SavedSession } from '../types';
import { useLiveSession } from '../hooks/useLiveSession';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech, AVAILABLE_VOICES } from '../hooks/useTextToSpeech';
import { useRealtimeSession, REALTIME_VOICES, type RealtimeState } from '../hooks/useRealtimeSession';
import { VoiceIndicator } from './VoiceIndicator';
import { ResearcherControls } from './ResearcherControls';

interface LiveSessionProps {
  selectedModel: string;
  compiledPrompt: string;
  params: LLMParams;
  scenarios: Scenario[];
  activeScenarioId: string | null;
  onActivateScenario: (id: string | null) => void;
  onScenariosChange: (scenarios: Scenario[]) => void;
  onEndSession: () => void;
  onSaveSession: (session: SavedSession) => void;
  agentMode: string;
  language: 'en' | 'sv';
  voiceConfig: VoiceConfig;
  introMessage: string;
  voiceEngine: 'cascade' | 'realtime';
  realtimeModel: string;
  realtimeVoice: string;
  realtimeReady: boolean;
}

// Map realtime state to the shared VoiceIndicator states
function realtimeToIndicator(s: RealtimeState): LiveSessionState {
  switch (s) {
    case 'listening': return 'listening';
    case 'user-speaking': return 'listening';
    case 'connecting': return 'processing';
    case 'thinking': return 'processing';
    case 'speaking': return 'responding';
    default: return 'idle';
  }
}

export function LiveSession({
  selectedModel, compiledPrompt, params,
  scenarios, activeScenarioId, onActivateScenario, onScenariosChange,
  onEndSession, onSaveSession, agentMode, language, voiceConfig: sharedVoiceConfig, introMessage,
  voiceEngine, realtimeModel, realtimeVoice, realtimeReady,
}: LiveSessionProps) {
  const isRealtime = voiceEngine === 'realtime';

  const [participantNumber, setParticipantNumber] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [mode, setMode] = useState<LiveSessionMode>('hands-free');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [liveStartTime, setLiveStartTime] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cascade engine
  const session = useLiveSession({ model: selectedModel, compiledPrompt, params });
  const stt = useSpeechToText({ language: language === 'sv' ? 'sv' : 'en' });
  const tts = useTextToSpeech({ voiceConfig: sharedVoiceConfig });

  // Realtime engine
  const realtime = useRealtimeSession({ model: realtimeModel, voice: realtimeVoice });

  // Unified view values
  const displayMessages = isRealtime ? realtime.messages : session.messages;
  const indicatorState: LiveSessionState = isRealtime
    ? realtimeToIndicator(realtime.state)
    : session.sessionState;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [displayMessages]);

  // Realtime: re-sync instructions when the active scenario changes mid-session
  useEffect(() => {
    if (isRealtime && sessionStarted) {
      realtime.updateInstructions(compiledPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScenarioId]);

  // Handle transcript from cascade STT
  const handleTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    try {
      if (mode === 'hands-free') {
        const response = await session.handleHandsFree(text);
        if (response) { await tts.speak(response); session.setListening(); }
      } else if (mode === 'approve') {
        await session.handleApprove(text);
      } else if (mode === 'manual') {
        session.handleManual(text);
      }
    } catch (err) {
      console.error('Session error:', err);
      session.setListening();
    }
  }, [mode, session, tts]);

  // Start session
  const beginSession = useCallback(() => {
    if (!participantNumber.trim()) return;
    setSessionStarted(true);
    setLiveStartTime(Date.now());

    if (isRealtime) {
      realtime.start({ instructions: compiledPrompt, greeting: introMessage });
      return;
    }

    // Cascade
    session.startSession();
    session.injectEvent(`Session started. Participant: P${participantNumber}. AINA introduction playing.`);
    tts.speak(introMessage).then(() => {
      session.setListening();
      if (micEnabled) stt.startListening(handleTranscript);
    });
  }, [participantNumber, isRealtime, realtime, compiledPrompt, introMessage, session, tts, micEnabled, stt, handleTranscript]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    const next = !micEnabled;
    setMicEnabled(next);
    if (isRealtime) {
      realtime.setMicMuted(!next);
    } else {
      if (next) stt.startListening(handleTranscript);
      else stt.stopListening();
    }
  }, [micEnabled, isRealtime, realtime, stt, handleTranscript]);

  // Cascade approve/reject/manual
  const handleApprove = useCallback(async () => {
    const text = session.approveResponse();
    if (text) { await tts.speak(text); session.setListening(); if (micEnabled) stt.startListening(handleTranscript); }
  }, [session, tts, micEnabled, stt, handleTranscript]);
  const handleReject = useCallback(() => {
    session.rejectResponse();
    if (micEnabled) stt.startListening(handleTranscript);
  }, [session, micEnabled, stt, handleTranscript]);
  const handleEditAndApprove = useCallback(async (text: string) => {
    session.editAndApprove(text);
    await tts.speak(text); session.setListening();
    if (micEnabled) stt.startListening(handleTranscript);
  }, [session, tts, micEnabled, stt, handleTranscript]);
  const handleSendManual = useCallback(async (text: string) => {
    session.sendManualResponse(text);
    await tts.speak(text); session.setListening();
    if (micEnabled) stt.startListening(handleTranscript);
  }, [session, tts, micEnabled, stt, handleTranscript]);

  // Fire trigger (context injection)
  const handleFireTrigger = useCallback((scenarioId: string, triggerId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    const trigger = scenario?.triggers.find(t => t.id === triggerId);
    if (!trigger) return;
    onScenariosChange(scenarios.map(s => {
      if (s.id !== scenarioId) return s;
      return { ...s, triggers: s.triggers.map(t => t.id === triggerId ? { ...t, fired: true } : t) };
    }));
    const note = `[SCENARIO EVENT: ${trigger.label}]\n${trigger.prompt}`;
    if (isRealtime) realtime.injectEvent(note);
    else session.injectEvent(note);
  }, [scenarios, onScenariosChange, isRealtime, realtime, session]);

  // End session — save transcript
  const handleEndSession = useCallback(() => {
    const msgs = isRealtime ? realtime.messages : session.messages;
    if (isRealtime) realtime.stop();
    else { stt.stopListening(); tts.stopSpeaking(); session.endSession(); }

    const saved: SavedSession = {
      id: crypto.randomUUID(),
      type: 'live',
      participantNumber,
      messages: msgs,
      startTime: liveStartTime || Date.now(),
      endTime: Date.now(),
      model: isRealtime ? `realtime:${realtimeModel}` : selectedModel,
      agentMode,
      activeScenario: activeScenarioId || undefined,
      sessionMode: 'hands-free',
    };
    onSaveSession(saved);
    onEndSession();
  }, [isRealtime, realtime, session, stt, tts, participantNumber, liveStartTime, realtimeModel, selectedModel, agentMode, activeScenarioId, onSaveSession, onEndSession]);

  const messageCount = displayMessages.filter(m => m.role !== 'system').length;
  const realtimeVoiceName = REALTIME_VOICES.find(v => v.id === realtimeVoice)?.name || realtimeVoice;
  const cascadeVoiceName = AVAILABLE_VOICES.find(v => v.id === sharedVoiceConfig.voiceId)?.name || 'Unknown';

  // Participant number gate
  if (!sessionStarted) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center gap-2 bg-green-900/40 px-4 py-2 rounded-xl border border-green-500/30 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-bold text-green-400">LIVE TEST</span>
            <span className="text-[10px] text-text-secondary ml-1">
              {isRealtime ? `Realtime · ${realtimeModel}` : 'Cascade'}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Enter Test Participant Number</h2>
          <p className="text-xs text-text-muted mb-6">Required before starting. The transcript will be saved under this number.</p>
          {isRealtime && !realtimeReady && (
            <div className="text-[11px] text-warning bg-warning/10 rounded-lg px-3 py-2 mb-4 max-w-xs mx-auto">
              OpenAI key not configured on the server — Realtime won't connect. Switch to Cascade in the Models tab, or add OPENAI_KEY.
            </div>
          )}
          <div className="flex gap-2 max-w-xs mx-auto">
            <input
              type="text"
              value={participantNumber}
              onChange={e => setParticipantNumber(e.target.value)}
              placeholder="e.g. 01, 02, 03..."
              autoFocus
              onKeyDown={e => e.key === 'Enter' && beginSession()}
              className="flex-1 bg-bg-secondary border border-border rounded-lg px-4 py-3 text-center text-lg font-mono text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted"
            />
            <button
              onClick={beginSession}
              disabled={!participantNumber.trim()}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Start
            </button>
          </div>
          <button onClick={onEndSession} className="mt-6 text-xs text-text-muted hover:text-text-secondary">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-bg-secondary border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-900/40 px-3 py-1.5 rounded-lg border border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-bold text-sm text-green-400 tracking-wide">LIVE</span>
            <span className="text-xs text-text-secondary">AINA Session</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            {isRealtime ? <AudioLines className="w-3 h-3" /> : null}
            {isRealtime
              ? `Realtime: ${realtimeModel} · ${realtimeVoiceName}`
              : `Model: ${selectedModel.split('/').pop()}`}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {realtime.error && isRealtime && (
            <span className="text-[10px] text-danger max-w-xs truncate" title={realtime.error}>
              {realtime.error}
            </span>
          )}
          <button
            onClick={toggleMic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              micEnabled
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-danger/20 text-danger border border-danger/30'
            }`}
          >
            {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            {micEnabled ? 'Mic On' : 'Mic Off'}
          </button>
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-bg-tertiary rounded-lg text-xs text-text-secondary hover:bg-bg-hover"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Voice
          </button>
        </div>
      </div>

      {/* Voice info */}
      {showVoiceSettings && (
        <div className="px-5 py-2 bg-bg-secondary border-b border-border">
          <div className="text-[10px] text-text-muted">
            {isRealtime ? (
              <>Engine: <span className="text-text-secondary">Realtime (OpenAI)</span> · Voice: <span className="text-text-secondary">{realtimeVoiceName}</span> · Model: <span className="text-text-secondary">{realtimeModel}</span></>
            ) : (
              <>Engine: <span className="text-text-secondary">Cascade</span> · Voice: <span className="text-text-secondary">{cascadeVoiceName}</span> <span className="ml-1">(change in Models / Chat)</span></>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Researcher Controls */}
        <div className="w-[360px] border-r border-border shrink-0 overflow-hidden">
          <ResearcherControls
            mode={mode}
            onModeChange={setMode}
            sessionState={indicatorState}
            pendingResponse={session.pendingResponse}
            sessionStart={liveStartTime}
            messageCount={messageCount}
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onActivateScenario={onActivateScenario}
            onFireTrigger={handleFireTrigger}
            onApprove={handleApprove}
            onReject={handleReject}
            onEditAndApprove={handleEditAndApprove}
            onSendManual={handleSendManual}
            onEndSession={handleEndSession}
            lockedHandsFree={isRealtime}
          />
        </div>

        {/* Right: Live Conversation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-center py-6 border-b border-border bg-bg-secondary/50">
            <VoiceIndicator state={indicatorState} size="lg" />
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {displayMessages.map(msg => {
              if (msg.role === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 max-w-lg">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Info className="w-3 h-3 text-accent" />
                        <span className="text-[10px] font-semibold text-accent">Event</span>
                        <span className="text-[9px] text-text-muted ml-auto">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-5 h-5 text-accent" />
                    </div>
                  )}
                  <div className="max-w-[70%]">
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isUser ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-bg-tertiary/60 text-text-primary rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <div className={`text-[9px] text-text-muted mt-0.5 px-1 ${isUser ? 'text-right' : ''}`}>
                      {isUser ? (
                        <span><Mic className="w-2.5 h-2.5 inline" /> Voice &middot; {new Date(msg.timestamp).toLocaleTimeString()}</span>
                      ) : (
                        <span>
                          <Volume2 className="w-2.5 h-2.5 inline" /> {msg.model?.split('/').pop() || 'AINA'}
                          {' '}&middot; {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {isUser && (
                    <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                  )}
                </div>
              );
            })}

            {!isRealtime && stt.isTranscribing && (
              <div className="flex justify-end">
                <div className="bg-blue-600/50 text-white/70 px-4 py-2 rounded-2xl rounded-br-sm text-sm italic">
                  Transcribing...
                </div>
              </div>
            )}
            {isRealtime && realtime.state === 'connecting' && (
              <div className="flex justify-center">
                <div className="text-[11px] text-text-muted italic">Connecting to realtime voice…</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
