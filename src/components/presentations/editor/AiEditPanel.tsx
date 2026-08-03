"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRegenerateSlide, useUpdatePresentation, useUpdateSlide } from "@/hooks/usePresentations";
import type { PresentationSlide, SlideSpec } from "@/types/presentations";
import { getPresentationCopy } from "../copy";
import { presentationErrorMessage } from "../error-copy";
import { normalizeSlideSpec } from "../slide-utils";

const fieldClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-300/70";

const themeAliases: Record<string, string> = {
  sand: "warm_classroom",
  ocean: "academic_blue",
  forest: "nature",
  night: "high_contrast",
};

function normalizedTheme(themeId: string) {
  return themeAliases[themeId] ?? themeId;
}

const editorOnlyKeys = new Set([
  "title",
  "role",
  "purpose",
  "subtitle",
  "body",
  "bullets",
  "layout",
  "theme",
  "speaker_notes",
  "review_status",
  "content",
]);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function editorDraft(slide: PresentationSlide): SlideSpec {
  const spec = normalizeSlideSpec(slide.spec);
  return {
    ...spec,
    title: String(spec.title ?? slide.title ?? ""),
    subtitle: String(spec.subtitle ?? slide.purpose ?? ""),
    body: String(spec.body ?? ""),
    bullets: Array.isArray(spec.bullets)
      ? spec.bullets.filter((item): item is string => typeof item === "string")
      : [],
    layout: String(spec.layout ?? slide.role ?? "auto"),
  };
}

function semanticPatch(draft: SlideSpec, slide: PresentationSlide): SlideSpec {
  const original = normalizeSlideSpec(slide.spec);
  const content: Record<string, unknown> = { ...record(original.content) };
  for (const [key, value] of Object.entries(original)) {
    if (!editorOnlyKeys.has(key)) content[key] = value;
  }

  const title = String(draft.title ?? "").trim();
  const subtitle = String(draft.subtitle ?? "").trim();
  const body = String(draft.body ?? "").trim();
  const bullets = Array.isArray(draft.bullets)
    ? draft.bullets.map(String).map((item) => item.trim()).filter(Boolean)
    : [];
  const requestedRole = String(draft.layout ?? "auto");
  const roleAliases: Record<string, string> = {
    title_body: "content",
    two_columns: "comparison",
    cards: "content",
  };
  let role = requestedRole === "auto"
    ? String(slide.role ?? original.role ?? "content")
    : roleAliases[requestedRole] ?? requestedRole;

  content.subtitle = subtitle;
  content.body = body;
  content.bullets = bullets;

  if (role === "comparison") {
    if (bullets.length >= 2) {
      const midpoint = Math.ceil(bullets.length / 2);
      const existing = Array.isArray(content.columns) ? content.columns.map(record) : [];
      content.columns = [
        { title: String(existing[0]?.title ?? "A"), items: bullets.slice(0, midpoint) },
        { title: String(existing[1]?.title ?? "B"), items: bullets.slice(midpoint) },
      ];
    } else if (!Array.isArray(content.columns)) {
      role = "content";
    }
  } else if (role === "timeline" || role === "process") {
    if (bullets.length >= 2) {
      content.steps = bullets.slice(0, 6).map((text, index) => ({ label: String(index + 1), text }));
    } else if (!Array.isArray(content.steps)) {
      role = "content";
    }
  } else if (role === "diagram") {
    if (bullets.length >= 2) {
      content.nodes = bullets.slice(0, 8).map((label, index) => ({ id: `node-${index + 1}`, label }));
      content.edges = bullets.slice(1, 8).map((_, index) => ({ from: `node-${index + 1}`, to: `node-${index + 2}` }));
    } else if (!Array.isArray(content.nodes)) {
      role = "content";
    }
  } else if (role === "table") {
    if (!Array.isArray(content.headers) || !Array.isArray(content.rows)) {
      const rows = (bullets.length ? bullets : [body]).filter(Boolean).slice(0, 8).map((item) => [item]);
      if (rows.length) {
        content.headers = [title];
        content.rows = rows;
      } else {
        role = "content";
      }
    }
  } else if (role === "quiz") {
    if (bullets.length >= 2) {
      content.question = body || title;
      content.options = bullets.slice(0, 6);
    } else if (!Array.isArray(content.options)) {
      role = "content";
    }
  } else if (role === "summary") {
    content.items = bullets.slice(0, 6);
    content.closing = body;
  }

  return {
    title,
    purpose: subtitle,
    role,
    content,
    speaker_notes: String(draft.speaker_notes ?? ""),
  };
}

export default function ClassicEditPanel({
  presentationId,
  slide,
  themeId,
  regenerationActive = false,
  onThemeChange,
  onDraftChange,
  onJobStarted,
}: {
  presentationId: string;
  slide: PresentationSlide;
  themeId: string;
  regenerationActive?: boolean;
  onThemeChange: (themeId: string) => void;
  onDraftChange: (spec: SlideSpec, dirty: boolean) => void;
  onJobStarted?: (jobId: string) => void;
}) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const updateMutation = useUpdateSlide();
  const projectMutation = useUpdatePresentation();
  const regenerateMutation = useRegenerateSlide();
  const initial = useMemo(() => editorDraft(slide), [slide]);
  const initialSerialized = useMemo(() => JSON.stringify(initial), [initial]);
  const [draft, setDraft] = useState<SlideSpec>(initial);
  const [saved, setSaved] = useState(initialSerialized);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localTheme, setLocalTheme] = useState(() => normalizedTheme(themeId));
  const serialized = JSON.stringify(draft);

  const themes = [
    { id: "academic_blue", label: copy.themeOcean, colors: ["#eff6ff", "#38bdf8", "#2563eb", "#172554"] },
    { id: "warm_classroom", label: copy.themeSand, colors: ["#fff7ed", "#fbbf24", "#f97316", "#7c2d12"] },
    { id: "nature", label: copy.themeForest, colors: ["#ecfdf5", "#6ee7b7", "#059669", "#064e3b"] },
    { id: "high_contrast", label: copy.themeNight, colors: ["#f8fafc", "#22d3ee", "#4f46e5", "#0f172a"] },
  ];

  const mountedRef = useRef(true);
  const savedRef = useRef(initialSerialized);
  const requestedRef = useRef(initialSerialized);
  const pendingRef = useRef(0);
  const latestRef = useRef({ draft, serialized, slide });
  const chainRef = useRef<Promise<unknown>>(Promise.resolve());
  const mutateSlideRef = useRef(updateMutation.mutateAsync);
  const onDraftChangeRef = useRef(onDraftChange);
  const onJobStartedRef = useRef(onJobStarted);
  const enqueueRef = useRef<(snapshot: typeof latestRef.current) => void>(() => undefined);

  useEffect(() => {
    mutateSlideRef.current = updateMutation.mutateAsync;
    onDraftChangeRef.current = onDraftChange;
    onJobStartedRef.current = onJobStarted;
    latestRef.current = { draft, serialized, slide };
  }, [draft, onDraftChange, onJobStarted, serialized, slide, updateMutation.mutateAsync]);

  useEffect(() => {
    enqueueRef.current = (snapshot) => {
      if (requestedRef.current === snapshot.serialized || !String(snapshot.draft.title ?? "").trim()) return;
      requestedRef.current = snapshot.serialized;
      pendingRef.current += 1;
      if (mountedRef.current) {
        setSaving(true);
        setSaveError(null);
      }
      chainRef.current = chainRef.current
        .catch(() => undefined)
        .then(async () => {
          const job = await mutateSlideRef.current({
            presentationId,
            slideKey: snapshot.slide.slide_key,
            spec: semanticPatch(snapshot.draft, snapshot.slide),
          });
          savedRef.current = snapshot.serialized;
          pendingRef.current = Math.max(0, pendingRef.current - 1);
          if (mountedRef.current) {
            setSaved(snapshot.serialized);
            setSaving(pendingRef.current > 0);
            setSaveError(null);
          }
          if (job.job_id) onJobStartedRef.current?.(job.job_id);
        })
        .catch((caught) => {
          if (requestedRef.current === snapshot.serialized) {
            requestedRef.current = savedRef.current;
          }
          pendingRef.current = Math.max(0, pendingRef.current - 1);
          if (mountedRef.current) {
            setSaving(pendingRef.current > 0);
            setSaveError(presentationErrorMessage(caught, copy, copy.saveError));
          }
        });
    };
  }, [copy, presentationId]);

  useEffect(() => {
    onDraftChangeRef.current(draft, serialized !== saved);
  }, [draft, saved, serialized]);

  useEffect(() => {
    setLocalTheme(normalizedTheme(themeId));
  }, [themeId]);

  useEffect(() => {
    if (serialized === savedRef.current || !String(draft.title ?? "").trim()) return;
    const timer = window.setTimeout(() => enqueueRef.current(latestRef.current), 800);
    return () => window.clearTimeout(timer);
  }, [draft, serialized]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (latestRef.current.serialized !== requestedRef.current) {
        enqueueRef.current(latestRef.current);
      }
    };
  }, [presentationId, slide.slide_key]);

  const set = <K extends keyof SlideSpec>(key: K, value: SlideSpec[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const changeTheme = async (nextTheme: string) => {
    const previous = localTheme;
    setLocalTheme(nextTheme);
    onThemeChange(nextTheme);
    setSaveError(null);
    try {
      const updated = await projectMutation.mutateAsync({ id: presentationId, patch: { theme_id: nextTheme } });
      const job = updated.latest_job;
      if (job && ["generate", "regenerate"].includes(job.kind ?? "")) {
        onJobStartedRef.current?.(job.job_id ?? job.id);
      }
    } catch (caught) {
      setLocalTheme(previous);
      onThemeChange(previous);
      setSaveError(presentationErrorMessage(caught, copy, copy.saveError));
    }
  };

  const rebuildSlide = async () => {
    setSaveError(null);
    try {
      const job = await regenerateMutation.mutateAsync({
        presentationId,
        slideKey: slide.slide_key,
      });
      onJobStartedRef.current?.(job.job_id);
    } catch (caught) {
      setSaveError(presentationErrorMessage(caught, copy, copy.saveError));
    }
  };

  const status = saving || projectMutation.isPending
    ? copy.saving
    : serialized === saved
      ? copy.saved
      : copy.unsaved;

  return (
    <aside className="w-full border-t border-slate-200 bg-white p-4 lg:w-80 lg:shrink-0 lg:border-l lg:border-t-0 lg:overflow-y-auto">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900">{copy.selectedSlide}</h2>
        <span aria-live="polite" className={`text-[11px] font-semibold ${saveError ? "text-rose-700" : serialized === saved ? "text-emerald-700" : "text-amber-700"}`}>{saveError || status}</span>
      </div>

      {saveError && (
        <button type="button" onClick={() => enqueueRef.current(latestRef.current)} className="mt-2 min-h-11 rounded-xl px-3 text-xs font-bold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
          {copy.retry}
        </button>
      )}
      {slide.status === "failed" && (
        <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <p className="text-sm font-bold">{copy.failedSlide}</p>
          <p className="mt-1 text-xs leading-5 text-rose-700">{copy.failedSlideHelp}</p>
          <button
            type="button"
            onClick={() => void rebuildSlide()}
            disabled={regenerateMutation.isPending || regenerationActive || saving}
            className="mt-3 min-h-11 w-full rounded-xl bg-rose-700 px-4 text-sm font-bold text-white transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:opacity-45"
          >
            {regenerateMutation.isPending || regenerationActive ? copy.regenerating : copy.retryFailedSlide}
          </button>
        </div>
      )}

      <fieldset disabled={regenerationActive} className="mt-5 space-y-5 disabled:opacity-65">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{copy.theme}</p>
          <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label={copy.theme}>
            {themes.map((theme) => {
              const selected = localTheme === theme.id;
              return (
                <label
                  key={theme.id}
                  className={`relative min-h-20 cursor-pointer rounded-2xl border p-2.5 transition focus-within:outline-none focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-1 ${
                    selected
                      ? "border-slate-900 bg-slate-50 shadow-sm ring-1 ring-slate-900"
                      : "border-slate-200 bg-white hover:border-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="classic-slide-theme"
                    value={theme.id}
                    checked={selected}
                    onChange={() => void changeTheme(theme.id)}
                    className="sr-only"
                  />
                  <span className="flex h-7 overflow-hidden rounded-lg border border-black/5" aria-hidden="true">
                    {theme.colors.map((color) => (
                      <span key={color} className="flex-1" style={{ backgroundColor: color }} />
                    ))}
                  </span>
                  <span className="mt-2 flex items-center justify-between gap-2 text-xs font-bold text-slate-800">
                    {theme.label}
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-transparent"}`} aria-hidden="true">✓</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <label htmlFor="classic-slide-title" className="text-xs font-bold uppercase tracking-wide text-slate-500">{copy.slideTitle}</label>
          <input id="classic-slide-title" value={String(draft.title ?? "")} onChange={(event) => set("title", event.target.value)} aria-invalid={!String(draft.title ?? "").trim()} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="classic-slide-body" className="text-xs font-bold uppercase tracking-wide text-slate-500">{copy.body}</label>
          <textarea id="classic-slide-body" rows={6} value={String(draft.body ?? "")} onChange={(event) => set("body", event.target.value)} className={`${fieldClass} resize-y`} />
        </div>
        <div>
          <label htmlFor="classic-slide-bullets" className="text-xs font-bold uppercase tracking-wide text-slate-500">{copy.bullets}</label>
          <textarea id="classic-slide-bullets" rows={5} value={Array.isArray(draft.bullets) ? draft.bullets.join("\n") : ""} onChange={(event) => set("bullets", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} className={`${fieldClass} resize-y`} />
        </div>
      </fieldset>
      {slide.status !== "failed" && (
        <button
          type="button"
          onClick={() => void rebuildSlide()}
          disabled={regenerateMutation.isPending || regenerationActive || saving}
          className="mt-5 min-h-12 w-full rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-900 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-45"
        >
          {regenerateMutation.isPending || regenerationActive ? copy.regenerating : copy.rebuildSlide}
        </button>
      )}
    </aside>
  );
}
