import { useState, useRef, useCallback } from 'react';
import type { VoiceConfig } from '../types';

interface UseTextToSpeechOptions {
  voiceConfig: VoiceConfig;
}

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voiceId: 'EXAVITQu4vr4xnSDxMaL',  // "Sarah" - natural female voice
  stability: 0.5,
  similarity: 0.75,
  model: 'eleven_multilingual_v2',
};

export const AVAILABLE_VOICES = [
  // Female voices
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Soft, natural' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Calm, professional' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', desc: 'Warm, confident' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', desc: 'Clear, friendly' },
  { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Gigi', desc: 'Young, energetic' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', desc: 'Warm, pleasant' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', desc: 'Emotional, expressive' },
  { id: 'z9fAnlkpzviPz146aGWa', name: 'Glinda', desc: 'Witchy, clear' },
  { id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Grace', desc: 'Mature, Southern' },
  { id: 'LcfcDJNUP1GQjkzn1xUU', name: 'Emily', desc: 'Calm, gentle' },
];

export function useTextToSpeech({ voiceConfig }: UseTextToSpeechOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    abortRef.current?.abort();

    const abortController = new AbortController();
    abortRef.current = abortController;

    setIsSpeaking(true);

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          voiceId: voiceConfig.voiceId,
          text,
          model: voiceConfig.model,
          stability: voiceConfig.stability,
          similarity: voiceConfig.similarity,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `TTS error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          resolve();
        };
        audio.onerror = (e) => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          reject(e);
        };
        audio.play().catch(reject);
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setIsSpeaking(false);
      throw err;
    }
  }, [voiceConfig]);

  const stopSpeaking = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stopSpeaking };
}
