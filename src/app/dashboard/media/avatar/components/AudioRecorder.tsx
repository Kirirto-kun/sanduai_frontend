"use client";

import { useState, useRef, useEffect } from "react";
import { chatWithYbyraiStream, YbyraiLanguage } from "../../../../../lib/api";

interface AudioRecorderProps {
  language: YbyraiLanguage;
  onResponse: (text: string, audioUrl?: string, transcribedText?: string) => void;
  onError: (error: string) => void;
  onProcessing: (processing: boolean) => void;
}

export function AudioRecorder({
  language,
  onResponse,
  onError,
  onProcessing,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioQueueRef = useRef<Array<{ url: string; text: string }>>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const abortStreamRef = useRef<(() => void) | null>(null);
  const fullTextRef = useRef("");
  const transcribedTextRef = useRef("");

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (stopRecordingRef.current) {
        stopRecordingRef.current();
      }
      if (abortStreamRef.current) {
        abortStreamRef.current();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  // Play audio queue sequentially
  const playNextAudio = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    const chunk = audioQueueRef.current.shift();
    if (!chunk) return;

    isPlayingRef.current = true;
    const audio = new Audio(chunk.url);
    currentAudioRef.current = audio;

    audio.onended = () => {
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      // Play next chunk
      playNextAudio();
    };

    audio.onerror = () => {
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      // Try next chunk even if this one failed
      playNextAudio();
    };

    audio.play().catch((err) => {
      console.error("Error playing audio:", err);
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      playNextAudio();
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Process audio
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Auto-stop after 30 seconds
      const timeout = setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 30000);

      stopRecordingRef.current = () => {
        clearTimeout(timeout);
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      };
    } catch (err: any) {
      console.error("Error starting recording:", err);
      onError("Не удалось получить доступ к микрофону. Проверьте разрешения.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (stopRecordingRef.current) {
      stopRecordingRef.current();
      stopRecordingRef.current = null;
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    onProcessing(true);
    fullTextRef.current = "";
    transcribedTextRef.current = "";
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    try {
      // Convert blob to File
      const audioFile = new File([audioBlob], "recording.webm", {
        type: "audio/webm",
      });

      // Use streaming API
      abortStreamRef.current = chatWithYbyraiStream(audioFile, language, {
        onTranscription: (text: string) => {
          transcribedTextRef.current = text;
          // Update UI immediately
          onResponse("", undefined, text);
        },
        onTextChunk: (text: string) => {
          fullTextRef.current += text;
          // Update UI with streaming text
          onResponse(fullTextRef.current, undefined, transcribedTextRef.current);
        },
        onAudioChunk: (url: string, text: string) => {
          // Add to queue
          audioQueueRef.current.push({ url, text });
          // Pass first audio chunk to parent for lip-sync
          if (audioQueueRef.current.length === 1) {
            onResponse(fullTextRef.current, url, transcribedTextRef.current);
          }
          // Start playing if not already
          if (!isPlayingRef.current) {
            playNextAudio();
          }
        },
        onDone: (fullText: string) => {
          fullTextRef.current = fullText;
          // Wait for all audio to finish
          const checkFinished = setInterval(() => {
            if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
              clearInterval(checkFinished);
              setIsProcessing(false);
              onProcessing(false);
              onResponse(fullText, undefined, transcribedTextRef.current);
            }
          }, 100);
        },
        onError: (error: string) => {
          setIsProcessing(false);
          onProcessing(false);
          if (error.includes("Insufficient tokens")) {
            onError("Недостаточно токенов. Пожалуйста, пополните баланс.");
          } else {
            onError(error || "Ошибка при обработке аудио. Попробуйте еще раз.");
          }
        },
      });
    } catch (err: any) {
      console.error("Error processing audio:", err);
      setIsProcessing(false);
      onProcessing(false);

      if (err.message?.includes("Insufficient tokens")) {
        onError("Недостаточно токенов. Пожалуйста, пополните баланс.");
      } else {
        onError(err.message || "Ошибка при обработке аудио. Попробуйте еще раз.");
      }
    }
  };

  const handleStop = () => {
    // Abort stream if active
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
    }
    
    // Stop current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // Clear queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    
    setIsProcessing(false);
    onProcessing(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!isRecording && !isProcessing && (
        <button
          onClick={startRecording}
          className="flex items-center justify-center w-20 h-20 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 hover:scale-105"
          aria-label="Начать запись"
        >
          <svg
            className="w-10 h-10"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {isRecording && (
        <div className="flex items-center gap-4">
          <button
            onClick={stopRecording}
            className="flex items-center justify-center w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-200 animate-pulse"
            aria-label="Остановить запись"
          >
            <div className="w-8 h-8 bg-white rounded"></div>
          </button>
          <span className="text-sm text-slate-600">Запись...</span>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-indigo-600 text-white shadow-lg">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            Стоп
          </button>
          <span className="text-sm text-slate-600">Обработка...</span>
        </div>
      )}
    </div>
  );
}
