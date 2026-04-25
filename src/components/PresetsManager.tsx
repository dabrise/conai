import { useState, useCallback, useEffect } from 'react';
import { Save, FolderOpen, Trash2, ChevronDown, X, Check, Download, Upload, RefreshCw } from 'lucide-react';
import type { SavedPreset } from '../types';
import { fetchPresets, savePresetToServer, deletePresetFromServer } from '../hooks/useApi';

interface PresetsManagerProps {
  getCurrentPreset: () => Omit<SavedPreset, 'id' | 'name' | 'savedAt'>;
  onLoadPreset: (preset: SavedPreset) => void;
}

export function PresetsManager({ getCurrentPreset, onLoadPreset }: PresetsManagerProps) {
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await fetchPresets();
      setPresets(data);
    } catch (err) {
      console.error('Failed to fetch presets:', err);
    }
  }, []);

  // Load on mount + when dropdown opens
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (isOpen) refresh(); }, [isOpen, refresh]);

  const savePreset = useCallback(async () => {
    if (!saveName.trim()) return;
    const current = getCurrentPreset();
    const preset: SavedPreset = {
      id: crypto.randomUUID(),
      name: saveName.trim(),
      savedAt: Date.now(),
      ...current,
    };
    setPresets(prev => [preset, ...prev]);
    setSaveName('');
    setShowSaveForm(false);
    try {
      await savePresetToServer(preset);
    } catch (err) {
      console.error('Failed to save preset:', err);
    }
  }, [saveName, getCurrentPreset]);

  const deletePreset = useCallback(async (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    try {
      await deletePresetFromServer(id);
    } catch (err) {
      console.error('Failed to delete preset:', err);
    }
  }, []);

  const loadPreset = useCallback((preset: SavedPreset) => {
    onLoadPreset(preset);
    setIsOpen(false);
  }, [onLoadPreset]);

  const exportPreset = useCallback((preset: SavedPreset) => {
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ConAI_Preset_${preset.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importPreset = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const preset = JSON.parse(text) as SavedPreset;
        if (preset.basePrompt && preset.params) {
          preset.id = crypto.randomUUID();
          preset.savedAt = Date.now();
          setPresets(prev => [preset, ...prev]);
          await savePresetToServer(preset);
        }
      } catch {
        alert('Invalid preset file');
      }
    };
    input.click();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-tertiary border border-border rounded text-xs text-text-secondary hover:bg-bg-hover transition-colors"
      >
        <FolderOpen className="w-3.5 h-3.5" />
        Presets
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-bg-secondary border border-border rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-text-primary">Settings Presets</span>
            <div className="flex gap-1">
              <button onClick={refresh} className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-muted hover:text-text-secondary" title="Refresh">
                <RefreshCw className="w-3 h-3" />
              </button>
              <button onClick={importPreset} className="flex items-center gap-1 px-2 py-1 text-[10px] text-accent hover:text-accent-hover" title="Import preset from file">
                <Upload className="w-3 h-3" /> Import
              </button>
              <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-secondary">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-border">
            {showSaveForm ? (
              <div className="flex gap-2">
                <input
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="Preset name..."
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && savePreset()}
                  className="flex-1 bg-bg-primary border border-border rounded px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted"
                />
                <button onClick={savePreset} disabled={!saveName.trim()}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-accent text-white rounded text-[10px] font-medium hover:bg-accent-hover disabled:opacity-30">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => { setShowSaveForm(false); setSaveName(''); }} className="px-1.5 text-text-muted hover:text-text-secondary">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowSaveForm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-accent/10 border border-accent/30 rounded text-[11px] text-accent font-medium hover:bg-accent/20 transition-colors">
                <Save className="w-3.5 h-3.5" /> Save Current Settings
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {presets.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <FolderOpen className="w-8 h-8 text-bg-tertiary mx-auto mb-2" />
                <p className="text-[11px] text-text-muted">No saved presets yet</p>
              </div>
            ) : (
              presets.map(preset => (
                <div key={preset.id}
                  className="flex items-center gap-2 px-3 py-2 border-b border-border/50 hover:bg-bg-tertiary/20 group">
                  <button onClick={() => loadPreset(preset)} className="flex-1 text-left min-w-0">
                    <div className="text-[11px] font-medium text-text-primary truncate">{preset.name}</div>
                    <div className="text-[9px] text-text-muted">
                      {new Date(preset.savedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' '}{new Date(preset.savedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {' '}&middot; {preset.selectedModel.split('/').pop()}
                      {' '}&middot; {preset.agentMode}
                    </div>
                  </button>
                  <button onClick={() => exportPreset(preset)}
                    className="p-1 text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity" title="Export">
                    <Download className="w-3 h-3" />
                  </button>
                  <button onClick={() => deletePreset(preset.id)}
                    className="p-1 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
