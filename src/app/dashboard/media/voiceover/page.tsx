"use client";

import { useState } from "react";
import { useTranslations } from "../../../../i18n/LanguageContext";
import { generateVoiceover } from "../../../../lib/api";

export default function VoiceoverPage() {
  const t = useTranslations();
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError(t.voiceover.errors.required);
      return;
    }
    if (text.length > 4096) {
      setError(t.voiceover.errors.tooLong);
      return;
    }

    setLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const res = await generateVoiceover({ text, voice });
      setAudioUrl(res.audio_url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.voiceover.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!audioUrl) return;

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `voiceover-${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
      // Fallback: try direct navigation if fetch fails (e.g. CORS)
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = `voiceover-${Date.now()}.mp3`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const voices = [
    { id: "alloy", label: t.voiceover.voices.alloy },
    { id: "echo", label: t.voiceover.voices.echo },
    { id: "fable", label: t.voiceover.voices.fable },
    { id: "onyx", label: t.voiceover.voices.onyx },
    { id: "nova", label: t.voiceover.voices.nova },
    { id: "shimmer", label: t.voiceover.voices.shimmer },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">{t.voiceover.title}</h1>

        <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Voice Selection */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t.voiceover.voiceLabel}
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {voices.map((v) => (
                  <label
                    key={v.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                      voice === v.id
                        ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="voice"
                        value={v.id}
                        checked={voice === v.id}
                        onChange={(e) => setVoice(e.target.value)}
                        className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                      />
                      <span className="text-sm font-medium text-slate-900">{v.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Текст
              </label>
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.voiceover.placeholder}
                  maxLength={4096}
                  rows={8}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                />
                <div className="absolute bottom-3 right-3 text-xs font-medium text-slate-400">
                  {text.length} / 4096
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  {t.voiceover.loading}
                </>
              ) : (
                t.voiceover.generate
              )}
            </button>
          </form>
        </div>

        {/* Result Section */}
        {audioUrl && (
          <div className="mt-6 animate-fade-in glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              {t.voiceover.result}
            </h2>
            <div className="flex flex-col items-center gap-4">
              <audio controls src={audioUrl} className="w-full" />
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-[color:var(--primary)]"
              >
                <span>⬇️</span>
                {t.voiceover.download}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
