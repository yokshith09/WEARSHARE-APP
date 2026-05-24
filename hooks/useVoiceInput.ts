"use client";

import { useCallback, useRef, useState } from "react";

type VoiceLanguage = "en-IN" | "hi-IN" | "en-US";

interface UseVoiceInputOptions {
  language?: VoiceLanguage;
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceInput({
  language = "en-IN",
  onResult,
  onError,
}: UseVoiceInputOptions) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!supported || listening) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      setListening(false);
      const errors: Record<string, string> = {
        "not-allowed": "Microphone permission denied.",
        "no-speech": "No speech detected.",
        "audio-capture": "Microphone not found.",
        network: "Network error during speech recognition.",
      };
      onError?.(errors[event.error] || `Speech recognition error: ${event.error}`);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [supported, listening, language, onResult, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, startListening, stopListening };
}

