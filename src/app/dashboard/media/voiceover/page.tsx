"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "../../../../i18n/LanguageContext";
import { generateVoiceover } from "../../../../lib/api";

const ADAM_VOICE_ID = "pNInz6obpgDQGcFmaJgB";

type VoiceKey =
  | "roger"
  | "sarah"
  | "laura"
  | "charlie"
  | "george"
  | "callum"
  | "river"
  | "harry"
  | "liam"
  | "alice"
  | "matilda"
  | "will"
  | "jessica"
  | "eric"
  | "bella"
  | "chris"
  | "brian"
  | "daniel"
  | "lily"
  | "adam"
  | "bill";

const VOICES: { voice_id: string; gender: string; nameKey: VoiceKey }[] = [
  { voice_id: "CwhRBWXzGAHq8TQ4Fs17", gender: "male", nameKey: "roger" },
  { voice_id: "EXAVITQu4vr4xnSDxMaL", gender: "female", nameKey: "sarah" },
  { voice_id: "FGY2WhTYpPnrIDTdsKH5", gender: "female", nameKey: "laura" },
  { voice_id: "IKne3meq5aSn9XLyUdCD", gender: "male", nameKey: "charlie" },
  { voice_id: "JBFqnCBsd6RMkjVDRZzb", gender: "male", nameKey: "george" },
  { voice_id: "N2lVS1w4EtoT3dr4eOWO", gender: "male", nameKey: "callum" },
  { voice_id: "SAz9YHcvj6GT2YYXdXww", gender: "neutral", nameKey: "river" },
  { voice_id: "SOYHLrjzK2X1ezoPC6cr", gender: "male", nameKey: "harry" },
  { voice_id: "TX3LPaxmHKxFdv7VOQHJ", gender: "male", nameKey: "liam" },
  { voice_id: "Xb7hH8MSUJpSbSDYk0k2", gender: "female", nameKey: "alice" },
  { voice_id: "XrExE9yKIg1WjnnlVkGX", gender: "female", nameKey: "matilda" },
  { voice_id: "bIHbv24MWmeRgasZH58o", gender: "male", nameKey: "will" },
  { voice_id: "cgSgspJ2msm6clMCkdW9", gender: "female", nameKey: "jessica" },
  { voice_id: "cjVigY5qzO86Huf0OWal", gender: "male", nameKey: "eric" },
  { voice_id: "hpp4J3VqNfWAUOO0d1Us", gender: "female", nameKey: "bella" },
  { voice_id: "iP95p4xoKVk53GoZ742B", gender: "male", nameKey: "chris" },
  { voice_id: "nPczCjzI2devNBz1zQrb", gender: "male", nameKey: "brian" },
  { voice_id: "onwK4e9ZLuTAKqWW03F9", gender: "male", nameKey: "daniel" },
  { voice_id: "pFZP5JQG7iQjIQuC4Bku", gender: "female", nameKey: "lily" },
  { voice_id: ADAM_VOICE_ID, gender: "male", nameKey: "adam" },
  { voice_id: "pqHfZKP75CvOlQylNhV4", gender: "male", nameKey: "bill" },
];

type GenderFilter = "all" | "female" | "male" | "neutral";

function filterVoices(
  voices: typeof VOICES,
  genderFilter: GenderFilter,
  search: string,
  getLabel: (nameKey: VoiceKey) => string
): typeof VOICES {
  let list = voices;
  if (genderFilter !== "all") {
    list = list.filter(
      (v) => v.gender?.toLowerCase() === genderFilter.toLowerCase()
    );
  }
  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter((v) =>
      getLabel(v.nameKey).toLowerCase().includes(q)
    );
  }
  return list;
}

export default function VoiceoverPage() {
  const t = useTranslations();
  const getVoiceLabel = useCallback(
    (nameKey: VoiceKey) => t.voiceover.voices[nameKey] ?? nameKey,
    [t.voiceover.voices]
  );

  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [voiceSearch, setVoiceSearch] = useState("");
  const [voiceId, setVoiceId] = useState(ADAM_VOICE_ID);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [charactersUsed, setCharactersUsed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredVoices = useMemo(
    () => filterVoices(VOICES, genderFilter, voiceSearch, getVoiceLabel),
    [genderFilter, voiceSearch, getVoiceLabel]
  );

  const defaultVoiceId = useMemo(() => {
    const adam = VOICES.find((v) => v.voice_id === ADAM_VOICE_ID);
    return adam ? adam.voice_id : VOICES[0].voice_id;
  }, []);

  const effectiveVoiceId = VOICES.some((v) => v.voice_id === voiceId)
    ? voiceId
    : defaultVoiceId;

  useEffect(() => {
    if (!VOICES.some((v) => v.voice_id === voiceId)) {
      setVoiceId(defaultVoiceId);
    }
  }, [voiceId, defaultVoiceId]);

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
    setCharactersUsed(null);

    try {
      const res = await generateVoiceover({
        text,
        voice_id: effectiveVoiceId,
      });
      setAudioUrl(res.audio_url);
      if (res.characters_used != null) setCharactersUsed(res.characters_used);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : t.voiceover.errors.generic
      );
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
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = `voiceover-${Date.now()}.mp3`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const genderBadge = (g: string) => {
    const lower = g?.toLowerCase() ?? "";
    if (lower === "female") return t.voiceover.voiceFilterFemale;
    if (lower === "male") return t.voiceover.voiceFilterMale;
    if (lower === "neutral") return t.voiceover.voiceFilterNeutral;
    return g || "—";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          {t.voiceover.title}
        </h1>

        <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t.voiceover.voiceLabel}
              </label>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {(
                  [
                    ["all", t.voiceover.voiceFilterAll],
                    ["female", t.voiceover.voiceFilterFemale],
                    ["male", t.voiceover.voiceFilterMale],
                    ["neutral", t.voiceover.voiceFilterNeutral],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGenderFilter(value as GenderFilter)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      genderFilter === value
                        ? "bg-[color:var(--primary)] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={voiceSearch}
                onChange={(e) => setVoiceSearch(e.target.value)}
                placeholder={t.voiceover.voiceSearchPlaceholder}
                className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {filteredVoices.map((v) => {
                  const label = getVoiceLabel(v.nameKey);
                  const [name, trait] = label.includes(" — ")
                    ? label.split(" — ", 2)
                    : [label, ""];
                  return (
                    <label
                      key={v.voice_id}
                      className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 transition-all ${
                        effectiveVoiceId === v.voice_id
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10 ring-1 ring-[color:var(--primary)]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="voice"
                          value={v.voice_id}
                          checked={effectiveVoiceId === v.voice_id}
                          onChange={() => setVoiceId(v.voice_id)}
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-slate-900">
                            {name}
                          </span>
                          {trait && (
                            <span className="block text-xs text-slate-500">
                              {trait}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="mt-1 pl-5 text-xs text-slate-400">
                        {genderBadge(v.gender)}
                      </span>
                    </label>
                  );
                })}
              </div>
              {filteredVoices.length === 0 && (
                <p className="py-2 text-sm text-slate-500">
                  {t.voiceover.voiceSearchPlaceholder}
                </p>
              )}
            </div>

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

            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

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

        {audioUrl && (
          <div className="mt-6 animate-fade-in glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              {t.voiceover.result}
            </h2>
            <div className="flex flex-col items-center gap-4">
              <audio controls src={audioUrl} className="w-full" />
              {charactersUsed != null && (
                <p className="text-sm text-slate-500">
                  {t.voiceover.charactersUsed ?? "Символов использовано"}:{" "}
                  {charactersUsed}
                </p>
              )}
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
