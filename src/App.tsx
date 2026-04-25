import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ModelSelector } from './components/ModelSelector';
import { PromptEditor } from './components/PromptEditor';
import { AdasPanel } from './components/AdasPanel';
import { ScenarioPanel } from './components/ScenarioPanel';
import { ParameterPanel } from './components/ParameterPanel';
import { PromptPreview } from './components/PromptPreview';
import { Chat } from './components/Chat';
import { LiveSession } from './components/LiveSession';
import { PasswordGate } from './components/PasswordGate';
import { TranscriptionHistory } from './components/TranscriptionHistory';
import { PresetsManager } from './components/PresetsManager';
import { useChat } from './hooks/useChat';
import { useTextToSpeech, DEFAULT_VOICE_CONFIG } from './hooks/useTextToSpeech';
import { useSpeechToText } from './hooks/useSpeechToText';
import { useSessionStorage } from './hooks/useSessionStorage';
import type { AdasModule, AgentMode, ModelInfo, ResponseDepth, Scenario, DesignPrinciple, LLMParams, VoiceConfig, SavedSession, SavedPreset } from './types';
import { BASE_SYSTEM_PROMPT, DEFAULT_AGENT_MODES, DESIGN_PRINCIPLES, DEFAULT_RESPONSE_DEPTHS, CORE_TASKS_PROMPT } from './data/prompts';
import { DEFAULT_ADAS_MODULES } from './data/adas';
import { DEFAULT_SCENARIOS } from './data/scenarios';

function App() {
  // Auth — check session cookie on load
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/auth-status`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setIsAuthenticated(Boolean(d.authenticated)))
      .catch(() => setIsAuthenticated(false));
  }, []);

  // Server key status (only available once authenticated)
  const [serverStatus, setServerStatus] = useState({ openrouter: false, elevenlabs: false });
  useEffect(() => {
    if (isAuthenticated) {
      fetch(`${import.meta.env.BASE_URL}api/status`, { credentials: 'include' }).then(r => r.json()).then(setServerStatus).catch(() => {});
    }
  }, [isAuthenticated]);

  // Session storage
  const sessionStore = useSessionStorage();

  // Live session toggle
  const [liveSessionActive, setLiveSessionActive] = useState(false);

  // Defaults
  const DEFAULTS = useMemo(() => ({
    selectedModel: 'openai/gpt-4.1-mini',
    agentModes: DEFAULT_AGENT_MODES,
    agentMode: 'adaptive',
    responseDepths: DEFAULT_RESPONSE_DEPTHS,
    responseDepth: 'quick',
    basePrompt: BASE_SYSTEM_PROMPT,
    coreTasksPrompt: CORE_TASKS_PROMPT,
    designPrinciples: DESIGN_PRINCIPLES,
    adasModules: DEFAULT_ADAS_MODULES,
    scenarios: DEFAULT_SCENARIOS,
    activeScenarioId: null as string | null,
    introEn: "Hi, I'm AINA. I'm here to help you understand your truck's features. We can go at whatever pace works for you.",
    introSv: "Hej, jag heter AINA. Jag finns här för att hjälpa dig förstå lastbilens funktioner. Vi kan ta det i den takt som passar dig.",
    language: 'en' as 'en' | 'sv',
    voiceConfig: DEFAULT_VOICE_CONFIG,
    customModels: [] as ModelInfo[],
    params: { temperature: 0.7, topP: 0.9, maxTokens: 512, frequencyPenalty: 0, presencePenalty: 0 },
  }), []);

  // Load saved state or use defaults
  const savedState = useMemo(() => {
    try {
      const raw = localStorage.getItem('conai_working_state');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, []);

  // Config state (auto-loads from localStorage if available)
  const [selectedModel, setSelectedModel] = useState(savedState?.selectedModel ?? DEFAULTS.selectedModel);
  const [agentModes, setAgentModes] = useState<AgentMode[]>(savedState?.agentModes ?? DEFAULTS.agentModes);
  const [agentMode, setAgentMode] = useState(savedState?.agentMode ?? DEFAULTS.agentMode);
  const [responseDepths, setResponseDepths] = useState<ResponseDepth[]>(savedState?.responseDepths ?? DEFAULTS.responseDepths);
  const [responseDepth, setResponseDepth] = useState(savedState?.responseDepth ?? DEFAULTS.responseDepth);
  const [basePrompt, setBasePrompt] = useState(savedState?.basePrompt ?? DEFAULTS.basePrompt);
  const [coreTasksPrompt, setCoreTasksPrompt] = useState(savedState?.coreTasksPrompt ?? DEFAULTS.coreTasksPrompt);
  const [designPrinciples, setDesignPrinciples] = useState<DesignPrinciple[]>(savedState?.designPrinciples ?? DEFAULTS.designPrinciples);
  const [adasModules, setAdasModules] = useState<AdasModule[]>(savedState?.adasModules ?? DEFAULTS.adasModules);
  const [scenarios, setScenarios] = useState<Scenario[]>(savedState?.scenarios ?? DEFAULTS.scenarios);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(savedState?.activeScenarioId ?? DEFAULTS.activeScenarioId);
  const [introEn, setIntroEn] = useState(savedState?.introEn ?? DEFAULTS.introEn);
  const [introSv, setIntroSv] = useState(savedState?.introSv ?? DEFAULTS.introSv);
  const [language, setLanguage] = useState<'en' | 'sv'>(savedState?.language ?? DEFAULTS.language);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(savedState?.voiceConfig ?? DEFAULTS.voiceConfig);
  const [customModels, setCustomModels] = useState<ModelInfo[]>(savedState?.customModels ?? DEFAULTS.customModels);
  const [params, setParams] = useState<LLMParams>(savedState?.params ?? DEFAULTS.params);

  // Auto-save working state to localStorage on any change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    localStorage.setItem('conai_working_state', JSON.stringify({
      selectedModel, agentModes, agentMode, responseDepths, responseDepth,
      basePrompt, coreTasksPrompt, designPrinciples, adasModules, scenarios,
      activeScenarioId, introEn, introSv, language, voiceConfig, customModels, params,
    }));
  }, [selectedModel, agentModes, agentMode, responseDepths, responseDepth,
      basePrompt, coreTasksPrompt, designPrinciples, adasModules, scenarios,
      activeScenarioId, introEn, introSv, language, voiceConfig, customModels, params]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setSelectedModel(DEFAULTS.selectedModel);
    setAgentModes(DEFAULTS.agentModes);
    setAgentMode(DEFAULTS.agentMode);
    setResponseDepths(DEFAULTS.responseDepths);
    setResponseDepth(DEFAULTS.responseDepth);
    setBasePrompt(DEFAULTS.basePrompt);
    setCoreTasksPrompt(DEFAULTS.coreTasksPrompt);
    setDesignPrinciples(DEFAULTS.designPrinciples);
    setAdasModules(DEFAULTS.adasModules);
    setScenarios(DEFAULTS.scenarios);
    setActiveScenarioId(DEFAULTS.activeScenarioId);
    setIntroEn(DEFAULTS.introEn);
    setIntroSv(DEFAULTS.introSv);
    setLanguage(DEFAULTS.language);
    setVoiceConfig(DEFAULTS.voiceConfig);
    setCustomModels(DEFAULTS.customModels);
    setParams(DEFAULTS.params);
    localStorage.removeItem('conai_working_state');
  }, [DEFAULTS]);
  // Track config chat start time
  const [chatStartTime] = useState(Date.now());

  // Compile the full system prompt
  const compiledPrompt = useMemo(() => {
    const parts: string[] = [];
    parts.push(basePrompt);
    const currentMode = agentModes.find(m => m.id === agentMode);
    if (currentMode) parts.push('\n\n--- CURRENT MODE ---\n' + currentMode.systemPrompt);

    const depth = responseDepths.find(d => d.id === responseDepth);
    if (depth) parts.push('\n\n--- RESPONSE DEPTH ---\n' + depth.constraint);

    const activePrinciples = designPrinciples.filter(p => p.enabled);
    if (activePrinciples.length > 0) {
      parts.push('\n\n--- DESIGN PRINCIPLES ---');
      activePrinciples.forEach(p => parts.push(`\n${p.name}: ${p.prompt}`));
    }

    if (coreTasksPrompt.trim()) parts.push('\n\n--- CORE TASKS ---\n' + coreTasksPrompt);

    const enabledModules = adasModules.filter(m => m.enabled);
    if (enabledModules.length > 0) {
      parts.push('\n\n--- ADAS KNOWLEDGE ---');
      parts.push('You have knowledge about the following ADAS systems. Use this to answer driver questions accurately:');
      enabledModules.forEach(m => parts.push(`\n[${m.shortName}]\n${m.knowledge}`));
    }

    const activeScenario = scenarios.find(s => s.id === activeScenarioId);
    if (activeScenario) parts.push('\n\n--- CURRENT DRIVING CONTEXT ---\n' + activeScenario.contextPrompt);

    if (language === 'sv') {
      parts.push('\n\n--- LANGUAGE ---\nIMPORTANT: You MUST respond to the driver in Swedish (Svenska). All your responses, explanations, and questions must be in Swedish. Your internal knowledge and settings are in English, but your output language is Swedish.');
    } else {
      parts.push('\n\n--- LANGUAGE ---\nRespond to the driver in English.');
    }

    return parts.join('');
  }, [basePrompt, agentModes, agentMode, responseDepths, responseDepth, designPrinciples, coreTasksPrompt, adasModules, scenarios, activeScenarioId, language]);

  // Voice hooks for config chat
  const chatTts = useTextToSpeech({ voiceConfig });
  const chatStt = useSpeechToText({ language: language === 'sv' ? 'sv' : 'en' });

  const { messages, isStreaming, sendMessage, stopStreaming, clearMessages, injectSystemMessage } = useChat({
    model: selectedModel,
    systemPrompt: compiledPrompt,
    ...params,
  });

  const handleFireTrigger = useCallback((scenarioId: string, triggerId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    const trigger = scenario?.triggers.find(t => t.id === triggerId);
    if (!trigger) return;
    setScenarios(prev => prev.map(s => {
      if (s.id !== scenarioId) return s;
      return { ...s, triggers: s.triggers.map(t => t.id === triggerId ? { ...t, fired: true } : t) };
    }));
    injectSystemMessage(`[SCENARIO EVENT: ${trigger.label}]\n${trigger.prompt}`);
  }, [scenarios, injectSystemMessage]);

  // Save config chat on clear (if it has messages)
  const handleClearMessages = useCallback(() => {
    if (messages.filter(m => m.role !== 'system').length > 0) {
      const saved: SavedSession = {
        id: crypto.randomUUID(),
        type: 'chat',
        messages: [...messages],
        startTime: chatStartTime,
        endTime: Date.now(),
        model: selectedModel,
        agentMode,
      };
      sessionStore.saveSession(saved);
    }
    clearMessages();
  }, [messages, clearMessages, chatStartTime, selectedModel, agentMode, sessionStore]);

  // Presets
  const getCurrentPreset = useCallback(() => ({
    selectedModel,
    agentMode,
    agentModes,
    responseDepth,
    basePrompt,
    coreTasksPrompt,
    designPrinciples,
    adasModules,
    scenarios,
    params,
  }), [selectedModel, agentMode, agentModes, responseDepth, basePrompt, coreTasksPrompt, designPrinciples, adasModules, scenarios, params]);

  const loadPreset = useCallback((preset: SavedPreset) => {
    setSelectedModel(preset.selectedModel);
    if ((preset as any).agentModes) setAgentModes((preset as any).agentModes);
    setAgentMode(preset.agentMode);
    setResponseDepth(preset.responseDepth as 'quick' | 'short' | 'detailed');
    setBasePrompt(preset.basePrompt);
    setCoreTasksPrompt(preset.coreTasksPrompt);
    setDesignPrinciples(preset.designPrinciples);
    setAdasModules(preset.adasModules);
    setScenarios(preset.scenarios);
    setParams(preset.params);
    setActiveScenarioId(null);
  }, []);

  const isConnected = serverStatus.openrouter;
  const voiceReady = serverStatus.elevenlabs;

  // --- PASSWORD GATE ---
  if (isAuthenticated === null) {
    return <div className="h-screen flex items-center justify-center bg-bg-primary" />;
  }
  if (!isAuthenticated) {
    return <PasswordGate onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  // --- LIVE SESSION VIEW ---
  if (liveSessionActive) {
    return (
      <LiveSession
        selectedModel={selectedModel}
        compiledPrompt={compiledPrompt}
        params={params}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onActivateScenario={setActiveScenarioId}
        onScenariosChange={setScenarios}
        onEndSession={() => setLiveSessionActive(false)}
        onSaveSession={sessionStore.saveSession}
        agentMode={agentMode}
        language={language}
        voiceConfig={voiceConfig}
        introMessage={language === 'sv' ? introSv : introEn}
      />
    );
  }

  // --- CONFIG / TEST VIEW ---
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bg-primary">
      <Header
        selectedModel={selectedModel}
        isConnected={isConnected}
        voiceReady={voiceReady}
        onStartLiveSession={() => setLiveSessionActive(true)}
        language={language}
        onLanguageChange={setLanguage}
        onResetDefaults={resetToDefaults}
        presetsSlot={
          <PresetsManager
            getCurrentPreset={getCurrentPreset}
            onLoadPreset={loadPreset}
          />
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[420px] border-r border-border shrink-0 overflow-hidden">
          <Sidebar>
            {{
              prompt: (
                <PromptEditor
                  basePrompt={basePrompt}
                  onBasePromptChange={setBasePrompt}
                  agentModes={agentModes}
                  onAgentModesChange={setAgentModes}
                  agentMode={agentMode}
                  onAgentModeChange={setAgentMode}
                  responseDepths={responseDepths}
                  onResponseDepthsChange={setResponseDepths}
                  responseDepth={responseDepth}
                  onResponseDepthChange={setResponseDepth}
                  designPrinciples={designPrinciples}
                  onDesignPrinciplesChange={setDesignPrinciples}
                  coreTasksPrompt={coreTasksPrompt}
                  onCoreTasksPromptChange={setCoreTasksPrompt}
                  introEn={introEn}
                  onIntroEnChange={setIntroEn}
                  introSv={introSv}
                  onIntroSvChange={setIntroSv}
                />
              ),
              adas: (
                <AdasPanel modules={adasModules} onModulesChange={setAdasModules} />
              ),
              scenarios: (
                <ScenarioPanel
                  scenarios={scenarios}
                  onScenariosChange={setScenarios}
                  activeScenarioId={activeScenarioId}
                  onActivateScenario={setActiveScenarioId}
                  onFireTrigger={handleFireTrigger}
                />
              ),
              models: (
                <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} customModels={customModels} onCustomModelsChange={setCustomModels} />
              ),
              params: (
                <ParameterPanel params={params} onParamsChange={setParams} />
              ),
              preview: (
                <PromptPreview compiledPrompt={compiledPrompt} />
              ),
              history: (
                <TranscriptionHistory
                  sessions={sessionStore.sessions}
                  onDelete={sessionStore.deleteSession}
                  onExport={sessionStore.exportSession}
                  onRename={sessionStore.renameSession}
                />
              ),
            }}
          </Sidebar>
        </div>

        <div className="flex-1 overflow-hidden">
          <Chat
            messages={messages}
            isStreaming={isStreaming}
            onSendMessage={sendMessage}
            onStopStreaming={stopStreaming}
            onClearMessages={handleClearMessages}
            selectedModel={selectedModel}
            isConnected={isConnected}
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onActivateScenario={setActiveScenarioId}
            onFireTrigger={handleFireTrigger}
            voiceReady={voiceReady}
            onSpeakResponse={chatTts.speak}
            isSpeaking={chatTts.isSpeaking}
            onStopSpeaking={chatTts.stopSpeaking}
            sttListening={chatStt.isListening}
            sttTranscribing={chatStt.isTranscribing}
            onStartListening={chatStt.startListening}
            onStopListening={chatStt.stopListening}
            voiceConfig={voiceConfig}
            onVoiceConfigChange={setVoiceConfig}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
