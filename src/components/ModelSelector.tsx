import { useState } from 'react';
import { Cloud, HardDrive, Crown, Sparkles, Leaf, Monitor, Plus, Check, X, Trash2, AudioLines, Layers } from 'lucide-react';
import { MODELS, MODEL_TIERS } from '../data/models';
import { REALTIME_MODELS, REALTIME_VOICES } from '../hooks/useRealtimeSession';
import type { ModelInfo } from '../types';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  customModels: ModelInfo[];
  onCustomModelsChange: (models: ModelInfo[]) => void;
  voiceEngine: 'cascade' | 'realtime';
  onVoiceEngineChange: (engine: 'cascade' | 'realtime') => void;
  realtimeModel: string;
  onRealtimeModelChange: (model: string) => void;
  realtimeVoice: string;
  onRealtimeVoiceChange: (voice: string) => void;
  realtimeReady: boolean;
}

const tierIcons = {
  flagship: Crown,
  mid: Sparkles,
  budget: Leaf,
};

export function ModelSelector({
  selectedModel, onModelChange, customModels, onCustomModelsChange,
  voiceEngine, onVoiceEngineChange, realtimeModel, onRealtimeModelChange,
  realtimeVoice, onRealtimeVoiceChange, realtimeReady,
}: ModelSelectorProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newModelId, setNewModelId] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('http://localhost:11434');

  const cloudModels = MODELS.filter(m => m.category === 'cloud');
  const localModels = MODELS.filter(m => m.category === 'local');

  const addCustomModel = () => {
    if (!newName.trim() || !newModelId.trim() || !newEndpoint.trim()) return;
    const model: ModelInfo = {
      id: `custom:${newEndpoint}:${newModelId.trim()}`,
      name: newName.trim(),
      provider: 'Local',
      category: 'local',
      tier: 'mid',
      contextWindow: 0,
      description: `${newEndpoint} — ${newModelId.trim()}`,
      isCustom: true,
      endpoint: newEndpoint.trim(),
    };
    onCustomModelsChange([...customModels, model]);
    setNewName(''); setNewModelId(''); setNewEndpoint('http://localhost:11434');
    setShowAddForm(false);
  };

  const deleteCustomModel = (id: string) => {
    onCustomModelsChange(customModels.filter(m => m.id !== id));
    if (selectedModel === id) onModelChange(MODELS[0].id);
  };

  const renderModelGroup = (models: ModelInfo[], icon: React.ReactNode, label: string, desc: string) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        {icon}
        <div>
          <div className="text-xs font-semibold text-text-primary">{label}</div>
          <div className="text-[10px] text-text-muted">{desc}</div>
        </div>
      </div>
      <div className="space-y-1">
        {(['flagship', 'mid', 'budget'] as const).map(tier => {
          const tierModels = models.filter(m => m.tier === tier);
          if (tierModels.length === 0) return null;
          const TierIcon = tierIcons[tier];
          return (
            <div key={tier}>
              <div className="flex items-center gap-1 px-1 mb-0.5">
                <TierIcon className="w-3 h-3" style={{ color: MODEL_TIERS[tier].color }} />
                <span className="text-[10px] font-medium" style={{ color: MODEL_TIERS[tier].color }}>
                  {MODEL_TIERS[tier].label}
                </span>
              </div>
              {tierModels.map(model => (
                <button
                  key={model.id}
                  onClick={() => onModelChange(model.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                    selectedModel === model.id
                      ? 'bg-accent/20 border border-accent/40 text-text-primary'
                      : 'hover:bg-bg-tertiary/50 text-text-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-[10px] text-text-muted">{model.provider}</span>
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">{model.description}</div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-1">
      {/* Voice Engine */}
      <div className="mb-4 border border-border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <AudioLines className="w-4 h-4 text-accent" />
          <div>
            <div className="text-xs font-semibold text-text-primary">Voice Engine</div>
            <div className="text-[10px] text-text-muted">How spoken conversations work</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <button
            onClick={() => onVoiceEngineChange('cascade')}
            className={`p-2 rounded-lg border text-left transition-all ${
              voiceEngine === 'cascade' ? 'border-accent bg-accent/10' : 'border-border hover:border-bg-hover'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-text-secondary" />
              <span className="text-[11px] font-semibold text-text-primary">Cascade</span>
            </div>
            <div className="text-[9px] text-text-muted mt-0.5 leading-tight">
              STT → selected LLM → ElevenLabs. Works with any model above.
            </div>
          </button>
          <button
            onClick={() => onVoiceEngineChange('realtime')}
            className={`p-2 rounded-lg border text-left transition-all ${
              voiceEngine === 'realtime' ? 'border-accent bg-accent/10' : 'border-border hover:border-bg-hover'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <AudioLines className="w-3.5 h-3.5 text-text-secondary" />
              <span className="text-[11px] font-semibold text-text-primary">Realtime</span>
            </div>
            <div className="text-[9px] text-text-muted mt-0.5 leading-tight">
              OpenAI speech-to-speech. Most fluid, but OpenAI-only.
            </div>
          </button>
        </div>

        {voiceEngine === 'realtime' && (
          <div className="space-y-2 pt-1">
            {!realtimeReady && (
              <div className="text-[10px] text-warning bg-warning/10 rounded px-2 py-1.5">
                OpenAI key not configured on server. Add <span className="font-mono">OPENAI_KEY</span> to <span className="font-mono">.env</span> and restart.
              </div>
            )}
            <div>
              <label className="text-[10px] text-text-muted block mb-1">Realtime model</label>
              <select
                value={realtimeModel}
                onChange={e => onRealtimeModelChange(e.target.value)}
                className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent"
              >
                {REALTIME_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name} — {m.desc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-text-muted block mb-1">OpenAI voice</label>
              <select
                value={realtimeVoice}
                onChange={e => onRealtimeVoiceChange(e.target.value)}
                className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent"
              >
                {REALTIME_VOICES.map(v => (
                  <option key={v.id} value={v.id}>{v.name} — {v.desc}</option>
                ))}
              </select>
            </div>
            <div className="text-[9px] text-text-muted leading-tight">
              Realtime ignores the OpenRouter model + ElevenLabs voice for spoken turns. Typed chat still uses the selected model below.
            </div>
          </div>
        )}
      </div>

      {renderModelGroup(cloudModels, <Cloud className="w-4 h-4 text-blue-400" />, 'Cloud Models', 'Hosted by providers via OpenRouter')}
      {renderModelGroup(localModels, <HardDrive className="w-4 h-4 text-green-400" />, 'Open-Weight / Local', 'Run via OpenRouter')}

      {/* Custom Local Models */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Monitor className="w-4 h-4 text-purple-400" />
          <div>
            <div className="text-xs font-semibold text-text-primary">Custom / Local Models</div>
            <div className="text-[10px] text-text-muted">Ollama, LM Studio, or any OpenAI-compatible endpoint</div>
          </div>
        </div>

        {customModels.length > 0 && (
          <div className="space-y-1 mb-2">
            {customModels.map(model => (
              <div key={model.id} className={`flex items-center gap-1 rounded text-xs transition-colors ${
                selectedModel === model.id
                  ? 'bg-purple-500/20 border border-purple-500/40'
                  : 'hover:bg-bg-tertiary/50'
              }`}>
                <button
                  onClick={() => onModelChange(model.id)}
                  className="flex-1 text-left px-2.5 py-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">{model.name}</span>
                    <span className="text-[10px] text-purple-400">Local</span>
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">{model.endpoint} — {model.id.split(':').pop()}</div>
                </button>
                <button onClick={() => deleteCustomModel(model.id)}
                  className="p-1.5 text-text-muted hover:text-danger shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddForm ? (
          <div className="border border-purple-500/30 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-purple-400">Add Local Model</span>
              <button onClick={() => setShowAddForm(false)} className="text-text-muted hover:text-text-secondary">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Display name (e.g., 'Llama 3.1 8B')"
              className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted" />
            <input value={newModelId} onChange={e => setNewModelId(e.target.value)}
              placeholder="Model ID (e.g., 'llama3.1:8b' or 'qwen2.5:7b')"
              className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted" />
            <input value={newEndpoint} onChange={e => setNewEndpoint(e.target.value)}
              placeholder="Endpoint URL"
              className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary font-mono focus:outline-none focus:border-accent placeholder:text-text-muted" />
            <div className="text-[9px] text-text-muted">
              Ollama: http://localhost:11434 &middot; LM Studio: http://localhost:1234
            </div>
            <button onClick={addCustomModel} disabled={!newName.trim() || !newModelId.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded text-[10px] font-medium hover:bg-purple-600 disabled:opacity-30">
              <Check className="w-3 h-3" /> Add Model
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg text-[10px] text-text-muted hover:text-purple-400 hover:border-purple-500/50 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Local Model
          </button>
        )}
      </div>
    </div>
  );
}
