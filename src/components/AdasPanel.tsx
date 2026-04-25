import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Trash2, Edit3, Plus, Check, X } from 'lucide-react';
import type { AdasModule } from '../types';

interface AdasPanelProps {
  modules: AdasModule[];
  onModulesChange: (modules: AdasModule[]) => void;
}

export function AdasPanel({ modules, onModulesChange }: AdasPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newShort, setNewShort] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newKnowledge, setNewKnowledge] = useState('');

  const enabledCount = modules.filter(m => m.enabled).length;

  const toggleModule = (id: string) => {
    onModulesChange(modules.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const updateField = (id: string, field: keyof AdasModule, value: string) => {
    onModulesChange(modules.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const deleteModule = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    onModulesChange(modules.filter(m => m.id !== id));
  };

  const addModule = () => {
    if (!newName.trim()) return;
    const mod: AdasModule = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      shortName: newShort.trim() || newName.trim().split(' ')[0],
      enabled: true,
      difficulty: 'medium',
      description: newDesc.trim(),
      knowledge: newKnowledge.trim() || `${newName.trim()} Knowledge Base:\n\nAdd knowledge about this ADAS system here.`,
    };
    onModulesChange([...modules, mod]);
    setNewName(''); setNewShort(''); setNewDesc(''); setNewKnowledge('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-text-primary">ADAS Knowledge Modules</span>
        </div>
        <span className="text-[10px] text-text-muted">{enabledCount} active</span>
      </div>
      <p className="text-[10px] text-text-muted px-1 mb-2">
        Toggle ADAS systems to include their knowledge in the prompt. Edit knowledge live to test different explanations.
      </p>

      {modules.map(mod => {
        const isExpanded = expandedId === mod.id;
        const isEditing = editingId === mod.id;

        return (
          <div
            key={mod.id}
            className={`border rounded-lg overflow-hidden transition-all ${
              mod.enabled ? 'border-border' : 'border-border/40 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary/20">
              <input
                type="checkbox"
                checked={mod.enabled}
                onChange={() => toggleModule(mod.id)}
                className="accent-accent shrink-0"
              />
              <button
                onClick={() => setExpandedId(isExpanded ? null : mod.id)}
                className="flex-1 flex items-center gap-2 text-left min-w-0"
              >
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  : <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                }
                {isEditing ? (
                  <div className="flex-1 space-y-1" onClick={e => e.stopPropagation()}>
                    <input
                      value={mod.name}
                      onChange={e => updateField(mod.id, 'name', e.target.value)}
                      className="w-full bg-bg-primary border border-accent rounded px-1.5 py-0.5 text-xs font-medium text-text-primary focus:outline-none"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <input
                        value={mod.shortName}
                        onChange={e => updateField(mod.id, 'shortName', e.target.value)}
                        placeholder="Short name"
                        className="w-20 bg-bg-primary border border-border rounded px-1.5 py-0.5 text-[10px] text-text-muted focus:outline-none focus:border-accent"
                      />
                      <input
                        value={mod.description}
                        onChange={e => updateField(mod.id, 'description', e.target.value)}
                        placeholder="Description"
                        className="flex-1 bg-bg-primary border border-border rounded px-1.5 py-0.5 text-[10px] text-text-muted focus:outline-none focus:border-accent"
                      />
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setEditingId(null); }}
                      className="flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover"
                    >
                      <Check className="w-3 h-3" /> Done
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text-primary truncate">{mod.name}</div>
                    <div className="text-[10px] text-text-muted truncate">{mod.description}</div>
                  </div>
                )}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditingId(isEditing ? null : mod.id)}
                  className="p-1 text-text-muted hover:text-text-secondary"
                  title="Edit name"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteModule(mod.id)}
                  className="p-1 text-text-muted hover:text-danger"
                  title="Delete module"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="p-3 border-t border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-text-secondary">Knowledge Base (editable)</span>
                  <span className="text-[10px] text-text-muted">{mod.knowledge.length} chars</span>
                </div>
                <textarea
                  value={mod.knowledge}
                  onChange={e => updateField(mod.id, 'knowledge', e.target.value)}
                  className="w-full bg-bg-primary border border-border rounded p-2.5 text-[11px] text-text-secondary font-mono resize-y min-h-48 focus:outline-none focus:border-accent"
                  rows={15}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Add new ADAS module */}
      {showAdd ? (
        <div className="border border-accent/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-accent">New ADAS Module</span>
            <button onClick={() => setShowAdd(false)} className="text-text-muted hover:text-text-secondary">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Full name (e.g., 'Adaptive Cruise Control')"
            className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted"
          />
          <input
            value={newShort}
            onChange={e => setNewShort(e.target.value)}
            placeholder="Short name (e.g., ACC)"
            className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted"
          />
          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Short description..."
            className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-[10px] text-text-secondary focus:outline-none focus:border-accent placeholder:text-text-muted"
          />
          <textarea
            value={newKnowledge}
            onChange={e => setNewKnowledge(e.target.value)}
            placeholder="Knowledge base content (what AINA should know about this system)..."
            className="w-full bg-bg-primary border border-border rounded p-2 text-[10px] text-text-secondary font-mono resize-y min-h-20 focus:outline-none focus:border-accent placeholder:text-text-muted"
            rows={5}
          />
          <button
            onClick={addModule}
            disabled={!newName.trim()}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white rounded text-[10px] font-medium hover:bg-accent-hover disabled:opacity-30"
          >
            <Check className="w-3 h-3" /> Add Module
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-border rounded-lg text-[10px] text-text-muted hover:text-accent hover:border-accent/50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add ADAS Module
        </button>
      )}
    </div>
  );
}
