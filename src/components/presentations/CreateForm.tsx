"use client";

import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { CreatePresentationInput, PresentationMode } from "@/types/presentations";
import { getPresentationCopy } from "./copy";
import { ModeBadge } from "./PresentationUI";

const inputClass =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-300/70";

export default function CreateForm({
  mode,
  loading,
  onSubmit,
}: {
  mode: PresentationMode;
  loading: boolean;
  onSubmit: (input: CreatePresentationInput) => Promise<void> | void;
}) {
  const { language: uiLanguage } = useLanguage();
  const copy = getPresentationCopy(uiLanguage);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [language, setLanguage] = useState<"ru" | "kk">(uiLanguage);
  const [slideCount, setSlideCount] = useState(mode === "creative" ? 10 : 12);
  const [submitted, setSubmitted] = useState(false);

  const invalid = submitted && !topic.trim();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!topic.trim()) return;
    await onSubmit({
      mode,
      title: topic.trim(),
      topic: topic.trim(),
      subject: subject.trim() || undefined,
      grade: grade.trim() || undefined,
      audience: grade.trim() || undefined,
      language,
      slide_count: Math.max(6, Math.min(30, slideCount)),
      source_kind: "scratch",
      text_density: "balanced",
      style: { preset: "clean" },
      theme_id: "academic_blue",
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{copy.newPresentation}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {mode === "creative" ? copy.creativeDescription : copy.classicDescription}
          </p>
        </div>
        <ModeBadge mode={mode} />
      </div>

      {mode === "creative" && (
        <aside className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4 text-sm text-violet-950">
          <p className="font-bold">{copy.creativeNoticeTitle}</p>
          <p className="mt-1.5 leading-6 text-violet-800">{copy.creativeNoticeBody}</p>
        </aside>
      )}

      <div>
        <label htmlFor="presentation-topic" className="text-sm font-bold text-slate-800">
          {copy.topic} <span className="text-rose-600" aria-hidden="true">*</span>
        </label>
        <textarea
          id="presentation-topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          rows={3}
          aria-invalid={invalid}
          aria-describedby={invalid ? "presentation-topic-error" : undefined}
          placeholder={copy.topicPlaceholder}
          className={`${inputClass} resize-y ${invalid ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200" : ""}`}
        />
        {invalid && <p id="presentation-topic-error" role="alert" className="mt-1.5 text-sm text-rose-700">{copy.required}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="presentation-subject" className="text-sm font-bold text-slate-800">{copy.subject}</label>
          <input
            id="presentation-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder={copy.subjectPlaceholder}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="presentation-grade" className="text-sm font-bold text-slate-800">{copy.grade}</label>
          <input
            id="presentation-grade"
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
            placeholder={copy.gradePlaceholder}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-bold text-slate-800">{copy.language}</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["kk", "ru"] as const).map((value) => (
              <label
                key={value}
                className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-semibold transition focus-within:ring-2 focus-within:ring-slate-400 ${
                  language === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input className="sr-only" type="radio" name="presentation-language" value={value} checked={language === value} onChange={() => setLanguage(value)} />
                {value === "kk" ? "Қазақша" : "Русский"}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="presentation-slide-count" className="text-sm font-bold text-slate-800">{copy.slideCount}</label>
          <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 shadow-sm">
            <input
              id="presentation-slide-count"
              type="range"
              min={6}
              max={30}
              value={slideCount}
              onChange={(event) => setSlideCount(Number(event.target.value))}
              className="min-w-0 flex-1 accent-slate-900"
            />
            <output htmlFor="presentation-slide-count" className="min-w-8 text-center text-sm font-bold text-slate-900">{slideCount}</output>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`flex min-h-14 w-full items-center justify-center rounded-2xl px-6 text-base font-bold text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${
          mode === "creative"
            ? "bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500"
            : "bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-500"
        }`}
      >
        {loading ? copy.creatingPlan : copy.createPlan}
        {!loading && <span className="ml-2" aria-hidden="true">→</span>}
      </button>
    </form>
  );
}
