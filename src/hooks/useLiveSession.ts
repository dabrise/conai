import { useState, useCallback, useRef } from 'react';
import type { Message, LiveSessionState, LLMParams } from '../types';

interface UseLiveSessionOptions {
  model: string;
  compiledPrompt: string;
  params: LLMParams;
}

export function useLiveSession({ model, compiledPrompt, params }: UseLiveSessionOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionState, setSessionState] = useState<LiveSessionState>('idle');
  const [pendingResponse, setPendingResponse] = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startSession = useCallback(() => {
    setMessages([]);
    setSessionState('listening');
    setSessionStart(Date.now());
    setPendingResponse(null);
  }, []);

  const endSession = useCallback(() => {
    abortRef.current?.abort();
    setSessionState('idle');
    setSessionStart(null);
    setPendingResponse(null);
  }, []);

  const generateResponse = useCallback(async (userText: string): Promise<string> => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setSessionState('processing');

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const allMessages = [...messages, userMsg];
      const apiMessages = [
        { role: 'system' as const, content: compiledPrompt },
        ...allMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      const response = await fetch(`${import.meta.env.BASE_URL}api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          model,
          messages: apiMessages,
          temperature: params.temperature,
          top_p: params.topP,
          max_tokens: params.maxTokens,
          frequency_penalty: params.frequencyPenalty,
          presence_penalty: params.presencePenalty,
          stream: false,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'No response generated.';
      return content;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return '';
      throw err;
    }
  }, [model, compiledPrompt, params, messages]);

  // Hands-free: auto-generate and return response
  const handleHandsFree = useCallback(async (userText: string): Promise<string> => {
    const response = await generateResponse(userText);
    if (response) {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        model,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setSessionState('responding');
    }
    return response;
  }, [generateResponse, model]);

  // Approve mode: generate but hold for approval
  const handleApprove = useCallback(async (userText: string): Promise<void> => {
    const response = await generateResponse(userText);
    if (response) {
      setPendingResponse(response);
      setSessionState('awaiting-approval');
    }
  }, [generateResponse]);

  const approveResponse = useCallback((): string => {
    const response = pendingResponse || '';
    if (response) {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        model,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setSessionState('responding');
    }
    setPendingResponse(null);
    return response;
  }, [pendingResponse, model]);

  const rejectResponse = useCallback(() => {
    setPendingResponse(null);
    setSessionState('listening');
  }, []);

  const editAndApprove = useCallback((editedText: string): string => {
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: editedText,
      timestamp: Date.now(),
      model,
    };
    setMessages(prev => [...prev, assistantMsg]);
    setPendingResponse(null);
    setSessionState('responding');
    return editedText;
  }, [model]);

  // Manual mode: researcher writes the response
  const handleManual = useCallback((userText: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setSessionState('awaiting-approval');
  }, []);

  const sendManualResponse = useCallback((text: string): string => {
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: text,
      timestamp: Date.now(),
      model: 'manual',
    };
    setMessages(prev => [...prev, assistantMsg]);
    setSessionState('responding');
    return text;
  }, []);

  // Inject system event (scenario trigger)
  const injectEvent = useCallback((content: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  const setListening = useCallback(() => {
    setSessionState('listening');
  }, []);

  return {
    messages,
    sessionState,
    pendingResponse,
    sessionStart,
    startSession,
    endSession,
    handleHandsFree,
    handleApprove,
    approveResponse,
    rejectResponse,
    editAndApprove,
    handleManual,
    sendManualResponse,
    injectEvent,
    setListening,
  };
}
