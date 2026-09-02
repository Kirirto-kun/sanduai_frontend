"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSavedKmzhSources } from "@/hooks/usePresentations";
import type { CreatePresentationInput } from "@/types/presentations";
import { getPresentationCopy } from "./copy";
import {
  buildPresentationCreateInput,
  validatePresentationSource,
  type PresentationSourceChoice,
} from "./source-selection";

const inputClass =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-300/70";

export default function CreateForm({
  mode,
  loading,
  onSubmit,
}: {
  mode: "creative";
  loading: boolean;
  onSubmit: (input: CreatePresentationInput) => Promise<void> | void;
}) {
  const { language: uiLanguage } = useLanguage();
  const copy = getPresentationCopy(uiLanguage);
  const [source, setSource] = useState<PresentationSourceChoice>("topic");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [selectedKmzhId, setSelectedKmzhId] = useState("");
  const [pastedTitle, setPastedTitle] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [language, setLanguage] = useState<"ru" | "kk">(uiLanguage);
  const [slideCount, setSlideCount] = useState(10);
  const [submitted, setSubmitted] = useState(false);
  const kmzhQuery = useSavedKmzhSources(source === "saved_kmzh");
  const selectedKmzh = kmzhQuery.data?.items.find((item) => item.id === selectedKmzhId);
  const validationError = submitted
    ? validatePresentationSource({ source, topic, pastedTitle, pastedText, selectedKmzh })
    : null;

  const sourceOptions: Array<{
    id: PresentationSourceChoice;
    title: string;
    description: string;
  }> = [
    { id: "topic", title: copy.sourceTopic, description: copy.sourceTopicHint },
    { id: "saved_kmzh", title: copy.sourceKmzh, description: copy.sourceKmzhHint },
    { id: "pasted", title: copy.sourcePaste, description: copy.sourcePasteHint },
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (validatePresentationSource({ source, topic, pastedTitle, pastedText, selectedKmzh })) return;
    await onSubmit(buildPresentationCreateInput({
      mode,
      source,
      topic,
      subject,
      grade,
      selectedKmzh,
      pastedTitle,
      pastedText,
      language,
      slideCount,
    }));
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <fieldset>
        <legend className="text-base font-bold text-slate-900">{copy.sourcePrompt}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {sourceOptions.map((option) => (
            <label
              key={option.id}
              className={`cursor-pointer rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-violet-400 focus-within:ring-offset-2 ${
                source === option.id
                  ? "border-violet-500 bg-violet-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <input
                className="sr-only"
                type="radio"
                name="presentation-source"
                value={option.id}
                checked={source === option.id}
                onChange={() => {
                  setSource(option.id);
                  setSubmitted(false);
                }}
              />
              <span className="block font-bold text-slate-900">{option.title}</span>
              <span className="mt-1 block text-sm leading-5 text-slate-600">{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {source === "topic" ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="presentation-topic" className="text-sm font-bold text-slate-800">
              {copy.topic} <span className="text-rose-600" aria-hidden="true">*</span>
            </label>
            <textarea
              id="presentation-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              rows={3}
              aria-invalid={validationError === "topic"}
              aria-describedby={validationError === "topic" ? "presentation-topic-error" : undefined}
              placeholder={copy.topicPlaceholder}
              className={`${inputClass} resize-y ${validationError === "topic" ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200" : ""}`}
            />
            {validationError === "topic" ? (
              <p id="presentation-topic-error" role="alert" className="mt-1.5 text-sm text-rose-700">{copy.required}</p>
            ) : null}
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
        </div>
      ) : null}

      {source === "saved_kmzh" ? (
        <fieldset aria-describedby={validationError === "saved_kmzh" ? "presentation-kmzh-error" : undefined}>
          <legend className="text-sm font-bold text-slate-800">{copy.chooseKmzh}</legend>
          {kmzhQuery.isPending ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600" role="status">
              {copy.kmzhLoading}
            </div>
          ) : kmzhQuery.isError ? (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm text-rose-800">{copy.kmzhLoadError}</p>
              <button
                type="button"
                onClick={() => void kmzhQuery.refetch()}
                className="mt-3 min-h-10 rounded-xl bg-white px-4 text-sm font-bold text-rose-800 shadow-sm ring-1 ring-rose-200 hover:bg-rose-100"
              >
                {copy.retryKmzh}
              </button>
            </div>
          ) : kmzhQuery.data.items.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-bold text-slate-900">{copy.kmzhEmpty}</p>
              <p className="mt-1 text-sm leading-5 text-slate-600">{copy.kmzhEmptyHint}</p>
              <Link
                href="/dashboard/ai/kmzh"
                className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-white px-4 text-sm font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"
              >
                {copy.createKmzh}
              </Link>
            </div>
          ) : (
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {kmzhQuery.data.items.map((item) => {
                const expiry = new Intl.DateTimeFormat(uiLanguage === "kk" ? "kk-KZ" : "ru-RU", {
                  day: "numeric",
                  month: "long",
                }).format(new Date(item.expires_at));
                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-violet-400 ${
                      selectedKmzhId === item.id
                        ? "border-violet-500 bg-violet-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="saved-kmzh"
                      value={item.id}
                      checked={selectedKmzhId === item.id}
                      onChange={() => setSelectedKmzhId(item.id)}
                      className="mt-1 size-4 accent-violet-600"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-slate-900">{item.title}</span>
                      <span className="mt-1 block text-xs text-slate-500">{copy.availableUntil}: {expiry}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {validationError === "saved_kmzh" ? (
            <p id="presentation-kmzh-error" role="alert" className="mt-2 text-sm text-rose-700">{copy.chooseKmzhRequired}</p>
          ) : null}
        </fieldset>
      ) : null}

      {source === "pasted" ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="presentation-name" className="text-sm font-bold text-slate-800">
              {copy.presentationName} <span className="text-rose-600" aria-hidden="true">*</span>
            </label>
            <input
              id="presentation-name"
              value={pastedTitle}
              onChange={(event) => setPastedTitle(event.target.value)}
              aria-invalid={validationError === "pasted_title"}
              aria-describedby={validationError === "pasted_title" ? "presentation-name-error" : undefined}
              placeholder={copy.presentationNamePlaceholder}
              className={`${inputClass} ${validationError === "pasted_title" ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200" : ""}`}
            />
            {validationError === "pasted_title" ? (
              <p id="presentation-name-error" role="alert" className="mt-1.5 text-sm text-rose-700">{copy.required}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="presentation-source-text" className="text-sm font-bold text-slate-800">
              {copy.pastedSource} <span className="text-rose-600" aria-hidden="true">*</span>
            </label>
            <textarea
              id="presentation-source-text"
              value={pastedText}
              onChange={(event) => setPastedText(event.target.value)}
              rows={9}
              aria-invalid={validationError === "pasted_text"}
              aria-describedby={validationError === "pasted_text" ? "presentation-source-text-error" : undefined}
              placeholder={copy.pastedSourcePlaceholder}
              className={`${inputClass} resize-y ${validationError === "pasted_text" ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200" : ""}`}
            />
            {validationError === "pasted_text" ? (
              <p id="presentation-source-text-error" role="alert" className="mt-1.5 text-sm text-rose-700">{copy.required}</p>
            ) : null}
          </div>
        </div>
      ) : null}

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
        className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-violet-600 px-6 text-base font-bold text-white shadow-lg transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? copy.creatingPlan : copy.createPlan}
        {!loading && <span className="ml-2" aria-hidden="true">→</span>}
      </button>
    </form>
  );
}
