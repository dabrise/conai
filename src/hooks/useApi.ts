import type { SavedPreset, SavedSession } from '../types';

const API_BASE = `${import.meta.env.BASE_URL}api`;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Presets
export async function fetchPresets(): Promise<SavedPreset[]> {
  return request<SavedPreset[]>('/presets');
}

export async function savePresetToServer(preset: SavedPreset): Promise<void> {
  await request('/presets', { method: 'POST', body: JSON.stringify(preset) });
}

export async function deletePresetFromServer(id: string): Promise<void> {
  await request(`/presets/${id}`, { method: 'DELETE' });
}

// Sessions
export async function fetchSessions(): Promise<SavedSession[]> {
  return request<SavedSession[]>('/sessions');
}

export async function saveSessionToServer(session: SavedSession): Promise<void> {
  await request('/sessions', { method: 'POST', body: JSON.stringify(session) });
}

export async function deleteSessionFromServer(id: string): Promise<void> {
  await request(`/sessions/${id}`, { method: 'DELETE' });
}
