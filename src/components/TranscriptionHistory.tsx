import { useState, useRef, useEffect } from 'react';
import { Clock, Radio, MessageSquare, Trash2, Download, ChevronDown, ChevronRight, Bot, User, Info, Pencil, Check, X } from 'lucide-react';
import type { SavedSession, Message } from '../types';

interface TranscriptionHistoryProps {
  sessions: SavedSession[];
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

function defaultSessionLabel(s: SavedSession): string {
  const isLive = s.type === 'live';
  const prefix = isLive && s.participantNumber ? `P${s.participantNumber}` : 'Chat Session';
  return `${prefix} \u2014 ${formatDate(s.startTime)} ${formatTime(s.startTime)}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s % 60}s`;
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center my-1">
        <div className="bg-accent/10 border border-accent/20 rounded px-2.5 py-1.5 max-w-md">
          <div className="flex items-center gap-1 mb-0.5">
            <Info className="w-2.5 h-2.5 text-accent" />
            <span className="text-[9px] font-semibold text-accent">Event</span>
            <span className="text-[8px] text-text-muted ml-auto">{formatTime(msg.timestamp)}</span>
          </div>
          <p className="text-[10px] text-text-secondary">{msg.content}</p>
        </div>
      </div>
    );
  }

  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 my-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3 h-3 text-accent" />
        </div>
      )}
      <div className="max-w-[75%]">
        <div className={`px-2.5 py-1.5 rounded-xl text-[11px] leading-relaxed ${
          isUser ? 'bg-accent text-white rounded-br-sm' : 'bg-bg-tertiary/60 text-text-primary rounded-bl-sm'
        }`}>
          {msg.content}
        </div>
        <div className={`text-[8px] text-text-muted mt-0.5 px-1 ${isUser ? 'text-right' : ''}`}>
          {formatTime(msg.timestamp)}
          {!isUser && msg.model && <> &middot; {msg.model.split('/').pop()}</>}
        </div>
      </div>
      {isUser && (
        <div className="w-5 h-5 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-3 h-3 text-text-secondary" />
        </div>
      )}
    </div>
  );
}

export function TranscriptionHistory({ sessions, onDelete, onExport, onRename }: TranscriptionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const startEdit = (s: SavedSession) => {
    setEditingId(s.id);
    setDraftName(s.name ?? defaultSessionLabel(s));
  };

  const commitEdit = () => {
    if (editingId !== null) {
      onRename(editingId, draftName);
    }
    setEditingId(null);
    setDraftName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftName('');
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="w-10 h-10 text-bg-tertiary mb-3" />
        <div className="text-sm font-medium text-text-secondary mb-1">No sessions yet</div>
        <p className="text-[11px] text-text-muted max-w-xs">
          Chat transcriptions and live test sessions will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Clock className="w-4 h-4 text-accent" />
        <span className="text-xs font-semibold text-text-primary">Session History</span>
        <span className="text-[10px] text-text-muted ml-auto">{sessions.length} sessions</span>
      </div>

      {sessions.map(session => {
        const isExpanded = expandedId === session.id;
        const msgCount = session.messages.filter(m => m.role !== 'system').length;
        const isLive = session.type === 'live';

        return (
          <div key={session.id} className="border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-bg-tertiary/20 transition-colors">
              <button
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                className="shrink-0"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                  : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                }
              </button>

              <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                isLive ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {isLive ? <Radio className="w-3 h-3 inline mr-0.5" /> : <MessageSquare className="w-3 h-3 inline mr-0.5" />}
                {isLive ? 'LIVE' : 'CHAT'}
              </span>

              <div className="flex-1 min-w-0">
                {editingId === session.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={draftName}
                      onChange={e => setDraftName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                        else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                      }}
                      onBlur={commitEdit}
                      className="flex-1 min-w-0 text-xs font-medium text-text-primary bg-bg-tertiary/40 border border-accent/40 rounded px-1.5 py-0.5 focus:outline-none focus:border-accent"
                      maxLength={120}
                      placeholder={defaultSessionLabel(session)}
                    />
                    <button
                      onMouseDown={e => { e.preventDefault(); commitEdit(); }}
                      className="p-1 text-accent hover:text-accent-hover shrink-0"
                      aria-label="Save name"
                      title="Save (Enter)"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onMouseDown={e => { e.preventDefault(); cancelEdit(); }}
                      className="p-1 text-text-muted hover:text-text-primary shrink-0"
                      aria-label="Cancel rename"
                      title="Cancel (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : session.id)}
                      className="text-xs font-medium text-text-primary truncate text-left flex-1 min-w-0 hover:text-accent"
                    >
                      {session.name?.trim() || defaultSessionLabel(session)}
                    </button>
                    <button
                      onClick={() => startEdit(session)}
                      className="p-1 text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      aria-label="Rename session"
                      title="Rename"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="text-[10px] text-text-muted">
                  {formatDate(session.startTime)} {formatTime(session.startTime)}
                  {' '}&middot; {msgCount} messages
                  {' '}&middot; {formatDuration(session.endTime - session.startTime)}
                  {isLive && session.sessionMode && <> &middot; {session.sessionMode}</>}
                  {' '}&middot; {session.model.split('/').pop()}
                </div>
              </div>
            </div>

            {/* Expanded: transcript + actions */}
            {isExpanded && (
              <div className="border-t border-border">
                {/* Actions bar */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary/20">
                  <button
                    onClick={() => onExport(session.id)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-accent hover:text-accent-hover"
                  >
                    <Download className="w-3 h-3" /> Export JSON
                  </button>
                  <button
                    onClick={() => { onDelete(session.id); setExpandedId(null); }}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-danger hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                  <span className="ml-auto text-[9px] text-text-muted">
                    {session.agentMode} mode
                  </span>
                </div>

                {/* Messages */}
                <div className="px-3 py-2 max-h-80 overflow-y-auto">
                  {session.messages.length === 0 ? (
                    <p className="text-[10px] text-text-muted text-center py-4">No messages in this session</p>
                  ) : (
                    session.messages.map(msg => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
