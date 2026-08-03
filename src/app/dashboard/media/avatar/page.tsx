"use client";

import { useState, useRef, useEffect } from "react";
import { AudioRecorder } from "./components/AudioRecorder";
import { SpeechBubble } from "./components/SpeechBubble";
import { YbyraiScene } from "./components/YbyraiScene";
import type { YbyraiLanguage } from "../../../../lib/api";

export default function AvatarPage() {
  const [responseText, setResponseText] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [afterConversation, setAfterConversation] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevSpeakingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<YbyraiLanguage>("auto");
  const fullscreenRef = useRef<HTMLDivElement>(null);

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
    if (processing) setAfterConversation(false);
  };

  const handleSpeaking = (speaking: boolean) => {
    if (prevSpeakingRef.current && !speaking) setAfterConversation(true);
    prevSpeakingRef.current = speaking;
    setIsSpeaking(speaking);
  };

  const toggleFullscreen = async () => {
    const el = fullscreenRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  return (
    <div
      ref={fullscreenRef}
      className="flex flex-col h-[calc(100vh-3rem)] min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl overflow-hidden"
    >
      {/* Верхняя строка: компактная */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-2 sm:px-3 bg-white/70 backdrop-blur-sm border-b border-white/60 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Цифровой аватар Ыбырай
          </h2>
          <p className="text-xs text-slate-600 hidden sm:block">
            Интерактивный видео-ассистент для школьников
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setLanguage("kk")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                language === "kk"
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Қазақша
            </button>
            <button
              type="button"
              onClick={() => setLanguage("ru")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                language === "ru"
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Русский
            </button>
            <button
              type="button"
              onClick={() => setLanguage("auto")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                language === "auto"
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Авто
            </button>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shrink-0"
            title={isFullscreen ? "Выйти из полноэкранного режима" : "На весь экран"}
            aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "На весь экран"}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Видео на всю оставшуюся высоту — размер не меняется */}
      <div className="relative flex-1 min-h-[300px] w-full">
        <YbyraiScene
          isSpeaking={isSpeaking}
          useFixedListenVideo={afterConversation}
          responseText={responseText}
          audioUrl={audioUrl}
        />
        {/* Транскрипт и ответ поверх видео, чтобы не уменьшать область аватара */}
        <div className="absolute bottom-0 left-0 right-0 max-h-[40%] overflow-y-auto px-3 py-2 space-y-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
          {transcribedText && (
            <div className="text-center pointer-events-auto">
              <span className="text-xs text-white/80">Вы сказали:</span>
              <p className="text-sm text-white italic">&quot;{transcribedText}&quot;</p>
            </div>
          )}
          {responseText && (
            <div className="pointer-events-auto">
              <SpeechBubble text={responseText} />
            </div>
          )}
        </div>
        {error && (
          <div className="absolute top-2 left-2 right-2 p-3 bg-red-50/95 border border-red-200 rounded-lg text-red-700 text-sm shadow">
            {error}
          </div>
        )}
      </div>

      {/* Только кнопка записи внизу */}
      <div className="shrink-0 py-2 px-2 sm:px-3 bg-white/70 backdrop-blur-sm border-t border-white/60">
        <div className="flex justify-center">
          <AudioRecorder
            language={language}
            onResponse={handleResponse}
            onError={handleError}
            onProcessing={handleProcessing}
            onSpeaking={handleSpeaking}
          />
        </div>
      </div>
    </div>
  );
}
