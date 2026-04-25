import type { ReactNode } from 'react';
import { Truck, Zap, Radio, Volume2, RotateCcw } from 'lucide-react';

interface HeaderProps {
  selectedModel: string;
  isConnected: boolean;
  voiceReady: boolean;
  onStartLiveSession: () => void;
  presetsSlot?: ReactNode;
  language: 'en' | 'sv';
  onLanguageChange: (lang: 'en' | 'sv') => void;
  onResetDefaults?: () => void;
}

export function Header({
  selectedModel, isConnected, voiceReady,
  onStartLiveSession, presetsSlot, language, onLanguageChange, onResetDefaults,
}: HeaderProps) {
  return (
    <header className="bg-bg-secondary border-b border-border shrink-0">
      <div className="flex items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-scania-blue px-3 py-1.5 rounded-lg">
            <Truck className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm tracking-wide">ConAI</span>
            <span className="text-xs text-text-secondary">AINA Tester</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`} />
            {isConnected ? 'LLM ready' : 'LLM not configured'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Volume2 className="w-3 h-3" />
            <div className={`w-2 h-2 rounded-full ${voiceReady ? 'bg-success' : 'bg-danger'}`} />
            {voiceReady ? 'Voice ready' : 'Voice not configured'}
          </div>
          {selectedModel && (
            <div className="flex items-center gap-1 bg-bg-tertiary/50 px-2 py-1 rounded text-xs text-text-secondary">
              <Zap className="w-3 h-3" />
              {selectedModel.split('/').pop()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onResetDefaults && (
            <button
              onClick={() => { if (confirm('Reset all settings to defaults?')) onResetDefaults(); }}
              className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-text-muted hover:text-warning transition-colors"
              title="Reset all settings to defaults"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}

          <div className="flex items-center bg-bg-tertiary rounded border border-border overflow-hidden">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                language === 'en' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('sv')}
              className={`px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                language === 'sv' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              SV
            </button>
          </div>

          {presetsSlot}

          <button
            onClick={onStartLiveSession}
            disabled={!isConnected}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              isConnected
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20'
                : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
            }`}
          >
            <Radio className="w-4 h-4" />
            Start Test
          </button>
        </div>
      </div>
    </header>
  );
}
