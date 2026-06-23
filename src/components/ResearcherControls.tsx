import { useState } from 'react';
import {
  Ear, ShieldCheck, PenLine, Play, RotateCcw,
  CheckCircle, XCircle, Edit3, Send, Square,
} from 'lucide-react';
import type { LiveSessionMode, LiveSessionState, Scenario } from '../types';
import { VoiceIndicator } from './VoiceIndicator';

interface ResearcherControlsProps {
  mode: LiveSessionMode;
  onModeChange: (mode: LiveSessionMode) => void;
  sessionState: LiveSessionState;
  pendingResponse: string | null;
  sessionStart: number | null;
  messageCount: number;
  scenarios: Scenario[];
  activeScenarioId: string | null;
  onActivateScenario: (id: string | null) => void;
  onFireTrigger: (scenarioId: string, triggerId: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onEditAndApprove: (text: string) => void;
  onSendManual: (text: string) => void;
  onEndSession: () => void;
  /** When true (Realtime engine), hides the mode selector + approve/manual panels. */
  lockedHandsFree?: boolean;
}

const modeConfig = {
  'hands-free': {
    icon: Ear,
    label: 'Hands-Free',
    desc: 'AI responds automatically to driver',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/30',
  },
  approve: {
    icon: ShieldCheck,
    label: 'Approve',
    desc: 'Review each AI response before it plays',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30',
  },
  manual: {
    icon: PenLine,
    label: 'Manual',
    desc: 'You write all responses manually',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
  },
};

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function ResearcherControls({
  mode, onModeChange,
  sessionState, pendingResponse, sessionStart, messageCount,
  scenarios, activeScenarioId, onActivateScenario, onFireTrigger,
  onApprove, onReject, onEditAndApprove, onSendManual,
  onEndSession, lockedHandsFree = false,
}: ResearcherControlsProps) {
  const [manualText, setManualText] = useState('');
  const [editText, setEditText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Update timer
  useState(() => {
    const interval = setInterval(() => {
      if (sessionStart) setElapsed(Date.now() - sessionStart);
    }, 1000);
    return () => clearInterval(interval);
  });

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Session status bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary">
        <div className="flex items-center gap-3">
          <VoiceIndicator state={sessionState} size="sm" />
          <div>
            <div className="text-xs font-semibold text-text-primary">Live Session</div>
            <div className="text-[10px] text-text-muted">
              {sessionStart ? formatDuration(elapsed) : '0:00'} &middot; {messageCount} messages
            </div>
          </div>
        </div>
        <button
          onClick={onEndSession}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/20 text-danger rounded-lg text-xs font-medium hover:bg-danger/30"
        >
          <Square className="w-3.5 h-3.5" /> End Session
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Mode Selector */}
        {lockedHandsFree ? (
          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-green-500/30 bg-green-500/10">
            <Ear className="w-5 h-5 shrink-0 text-green-400" />
            <div>
              <div className="text-xs font-medium text-green-400">Hands-Free (Realtime)</div>
              <div className="text-[10px] text-text-muted">Speech-to-speech — Approve/Manual not available</div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs font-semibold text-text-primary mb-2">Interaction Mode</div>
            <div className="space-y-1.5">
              {(Object.entries(modeConfig) as [LiveSessionMode, typeof modeConfig['hands-free']][]).map(([id, cfg]) => {
                const Icon = cfg.icon;
                const isActive = mode === id;
                return (
                  <button
                    key={id}
                    onClick={() => onModeChange(id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                      isActive ? cfg.bg : 'border-border hover:border-bg-hover'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? cfg.color : 'text-text-muted'}`} />
                    <div>
                      <div className={`text-xs font-medium ${isActive ? cfg.color : 'text-text-secondary'}`}>{cfg.label}</div>
                      <div className="text-[10px] text-text-muted">{cfg.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Approve mode: pending response panel */}
        {mode === 'approve' && sessionState === 'awaiting-approval' && pendingResponse && (
          <div className="border border-purple-500/30 bg-purple-500/5 rounded-lg p-3 space-y-2">
            <div className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide">Pending Response</div>
            {isEditing ? (
              <>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full bg-bg-primary border border-border rounded p-2 text-xs text-text-primary resize-y min-h-16 focus:outline-none focus:border-accent"
                  rows={4}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { onEditAndApprove(editText); setIsEditing(false); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded text-[10px] font-medium hover:bg-purple-600"
                  >
                    <Send className="w-3 h-3" /> Send Edited
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-[10px] text-text-muted hover:text-text-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-text-primary leading-relaxed bg-bg-primary rounded p-2">{pendingResponse}</p>
                <div className="flex gap-2">
                  <button
                    onClick={onApprove}
                    className="flex items-center gap-1 px-3 py-1.5 bg-success/20 text-success rounded text-[10px] font-medium hover:bg-success/30"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={onReject}
                    className="flex items-center gap-1 px-3 py-1.5 bg-danger/20 text-danger rounded text-[10px] font-medium hover:bg-danger/30"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => { setEditText(pendingResponse); setIsEditing(true); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-bg-tertiary text-text-secondary rounded text-[10px] font-medium hover:bg-bg-hover"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Manual mode: text input */}
        {mode === 'manual' && sessionState === 'awaiting-approval' && (
          <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-3 space-y-2">
            <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Write Response</div>
            <textarea
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              placeholder="Type AINA's response..."
              className="w-full bg-bg-primary border border-border rounded p-2 text-xs text-text-primary resize-y min-h-16 focus:outline-none focus:border-accent placeholder:text-text-muted"
              rows={3}
              autoFocus
            />
            <button
              onClick={() => { if (manualText.trim()) { onSendManual(manualText.trim()); setManualText(''); } }}
              disabled={!manualText.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded text-[10px] font-medium hover:bg-amber-600 disabled:opacity-30"
            >
              <Send className="w-3 h-3" /> Send & Speak
            </button>
          </div>
        )}

        {/* Scenario Switcher */}
        <div>
          <div className="text-xs font-semibold text-text-primary mb-2">Scenario</div>
          {activeScenario && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-accent/10 border border-accent/30 rounded-lg mb-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] text-accent font-medium flex-1">{activeScenario.name}</span>
              <button
                onClick={() => onActivateScenario(null)}
                className="text-[10px] text-text-muted hover:text-text-secondary"
              >
                Clear
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            {scenarios.map(s => (
              <button
                key={s.id}
                onClick={() => onActivateScenario(s.id)}
                className={`p-2 rounded border text-left transition-all ${
                  activeScenarioId === s.id
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-border hover:border-bg-hover'
                }`}
              >
                <div className="text-[10px] font-medium text-text-primary truncate">{s.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Triggers */}
        {activeScenario && activeScenario.triggers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-primary">Event Triggers</span>
              <button
                onClick={() => {
                  // Reset all triggers in active scenario
                  activeScenario.triggers.forEach(t => { t.fired = false; });
                }}
                className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
            <div className="space-y-1">
              {activeScenario.triggers.map(trigger => (
                <button
                  key={trigger.id}
                  onClick={() => onFireTrigger(activeScenario.id, trigger.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded border border-border text-left hover:border-accent/50 hover:bg-accent/5 transition-all"
                >
                  <Play className="w-3 h-3 shrink-0 text-accent" />
                  <span className="text-[10px] text-text-primary">{trigger.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
