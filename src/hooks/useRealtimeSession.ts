import { useState, useRef, useCallback } from 'react';
import type { Message } from '../types';

// OpenAI Realtime (speech-to-speech) models. The server passes whichever the
// user picks straight through to OpenAI, so updating this list is cheap.
export const REALTIME_MODELS = [
  { id: 'gpt-realtime', name: 'GPT Realtime (GA)', desc: 'Latest production speech-to-speech' },
  { id: 'gpt-realtime-mini', name: 'GPT Realtime Mini', desc: 'Faster, cheaper' },
  { id: 'gpt-4o-realtime-preview', name: 'GPT-4o Realtime (preview)', desc: 'Previous generation' },
  { id: 'gpt-4o-mini-realtime-preview', name: 'GPT-4o Mini Realtime', desc: 'Previous gen, light' },
];

// OpenAI's built-in voices (these are NOT the ElevenLabs voices).
export const REALTIME_VOICES = [
  { id: 'marin', name: 'Marin', desc: 'Natural female (newest)' },
  { id: 'cedar', name: 'Cedar', desc: 'Natural male (newest)' },
  { id: 'alloy', name: 'Alloy', desc: 'Neutral' },
  { id: 'shimmer', name: 'Shimmer', desc: 'Warm female' },
  { id: 'coral', name: 'Coral', desc: 'Bright female' },
  { id: 'sage', name: 'Sage', desc: 'Calm female' },
  { id: 'ballad', name: 'Ballad', desc: 'Expressive' },
  { id: 'ash', name: 'Ash', desc: 'Soft male' },
  { id: 'echo', name: 'Echo', desc: 'Clear male' },
  { id: 'verse', name: 'Verse', desc: 'Versatile' },
];

export type RealtimeState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'user-speaking'
  | 'thinking'
  | 'speaking'
  | 'error';

interface UseRealtimeOptions {
  model: string;
  voice: string;
}

interface StartOptions {
  instructions: string;
  greeting?: string;
  onSystemEvent?: (text: string) => void;
}

export function useRealtimeSession({ model, voice }: UseRealtimeOptions) {
  const [state, setState] = useState<RealtimeState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [micMuted, setMicMutedState] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Assistant transcript accumulation
  const curAssistantIdRef = useRef<string | null>(null);
  const curResponseKeyRef = useRef<string | null>(null);

  const pushMessage = useCallback((role: Message['role'], content: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: Date.now(),
      model: role === 'assistant' ? `realtime:${model}` : undefined,
    }]);
  }, [model]);

  const handleAssistantDelta = useCallback((text: string, key: string) => {
    if (curResponseKeyRef.current !== key || !curAssistantIdRef.current) {
      // New assistant turn
      const id = crypto.randomUUID();
      curAssistantIdRef.current = id;
      curResponseKeyRef.current = key;
      setMessages(prev => [...prev, {
        id, role: 'assistant', content: text, timestamp: Date.now(), model: `realtime:${model}`,
      }]);
    } else {
      const id = curAssistantIdRef.current;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content: m.content + text } : m));
    }
  }, [model]);

  const handleAssistantDone = useCallback((fullText: string, key: string) => {
    const id = curAssistantIdRef.current;
    if (id && curResponseKeyRef.current === key && fullText) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content: fullText } : m));
    } else if (fullText) {
      pushMessage('assistant', fullText);
    }
    curAssistantIdRef.current = null;
    curResponseKeyRef.current = null;
  }, [pushMessage]);

  const handleEvent = useCallback((ev: any) => {
    const type: string = ev?.type || '';

    // User speech / turn-taking indicators
    if (type === 'input_audio_buffer.speech_started') {
      setState('user-speaking');
      return;
    }
    if (type === 'input_audio_buffer.speech_stopped') {
      setState('thinking');
      return;
    }

    // User transcription finished
    if (type === 'conversation.item.input_audio_transcription.completed') {
      const t = (ev.transcript || '').trim();
      if (t) pushMessage('user', t);
      return;
    }

    // Assistant transcript streaming
    if (type === 'response.output_audio_transcript.delta' || type === 'response.audio_transcript.delta') {
      const key = ev.response_id || ev.item_id || 'cur';
      if (ev.delta) handleAssistantDelta(ev.delta, key);
      setState('speaking');
      return;
    }
    if (type === 'response.output_audio_transcript.done' || type === 'response.audio_transcript.done') {
      const key = ev.response_id || ev.item_id || 'cur';
      handleAssistantDone((ev.transcript || '').trim(), key);
      return;
    }

    if (type === 'response.created') { setState('speaking'); return; }
    if (type === 'response.done') {
      // Settle finished turn
      curAssistantIdRef.current = null;
      curResponseKeyRef.current = null;
      setState('listening');
      return;
    }

    if (type === 'error') {
      const msg = ev.error?.message || 'Realtime error';
      console.error('[Realtime event error]', ev.error);
      setError(msg);
      return;
    }
  }, [pushMessage, handleAssistantDelta, handleAssistantDone]);

  const sendEvent = useCallback((obj: unknown) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === 'open') {
      dc.send(JSON.stringify(obj));
      return true;
    }
    return false;
  }, []);

  const updateInstructions = useCallback((instructions: string) => {
    sendEvent({
      type: 'session.update',
      session: { type: 'realtime', instructions },
    });
  }, [sendEvent]);

  const injectEvent = useCallback((text: string) => {
    // Context-only system note (no forced response), mirrors the cascade behaviour
    sendEvent({
      type: 'conversation.item.create',
      item: { type: 'message', role: 'system', content: [{ type: 'input_text', text }] },
    });
    pushMessage('system', text);
  }, [sendEvent, pushMessage]);

  const sendText = useCallback((text: string) => {
    if (!text.trim()) return;
    pushMessage('user', text.trim());
    sendEvent({
      type: 'conversation.item.create',
      item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: text.trim() }] },
    });
    sendEvent({ type: 'response.create' });
  }, [sendEvent, pushMessage]);

  const setMicMuted = useCallback((muted: boolean) => {
    setMicMutedState(muted);
    micStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !muted; });
  }, []);

  const stop = useCallback(() => {
    try { dcRef.current?.close(); } catch {}
    try { pcRef.current?.close(); } catch {}
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current.remove();
    }
    dcRef.current = null;
    pcRef.current = null;
    micStreamRef.current = null;
    audioElRef.current = null;
    curAssistantIdRef.current = null;
    curResponseKeyRef.current = null;
    setState('idle');
  }, []);

  const start = useCallback(async ({ instructions, greeting }: StartOptions) => {
    if (pcRef.current) return; // already running
    setError(null);
    setMessages([]);
    setState('connecting');
    startTimeRef.current = Date.now();

    try {
      // 1. Mint ephemeral token from our server (real key stays server-side)
      const tokenRes = await fetch(`${import.meta.env.BASE_URL}api/realtime-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ model, voice }),
      });
      const tokenData = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok || !tokenData.value) {
        throw new Error(tokenData?.error?.message || `Could not get realtime token (${tokenRes.status})`);
      }
      const ephemeralKey: string = tokenData.value;

      // 2. Microphone
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      // 3. Peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Remote audio (AINA's voice)
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElRef.current = audioEl;
      pc.ontrack = (e) => { audioEl.srcObject = e.streams[0]; };

      pc.addTrack(micStream.getAudioTracks()[0], micStream);

      // Data channel for events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onmessage = (e) => {
        try { handleEvent(JSON.parse(e.data)); } catch {}
      };

      dc.onopen = () => {
        // Configure the session: instructions, transcription, semantic VAD, voice
        sendEvent({
          type: 'session.update',
          session: {
            type: 'realtime',
            instructions,
            audio: {
              input: {
                transcription: { model: 'whisper-1' },
                turn_detection: { type: 'semantic_vad' },
              },
              output: { voice },
            },
          },
        });
        // Speak the greeting first
        if (greeting) {
          sendEvent({
            type: 'response.create',
            response: { instructions: `Say this greeting verbatim, then wait for the driver: "${greeting}"` },
          });
          setState('speaking');
        } else {
          setState('listening');
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setError('Connection lost');
          setState('error');
        }
      };

      // 4. SDP offer/answer with OpenAI directly (using the ephemeral key)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!sdpRes.ok) {
        const txt = await sdpRes.text().catch(() => '');
        throw new Error(`Realtime connect failed (${sdpRes.status}): ${txt.slice(0, 200)}`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start realtime session';
      console.error('[Realtime start]', msg);
      setError(msg);
      setState('error');
      stop();
    }
  }, [model, voice, sendEvent, handleEvent, stop]);

  return {
    state,
    messages,
    error,
    micMuted,
    startTime: startTimeRef,
    start,
    stop,
    setMicMuted,
    updateInstructions,
    injectEvent,
    sendText,
  };
}
