import { useState, useCallback, useRef } from 'react';
import type { Message } from '../types';

interface UseChatOptions {
  model: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export function useChat(options: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: options.model,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const allMessages = [...messages, userMsg];
      const apiMessages = [
        { role: 'system' as const, content: options.systemPrompt },
        ...allMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      const isCustomModel = options.model.startsWith('custom:');
      let fetchUrl: string;
      let fetchBody: string;

      if (isCustomModel) {
        const parts = options.model.split(':');
        const endpoint = parts.slice(1, -1).join(':');
        const modelId = parts[parts.length - 1];
        fetchUrl = `${import.meta.env.BASE_URL}api/local-llm`;
        fetchBody = JSON.stringify({
          endpoint,
          model: modelId,
          messages: apiMessages,
          temperature: options.temperature,
          top_p: options.topP,
          max_tokens: options.maxTokens,
          frequency_penalty: options.frequencyPenalty,
          presence_penalty: options.presencePenalty,
          stream: true,
        });
      } else {
        fetchUrl = `${import.meta.env.BASE_URL}api/chat`;
        fetchBody = JSON.stringify({
          model: options.model,
          messages: apiMessages,
          temperature: options.temperature,
          top_p: options.topP,
          max_tokens: options.maxTokens,
          frequency_penalty: options.frequencyPenalty,
          presence_penalty: options.presencePenalty,
          stream: true,
        });
      }

      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: fetchBody,
        signal: abortController.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                const current = accumulated;
                setMessages(prev =>
                  prev.map(m => m.id === assistantMsg.id ? { ...m, content: current } : m)
                );
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: `Error: ${errorMessage}` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [options, messages]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const injectSystemMessage = useCallback((content: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  return { messages, isStreaming, sendMessage, stopStreaming, clearMessages, injectSystemMessage };
}
