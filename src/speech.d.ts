// Minimal ambient types for the Web Speech API (Chrome implementation).
// Not part of lib.dom yet.

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
