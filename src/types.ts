export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
}

export interface AdasModule {
  id: string;
  name: string;
  shortName: string;
  enabled: boolean;
  knowledge: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
}

export interface Scenario {
  id: string;
  name: string;
  icon: string;
  description: string;
  contextPrompt: string;
  triggers: ScenarioTrigger[];
  active: boolean;
}

export interface ScenarioTrigger {
  id: string;
  label: string;
  prompt: string;
  fired: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  category: 'cloud' | 'local';
  tier: 'flagship' | 'mid' | 'budget';
  contextWindow: number;
  description: string;
  // For custom local models (Ollama etc.)
  isCustom?: boolean;
  endpoint?: string; // e.g. "http://localhost:11434"
}

export interface AgentMode {
  id: string;
  name: string;
  subtitle: string;
  systemPrompt: string;
  maxWords: number;
  responseStyle: string;
}

export interface DesignPrinciple {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  prompt: string;
}

export interface LLMParams {
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface ResponseDepth {
  id: string;
  name: string;
  description: string;
  constraint: string;
}

export type LiveSessionMode = 'hands-free' | 'approve' | 'manual';

export type LiveSessionState = 'idle' | 'listening' | 'processing' | 'awaiting-approval' | 'responding';

export interface VoiceConfig {
  voiceId: string;
  stability: number;
  similarity: number;
  model: string;
}

export interface SavedSession {
  id: string;
  type: 'live' | 'chat';
  participantNumber?: string;
  messages: Message[];
  startTime: number;
  endTime: number;
  model: string;
  agentMode: string;
  activeScenario?: string;
  sessionMode?: LiveSessionMode;
  /** User-editable display name. Falls back to auto-generated label if absent. */
  name?: string;
}

export interface SavedPreset {
  id: string;
  name: string;
  savedAt: number;
  selectedModel: string;
  agentMode: string;
  responseDepth: string;
  basePrompt: string;
  coreTasksPrompt: string;
  designPrinciples: DesignPrinciple[];
  adasModules: AdasModule[];
  scenarios: Scenario[];
  params: LLMParams;
}

export interface AppState {
  apiKey: string;
  selectedModel: string;
  agentMode: 'calm' | 'proactive';
  responseDepth: 'quick' | 'short' | 'detailed';
  params: LLMParams;
  adasModules: AdasModule[];
  scenarios: Scenario[];
  activeScenarioId: string | null;
  designPrinciples: DesignPrinciple[];
  basePrompt: string;
  messages: Message[];
  isStreaming: boolean;
}
