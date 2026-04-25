import { useState, useCallback, useEffect } from 'react';
import type { SavedSession } from '../types';
import { fetchSessions, saveSessionToServer, deleteSessionFromServer } from './useApi';

export function useSessionStorage() {
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, []);

  // Load on mount
  useEffect(() => { refresh(); }, [refresh]);

  const saveSession = useCallback(async (session: SavedSession) => {
    setSessions(prev => [session, ...prev]);
    try {
      await saveSessionToServer(session);
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    try {
      await deleteSessionFromServer(id);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }, []);

  const renameSession = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    let updated: SavedSession | undefined;
    setSessions(prev => prev.map(s => {
      if (s.id !== id) return s;
      updated = { ...s, name: trimmed || undefined };
      return updated;
    }));
    if (!updated) return;
    try {
      await saveSessionToServer(updated);
    } catch (err) {
      console.error('Failed to rename session:', err);
    }
  }, []);

  const exportSession = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date(session.startTime).toISOString().slice(0, 16).replace('T', '_');
    const prefix = session.type === 'live' ? `P${session.participantNumber}` : 'Chat';
    a.href = url;
    a.download = `ConAI_${prefix}_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sessions]);

  return { sessions, saveSession, deleteSession, renameSession, exportSession, refresh };
}
