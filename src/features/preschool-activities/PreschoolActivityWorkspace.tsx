"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useTokens } from "@/hooks/useTokens";
import { useLanguage } from "@/i18n/LanguageContext";
import type { GenerationJob, GenerationJobStatus } from "@/lib/api";
import {
  CONTENT_LANGUAGE_OPTIONS,
  tryNormalizeContentLanguage,
  type ContentLanguage,
} from "@/lib/content-languages";
import { saveBlob } from "@/lib/generation-download";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { preschoolActivityApi, PRESCHOOL_JOB_KINDS } from "./api";
import { preschoolActivityCopy } from "./copy";
import { preschoolDocumentCopy } from "./document-copy";
import {
  areasForAge,
  defaultPreschoolInput,
  documentFromJobResult,
  isPreschoolDocument,
  localizedPreschoolLabel,
  MAX_PRESCHOOL_INTEGRATED_AREAS,
  MAX_PRESCHOOL_STYLES,
  normalizePreschoolInput,
  safePreschoolFileName,
  taskBuilderPrompt,
  taskIntegrationHref,
  taskVisualPrompt,
  topicsFromJobResult,
  validatePreschoolInput,
  type PreschoolValidationIssue,
} from "./model";
import type {
  PreschoolActivityDocument,
  PreschoolActivityInput,
  PreschoolActivitySummary,
  PreschoolConfig,
  PreschoolGroupCount,
  PreschoolPhase,
  PreschoolTask,
  PreschoolTaskAction,
} from "./types";

type View = "create" | "history" | "document";
type PendingKind = "generate" | "topics" | "task" | "unknown";
type PendingOperation = {
  id: string;
  kind: PendingKind;
  taskId?: string;
};
type Copy = (typeof preschoolActivityCopy)[keyof typeof preschoolActivityCopy];

const SOURCE_PATH = "/dashboard/ai/preschool-activities";
const ACTIVE_STATUSES = new Set<GenerationJobStatus>(["queued", "running", "settling", "refunding"]);
const TASK_ACTIONS: PreschoolTaskAction[] = [
  "regenerate",
  "more_interesting",
  "simplify",
  "complicate",
  "convert_to_steam",
  "other",
];

function useDialogAccessibility(onClose: () => void, closeEnabled = true) {
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const closeEnabledRef = useRef(closeEnabled);

  useEffect(() => {
    onCloseRef.current = onClose;
    closeEnabledRef.current = closeEnabled;
  }, [closeEnabled, onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeEnabledRef.current) {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return dialogRef;
}

function pendingKind(jobKind: string): PendingKind {
  if (jobKind === PRESCHOOL_JOB_KINDS.generate) return "generate";
  if (jobKind === PRESCHOOL_JOB_KINDS.topics) return "topics";
  if (jobKind === PRESCHOOL_JOB_KINDS.task) return "task";
  return "unknown";
}

function Field({ label, labelFor, hint, children, wide = false }: { label: string; labelFor?: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        {labelFor
          ? <label htmlFor={labelFor} className="text-sm font-bold text-slate-800">{label}</label>
          : <p className="text-sm font-bold text-slate-800">{label}</p>}
        {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

const inputClass = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function ToggleCard({ checked, disabled, title, hint, onChange }: {
  checked: boolean;
  disabled: boolean;
  title: string;
  hint: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex cursor-pointer gap-3 rounded-2xl border p-3.5 transition ${checked ? "border-emerald-300 bg-emerald-50/80" : "border-slate-200 bg-white hover:border-slate-300"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
      />
      <span>
        <span className="block text-sm font-bold text-slate-900">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{hint}</span>
      </span>
    </label>
  );
}

function FormView({
  copy,
  interfaceLanguage,
  config,
  input,
  setInput,
  season,
  setSeason,
  busy,
  pendingKind: currentPendingKind,
  balance,
  error,
  onSubmit,
  onTopics,
}: {
  copy: Copy;
  interfaceLanguage: "ru" | "kk";
  config: PreschoolConfig;
  input: PreschoolActivityInput;
  setInput: React.Dispatch<React.SetStateAction<PreschoolActivityInput>>;
  season: string;
  setSeason: (value: string) => void;
  busy: boolean;
  pendingKind: PendingKind | null;
  balance: number | null;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTopics: () => void;
}) {
  const availableAreas = areasForAge(config.activity_areas, input.age);
  const durationIsCustom = !config.duration_options.includes(input.duration_minutes);
  const insufficient = balance !== null && balance < config.token_cost;
  const invalidGroupCount = input.group_count > input.children_count;
  const [goalMode, setGoalMode] = useState<"ai" | "own">(input.goal.trim() ? "own" : "ai");
  const [characterMode, setCharacterMode] = useState<"ai" | "own">(input.story_character.trim() ? "own" : "ai");
  const update = <K extends keyof PreschoolActivityInput>(key: K, value: PreschoolActivityInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
  };
  const toggleArray = (key: "styles" | "integrated_areas" | "support_needs", value: string) => {
    setInput((current) => {
      const selected = current[key];
      const limit = key === "integrated_areas"
        ? MAX_PRESCHOOL_INTEGRATED_AREAS
        : key === "styles"
          ? MAX_PRESCHOOL_STYLES
          : Number.POSITIVE_INFINITY;
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : selected.length < limit
          ? [...selected, value]
          : selected;
      return {
        ...current,
        [key]: next,
        ...(key === "support_needs" && value === "other" && !next.includes("other")
          ? { custom_support_need: "" }
          : {}),
      };
    });
  };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[28px] border border-white bg-[linear-gradient(135deg,#fff_0%,#f0fdf4_48%,#fff7ed_100%)] px-5 py-7 shadow-sm sm:px-8 sm:py-9">
        <div aria-hidden="true" className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">{copy.badge}</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">{copy.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{copy.subtitle}</p>
        </div>
      </header>

      {error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</div> : null}
      {busy ? (
        <div aria-live="polite" className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sky-950">
          <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-sky-600 border-r-transparent" />
          <div>
            <p className="text-sm font-bold">{currentPendingKind === "topics" ? copy.topicsLoading : copy.loading}</p>
            <p className="mt-0.5 text-xs leading-5 text-sky-800">{copy.loadingHint}</p>
          </div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,0.75fr)]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/90 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600">01</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{copy.formTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">{copy.formHint}</p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={copy.organization} labelFor="preschool-organization" hint={copy.optional} wide>
                <input id="preschool-organization" className={inputClass} value={input.organization} onChange={(event) => update("organization", event.target.value)} placeholder={copy.organizationPlaceholder} disabled={busy} />
              </Field>
              <Field label={copy.teacher} labelFor="preschool-teacher">
                <input id="preschool-teacher" className={inputClass} value={input.teacher_name} onChange={(event) => update("teacher_name", event.target.value)} placeholder={copy.teacherPlaceholder} disabled={busy} />
              </Field>
              <Field label={copy.language} labelFor="preschool-language">
                <select id="preschool-language" className={inputClass} value={input.language} onChange={(event) => {
                  const nextLanguage = event.target.value as ContentLanguage;
                  const selectedGroup = config.age_groups.find((item) => item.id === input.group_id);
                  setInput((current) => ({
                    ...current,
                    language: nextLanguage,
                    group_name: selectedGroup ? localizedPreschoolLabel(selectedGroup.label, nextLanguage, interfaceLanguage) : current.group_name,
                  }));
                }} disabled={busy}>
                  {CONTENT_LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <Field label={copy.group} labelFor="preschool-group">
                <select
                  id="preschool-group"
                  className={inputClass}
                  value={input.group_id}
                  disabled={busy}
                  onChange={(event) => {
                    const group = config.age_groups.find((item) => item.id === event.target.value);
                    const nextAge = group?.age ?? input.age;
                    const nextAreas = areasForAge(config.activity_areas, nextAge);
                    setInput((current) => ({
                      ...current,
                      group_id: event.target.value,
                      age: nextAge,
                      group_name: group ? localizedPreschoolLabel(group.label, current.language, interfaceLanguage) : current.group_name,
                      activity_type: nextAreas.some((item) => item.id === current.activity_type) ? current.activity_type : (nextAreas[0]?.id ?? ""),
                      integrated_areas: current.integrated_areas.filter((id) => nextAreas.some((item) => item.id === id)),
                    }));
                  }}
                >
                  <option value="">—</option>
                  {config.age_groups.map((group) => <option key={group.id} value={group.id}>{localizedPreschoolLabel(group.label, input.language, interfaceLanguage)}</option>)}
                </select>
              </Field>
              <Field label={copy.age}>
                <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-bold text-slate-700">
                  {input.age} {copy.years}
                  <span className="ml-auto text-xs font-normal text-slate-400">auto</span>
                </div>
              </Field>
              <Field label={copy.groupName} labelFor="preschool-group-name">
                <input id="preschool-group-name" className={inputClass} value={input.group_name} onChange={(event) => update("group_name", event.target.value)} placeholder={copy.groupNamePlaceholder} disabled={busy} />
              </Field>
              <Field label={copy.activity} labelFor="preschool-activity">
                <select
                  id="preschool-activity"
                  className={inputClass}
                  value={input.activity_type}
                  onChange={(event) => {
                    const next = event.target.value;
                    setInput((current) => ({ ...current, activity_type: next, integrated_areas: current.integrated_areas.filter((id) => id !== next) }));
                  }}
                  disabled={busy}
                >
                  <option value="">—</option>
                  {availableAreas.map((area) => <option key={area.id} value={area.id}>{localizedPreschoolLabel(area.label, input.language, interfaceLanguage)}</option>)}
                </select>
              </Field>
              <Field label={copy.topic} labelFor="preschool-topic" wide>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input id="preschool-topic" className={inputClass} value={input.topic} onChange={(event) => update("topic", event.target.value)} placeholder={copy.topicPlaceholder} disabled={busy} />
                  <button
                    type="button"
                    onClick={onTopics}
                    disabled={busy || !input.group_id || !input.activity_type}
                    className="min-h-11 shrink-0 rounded-xl border border-emerald-600 bg-white px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ✦ {copy.suggestTopics}
                  </button>
                </div>
              </Field>
              <Field label={copy.season} labelFor="preschool-season" hint={copy.optional}>
                <input id="preschool-season" className={inputClass} value={season} onChange={(event) => setSeason(event.target.value)} placeholder={copy.seasonPlaceholder} disabled={busy} />
              </Field>
              <Field label={copy.goal}>
                <div role="group" aria-label={copy.goal} className="grid grid-cols-2 gap-2">
                  <button type="button" aria-pressed={goalMode === "ai"} disabled={busy} onClick={() => { setGoalMode("ai"); update("goal", ""); }} className={`min-h-11 rounded-xl border px-3 text-xs font-bold transition ${goalMode === "ai" ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{copy.goalAi}</button>
                  <button type="button" aria-pressed={goalMode === "own"} disabled={busy} onClick={() => setGoalMode("own")} className={`min-h-11 rounded-xl border px-3 text-xs font-bold transition ${goalMode === "own" ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{copy.goalOwn}</button>
                </div>
                {goalMode === "own" ? <textarea aria-label={copy.goal} className={`${inputClass} mt-2 min-h-24 resize-y`} value={input.goal} onChange={(event) => update("goal", event.target.value)} placeholder={copy.goalPlaceholder} disabled={busy} /> : null}
              </Field>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="text-sm font-bold text-slate-800">{copy.integrated}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{copy.integratedHint}</p>
              <p className="mt-1 text-xs font-bold text-emerald-700">{copy.integratedLimit} · {input.integrated_areas.length}/{MAX_PRESCHOOL_INTEGRATED_AREAS}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableAreas.filter((area) => area.id !== input.activity_type).map((area) => {
                  const active = input.integrated_areas.includes(area.id);
                  const disabledByLimit = !active && input.integrated_areas.length >= MAX_PRESCHOOL_INTEGRATED_AREAS;
                  return (
                    <button key={area.id} type="button" aria-pressed={active} disabled={busy || disabledByLimit} title={disabledByLimit ? copy.integratedLimit : undefined} onClick={() => toggleArray("integrated_areas", area.id)} className={`min-h-10 rounded-full border px-3.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${active ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300"}`}>
                      {localizedPreschoolLabel(area.label, input.language, interfaceLanguage)}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/90 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-600">02</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{copy.setupTitle}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Field label={copy.duration} labelFor="preschool-duration">
                <select
                  id="preschool-duration"
                  className={inputClass}
                  value={durationIsCustom ? "custom" : input.duration_minutes}
                  onChange={(event) => update("duration_minutes", event.target.value === "custom" ? 35 : Number(event.target.value))}
                  disabled={busy}
                >
                  {config.duration_options.map((value) => <option key={value} value={value}>{value} {copy.minutes}</option>)}
                  <option value="custom">{interfaceLanguage === "kk" ? "Өз уақытым" : "Своё время"}</option>
                </select>
                {durationIsCustom ? <input type="number" aria-label={copy.duration} min={10} max={90} value={input.duration_minutes} onChange={(event) => update("duration_minutes", Number(event.target.value))} className={`${inputClass} mt-2`} disabled={busy} /> : null}
              </Field>
              <Field label={copy.children} labelFor="preschool-children">
                <input id="preschool-children" type="number" min={1} max={60} className={inputClass} value={input.children_count} onChange={(event) => update("children_count", Number(event.target.value))} disabled={busy} />
              </Field>
              <Field label={copy.groupDivision} labelFor="preschool-group-count">
                <select id="preschool-group-count" className={`${inputClass} ${invalidGroupCount ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : ""}`} aria-invalid={invalidGroupCount} aria-describedby="preschool-group-count-hint" value={input.group_count} onChange={(event) => update("group_count", Number(event.target.value) as PreschoolGroupCount)} disabled={busy}>
                  <option value={1}>{copy.noDivision}</option>
                  <option value={2} disabled={input.children_count < 2}>{copy.twoGroups}</option>
                  <option value={3} disabled={input.children_count < 3}>{copy.threeGroups}</option>
                  <option value={4} disabled={input.children_count < 4}>{copy.fourGroups}</option>
                </select>
                <p id="preschool-group-count-hint" className={`mt-1.5 text-xs leading-5 ${invalidGroupCount ? "font-bold text-rose-700" : "text-slate-500"}`}>{copy.groupCountHint}</p>
              </Field>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(["full", "short"] as const).map((format) => {
                const active = input.output_format === format;
                return (
                  <button key={format} type="button" aria-pressed={active} onClick={() => update("output_format", format)} disabled={busy} className={`rounded-2xl border p-4 text-left transition ${active ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"}`}>
                    <span className="block text-sm font-black text-slate-900">{format === "full" ? copy.full : copy.short}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{format === "full" ? copy.fullHint : copy.shortHint}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5">
              <p className="text-sm font-bold text-slate-800">{copy.style}</p>
              <p className="mt-1 text-xs text-slate-500">{copy.styleHint}</p>
              <p className="mt-1 text-xs font-bold text-amber-700">{copy.styleLimit} · {input.styles.length}/{MAX_PRESCHOOL_STYLES}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {config.styles.map((style) => {
                  const active = input.styles.includes(style.id);
                  const disabledByLimit = !active && input.styles.length >= MAX_PRESCHOOL_STYLES;
                  return (
                    <button key={style.id} type="button" aria-pressed={active} onClick={() => toggleArray("styles", style.id)} disabled={busy || disabledByLimit} title={disabledByLimit ? copy.styleLimit : undefined} className={`min-h-10 rounded-full border px-3.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${active ? "border-amber-500 bg-amber-500 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-300"}`}>
                      {localizedPreschoolLabel(style.label, input.language, interfaceLanguage)}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/90 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-600">03</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{copy.enhancementsTitle}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ToggleCard checked={input.wow_enabled} disabled={busy} title={copy.wow} hint={copy.wowHint} onChange={(value) => update("wow_enabled", value)} />
              <ToggleCard checked={input.national_values} disabled={busy} title={copy.national} hint={copy.nationalHint} onChange={(value) => update("national_values", value)} />
              <ToggleCard checked={input.inclusive_enabled} disabled={busy} title={copy.inclusion} hint={copy.inclusionHint} onChange={(value) => setInput((current) => ({
                ...current,
                inclusive_enabled: value,
                support_needs: value ? current.support_needs : [],
                custom_support_need: value ? current.custom_support_need : "",
              }))} />
              <ToggleCard checked={input.teacher_script} disabled={busy} title={copy.teacherScript} hint={copy.fullHint} onChange={(value) => update("teacher_script", value)} />
              <ToggleCard checked={input.expected_answers} disabled={busy} title={copy.expectedAnswers} hint={copy.childrenDo} onChange={(value) => update("expected_answers", value)} />
            </div>
            {input.inclusive_enabled ? (
              <div className="mt-5 rounded-2xl bg-violet-50 p-4">
                <p className="text-sm font-bold text-violet-950">{copy.supportNeeds}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {config.support_needs.map((need) => (
                    <label key={need.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-900">
                      <input type="checkbox" checked={input.support_needs.includes(need.id)} onChange={() => toggleArray("support_needs", need.id)} disabled={busy} className="accent-violet-600" />
                      {localizedPreschoolLabel(need.label, input.language, interfaceLanguage)}
                    </label>
                  ))}
                </div>
                {input.support_needs.includes("other") ? <input className={`${inputClass} mt-3`} value={input.custom_support_need} onChange={(event) => update("custom_support_need", event.target.value)} placeholder={copy.supportPlaceholder} disabled={busy} /> : null}
              </div>
            ) : null}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={copy.character}>
                <div role="group" aria-label={copy.character} className="grid grid-cols-2 gap-2">
                  <button type="button" aria-pressed={characterMode === "ai"} disabled={busy} onClick={() => { setCharacterMode("ai"); update("story_character", ""); }} className={`min-h-11 rounded-xl border px-3 text-xs font-bold transition ${characterMode === "ai" ? "border-violet-500 bg-violet-50 text-violet-800 ring-2 ring-violet-100" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{copy.characterAi}</button>
                  <button type="button" aria-pressed={characterMode === "own"} disabled={busy} onClick={() => setCharacterMode("own")} className={`min-h-11 rounded-xl border px-3 text-xs font-bold transition ${characterMode === "own" ? "border-violet-500 bg-violet-50 text-violet-800 ring-2 ring-violet-100" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{copy.characterOwn}</button>
                </div>
                {characterMode === "own" ? <input aria-label={copy.character} className={`${inputClass} mt-2`} value={input.story_character} onChange={(event) => update("story_character", event.target.value)} placeholder={copy.characterPlaceholder} disabled={busy} /> : null}
              </Field>
              <Field label={copy.notes} labelFor="preschool-notes" hint={copy.optional}>
                <textarea id="preschool-notes" className={`${inputClass} min-h-24 resize-y`} value={input.notes} onChange={(event) => update("notes", event.target.value)} placeholder={copy.notesPlaceholder} disabled={busy} />
              </Field>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-white/90 bg-white p-5 shadow-sm xl:sticky xl:top-24">
          <div className="rounded-2xl bg-[linear-gradient(135deg,#064e3b,#047857)] p-5 text-white">
            <div className="text-3xl" aria-hidden>🧩</div>
            <h2 className="mt-3 text-lg font-black">{input.topic.trim() || copy.emptyTitle}</h2>
            <p className="mt-2 text-xs leading-5 text-emerald-100">{copy.emptyHint}</p>
            <dl className="mt-5 space-y-2 border-t border-white/15 pt-4 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-emerald-100">{copy.duration}</dt><dd className="font-bold">{input.duration_minutes} {copy.minutes}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-emerald-100">{copy.children}</dt><dd className="font-bold">{input.children_count}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-emerald-100">{copy.output}</dt><dd className="text-right font-bold">{input.output_format === "full" ? copy.full : copy.short}</dd></div>
            </dl>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between gap-3"><span className="text-slate-500">{copy.balance}</span><strong>{balance ?? "—"} {copy.tokens}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">{copy.cost}</span><strong>{config.token_cost} {copy.tokens}</strong></div>
          </div>
          {insufficient ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{copy.noTokens}</p> : null}
          <button type="submit" disabled={busy || insufficient} className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300">
            {busy && currentPendingKind === "generate" ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" /> : <span>✦</span>}
            {copy.generate}
          </button>
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">{config.regulatory_notes?.[input.language] || copy.regulatory}</p>
        </aside>
      </form>
    </div>
  );
}

function HistoryView({
  copy,
  config,
  language,
  items,
  total,
  loading,
  error,
  search,
  setSearch,
  onOpen,
  onAdapt,
  onLoadMore,
}: {
  copy: Copy;
  config: PreschoolConfig;
  language: "ru" | "kk";
  items: PreschoolActivitySummary[];
  total: number;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  onOpen: (id: string) => void;
  onAdapt: (item: PreschoolActivitySummary) => void;
  onLoadMore: () => void;
}) {
  const query = search.trim().toLocaleLowerCase();
  const filtered = items.filter((item) => `${item.title ?? ""} ${item.topic} ${item.group_name}`.toLocaleLowerCase().includes(query));
  const groupLabel = (item: PreschoolActivitySummary) => {
    const group = config.age_groups.find((entry) => entry.id === item.group_id);
    return group ? localizedPreschoolLabel(group.label, item.language, language) : item.group_name;
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">{copy.historyBreadcrumb}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{copy.historyTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{copy.historyHint}</p>
        <label className="mt-5 block max-w-xl">
          <span className="sr-only">{copy.historySearch}</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.historySearch} className={inputClass} />
        </label>
      </header>
      {error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
      {loading && items.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label={copy.configLoading}>
          {[0, 1, 2].map((value) => <div key={value} className="h-52 animate-pulse rounded-3xl bg-white/70" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/55 px-6 py-14 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-2xl">🧩</div>
          <h2 className="mt-4 font-black text-slate-900">{query ? copy.noResults : copy.historyEmpty}</h2>
          {!query ? <p className="mt-2 text-sm text-slate-500">{copy.historyEmptyHint}</p> : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-3xl border border-white bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <button type="button" onClick={() => onOpen(item.id)} className="block w-full p-5 text-left">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">{groupLabel(item)} · {item.age} {copy.years}</span>
                  <span className="text-xs font-bold text-slate-400">{item.duration_minutes} {copy.minutes}</span>
                </div>
                <h2 className="mt-4 line-clamp-2 min-h-14 text-lg font-black leading-7 text-slate-950">{item.title || item.topic}</h2>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{item.topic}</p>
                <p className="mt-4 text-xs text-slate-400">{new Intl.DateTimeFormat(language === "kk" ? "kk-KZ" : "ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(item.updated_at))}</p>
              </button>
              <div className="flex gap-2 border-t border-slate-100 p-3">
                <button type="button" onClick={() => onOpen(item.id)} className="min-h-10 flex-1 rounded-xl bg-slate-950 px-4 text-xs font-black text-white hover:bg-emerald-700">{copy.open}</button>
                <button type="button" onClick={() => onAdapt(item)} className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 hover:bg-slate-50">{copy.adapt}</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {items.length < total ? <button type="button" onClick={onLoadMore} disabled={loading} className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 disabled:opacity-50">{copy.loadMore}</button> : null}
    </div>
  );
}

function NumberedList({ items, accent = "emerald" }: { items: string[]; accent?: "emerald" | "amber" }) {
  return (
    <ol className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-700">
          <span className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black ${accent === "emerald" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{index + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function DetailBlock({ title, children, tone = "slate" }: { title: string; children: ReactNode; tone?: "slate" | "emerald" | "amber" | "sky" | "violet" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50/70",
    emerald: "border-emerald-200 bg-emerald-50/70",
    amber: "border-amber-200 bg-amber-50/70",
    sky: "border-sky-200 bg-sky-50/70",
    violet: "border-violet-200 bg-violet-50/70",
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <h4 className="text-xs font-black uppercase tracking-[0.1em] text-slate-600">{title}</h4>
      <div className="mt-2 text-sm leading-6 text-slate-700">{children}</div>
    </div>
  );
}

function TaskCard({
  copy,
  task,
  document,
  busy,
  locked,
  selectedAction,
  customInstruction,
  onActionChange,
  onInstructionChange,
  onTransform,
}: {
  copy: Copy;
  task: PreschoolTask;
  document: PreschoolActivityDocument;
  busy: boolean;
  locked: boolean;
  selectedAction: PreschoolTaskAction;
  customInstruction: string;
  onActionChange: (action: PreschoolTaskAction) => void;
  onInstructionChange: (value: string) => void;
  onTransform: () => void;
}) {
  const language = tryNormalizeContentLanguage(document.language) ?? "kk";
  const documentCopy = preschoolDocumentCopy[language];
  const visualPrompt = taskVisualPrompt(task);
  const builderPrompt = taskBuilderPrompt(task, language);
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">{documentCopy.childrenDo}</p>
          <h3 className="mt-1 text-lg font-black leading-6 text-slate-950">{task.title}</h3>
        </div>
        {busy ? <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700"><span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-600 border-r-transparent" />{copy.taskLoading}</span> : null}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <DetailBlock title={documentCopy.taskPurpose} tone="emerald">{task.purpose}</DetailBlock>
        <DetailBlock title={documentCopy.materials}>{task.materials.length > 0 ? task.materials.join(" · ") : "—"}</DetailBlock>
        <DetailBlock title={documentCopy.teacherAction}>{task.teacher_action}</DetailBlock>
        <DetailBlock title={documentCopy.childAction} tone="amber"><strong>{task.children_action}</strong></DetailBlock>
      </div>
      {task.steps.length > 0 ? <div className="mt-3"><DetailBlock title={documentCopy.execution} tone="sky"><NumberedList items={task.steps} /></DetailBlock></div> : null}
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <DetailBlock title={documentCopy.taskResult} tone="emerald">{task.result}</DetailBlock>
        {task.safety ? <DetailBlock title={documentCopy.safety} tone="amber">{task.safety}</DetailBlock> : null}
        {task.inclusion_support && task.inclusion_support.length > 0 ? <DetailBlock title={documentCopy.inclusion} tone="violet"><NumberedList items={task.inclusion_support} /></DetailBlock> : null}
      </div>
      {task.experiment ? (
        <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
          <h4 className="text-xs font-black uppercase tracking-[0.1em] text-cyan-800">{documentCopy.experiment}</h4>
          <dl className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div><dt className="font-black text-cyan-900">{documentCopy.experimentNeed}</dt><dd className="mt-1"><NumberedList items={task.experiment.need} /></dd></div>
            <div><dt className="font-black text-cyan-900">{documentCopy.experimentDo}</dt><dd className="mt-1"><NumberedList items={task.experiment.do} /></dd></div>
            <div><dt className="font-black text-cyan-900">{documentCopy.experimentObserve}</dt><dd className="mt-1 leading-6">{task.experiment.observe}</dd></div>
            <div><dt className="font-black text-cyan-900">{documentCopy.experimentConclusion}</dt><dd className="mt-1 leading-6">{task.experiment.conclusion}</dd></div>
          </dl>
        </div>
      ) : null}
      {task.steam ? (
        <div className="mt-3 rounded-2xl bg-slate-950 p-4 text-white">
          <h4 className="text-xs font-black uppercase tracking-[0.14em] text-emerald-300">{documentCopy.steam}</h4>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            {([
              ["problem", documentCopy.steamProblem],
              ["child_choice", documentCopy.steamChoice],
              ["build", documentCopy.steamBuild],
              ["test", documentCopy.steamTest],
              ["improve", documentCopy.steamImprove],
            ] as const).map(([key, label]) => <div key={key} className="rounded-xl bg-white/8 p-3"><p className="text-[10px] font-black uppercase text-emerald-300">{label}</p><p className="mt-1 leading-5 text-slate-200">{task.steam?.[key]}</p></div>)}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Link href={taskIntegrationHref("visual", visualPrompt, language)} className="inline-flex min-h-10 items-center rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-black text-violet-700 hover:bg-violet-100">🎨 {copy.visual}</Link>
        {task.video_query ? <Link href={taskIntegrationHref("video", task.video_query, language)} className="inline-flex min-h-10 items-center rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-black text-sky-700 hover:bg-sky-100">🎬 {copy.video}</Link> : null}
        <Link href={taskIntegrationHref("builder", builderPrompt, language)} className="inline-flex min-h-10 items-center rounded-xl border border-orange-200 bg-orange-50 px-3 text-xs font-black text-orange-700 hover:bg-orange-100">✦ {copy.vibe}</Link>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-black text-slate-700">{copy.changeTask}</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <select value={selectedAction} onChange={(event) => onActionChange(event.target.value as PreschoolTaskAction)} disabled={locked} className={`${inputClass} sm:max-w-xs`} aria-label={copy.changeTask}>
            {TASK_ACTIONS.map((action) => <option key={action} value={action}>{copy.taskActions[action]}</option>)}
          </select>
          <button type="button" onClick={onTransform} disabled={locked || (selectedAction === "other" && customInstruction.trim().length < 3)} className="min-h-11 shrink-0 rounded-xl bg-slate-950 px-4 text-xs font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">{copy.apply}</button>
        </div>
        {selectedAction === "other" ? <textarea value={customInstruction} onChange={(event) => onInstructionChange(event.target.value)} placeholder={copy.customInstructionPlaceholder} aria-label={copy.customInstruction} disabled={locked} className={`${inputClass} mt-2 min-h-20 resize-y`} /> : null}
      </div>
    </article>
  );
}

function PhaseCard({
  copy,
  phase,
  index,
  document,
  pendingTaskId,
  transformLocked,
  actions,
  instructions,
  onActionChange,
  onInstructionChange,
  onTransform,
}: {
  copy: Copy;
  phase: PreschoolPhase;
  index: number;
  document: PreschoolActivityDocument;
  pendingTaskId?: string;
  transformLocked: boolean;
  actions: Record<string, PreschoolTaskAction>;
  instructions: Record<string, string>;
  onActionChange: (taskId: string, action: PreschoolTaskAction) => void;
  onInstructionChange: (taskId: string, value: string) => void;
  onTransform: (task: PreschoolTask) => void;
}) {
  const contentLanguage = tryNormalizeContentLanguage(document.language) ?? "kk";
  const documentCopy = preschoolDocumentCopy[contentLanguage];
  return (
    <section className="relative pl-8 sm:pl-12">
      <div className="absolute bottom-0 left-[13px] top-8 w-px bg-slate-200 sm:left-[21px]" aria-hidden />
      <div className="absolute left-0 top-0 grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-xs font-black text-white shadow-sm sm:h-11 sm:w-11 sm:text-sm">{index + 1}</div>
      <div className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">{documentCopy.phase} {index + 1}</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{phase.title}</h2>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">⏱ {phase.duration_minutes} {documentCopy.minutes}</span>
        </div>
        {phase.narrative ? <p className="mt-3 text-sm leading-6 text-slate-600">{phase.narrative}</p> : null}
        {(phase.teacher_script.length > 0 || phase.children_actions.length > 0 || phase.expected_answers.length > 0) ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {phase.teacher_script.length > 0 ? <DetailBlock title={documentCopy.teacherSays}><NumberedList items={phase.teacher_script} /></DetailBlock> : null}
            {phase.children_actions.length > 0 ? <DetailBlock title={documentCopy.childrenDo} tone="amber"><NumberedList items={phase.children_actions} accent="amber" /></DetailBlock> : null}
            {phase.expected_answers.length > 0 ? <DetailBlock title={documentCopy.answers} tone="sky"><NumberedList items={phase.expected_answers} /></DetailBlock> : null}
          </div>
        ) : null}
        {phase.tasks.length > 0 ? (
          <div className="mt-5 space-y-4">
            {phase.tasks.map((task) => <TaskCard key={task.id} copy={copy} task={task} document={document} busy={pendingTaskId === task.id} locked={transformLocked} selectedAction={actions[task.id] ?? "more_interesting"} customInstruction={instructions[task.id] ?? ""} onActionChange={(action) => onActionChange(task.id, action)} onInstructionChange={(value) => onInstructionChange(task.id, value)} onTransform={() => onTransform(task)} />)}
          </div>
        ) : null}
        {phase.reflection ? <div className="mt-4 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4 text-sm leading-6 text-fuchsia-950"><span className="font-black">{documentCopy.reflection} · </span>{phase.reflection}</div> : null}
      </div>
    </section>
  );
}

function DocumentView({
  copy,
  language,
  config,
  document,
  pendingTaskId,
  transformLocked,
  error,
  downloading,
  actions,
  instructions,
  onActionChange,
  onInstructionChange,
  onTransform,
  onBack,
  onAdapt,
  onExport,
  onOpenVisuals,
}: {
  copy: Copy;
  language: "ru" | "kk";
  config: PreschoolConfig;
  document: PreschoolActivityDocument;
  pendingTaskId?: string;
  transformLocked: boolean;
  error: string | null;
  downloading: "docx" | "pdf" | null;
  actions: Record<string, PreschoolTaskAction>;
  instructions: Record<string, string>;
  onActionChange: (taskId: string, action: PreschoolTaskAction) => void;
  onInstructionChange: (taskId: string, value: string) => void;
  onTransform: (task: PreschoolTask) => void;
  onBack: () => void;
  onAdapt: () => void;
  onExport: (format: "docx" | "pdf") => void;
  onOpenVisuals: () => void;
}) {
  const contentLanguage = tryNormalizeContentLanguage(document.language) ?? "kk";
  const documentCopy = preschoolDocumentCopy[contentLanguage];
  const area = config.activity_areas.find((item) => item.id === document.activity_type);
  const group = config.age_groups.find((item) => item.id === document.group_id);
  const integratedAreas = document.integrated_areas
    .map((id) => config.activity_areas.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const integratedAreaLabels = document.integrated_area_labels?.filter(Boolean)
    ?? integratedAreas.map((item) => localizedPreschoolLabel(item.label, contentLanguage, language));
  const visualCount = document.content.phases.flatMap((phase) => phase.tasks).length;
  const resourceQuantity = (quantity?: number | null, unit?: string | null) => quantity
    ? `${quantity}${unit ? ` ${unit}` : ""}`
    : (unit || "");

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#fdfbf7]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <button type="button" onClick={onBack} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50">← {copy.back}</button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="hidden text-xs font-bold text-emerald-700 md:inline">✓ {copy.autoSaved}</span>
          {visualCount > 0 ? <button type="button" onClick={onOpenVisuals} className="min-h-10 rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-black text-violet-700 hover:bg-violet-100">🎨 {copy.allVisuals} · {visualCount}</button> : null}
          <button type="button" onClick={onAdapt} disabled={transformLocked} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50">{copy.adapt}</button>
          <button type="button" onClick={() => onExport("docx")} disabled={Boolean(downloading) || transformLocked} className="min-h-10 rounded-xl bg-emerald-700 px-3 text-xs font-black text-white disabled:opacity-50">{downloading === "docx" ? copy.downloading : copy.word}</button>
          <button type="button" onClick={() => onExport("pdf")} disabled={Boolean(downloading) || transformLocked} className="min-h-10 rounded-xl bg-slate-950 px-3 text-xs font-black text-white disabled:opacity-50">{downloading === "pdf" ? copy.downloading : copy.pdf}</button>
        </div>
      </div>
      {error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}

      <article className="rounded-[30px] border border-white bg-white p-5 shadow-sm sm:p-8">
        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">{group ? localizedPreschoolLabel(group.label, contentLanguage, language) : document.group_name} · {document.age} {documentCopy.years}</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{document.activity_type_label || (area ? localizedPreschoolLabel(area.label, contentLanguage, language) : "—")}</span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-800">{document.duration_minutes} {documentCopy.minutes} · {document.children_count} {documentCopy.children}</span>
            {(document.style_labels ?? document.styles.map((id) => {
              const style = config.styles.find((item) => item.id === id);
              return style ? localizedPreschoolLabel(style.label, contentLanguage, language) : "";
            }).filter(Boolean)).map((label, index) => <span key={`${label}-${index}`} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-800">{label}</span>)}
          </div>
          <h1 className="mt-4 max-w-5xl text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">{document.content.title}</h1>
          <p className="mt-2 text-base font-semibold text-emerald-700">{document.topic}</p>
          <dl className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            {document.organization ? <div><dt className="inline font-black text-slate-800">{documentCopy.organization}: </dt><dd className="inline">{document.organization}</dd></div> : null}
            <div><dt className="inline font-black text-slate-800">{documentCopy.teacher}: </dt><dd className="inline">{document.teacher_name}</dd></div>
            <div><dt className="inline font-black text-slate-800">{documentCopy.group}: </dt><dd className="inline">{document.group_name}</dd></div>
            <div><dt className="inline font-black text-slate-800">{documentCopy.totalTime}: </dt><dd className="inline">{document.content.total_duration_minutes} {documentCopy.minutes}</dd></div>
            {integratedAreaLabels.length > 0 ? <div className="sm:col-span-2"><dt className="inline font-black text-slate-800">{documentCopy.integrated}: </dt><dd className="inline">{integratedAreaLabels.join(" · ")}</dd></div> : null}
          </dl>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl bg-emerald-50 p-5 lg:col-span-1">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">{documentCopy.goal}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">{document.content.goal}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">{documentCopy.objectives}</p>
            <div className="mt-3"><NumberedList items={document.content.objectives} /></div>
          </div>
          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">{documentCopy.expected}</p>
            <div className="mt-3"><NumberedList items={document.content.expected_results} accent="amber" /></div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 p-5">
            <h2 className="font-black text-slate-950">{documentCopy.resources}</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {document.content.resources.map((resource, index) => (
                <li key={`${resource.item}-${index}`} className="flex items-start justify-between gap-4 py-2 text-sm">
                  <span className="text-slate-700">{resource.item}{resource.notes ? <span className="block text-xs text-slate-400">{resource.notes}</span> : null}</span>
                  <strong className="shrink-0 text-slate-900">{resourceQuantity(resource.quantity, resource.unit)}</strong>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-slate-200 p-5">
            <h2 className="font-black text-slate-950">{documentCopy.preliminary}</h2>
            <div className="mt-3"><NumberedList items={document.content.preliminary_work} /></div>
          </section>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <DetailBlock title={documentCopy.storyArc} tone="violet">{document.content.story_arc}</DetailBlock>
          {document.content.group_division_method ? <DetailBlock title={documentCopy.groupDivision} tone="sky">{document.content.group_division_method}</DetailBlock> : null}
          <DetailBlock title={documentCopy.safety} tone="amber"><NumberedList items={document.content.safety_rules} accent="amber" /></DetailBlock>
          {document.content.praise_reward ? <DetailBlock title={documentCopy.praise} tone="emerald">{document.content.praise_reward}</DetailBlock> : null}
        </div>
      </article>

      <div className="space-y-5">
        {document.content.phases.map((phase, index) => <PhaseCard key={phase.id} copy={copy} phase={phase} index={index} document={document} pendingTaskId={pendingTaskId} transformLocked={transformLocked} actions={actions} instructions={instructions} onActionChange={onActionChange} onInstructionChange={onInstructionChange} onTransform={onTransform} />)}
      </div>

      <footer className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs leading-5 text-slate-500">
        <strong className="text-slate-700">{documentCopy.regulatory}: </strong>{document.regulatory_note || config.regulatory_notes?.[contentLanguage] || copy.regulatory}
        <span className="ml-2 text-slate-400">v{document.standard_version}</span>
      </footer>
    </div>
  );
}

function TopicDialog({ copy, topics, loading, onChoose, onClose }: { copy: Copy; topics: string[]; loading: boolean; onChoose: (topic: string) => void; onClose: () => void }) {
  const dialogRef = useDialogAccessibility(onClose, !loading);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target && !loading) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="preschool-topics-title" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl outline-none sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="preschool-topics-title" className="text-xl font-black text-slate-950">{copy.suggestionsTitle}</h2><p className="mt-1 text-sm text-slate-500">{copy.suggestionsHint}</p></div>
          <button type="button" onClick={onClose} disabled={loading} aria-label={copy.cancel} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">×</button>
        </div>
        {loading ? <div className="mt-8 flex items-center justify-center gap-3 py-10 text-sm font-bold text-sky-700"><span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-600 border-r-transparent" />{copy.topicsLoading}</div> : topics.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-8 text-center text-sm font-semibold text-amber-900">{copy.suggestionsEmpty}</p>
        ) : (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {topics.map((topic, index) => <button key={`${topic}-${index}`} type="button" onClick={() => onChoose(topic)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-semibold leading-6 text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50"><span className="mr-2 text-xs font-black text-emerald-600">{String(index + 1).padStart(2, "0")}</span>{topic}</button>)}
          </div>
        )}
      </section>
    </div>
  );
}

function VisualsDialog({ copy, document, onClose }: { copy: Copy; document: PreschoolActivityDocument; onClose: () => void }) {
  const language = tryNormalizeContentLanguage(document.language) ?? "kk";
  const tasks = document.content.phases.flatMap((phase) => phase.tasks.map((task) => ({ ...task, phase: phase.title, resolvedPrompt: taskVisualPrompt(task) })));
  const dialogRef = useDialogAccessibility(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="preschool-visuals-title" className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl outline-none sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="preschool-visuals-title" className="text-xl font-black text-slate-950">{copy.visualsTitle}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{copy.visualsHint}</p></div>
          <button type="button" onClick={onClose} aria-label={copy.cancel} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">×</button>
        </div>
        {tasks.length === 0 ? <p className="mt-8 rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{copy.noVisuals}</p> : (
          <div className="mt-5 space-y-3">
            {tasks.map((task) => <article key={task.id} className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-black uppercase tracking-wide text-violet-600">{task.phase}</p><h3 className="mt-1 font-black text-slate-900">{task.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{task.resolvedPrompt}</p><Link href={taskIntegrationHref("visual", task.resolvedPrompt, language)} className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-violet-600 px-4 text-xs font-black text-white hover:bg-violet-700">🎨 {copy.createVisual}</Link></article>)}
          </div>
        )}
      </section>
    </div>
  );
}

export default function PreschoolActivityWorkspace() {
  const { language } = useLanguage();
  const copy = preschoolActivityCopy[language];
  const { balance, refreshBalance } = useTokens();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedJobId = searchParams.get("job");
  const requestedDocumentId = searchParams.get("document");
  const requestedView = searchParams.get("view");
  const settledJobRef = useRef<string | null>(null);
  const restoredDocumentRef = useRef<string | null>(null);
  const mutationLockRef = useRef(false);

  const [view, setView] = useState<View>(requestedView === "history" ? "history" : "create");
  const [config, setConfig] = useState<PreschoolConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [input, setInput] = useState<PreschoolActivityInput | null>(null);
  const [season, setSeason] = useState("");
  const [document, setDocument] = useState<PreschoolActivityDocument | null>(null);
  const [pending, setPending] = useState<PendingOperation | null>(requestedJobId ? { id: requestedJobId, kind: "unknown" } : null);
  const [enqueueing, setEnqueueing] = useState<PendingKind | null>(null);
  const [enqueueingTaskId, setEnqueueingTaskId] = useState<string | undefined>();
  const [progress, setProgress] = useState<GenerationJob["progress"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[] | null>(null);
  const [visualsOpen, setVisualsOpen] = useState(false);
  const [downloading, setDownloading] = useState<"docx" | "pdf" | null>(null);
  const [history, setHistory] = useState<PreschoolActivitySummary[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [taskActions, setTaskActions] = useState<Record<string, PreschoolTaskAction>>({});
  const [taskInstructions, setTaskInstructions] = useState<Record<string, string>>({});
  const setReadyInput = useCallback((value: React.SetStateAction<PreschoolActivityInput>) => {
    setInput((current) => {
      if (!current) return current;
      return typeof value === "function" ? value(current) : value;
    });
  }, []);

  const reportError = useCallback((requestError: unknown, fallback?: string) => {
    setError(teacherFacingErrorMessage(requestError, language, { fallback }));
  }, [language]);

  const loadHistory = useCallback(async (offset = 0) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const result = await preschoolActivityApi.list(offset);
      setHistory((current) => offset === 0 ? result.items : [...current, ...result.items.filter((item) => !current.some((saved) => saved.id === item.id))]);
      setHistoryTotal(result.total);
    } catch (requestError) {
      setHistoryError(teacherFacingErrorMessage(requestError, language));
    } finally {
      setHistoryLoading(false);
    }
  }, [language]);

  const openHistory = useCallback(() => {
    setView("history");
    setError(null);
    router.replace(`${SOURCE_PATH}?view=history`, { scroll: false });
    if (history.length === 0) void loadHistory(0);
  }, [history.length, loadHistory, router]);

  const openDocument = useCallback(async (id: string, updateRoute = true) => {
    setError(null);
    try {
      const value = await preschoolActivityApi.get(id);
      if (!isPreschoolDocument(value)) throw new Error("INVALID_PRESCHOOL_DOCUMENT");
      setDocument(value);
      setView("document");
      restoredDocumentRef.current = id;
      if (updateRoute) router.replace(`${SOURCE_PATH}?document=${encodeURIComponent(id)}`, { scroll: false });
    } catch (requestError) {
      reportError(requestError, copy.invalidResult);
    }
  }, [copy.invalidResult, reportError, router]);

  useEffect(() => {
    let active = true;
    preschoolActivityApi.config().then((value) => {
      if (!active) return;
      setConfig(value);
      setInput((current) => current ?? defaultPreschoolInput(value, language));
    }).catch((requestError) => {
      if (active) setConfigError(teacherFacingErrorMessage(requestError, language));
    });
    return () => { active = false; };
  }, [language]);

  useEffect(() => {
    if (requestedJobId && pending?.id !== requestedJobId && settledJobRef.current !== requestedJobId) {
      setPending({ id: requestedJobId, kind: "unknown" });
    }
  }, [pending?.id, requestedJobId]);

  useEffect(() => {
    if (!requestedDocumentId || requestedJobId || restoredDocumentRef.current === requestedDocumentId) return;
    void openDocument(requestedDocumentId, false);
  }, [openDocument, requestedDocumentId, requestedJobId]);

  useEffect(() => {
    if (requestedView === "history" && view !== "history") {
      setView("history");
      if (history.length === 0) void loadHistory(0);
    }
  }, [history.length, loadHistory, requestedView, view]);

  useEffect(() => {
    if (!pending) return;
    let active = true;
    let timer: number | undefined;
    const controller = new AbortController();

    const poll = async () => {
      try {
        const job = await preschoolActivityApi.job(pending.id, controller.signal);
        if (!active) return;
        const actualKind = pendingKind(job.kind);
        if (pending.kind === "unknown" && actualKind !== "unknown") {
          setPending((current) => current?.id === job.id ? { ...current, kind: actualKind } : current);
        }
        setProgress(job.progress);
        if (ACTIVE_STATUSES.has(job.status)) {
          timer = window.setTimeout(() => void poll(), 1_800);
          return;
        }
        if (settledJobRef.current === job.id) return;
        settledJobRef.current = job.id;
        setPending(null);
        setProgress(null);
        void refreshBalance();

        if ((job.status === "completed" || job.status === "billing_error") && job.result) {
          if (actualKind === "topics") {
            setTopics(topicsFromJobResult(job.result));
            return;
          }
          if (actualKind === "generate" || actualKind === "task") {
            const nextDocument = documentFromJobResult(job.result);
            if (!nextDocument) {
              setError(copy.invalidResult);
              return;
            }
            setDocument(nextDocument);
            setView("document");
            setError(null);
            router.replace(`${SOURCE_PATH}?document=${encodeURIComponent(nextDocument.id)}`, { scroll: false });
            return;
          }
          setError(copy.wrongMaterial);
          return;
        }
        setError(job.status === "cancelled" ? copy.cancelled : copy.failed);
      } catch (requestError) {
        if (!active || controller.signal.aborted) return;
        reportError(requestError);
        timer = window.setTimeout(() => void poll(), 4_000);
      }
    };
    void poll();
    return () => {
      active = false;
      controller.abort();
      if (timer) window.clearTimeout(timer);
    };
  }, [copy.cancelled, copy.failed, copy.invalidResult, copy.wrongMaterial, pending, refreshBalance, reportError, router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input || pending || enqueueing || mutationLockRef.current) return;
    setError(null);
    const normalized = normalizePreschoolInput(input);
    const issue = validatePreschoolInput(normalized);
    if (issue) {
      setError(copy.formErrors[issue as PreschoolValidationIssue]);
      return;
    }
    if (balance !== null && balance < (config?.token_cost ?? 0)) {
      setError(copy.noTokens);
      return;
    }
    mutationLockRef.current = true;
    setEnqueueing("generate");
    try {
      const job = await preschoolActivityApi.generate(normalized);
      settledJobRef.current = null;
      setPending({ id: job.id, kind: "generate" });
      setProgress(job.progress);
      router.replace(`${SOURCE_PATH}?job=${encodeURIComponent(job.id)}`, { scroll: false });
    } catch (requestError) {
      reportError(requestError, copy.failed);
    } finally {
      mutationLockRef.current = false;
      setEnqueueing(null);
    }
  };

  const suggestTopics = async () => {
    if (!input || pending || enqueueing || mutationLockRef.current || !input.group_id || !input.activity_type) return;
    setError(null);
    setTopics([]);
    mutationLockRef.current = true;
    setEnqueueing("topics");
    try {
      const job = await preschoolActivityApi.topics({
        group_id: input.group_id,
        age: input.age,
        activity_type: input.activity_type,
        language: input.language,
        goal: input.goal,
        season: season.trim() || undefined,
      });
      settledJobRef.current = null;
      setPending({ id: job.id, kind: "topics" });
      setProgress(job.progress);
    } catch (requestError) {
      setTopics(null);
      reportError(requestError);
    } finally {
      mutationLockRef.current = false;
      setEnqueueing(null);
    }
  };

  const transformTask = async (task: PreschoolTask) => {
    if (!document || pending || enqueueing || mutationLockRef.current) return;
    const action = taskActions[task.id] ?? "more_interesting";
    const instructions = taskInstructions[task.id] ?? "";
    if (action === "other" && instructions.trim().length < 3) return;
    setError(null);
    mutationLockRef.current = true;
    setEnqueueing("task");
    setEnqueueingTaskId(task.id);
    try {
      const job = await preschoolActivityApi.transformTask(document.id, task.id, document.version, action, instructions);
      settledJobRef.current = null;
      setPending({ id: job.id, kind: "task", taskId: task.id });
      setProgress(job.progress);
      router.replace(`${SOURCE_PATH}?job=${encodeURIComponent(job.id)}`, { scroll: false });
    } catch (requestError) {
      reportError(requestError);
    } finally {
      mutationLockRef.current = false;
      setEnqueueing(null);
      setEnqueueingTaskId(undefined);
    }
  };

  const adapt = (source: PreschoolActivitySummary | PreschoolActivityDocument) => {
    if (!config) return;
    setInput({
      organization: source.organization,
      teacher_name: source.teacher_name,
      group_id: source.group_id,
      group_name: source.group_name,
      age: source.age,
      activity_type: source.activity_type,
      integrated_areas: [...source.integrated_areas],
      topic: source.topic,
      goal: source.goal,
      duration_minutes: source.duration_minutes,
      children_count: source.children_count,
      group_count: source.group_count,
      styles: [...source.styles],
      wow_enabled: source.wow_enabled,
      story_character: source.story_character,
      national_values: source.national_values,
      inclusive_enabled: source.inclusive_enabled,
      support_needs: [...source.support_needs],
      custom_support_need: source.custom_support_need,
      teacher_script: source.teacher_script,
      expected_answers: source.expected_answers,
      output_format: source.output_format,
      language: source.language,
      notes: source.notes,
    });
    setView("create");
    setError(null);
    router.replace(SOURCE_PATH, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportDocument = async (format: "docx" | "pdf") => {
    if (!document || downloading) return;
    setDownloading(format);
    setError(null);
    try {
      saveBlob(await preschoolActivityApi.export(document.id, format), safePreschoolFileName(document.topic, format));
    } catch (requestError) {
      reportError(requestError, copy.downloadError);
    } finally {
      setDownloading(null);
    }
  };

  const createNew = () => {
    setView("create");
    setError(null);
    router.replace(SOURCE_PATH, { scroll: false });
  };

  if (!config || !input) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-white bg-white px-6 py-14 text-center shadow-sm">
        {configError ? <><p role="alert" className="font-bold text-rose-700">{configError}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">{copy.retry}</button></> : <><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent" /><p className="mt-4 text-sm font-bold text-slate-600">{copy.configLoading}</p></>}
      </div>
    );
  }

  const currentOperation = pending?.kind ?? enqueueing;
  const pendingText = currentOperation === "task" ? copy.taskLoading : currentOperation === "topics" ? copy.topicsLoading : copy.loading;
  return (
    <div className="mx-auto max-w-[1480px] pb-12">
      <nav className="mb-6 flex flex-wrap gap-1 border-b border-slate-200" aria-label={copy.title}>
        <button type="button" onClick={createNew} aria-current={view === "create" ? "page" : undefined} className={`min-h-11 border-b-2 px-4 text-sm font-black ${view === "create" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{copy.createTab}</button>
        <button type="button" onClick={openHistory} aria-current={view === "history" ? "page" : undefined} className={`min-h-11 border-b-2 px-4 text-sm font-black ${view === "history" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{copy.historyTab}</button>
        {document ? <button type="button" onClick={() => { setView("document"); router.replace(`${SOURCE_PATH}?document=${encodeURIComponent(document.id)}`, { scroll: false }); }} aria-current={view === "document" ? "page" : undefined} className={`min-h-11 border-b-2 px-4 text-sm font-black ${view === "document" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{copy.resultTab}</button> : null}
      </nav>

      {(pending || enqueueing) && view !== "create" ? <div aria-live="polite" className="mb-5 flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"><span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-600 border-r-transparent" /><span><strong>{pendingText}</strong>{progress?.total ? ` · ${progress.current ?? 0}/${progress.total}` : progress?.message ? ` · ${progress.message}` : ""}</span></div> : null}
      {view === "create" ? <FormView copy={copy} interfaceLanguage={language} config={config} input={input} setInput={setReadyInput} season={season} setSeason={setSeason} busy={Boolean(pending || enqueueing)} pendingKind={currentOperation} balance={balance} error={error} onSubmit={(event) => void submit(event)} onTopics={() => void suggestTopics()} /> : null}
      {view === "history" ? <HistoryView copy={copy} config={config} language={language} items={history} total={historyTotal} loading={historyLoading} error={historyError} search={historySearch} setSearch={setHistorySearch} onOpen={(id) => void openDocument(id)} onAdapt={adapt} onLoadMore={() => void loadHistory(history.length)} /> : null}
      {view === "document" && document ? <DocumentView copy={copy} language={language} config={config} document={document} pendingTaskId={pending?.kind === "task" ? pending.taskId : enqueueing === "task" ? enqueueingTaskId : undefined} transformLocked={currentOperation === "task"} error={error} downloading={downloading} actions={taskActions} instructions={taskInstructions} onActionChange={(taskId, action) => setTaskActions((current) => ({ ...current, [taskId]: action }))} onInstructionChange={(taskId, value) => setTaskInstructions((current) => ({ ...current, [taskId]: value }))} onTransform={(task) => void transformTask(task)} onBack={createNew} onAdapt={() => adapt(document)} onExport={(format) => void exportDocument(format)} onOpenVisuals={() => setVisualsOpen(true)} /> : null}

      {topics !== null ? <TopicDialog copy={copy} topics={topics} loading={pending?.kind === "topics" || enqueueing === "topics"} onChoose={(topic) => { setInput((current) => current ? { ...current, topic } : current); setTopics(null); }} onClose={() => { if (pending?.kind !== "topics" && enqueueing !== "topics") setTopics(null); }} /> : null}
      {visualsOpen && document ? <VisualsDialog copy={copy} document={document} onClose={() => setVisualsOpen(false)} /> : null}
    </div>
  );
}
