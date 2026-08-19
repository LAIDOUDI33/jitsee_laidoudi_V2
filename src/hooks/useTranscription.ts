'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { authFetch } from '@/lib/api';

// ── TypeScript declarations for Web Speech API ─────────────────────────────

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  isInterim: boolean;
}

export interface UseTranscriptionOptions {
  language?: string;
  /** Auto-send finalized transcripts to the API */
  persistToServer?: boolean;
}

export interface UseTranscriptionReturn {
  isTranscribing: boolean;
  isStarting: boolean;
  transcript: TranscriptEntry[];
  interimTranscript: string;
  error: string | null;
  language: string;
  setLanguage: (lang: string) => void;
  startTranscription: () => void;
  stopTranscription: () => void;
}

// ── Language map ───────────────────────────────────────────────────────────

export const SPEECH_LANGUAGES: Record<string, string> = {
  'en-US': 'English',
  'es-ES': 'Spanish',
  'fr-FR': 'French',
  'de-DE': 'German',
  'zh-CN': 'Chinese',
  'ja-JP': 'Japanese',
  'ko-KR': 'Korean',
  'pt-BR': 'Portuguese',
  'ar-SA': 'Arabic',
  'hi-IN': 'Hindi',
};

// ── Hook ───────────────────────────────────────────────────────────────────

export function useTranscription(options: UseTranscriptionOptions = {}): UseTranscriptionReturn {
  const { language: langOption = 'en-US', persistToServer = true } = options;
  const meetingId = useAppStore((s) => s.currentMeetingId);
  const user = useAppStore((s) => s.user);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState(langOption);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldTranscribeRef = useRef(false);
  const persistQueueRef = useRef<Set<string>>(new Set());

  // ── Persist a finalized transcript to the server ────────────
  const persistTranscript = useCallback(
    async (text: string) => {
      if (!persistToServer || !meetingId) return;
      // Deduplicate by text content (debounce-like)
      const key = text.trim().toLowerCase();
      if (persistQueueRef.current.has(key)) return;
      persistQueueRef.current.add(key);

      try {
        await authFetch('/api/v1/ai/transcribe', {
          method: 'POST',
          body: JSON.stringify({
            meetingId,
            text: text.trim(),
            language,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch {
        // Silently fail — transcription still works locally
      }
    },
    [persistToServer, meetingId, language],
  );

  // ── Create recognition instance ────────────────────────────
  const createRecognition = useCallback(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsTranscribing(true);
      setIsStarting(false);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const entryText = result[0].transcript;

        if (result.isFinal) {
          const newEntry: TranscriptEntry = {
            id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            speaker: user?.name || 'You',
            text: entryText,
            timestamp: new Date(),
            isInterim: false,
          };
          setTranscript((prev) => [...prev, newEntry]);
          setInterimTranscript('');
          // Persist to server in background
          persistTranscript(entryText);
        } else {
          interim += entryText;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
 // Don't treat no-speech as a hard error
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setError(`Speech recognition error: ${event.error}`);
      setIsTranscribing(false);
      shouldTranscribeRef.current = false;
    };

    recognition.onend = () => {
 // Auto-restart if still supposed to be transcribing
      if (shouldTranscribeRef.current) {
        try {
          recognition.start();
        } catch {
          shouldTranscribeRef.current = false;
          setIsTranscribing(false);
        }
      } else {
        setIsTranscribing(false);
      }
    };

    return recognition;
  }, [language, user?.name, persistTranscript]);

  // ── Cleanup old recognition on language change ─────────────
  useEffect(() => {
    if (recognitionRef.current && isTranscribing) {
      shouldTranscribeRef.current = false;
      try { recognitionRef.current.stop(); } catch { /* noop */ }
      recognitionRef.current = null;
    }
  // Only re-run on language change
  }, [language]);

  // ── Start transcription ────────────────────────────────────
  const startTranscription = useCallback(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    setError(null);
    setIsStarting(true);
    shouldTranscribeRef.current = true;

    const recognition = createRecognition();
    if (!recognition) {
      setError('Failed to initialize speech recognition.');
      setIsStarting(false);
      return;
    }

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      setError(`Failed to start transcription: ${e instanceof Error ? e.message : 'Unknown error'}`);
      setIsStarting(false);
      shouldTranscribeRef.current = false;
    }
  }, [createRecognition]);

  // ── Stop transcription ─────────────────────────────────────
  const stopTranscription = useCallback(() => {
    shouldTranscribeRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
      recognitionRef.current = null;
    }
    setIsTranscribing(false);
    setIsStarting(false);
    setInterimTranscript('');
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      shouldTranscribeRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* noop */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isTranscribing,
    isStarting,
    transcript,
    interimTranscript,
    error,
    language,
    setLanguage,
    startTranscription,
    stopTranscription,
  };
}
