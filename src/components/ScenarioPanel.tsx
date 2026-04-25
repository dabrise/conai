import { useState } from 'react';
import {
  ParkingSquare, Route, TreePine, Building2, CloudSnow, Coffee,
  ChevronDown, ChevronRight, Play, RotateCcw, Plus, Trash2, Edit3, Check
} from 'lucide-react';
import type { Scenario, ScenarioTrigger } from '../types';

interface ScenarioPanelProps {
  scenarios: Scenario[];
  onScenariosChange: (scenarios: Scenario[]) => void;
  activeScenarioId: string | null;
  onActivateScenario: (id: string | null) => void;
  onFireTrigger: (scenarioId: string, triggerId: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  ParkingSquare, Route, TreePine, Building2, CloudSnow, Coffee,
};

export function ScenarioPanel({
  scenarios, onScenariosChange,
  activeScenarioId, onActivateScenario,
  onFireTrigger,
}: ScenarioPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [newTriggerScenarioId, setNewTriggerScenarioId] = useState<string | null>(null);
  const [newTriggerLabel, setNewTriggerLabel] = useState('');
  const [newTriggerPrompt, setNewTriggerPrompt] = useState('');
  const [showAddScenario, setShowAddScenario] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');
  const [newScenarioPrompt, setNewScenarioPrompt] = useState('');
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);

  const updateScenarioPrompt = (id: string, contextPrompt: string) => {
    onScenariosChange(scenarios.map(s => s.id === id ? { ...s, contextPrompt } : s));
  };

  const updateScenarioField = (id: string, field: 'name' | 'description', value: string) => {
    onScenariosChange(scenarios.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteScenario = (id: string) => {
    if (activeScenarioId === id) onActivateScenario(null);
    if (expandedId === id) setExpandedId(null);
    onScenariosChange(scenarios.filter(s => s.id !== id));
  };

  const addScenario = () => {
    if (!newScenarioName.trim()) return;
    const newScenario: Scenario = {
      id: `custom-${Date.now()}`,
      name: newScenarioName.trim(),
      icon: 'Route',
      description: newScenarioDesc.trim(),
      contextPrompt: newScenarioPrompt.trim() || `Current driving context: ${newScenarioName.trim()}.`,
      triggers: [],
      active: false,
    };
    onScenariosChange([...scenarios, newScenario]);
    setNewScenarioName('');
    setNewScenarioDesc('');
    setNewScenarioPrompt('');
    setShowAddScenario(false);
  };

  const updateTriggerPrompt = (scenarioId: string, triggerId: string, prompt: string) => {
    onScenariosChange(scenarios.map(s => {
      if (s.id !== scenarioId) return s;
      return { ...s, triggers: s.triggers.map(t => t.id === triggerId ? { ...t, prompt } : t) };
    }));
  };

  const resetTriggers = (scenarioId: string) => {
    onScenariosChange(scenarios.map(s => {
      if (s.id !== scenarioId) return s;
      return { ...s, triggers: s.triggers.map(t => ({ ...t, fired: false })) };
    }));
  };

  const addTrigger = (scenarioId: string) => {
    if (!newTriggerLabel.trim() || !newTriggerPrompt.trim()) return;
    const trigger: ScenarioTrigger = {
      id: `custom-${Date.now()}`,
      label: newTriggerLabel.trim(),
      prompt: newTriggerPrompt.trim(),
      fired: false,
    };
    onScenariosChange(scenarios.map(s => {
      if (s.id !== scenarioId) return s;
      return { ...s, triggers: [...s.triggers, trigger] };
    }));
    setNewTriggerLabel('');
    setNewTriggerPrompt('');
    setNewTriggerScenarioId(null);
  };

  const removeTrigger = (scenarioId: string, triggerId: string) => {
    onScenariosChange(scenarios.map(s => {
      if (s.id !== scenarioId) return s;
      return { ...s, triggers: s.triggers.filter(t => t.id !== triggerId) };
    }));
  };

  return (
    <div className="space-y-2">
      <div className="px-1 mb-2">
        <div className="text-xs font-semibold text-text-primary mb-1">Driving Scenario Context</div>
        <p className="text-[10px] text-text-muted">
          Select the current scenario to inject driving context into the prompt. Fire triggers to simulate ADAS events.
        </p>
      </div>

      {/* Active scenario indicator */}
      {activeScenarioId && (
        <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/30 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs text-accent font-medium">
            Active: {scenarios.find(s => s.id === activeScenarioId)?.name}
          </span>
          <button
            onClick={() => onActivateScenario(null)}
            className="ml-auto text-[10px] text-text-muted hover:text-text-secondary"
          >
            Deactivate
          </button>
        </div>
      )}

      {scenarios.map(scenario => {
        const Icon = iconMap[scenario.icon] || Route;
        const isActive = activeScenarioId === scenario.id;
        const isExpanded = expandedId === scenario.id;
        const firedCount = scenario.triggers.filter(t => t.fired).length;

        return (
          <div
            key={scenario.id}
            className={`border rounded-lg overflow-hidden transition-all ${
              isActive ? 'border-accent/50 bg-accent/5' : 'border-border'
            }`}
          >
            {/* Scenario header */}
            <div className="flex items-center gap-2 px-3 py-2">
              <button
                onClick={() => onActivateScenario(isActive ? null : scenario.id)}
                className={`p-1.5 rounded transition-colors ${
                  isActive ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                }`}
                title={isActive ? 'Deactivate scenario' : 'Activate scenario'}
              >
                <Icon className="w-4 h-4" />
              </button>

              <button
                onClick={() => setExpandedId(isExpanded ? null : scenario.id)}
                className="flex-1 text-left min-w-0"
              >
                {editingScenarioId === scenario.id ? (
                  <div className="space-y-1" onClick={e => e.stopPropagation()}>
                    <input
                      value={scenario.name}
                      onChange={e => updateScenarioField(scenario.id, 'name', e.target.value)}
                      className="w-full bg-bg-primary border border-accent rounded px-1.5 py-0.5 text-xs font-medium text-text-primary focus:outline-none"
                      autoFocus
                    />
                    <input
                      value={scenario.description}
                      onChange={e => updateScenarioField(scenario.id, 'description', e.target.value)}
                      className="w-full bg-bg-primary border border-border rounded px-1.5 py-0.5 text-[10px] text-text-muted focus:outline-none focus:border-accent"
                    />
                    <button
                      onClick={e => { e.stopPropagation(); setEditingScenarioId(null); }}
                      className="flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover"
                    >
                      <Check className="w-3 h-3" /> Done
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-medium text-text-primary truncate">{scenario.name}</div>
                    <div className="text-[10px] text-text-muted truncate">{scenario.description}</div>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1 shrink-0">
                {firedCount > 0 && (
                  <span className="text-[10px] text-warning">{firedCount} fired</span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); setEditingScenarioId(editingScenarioId === scenario.id ? null : scenario.id); }}
                  className="p-1 text-text-muted hover:text-text-secondary"
                  title="Edit name"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteScenario(scenario.id); }}
                  className="p-1 text-text-muted hover:text-danger"
                  title="Delete scenario"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                  : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-border">
                {/* Context prompt editor */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-text-secondary">Context Prompt (injected when active)</span>
                  </div>
                  <textarea
                    value={scenario.contextPrompt}
                    onChange={e => updateScenarioPrompt(scenario.id, e.target.value)}
                    className="w-full bg-bg-primary border border-border rounded p-2 text-[11px] text-text-secondary font-mono resize-y min-h-20 focus:outline-none focus:border-accent"
                    rows={5}
                  />
                </div>

                {/* Triggers */}
                <div className="px-3 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-text-primary">Event Triggers</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => resetTriggers(scenario.id)}
                        className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                      <button
                        onClick={() => setNewTriggerScenarioId(
                          newTriggerScenarioId === scenario.id ? null : scenario.id
                        )}
                        className="flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {scenario.triggers.map(trigger => (
                      <div key={trigger.id} className={`rounded border p-2 ${
                        trigger.fired ? 'border-warning/30 bg-warning/5' : 'border-border'
                      }`}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onFireTrigger(scenario.id, trigger.id)}
                            disabled={trigger.fired}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                              trigger.fired
                                ? 'bg-warning/20 text-warning cursor-not-allowed'
                                : 'bg-accent/20 text-accent hover:bg-accent/30'
                            }`}
                          >
                            <Play className="w-3 h-3" />
                            {trigger.fired ? 'Fired' : 'Fire'}
                          </button>
                          <span className="flex-1 text-[11px] text-text-primary">{trigger.label}</span>
                          <button
                            onClick={() => setEditingPromptId(
                              editingPromptId === trigger.id ? null : trigger.id
                            )}
                            className="text-text-muted hover:text-text-secondary"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          {trigger.id.startsWith('custom-') && (
                            <button
                              onClick={() => removeTrigger(scenario.id, trigger.id)}
                              className="text-text-muted hover:text-danger"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {editingPromptId === trigger.id && (
                          <textarea
                            value={trigger.prompt}
                            onChange={e => updateTriggerPrompt(scenario.id, trigger.id, e.target.value)}
                            className="w-full mt-2 bg-bg-primary border border-border rounded p-2 text-[10px] text-text-secondary font-mono resize-y min-h-12 focus:outline-none focus:border-accent"
                            rows={3}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add new trigger form */}
                  {newTriggerScenarioId === scenario.id && (
                    <div className="mt-2 border border-accent/30 rounded-lg p-2.5 space-y-2">
                      <input
                        value={newTriggerLabel}
                        onChange={e => setNewTriggerLabel(e.target.value)}
                        placeholder="Trigger label (e.g., 'Driver swerves')"
                        className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted"
                      />
                      <textarea
                        value={newTriggerPrompt}
                        onChange={e => setNewTriggerPrompt(e.target.value)}
                        placeholder="Trigger prompt (injected into conversation when fired)"
                        className="w-full bg-bg-primary border border-border rounded p-2 text-[10px] text-text-secondary font-mono resize-y min-h-12 focus:outline-none focus:border-accent placeholder:text-text-muted"
                        rows={3}
                      />
                      <button
                        onClick={() => addTrigger(scenario.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white rounded text-[10px] font-medium hover:bg-accent-hover"
                      >
                        <Check className="w-3 h-3" /> Add Trigger
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add new scenario */}
      {showAddScenario ? (
        <div className="border border-accent/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-accent">New Scenario</span>
            <button onClick={() => setShowAddScenario(false)} className="text-[10px] text-text-muted hover:text-text-secondary">Cancel</button>
          </div>
          <input
            value={newScenarioName}
            onChange={e => setNewScenarioName(e.target.value)}
            placeholder="Scenario name (e.g., 'Tunnel Driving')"
            className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted"
          />
          <input
            value={newScenarioDesc}
            onChange={e => setNewScenarioDesc(e.target.value)}
            placeholder="Short description..."
            className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[10px] text-text-secondary focus:outline-none focus:border-accent placeholder:text-text-muted"
          />
          <textarea
            value={newScenarioPrompt}
            onChange={e => setNewScenarioPrompt(e.target.value)}
            placeholder="Context prompt (injected when this scenario is active)..."
            className="w-full bg-bg-primary border border-border rounded p-2 text-[10px] text-text-secondary font-mono resize-y min-h-16 focus:outline-none focus:border-accent placeholder:text-text-muted"
            rows={4}
          />
          <button
            onClick={addScenario}
            disabled={!newScenarioName.trim()}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white rounded text-[10px] font-medium hover:bg-accent-hover disabled:opacity-30"
          >
            <Check className="w-3 h-3" /> Add Scenario
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddScenario(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-border rounded-lg text-[10px] text-text-muted hover:text-accent hover:border-accent/50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Scenario
        </button>
      )}
    </div>
  );
}
