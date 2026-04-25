import { useState, useRef, useCallback } from 'react';

interface UseSpeechToTextOptions {
  language?: string;
}

export function useSpeechToText({ language }: UseSpeechToTextOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const activeRef = useRef(false);
  const callbackRef = useRef<((text: string) => void) | null>(null);

  const startListening = useCallback(async (onTranscript: (text: string) => void) => {
    if (activeRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Web Speech API not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    callbackRef.current = onTranscript;

    recognition.lang = language === 'sv' ? 'sv-SE' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Get the latest final result
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text && callbackRef.current) {
            setTranscript(text);
            setIsTranscribing(false);
            callbackRef.current(text);
          }
        }
      }
    };

    recognition.onspeechstart = () => {
      setIsTranscribing(true);
    };

    recognition.onspeechend = () => {
      setIsTranscribing(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' and 'aborted' are normal — just restart
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      // Auto-restart if still active (browser stops after silence periods)
      if (activeRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started — ignore
        }
      } else {
        setIsListening(false);
      }
    };

    activeRef.current = true;
    setIsListening(true);
    recognition.start();
  }, [language]);

  const stopListening = useCallback(() => {
    activeRef.current = false;
    callbackRef.current = null;
    setIsListening(false);
    setIsTranscribing(false);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  return { isListening, isTranscribing, transcript, startListening, stopListening };
}
