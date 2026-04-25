import { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw, Trash2, Plus, Check, X, Edit3 } from 'lucide-react';
import type { AgentMode, DesignPrinciple, ResponseDepth } from '../types';

interface PromptEditorProps {
  basePrompt: string;
  onBasePromptChange: (prompt: string) => void;
  agentModes: AgentMode[];
  onAgentModesChange: (modes: AgentMode[]) => void;
  agentMode: string;
  onAgentModeChange: (mode: string) => void;
  responseDepths: ResponseDepth[];
  onResponseDepthsChange: (depths: ResponseDepth[]) => void;
  responseDepth: string;
  onResponseDepthChange: (depth: string) => void;
  designPrinciples: DesignPrinciple[];
  onDesignPrinciplesChange: (principles: DesignPrinciple[]) => void;
  coreTasksPrompt: string;
  onCoreTasksPromptChange: (prompt: string) => void;
  introEn: string;
  onIntroEnChange: (text: string) => void;
  introSv: string;
  onIntroSvChange: (text: string) => void;
}

function CollapsibleSection({ title, defaultOpen = false, children, badge }: {
  title: string; defaultOpen?: boolean; children: React.ReactNode; badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-bg-tertiary/30 hover:bg-bg-tertiary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
          <span className="text-xs font-semibold text-text-primary">{title}</span>
        </div>
        {badge}
      </button>
      {open && <div className="p-3 space-y-2">{children}</div>}
    </div>
  );
}

export function PromptEditor({
  basePrompt, onBasePromptChange,
  agentModes, onAgentModesChange,
  agentMode, onAgentModeChange,
  responseDepths, onResponseDepthsChange,
  responseDepth, onResponseDepthChange,
  designPrinciples, onDesignPrinciplesChange,
  coreTasksPrompt, onCoreTasksPromptChange,
  introEn, onIntroEnChange, introSv, onIntroSvChange,
}: PromptEditorProps) {
  const [editingModeId, setEditingModeId] = useState<string | null>(null);
  const [showAddMode, setShowAddMode] = useState(false);
  const [newModeName, setNewModeName] = useState('');
  const [newModeSubtitle, setNewModeSubtitle] = useState('');
  const [newModeStyle, setNewModeStyle] = useState('');
  const [newModePrompt, setNewModePrompt] = useState('');

  const [editingDepthId, setEditingDepthId] = useState<string | null>(null);
  const [showAddDepth, setShowAddDepth] = useState(false);
  const [newDepthName, setNewDepthName] = useState('');
  const [newDepthDesc, setNewDepthDesc] = useState('');
  const [newDepthConstraint, setNewDepthConstraint] = useState('');

  const [showAddPrinciple, setShowAddPrinciple] = useState(false);
  const [newPrincipleName, setNewPrincipleName] = useState('');
  const [newPrincipleDesc, setNewPrincipleDesc] = useState('');
  const [newPrinciplePrompt, setNewPrinciplePrompt] = useState('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);

  const currentMode = agentModes.find(m => m.id === agentMode);

  const addMode = () => {
    if (!newModeName.trim()) return;
    const mode: AgentMode = {
      id: `mode-${Date.now()}`,
      name: newModeName.trim(),
      subtitle: newModeSubtitle.trim(),
      maxWords: 50,
      responseStyle: newModeStyle.trim() || 'Custom response style',
      systemPrompt: newModePrompt.trim() || `You are AINA in ${newModeName.trim()} mode.`,
    };
    onAgentModesChange([...agentModes, mode]);
    setNewModeName(''); setNewModeSubtitle(''); setNewModeStyle(''); setNewModePrompt('');
    setShowAddMode(false);
  };

  const deleteMode = (id: string) => {
    if (agentModes.length <= 1) return;
    onAgentModesChange(agentModes.filter(m => m.id !== id));
    if (agentMode === id) onAgentModeChange(agentModes[0].id === id ? agentModes[1].id : agentModes[0].id);
  };

  const updateModeField = (id: string, field: keyof AgentMode, value: string | number) => {
    onAgentModesChange(agentModes.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addPrinciple = () => {
    if (!newPrincipleName.trim() || !newPrinciplePrompt.trim()) return;
    const newPrinciple: DesignPrinciple = {
      id: `custom-${Date.now()}`,
      name: newPrincipleName.trim(),
      description: newPrincipleDesc.trim(),
      enabled: true,
      prompt: newPrinciplePrompt.trim(),
    };
    onDesignPrinciplesChange([...designPrinciples, newPrinciple]);
    setNewPrincipleName(''); setNewPrincipleDesc(''); setNewPrinciplePrompt('');
    setShowAddPrinciple(false);
  };

  const deletePrinciple = (id: string) => {
    onDesignPrinciplesChange(designPrinciples.filter(p => p.id !== id));
  };

  const updatePrincipleField = (i: number, field: keyof DesignPrinciple, value: string | boolean) => {
    const updated = [...designPrinciples];
    updated[i] = { ...updated[i], [field]: value };
    onDesignPrinciplesChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Agent Modes */}
      <CollapsibleSection
        title="Agent Mode"
        defaultOpen={true}
        badge={currentMode && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-accent/20 text-accent">
            {currentMode.name}
          </span>
        )}
      >
        <div className="space-y-2">
          {agentModes.map(mode => {
            const isActive = agentMode === mode.id;
            const isEditing = editingModeId === mode.id;

            return (
              <div key={mode.id} className={`border rounded-lg transition-all ${
                isActive ? 'border-accent bg-accent/10' : 'border-border'
              }`}>
                {/* Mode header - click to select */}
                <div className="flex items-center gap-2 p-2.5">
                  <button
                    onClick={() => onAgentModeChange(mode.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="text-xs font-semibold text-text-primary">{mode.name}</div>
                    <div className="text-[10px] text-text-muted">{mode.subtitle}</div>
                    <div className="text-[10px] text-text-secondary mt-0.5">{mode.responseStyle}</div>
                  </button>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => setEditingModeId(isEditing ? null : mode.id)}
                      className={`p-1 rounded transition-colors ${isEditing ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}`}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {agentModes.length > 1 && (
                      <button
                        onClick={() => deleteMode(mode.id)}
                        className="p-1 text-text-muted hover:text-danger"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit mode - expanded */}
                {isEditing && (
                  <div className="px-2.5 pb-2.5 space-y-2 border-t border-border pt-2">
                    <div className="flex gap-2">
                      <input
                        value={mode.name}
                        onChange={e => updateModeField(mode.id, 'name', e.target.value)}
                        className="flex-1 bg-bg-primary border border-border rounded px-2 py-1 text-[11px] text-text-primary focus:outline-none focus:border-accent"
                        placeholder="Mode name"
                      />
                      <input
                        value={mode.subtitle}
                        onChange={e => updateModeField(mode.id, 'subtitle', e.target.value)}
                        className="flex-1 bg-bg-primary border border-border rounded px-2 py-1 text-[10px] text-text-secondary focus:outline-none focus:border-accent"
                        placeholder="Subtitle"
                      />
                    </div>
                    <input
                      value={mode.responseStyle}
                      onChange={e => updateModeField(mode.id, 'responseStyle', e.target.value)}
                      className="w-full bg-bg-primary border border-border rounded px-2 py-1 text-[10px] text-text-secondary focus:outline-none focus:border-accent"
                      placeholder="Response style description"
                    />
                    <textarea
                      value={mode.systemPrompt}
                      onChange={e => updateModeField(mode.id, 'systemPrompt', e.target.value)}
                      className="w-full bg-bg-primary border border-border rounded p-2 text-[10px] text-text-secondary font-mono resize-y min-h-24 focus:outline-none focus:border-accent"
                      rows={8}
                      placeholder="System prompt for this mode..."
                    />
                    <button
                      onClick={() => setEditingModeId(null)}
                      className="flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover"
                    >
                      <Check className="w-3 h-3" /> Done editing
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new mode */}
          {showAddMode ? (
            <div className="border border-accent/30 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-accent">New Agent Mode</span>
                <button onClick={() => setShowAddMode(false)} className="text-text-muted hover:text-text-secondary">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                <input value={newModeName} onChange={e => setNewModeName(e.target.value)}
                  placeholder="Mode name" className="flex-1 bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted" />
                <input value={newModeSubtitle} onChange={e => setNewModeSubtitle(e.target.value)}
                  placeholder="Subtitle" className="flex-1 bg-bg-primary border border-border rounded px-2 py-1.5 text-[10px] text-text-secondary focus:outline-none focus:border-accent placeholder:text-text-muted" />
              </div>
              <input value={newModeStyle} onChange={e => setNewModeStyle(e.target.value)}
                placeholder="Response style (e.g., '2-3 sentences, friendly')" className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[10px] text-text-secondary focus:outline-none focus:border-accent placeholder:text-text-muted" />
              <textarea value={newModePrompt} onChange={e => setNewModePrompt(e.target.value)}
                placeholder="System prompt for this mode..." className="w-full bg-bg-primary border border-border rounded p-2 text-[10px] text-text-secondary font-mono resize-y min-h-16 focus:outline-none focus:border-accent placeholder:text-text-muted" rows={4} />
              <button onClick={addMode} disabled={!newModeName.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white rounded text-[10px] font-medium hover:bg-accent-hover disabled:opacity-30">
                <Check className="w-3 h-3" /> Add Mode
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAddMode(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg text-[10px] text-text-muted hover:text-accent hover:border-accent/50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Agent Mode
            </button>
          )}
        </div>
      </CollapsibleSection>

      {/* Response Depth */}
      <CollapsibleSection
        title="Response Depth"
        defaultOpen={true}
        badge={
          <span className="text-[10px] text-text-muted">
            {responseDepths.find(d => d.id === responseDepth)?.name || 'None'}
          </span>
        }
      >
        <div className="space-y-1.5">
          {responseDepths.map(depth => {
            const isActive = responseDepth === depth.id;
            const isEditingDepth = editingDepthId === depth.id;
            return (
              <div key={depth.id} className={`border rounded-lg transition-all ${isActive ? 'border-accent bg-accent/10' : 'border-border'}`}>
                <div className="flex items-center gap-2 p-2">
                  <button onClick={() => onResponseDepthChange(depth.id)} className="flex-1 text-left min-w-0">
                    <div className="text-xs font-semibold text-text-primary">{depth.name}</div>
                    <div className="text-[10px] text-text-muted">{depth.description}</div>
                  </button>
                  <button onClick={() => setEditingDepthId(isEditingDepth ? null : depth.id)}
                    className={`p-1 rounded ${isEditingDepth ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}`}>
                    <Edit3 className="w-3 h-3" />
                  </button>
                  {responseDepths.length > 1 && (
                    <button onClick={() => {
                      onResponseDepthsChange(responseDepths.filter(d => d.id !== depth.id));
                      if (responseDepth === depth.id) onResponseDepthChange(responseDepths[0].id === depth.id ? responseDepths[1].id : responseDepths[0].id);
                    }} className="p-1 text-text-muted hover:text-danger">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {isEditingDepth && (
                  <div className="px-2 pb-2 space-y-1.5 border-t border-border pt-2">
                    <div className="flex gap-2">
                      <input value={depth.name}
                        onChange={e => onResponseDepthsChange(responseDepths.map(d => d.id === depth.id ? { ...d, name: e.target.value } : d))}
                        className="flex-1 bg-bg-primary border border-border rounded px-2 py-1 text-[11px] text-text-primary focus:outline-none focus:border-accent" placeholder="Name" />
                      <input value={depth.description}
                        onChange={e => onResponseDepthsChange(responseDepths.map(d => d.id === depth.id ? { ...d, description: e.target.value } : d))}
                        className="flex-1 bg-bg-primary border border-border rounded px-2 py-1 text-[10px] text-text-secondary focus:outline-none focus:border-accent" placeholder="Description" />
                    </div>
                    <textarea value={depth.constraint}
                      onChange={e => onResponseDepthsChange(responseDepths.map(d => d.id === depth.id ? { ...d, constraint: e.target.value } : d))}
                      className="w-full bg-bg-primary border border-border rounded p-2 text-[10px] text-text-secondary font-mono resize-y min-h-12 focus:outline-none focus:border-accent" rows={3} placeholder="Constraint prompt..." />
                    <button onClick={() => setEditingDepthId(null)} className="flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover">
                      <Check className="w-3 h-3" /> Done
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {showAddDepth ? (
            <div className="border border-accent/30 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-accent">New Response Depth</span>
                <button onClick={() => setShowAddDepth(false)} className="text-text-muted hover:text-text-secondary"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex gap-2">
                <input value={newDepthName} onChange={e => setNewDepthName(e.target.value)} placeholder="Name (e.g., 'Medium')"
                  className="flex-1 bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted" />
                <input value={newDepthDesc} onChange={e => setNewDepthDesc(e.target.value)} placeholder="Description"
                  className="flex-1 bg-bg-primary border border-border rounded px-2 py-1.5 text-[10px] text-text-secondary focus:outline-none focus:border-accent placeholder:text-text-muted" />
              </div>
              <textarea value={newDepthConstraint} onChange={e => setNewDepthConstraint(e.target.value)} placeholder="Constraint prompt..."
                className="w-full bg-bg-primary border border-border rounded p-2 text-[10px] text-text-secondary font-mono resize-y min-h-12 focus:outline-none focus:border-accent placeholder:text-text-muted" rows={3} />
              <button onClick={() => {
                if (!newDepthName.trim()) return;
                onResponseDepthsChange([...responseDepths, { id: `depth-${Date.now()}`, name: newDepthName.trim(), description: newDepthDesc.trim(), constraint: newDepthConstraint.trim() }]);
                setNewDepthName(''); setNewDepthDesc(''); setNewDepthConstraint(''); setShowAddDepth(false);
              }} disabled={!newDepthName.trim()} className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white rounded text-[10px] font-medium hover:bg-accent-hover disabled:opacity-30">
                <Check className="w-3 h-3" /> Add Depth
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAddDepth(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg text-[10px] text-text-muted hover:text-accent hover:border-accent/50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Response Depth
            </button>
          )}
        </div>
      </CollapsibleSection>

      {/* Base Identity Prompt */}
      <CollapsibleSection title="Base Identity Prompt (AINA)" defaultOpen={false}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-text-muted">Core identity, personality, and rules</span>
          <button
            onClick={() => onBasePromptChange(basePrompt)}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <textarea
          value={basePrompt}
          onChange={e => onBasePromptChange(e.target.value)}
          className="w-full bg-bg-primary border border-border rounded p-2.5 text-[11px] text-text-secondary font-mono resize-y min-h-40 focus:outline-none focus:border-accent"
          rows={12}
        />
      </CollapsibleSection>

      {/* Design Principles */}
      <CollapsibleSection
        title="Design Principles"
        badge={
          <span className="text-[10px] text-text-muted">
            {designPrinciples.filter(p => p.enabled).length}/{designPrinciples.length} active
          </span>
        }
      >
        <div className="space-y-2">
          {designPrinciples.map((principle, i) => (
            <div key={principle.id} className={`border rounded-lg p-2.5 transition-all ${
              principle.enabled ? 'border-border' : 'border-border/50 opacity-50'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={principle.enabled}
                  onChange={() => updatePrincipleField(i, 'enabled', !principle.enabled)}
                  className="accent-accent shrink-0"
                />
                <div className="flex-1 min-w-0">
                  {editingNameId === principle.id ? (
                    <div className="space-y-1">
                      <input
                        value={principle.name}
                        onChange={e => updatePrincipleField(i, 'name', e.target.value)}
                        className="w-full bg-bg-primary border border-accent rounded px-1.5 py-0.5 text-xs font-medium text-text-primary focus:outline-none"
                        autoFocus
                      />
                      <input
                        value={principle.description}
                        onChange={e => updatePrincipleField(i, 'description', e.target.value)}
                        className="w-full bg-bg-primary border border-border rounded px-1.5 py-0.5 text-[10px] text-text-muted focus:outline-none focus:border-accent"
                        placeholder="Short description..."
                      />
                      <button onClick={() => setEditingNameId(null)}
                        className="flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover">
                        <Check className="w-3 h-3" /> Done
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingNameId(principle.id)} className="text-left w-full" title="Click to edit">
                      <div className="text-xs font-medium text-text-primary hover:text-accent transition-colors">{principle.name}</div>
                      <div className="text-[10px] text-text-muted">{principle.description}</div>
                    </button>
                  )}
                </div>
                <button onClick={() => deletePrinciple(principle.id)}
                  className="text-text-muted hover:text-danger transition-colors shrink-0 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {principle.enabled && (
                <textarea
                  value={principle.prompt}
                  onChange={e => updatePrincipleField(i, 'prompt', e.target.value)}
                  className="w-full mt-2 bg-bg-primary border border-border rounded p-2 text-[10px] text-text-secondary font-mono resize-y min-h-12 focus:outline-none focus:border-accent"
                  rows={3}
                />
              )}
            </div>
          ))}

          {showAddPrinciple ? (
            <div className="border border-accent/30 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-accent">New Design Principle</span>
                <button onClick={() => setShowAddPrinciple(false)} className="text-text-muted hover:text-text-secondary">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input value={newPrincipleName} onChange={e => setNewPrincipleName(e.target.value)}
                placeholder="Principle name" className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted" />
              <input value={newPrincipleDesc} onChange={e => setNewPrincipleDesc(e.target.value)}
                placeholder="Short description..." className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[10px] text-text-secondary focus:outline-none focus:border-accent placeholder:text-text-muted" />
              <textarea value={newPrinciplePrompt} onChange={e => setNewPrinciplePrompt(e.target.value)}
                placeholder="Prompt instruction..." className="w-full bg-bg-primary border border-border rounded p-2 text-[10px] text-text-secondary font-mono resize-y min-h-12 focus:outline-none focus:border-accent placeholder:text-text-muted" rows={3} />
              <button onClick={addPrinciple} disabled={!newPrincipleName.trim() || !newPrinciplePrompt.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white rounded text-[10px] font-medium hover:bg-accent-hover disabled:opacity-30">
                <Check className="w-3 h-3" /> Add Principle
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAddPrinciple(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg text-[10px] text-text-muted hover:text-accent hover:border-accent/50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Design Principle
            </button>
          )}
        </div>
      </CollapsibleSection>

      {/* Core Tasks */}
      <CollapsibleSection title="Core Tasks Prompt">
        <textarea
          value={coreTasksPrompt}
          onChange={e => onCoreTasksPromptChange(e.target.value)}
          className="w-full bg-bg-primary border border-border rounded p-2.5 text-[11px] text-text-secondary font-mono resize-y min-h-40 focus:outline-none focus:border-accent"
          rows={10}
        />
      </CollapsibleSection>

      {/* AINA Introduction Message */}
      <CollapsibleSection title="AINA Introduction (Start Test)">
        <p className="text-[10px] text-text-muted mb-2">
          The first thing AINA says when a live test session starts. Spoken aloud via TTS.
        </p>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-medium text-text-secondary block mb-1">English</label>
            <textarea
              value={introEn}
              onChange={e => onIntroEnChange(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded p-2 text-[11px] text-text-secondary resize-y min-h-12 focus:outline-none focus:border-accent"
              rows={2}
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-text-secondary block mb-1">Svenska</label>
            <textarea
              value={introSv}
              onChange={e => onIntroSvChange(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded p-2 text-[11px] text-text-secondary resize-y min-h-12 focus:outline-none focus:border-accent"
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
