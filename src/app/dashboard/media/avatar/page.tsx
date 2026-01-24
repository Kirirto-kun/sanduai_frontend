"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AudioRecorder } from "./components/AudioRecorder";
import { SpeechBubble } from "./components/SpeechBubble";
import type { YbyraiLanguage } from "../../../../lib/api";

// Dynamic import to avoid SSR issues with Three.js
const YbyraiScene = dynamic(
  () => import("./components/YbyraiScene").then((mod) => ({ default: mod.YbyraiScene })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Загрузка...</div>,
  }
);

export default function AvatarPage() {
  const [responseText, setResponseText] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<YbyraiLanguage>("auto");

  const handleResponse = (text: string, url?: string, transcribed?: string) => {
    setResponseText(text);
    setTranscribedText(transcribed || null);
    setAudioUrl(url || null);
    setError(null);
  };

  const handleError = (err: string) => {
    setError(err);
    setResponseText(null);
    setTranscribedText(null);
    setAudioUrl(null);
  };

  const handleProcessing = (processing: boolean) => {
    setIsProcessing(processing);
  };

  return (
    <div className="glass-card rounded-3xl border border-white/60 px-6 py-12 shadow-md sm:px-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">
          Цифровой аватар Ыбырай
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Интерактивный 3D-ассистент для учителей
        </p>
        
        {/* Language selector */}
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setLanguage("kk")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              language === "kk"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            🇰🇿 Қазақша
          </button>
          <button
            onClick={() => setLanguage("ru")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              language === "ru"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            🇷🇺 Русский
          </button>
          <button
            onClick={() => setLanguage("auto")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              language === "auto"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            🌐 Авто
          </button>
        </div>
      </div>

      <div className="relative w-full h-[600px] bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl overflow-hidden mb-6">
        <YbyraiScene
          isSpeaking={isProcessing}
          responseText={responseText}
          audioUrl={audioUrl}
        />
      </div>

      {transcribedText && (
        <div className="mb-2 text-center">
          <span className="text-xs text-slate-500">Вы сказали:</span>
          <p className="text-sm text-slate-700 italic">&quot;{transcribedText}&quot;</p>
        </div>
      )}

      {responseText && (
        <div className="mb-4">
          <SpeechBubble text={responseText} />
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <AudioRecorder
          language={language}
          onResponse={handleResponse}
          onError={handleError}
          onProcessing={handleProcessing}
        />
      </div>
    </div>
  );
}

