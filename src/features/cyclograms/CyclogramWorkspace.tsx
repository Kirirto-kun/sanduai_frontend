"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useTokens } from "@/hooks/useTokens";
import { useLanguage } from "@/i18n/LanguageContext";
import type { GenerationJob, GenerationJobStatus } from "@/lib/api";
import { tryNormalizeContentLanguage } from "@/lib/content-languages";
import { saveBlob } from "@/lib/generation-download";
import { generatedContentCopy } from "@/lib/generated-content-copy";
import { ApiRequestError } from "@/lib/http-client";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { invalidateCachedBalance } from "@/lib/tokenCache";
import {
  CYCLOGRAM_JOB_KINDS,
  clearCyclogramIntentForJob,
  cyclogramApi,
} from "./api";
import { cyclogramCopy } from "./copy";
import {
  changedCells,
  cyclogramDisplayLanguage,
  draftKey,
  formatDate,
  hasFiveDayRows,
  inputFromDocument,
  isCyclogramDocument,
  nextWeek,
  normalizeInput,
  replaceCell,
  resolveInitialCyclogramLanguage,
  validateInput,
  weekDates,
} from "./model";
import type {
  CellAction,
  CyclogramConfig,
  CyclogramContent,
  CyclogramDocument,
  CyclogramInput,
  CyclogramSummary,
} from "./types";

type View = "create" | "history" | "document";
type PendingType = "generate" | "topics" | "cell" | "unknown";
type PendingOperation = {
  jobId: string;
  type: PendingType;
  documentId?: string;
  sectionId?: string;
  dayIndex?: number;
};
type SaveState = "saved" | "unsaved" | "saving" | "error";
type Copy = (typeof cyclogramCopy)[keyof typeof cyclogramCopy];

const ACTIVE_STATUSES = new Set<GenerationJobStatus>([
  "queued",
  "running",
  "settling",
  "refunding",
]);
const WEEKDAY_LABELS: Record<string, { long: readonly string[]; short: readonly string[] }> = {
  kk: {
    long: ["Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма"],
    short: ["Дс", "Сс", "Ср", "Бс", "Жм"],
  },
  ru: {
    long: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"],
    short: ["Пн", "Вт", "Ср", "Чт", "Пт"],
  },
  en: {
    long: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    short: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  },
  ky: {
    long: ["Дүйшөмбү", "Шейшемби", "Шаршемби", "Бейшемби", "Жума"],
    short: ["Дш", "Шш", "Шр", "Бш", "Жм"],
  },
  uz: {
    long: ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma"],
    short: ["Du", "Se", "Ch", "Pa", "Ju"],
  },
};
function pendingKey(userId: string): string {
  return `sanduai:cyclogram:pending:${userId}`;
}

function defaultWeekStart(): string {
  return weekDates(new Date().toISOString().slice(0, 10))[0] ?? "";
}

function emptyInput(): CyclogramInput {
  return {
    organization: "",
    group_id: "",
    age: 3,
    group_name: "",
    teacher_name: "",
    week_start: defaultWeekStart(),
    weekly_theme: "",
    notes: "",
    language: "",
  };
}

function inferPendingType(kind: string): PendingType {
  if (kind === CYCLOGRAM_JOB_KINDS.generate) return "generate";
  if (kind === CYCLOGRAM_JOB_KINDS.topics) return "topics";
  if (kind === CYCLOGRAM_JOB_KINDS.cell) return "cell";
  return "unknown";
}

function resultRecord(result: GenerationJob["result"]): Record<string, unknown> | null {
  return result && !Array.isArray(result) && typeof result === "object"
    ? result as Record<string, unknown>
    : null;
}

function documentFromResult(result: GenerationJob["result"]): CyclogramDocument | null {
  if (isCyclogramDocument(result)) return result;
  const record = resultRecord(result);
  for (const key of ["document", "cyclogram"]) {
    if (record && isCyclogramDocument(record[key])) return record[key];
  }
  return null;
}

function documentIdFromResult(result: GenerationJob["result"]): string | null {
  const record = resultRecord(result);
  if (!record) return null;
  for (const key of ["document_id", "cyclogram_id"]) {
    if (typeof record[key] === "string" && record[key]) return record[key];
  }
  return null;
}

function topicsFromResult(result: GenerationJob["result"]): string[] {
  const raw = Array.isArray(result) ? result : resultRecord(result)?.topics;
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === "string" && value.trim().length > 0).slice(0, 10);
}

function safeFilePart(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_").slice(0, 80) || "cyclogram";
}

function contentDraft(value: string | null): { version: number; content: CyclogramContent } | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { version?: unknown; content?: unknown };
    if (typeof parsed.version !== "number" || !parsed.content || typeof parsed.content !== "object") return null;
    const content = parsed.content as CyclogramContent;
    return hasFiveDayRows(content) ? { version: parsed.version, content } : null;
  } catch {
    return null;
  }
}

function localizedLabel(
  labels: Record<string, string>,
  documentLanguage: string,
  interfaceLanguage: "ru" | "kk",
): string {
  const contentLanguage = tryNormalizeContentLanguage(documentLanguage);
  if (contentLanguage) return labels[contentLanguage] || "";
  return labels[interfaceLanguage] || labels.kk || labels.ru || "";
}

function weekdayLabels(document: CyclogramDocument, copy: Copy): string[] {
  const configured = WEEKDAY_LABELS[document.language];
  if (configured) return [...configured.long];
  const dates = weekDates(document.week_start);
  if (dates.length !== 5) return copy.days;
  try {
    return dates.map(date => new Intl.DateTimeFormat(document.language || "kk-KZ", {
      weekday: "long",
      timeZone: "UTC",
    }).format(new Date(`${date}T12:00:00Z`)));
  } catch {
    return copy.days;
  }
}

function shortWeekdayLabels(language: string, copy: Copy): string[] {
  return [...(WEEKDAY_LABELS[language]?.short ?? copy.shortDays)];
}

function FormView({
  copy,
  config,
  input,
  setInput,
  balance,
  busy,
  error,
  pendingType,
  onSubmit,
  onTopics,
  onCancelSource,
}: {
  copy: Copy;
  config: CyclogramConfig;
  input: CyclogramInput;
  setInput: React.Dispatch<React.SetStateAction<CyclogramInput>>;
  balance: number | null;
  busy: boolean;
  error: string | null;
  pendingType: PendingType | null;
  onSubmit: (event: FormEvent) => void;
  onTopics: () => void;
  onCancelSource: () => void;
}) {
  const dates = weekDates(input.week_start);
  const previewDays = shortWeekdayLabels(input.language, copy);
  const fieldClass = "mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100";
  const labelClass = "block text-sm font-semibold text-slate-800";
  const insufficient = balance !== null && balance < config.token_cost;

  const update = <K extends keyof CyclogramInput>(key: K, value: CyclogramInput[K]) => {
    setInput(previous => ({ ...previous, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase text-teal-700">{copy.badge}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{copy.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{copy.subtitle}</p>
      </header>

      {input.source_id ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-teal-500 bg-teal-50 px-4 py-3 text-sm text-teal-950">
          <span>{copy.adaptedFrom}</span>
          <button type="button" onClick={onCancelSource} className="font-bold underline underline-offset-4">
            {copy.cancelReuse}
          </button>
        </div>
      ) : null}

      {error ? <div role="alert" className="border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      {busy ? (
        <div aria-live="polite" className="flex items-center gap-3 border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-600 border-r-transparent" aria-hidden="true" />
          <div>
            <p className="font-bold">{pendingType === "topics" ? copy.topicLoading : copy.loading}</p>
            <p className="mt-0.5 text-sky-800">{copy.loadingHint}</p>
          </div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <section aria-labelledby="cyclogram-form-heading">
          <h2 id="cyclogram-form-heading" className="text-xl font-bold text-slate-950">{copy.formTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{copy.formHint}</p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>
              {copy.organization} <span className="font-normal text-slate-400">({copy.optional})</span>
              <input className={fieldClass} value={input.organization} onChange={event => update("organization", event.target.value)} placeholder={copy.organizationPlaceholder} disabled={busy} />
            </label>

            <label className={labelClass}>
              {copy.group}
              <select
                required
                className={fieldClass}
                value={input.group_id}
                disabled={busy}
                onChange={event => {
                  const group = config.age_groups.find(item => item.id === event.target.value);
                  setInput(previous => ({ ...previous, group_id: event.target.value, age: group?.default_age ?? previous.age }));
                }}
              >
                <option value="">—</option>
                {config.age_groups.map(group => <option key={group.id} value={group.id}>{localizedLabel(group.label, input.language, "kk")}</option>)}
              </select>
            </label>

            <label className={labelClass}>
              {copy.age}
              <select required className={fieldClass} value={input.age} disabled={busy} onChange={event => update("age", Number(event.target.value))}>
                {[2, 3, 4, 5, 6].map(age => <option key={age} value={age}>{age} {copy.years}</option>)}
              </select>
            </label>

            <label className={labelClass}>
              {copy.groupName}
              <input required className={fieldClass} value={input.group_name} onChange={event => update("group_name", event.target.value)} placeholder={copy.groupPlaceholder} disabled={busy} />
            </label>

            <label className={labelClass}>
              {copy.teacher}
              <input required className={fieldClass} value={input.teacher_name} onChange={event => update("teacher_name", event.target.value)} placeholder={copy.teacherPlaceholder} disabled={busy} />
            </label>

            <label className={labelClass}>
              {copy.week}
              <input
                required
                type="date"
                className={fieldClass}
                value={input.week_start}
                disabled={busy}
                onChange={event => update("week_start", weekDates(event.target.value)[0] ?? event.target.value)}
              />
            </label>

            <label className={labelClass}>
              {copy.language}
              <select required className={fieldClass} value={input.language} disabled={busy} onChange={event => update("language", event.target.value)}>
                <option value="">—</option>
                {config.languages.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
            </label>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="cyclogram-theme">{copy.theme}</label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input id="cyclogram-theme" required className={`${fieldClass} mt-0`} value={input.weekly_theme} onChange={event => update("weekly_theme", event.target.value)} placeholder={copy.themePlaceholder} disabled={busy} />
                <button
                  type="button"
                  onClick={onTopics}
                  disabled={busy || !input.group_id || !input.language || !input.week_start}
                  className="min-h-11 shrink-0 rounded-lg border border-teal-700 bg-white px-4 text-sm font-bold text-teal-800 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copy.suggest}
                </button>
              </div>
            </div>

            <label className={`${labelClass} sm:col-span-2`}>
              {copy.notes} <span className="font-normal text-slate-400">({copy.optional})</span>
              <textarea className={`${fieldClass} min-h-24 resize-y`} value={input.notes} onChange={event => update("notes", event.target.value)} placeholder={copy.notesPlaceholder} disabled={busy} />
            </label>
          </div>
        </section>

        <aside className="border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <h2 className="text-base font-bold text-slate-950">{copy.plan}</h2>
          <p className="mt-1 text-sm text-slate-500">{copy.previewHint}</p>
          <div className="mt-5 grid grid-cols-5 gap-1" aria-label={copy.week}>
            {previewDays.map((day, index) => (
              <div key={day} className="min-w-0 border border-slate-200 bg-slate-50 px-1 py-2 text-center">
                <div className="text-xs font-bold text-slate-700">{day}</div>
                <div className="mt-1 text-[11px] text-slate-500">{dates[index] ? formatDate(dates[index], input.language) : "—"}</div>
              </div>
            ))}
          </div>
          <ul className="mt-6 space-y-3 text-sm leading-5 text-slate-700">
            {[copy.previewPoint1, copy.previewPoint2, copy.previewPoint3].map(value => (
              <li key={value} className="flex gap-2"><span className="text-teal-600" aria-hidden="true">✓</span><span>{value}</span></li>
            ))}
          </ul>
          <div className="mt-6 border-t border-slate-200 pt-5 text-sm">
            <div className="flex justify-between gap-3"><span className="text-slate-500">{copy.balance}</span><strong>{balance ?? "—"} {copy.token}</strong></div>
            <div className="mt-2 flex justify-between gap-3"><span className="text-slate-500">{copy.create}</span><strong>{config.token_cost} {copy.token}</strong></div>
          </div>
          {insufficient ? <p className="mt-3 text-sm font-semibold text-rose-700">{copy.insufficient}</p> : null}
          <button
            type="submit"
            disabled={busy || insufficient}
            className="mt-5 min-h-12 w-full rounded-lg bg-teal-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {copy.generate} · {config.token_cost} {copy.token}
          </button>
          <p className="mt-4 text-xs leading-5 text-slate-500">{copy.previewFooter}</p>
        </aside>
      </form>
    </div>
  );
}

function HistoryView({
  copy,
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
  items: CyclogramSummary[];
  total: number;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  onOpen: (id: string) => void;
  onAdapt: (item: CyclogramSummary) => void;
  onLoadMore: () => void;
}) {
  const query = search.trim().toLocaleLowerCase();
  const filtered = items.filter(item => `${item.weekly_theme} ${item.group_name}`.toLocaleLowerCase().includes(query));
  return (
    <div className="space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-950">{copy.historyTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{copy.historyHint}</p>
      </header>
      <label className="block max-w-xl text-sm font-semibold text-slate-800">
        <span className="sr-only">{copy.search}</span>
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={copy.search} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
      </label>
      {error ? <div role="alert" className="border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {loading && items.length === 0 ? (
        <div className="space-y-2" aria-label={copy.loadingHistory}>{[0, 1, 2].map(index => <div key={index} className="h-24 animate-pulse bg-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-slate-300 px-5 py-12 text-center">
          <p className="font-bold text-slate-900">{query ? copy.noResults : copy.historyEmpty}</p>
          <p className="mt-2 text-sm text-slate-500">{query ? "" : copy.historyEmptyHint}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {filtered.map(item => (
            <article key={item.id} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-teal-700">{item.group_name} · {item.age} {copy.years}</p>
                <h2 className="mt-1 truncate text-lg font-bold text-slate-950">{item.weekly_theme}</h2>
                <p className="mt-1 text-sm text-slate-500">{formatDate(item.week_start, item.language)} – {formatDate(item.week_end, item.language)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onOpen(item.id)} className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800">{copy.open}</button>
                <button type="button" onClick={() => onAdapt(item)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{copy.next}</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {items.length < total ? (
        <button type="button" onClick={onLoadMore} disabled={loading} className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 disabled:opacity-50">{loading ? copy.loadingHistory : copy.loadMore}</button>
      ) : null}
    </div>
  );
}

function DocumentView({
  copy,
  language,
  document,
  mobileDay,
  setMobileDay,
  saveState,
  conflict,
  error,
  pendingCell,
  downloading,
  onSelectCell,
  onBack,
  onAdapt,
  onExport,
  onPrint,
  onReload,
  onRetrySave,
}: {
  copy: Copy;
  language: "ru" | "kk";
  document: CyclogramDocument;
  mobileDay: number;
  setMobileDay: (day: number) => void;
  saveState: SaveState;
  conflict: boolean;
  error: string | null;
  pendingCell: boolean;
  downloading: "docx" | "pdf" | null;
  onSelectCell: (sectionId: string, day: number) => void;
  onBack: () => void;
  onAdapt: () => void;
  onExport: (format: "docx" | "pdf") => void;
  onPrint: () => void;
  onReload: () => void;
  onRetrySave: () => void;
}) {
  const dates = weekDates(document.week_start);
  const days = weekdayLabels(document, copy);
  const shortDays = shortWeekdayLabels(document.language, copy);
  const sectionById = new Map(document.sections.map(section => [section.id, section]));
  const documentCopy = generatedContentCopy(
    tryNormalizeContentLanguage(document.language) ?? language,
  ).cyclogram;
  const saveCopy = saveState === "saving" ? copy.saving : saveState === "unsaved" ? copy.unsaved : saveState === "error" ? copy.saveError : copy.saved;
  return (
    <div className="space-y-5">
      <div className="cyclogram-no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <button type="button" onClick={onBack} className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">← {copy.back}</button>
        <div className="flex flex-wrap items-center gap-2">
          <span aria-live="polite" className={`text-xs font-semibold ${saveState === "error" ? "text-rose-700" : saveState === "saved" ? "text-emerald-700" : "text-amber-700"}`}>{saveCopy}</span>
          {saveState === "error" && !conflict ? <button type="button" onClick={onRetrySave} className="text-xs font-bold underline">{copy.retry}</button> : null}
          <button type="button" onClick={onAdapt} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800">{copy.adapt}</button>
          <button type="button" onClick={() => onExport("docx")} disabled={Boolean(downloading) || saveState === "saving"} className="min-h-10 rounded-lg bg-teal-700 px-3 text-sm font-bold text-white disabled:opacity-50">{downloading === "docx" ? copy.downloadBusy : copy.word}</button>
          <button type="button" onClick={() => onExport("pdf")} disabled={Boolean(downloading) || saveState === "saving"} className="min-h-10 rounded-lg bg-teal-700 px-3 text-sm font-bold text-white disabled:opacity-50">{downloading === "pdf" ? copy.downloadBusy : copy.pdf}</button>
          <button type="button" onClick={onPrint} className="min-h-10 rounded-lg bg-slate-950 px-3 text-sm font-bold text-white">{copy.print}</button>
        </div>
      </div>

      {conflict ? (
        <div role="alert" className="cyclogram-no-print flex flex-wrap items-center justify-between gap-3 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span>{copy.conflict}</span><button type="button" onClick={onReload} className="font-bold underline underline-offset-4">{copy.reload}</button>
        </div>
      ) : error ? <div role="alert" className="cyclogram-no-print border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <article id="cyclogram-print-root" className="bg-white text-slate-950">
        <header className="border border-slate-300 p-5">
          <h1 className="text-center text-xl font-bold">{documentCopy.documentTitle}</h1>
          <dl className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex gap-2"><dt className="font-bold">{documentCopy.organization}:</dt><dd>{document.organization || "—"}</dd></div>
            <div className="flex gap-2"><dt className="font-bold">{documentCopy.group}:</dt><dd>{document.group_name}</dd></div>
            <div className="flex gap-2"><dt className="font-bold">{documentCopy.age}:</dt><dd>{document.age} {documentCopy.years}</dd></div>
            <div className="flex gap-2"><dt className="font-bold">{documentCopy.teacher}:</dt><dd>{document.teacher_name}</dd></div>
            <div className="flex gap-2"><dt className="font-bold">{documentCopy.week}:</dt><dd>{formatDate(document.week_start, document.language)} – {formatDate(document.week_end, document.language)}</dd></div>
            <div className="flex gap-2"><dt className="font-bold">{documentCopy.theme}:</dt><dd>{document.weekly_theme}</dd></div>
          </dl>
        </header>

        <div className="cyclogram-desktop-table hidden xl:block">
          <table className="w-full table-fixed border-collapse text-left text-xs leading-5">
            <thead>
              <tr>
                <th className="w-40 border border-slate-400 bg-slate-100 p-3 font-bold">{documentCopy.sectionLabel}</th>
                {days.map((day, index) => <th key={`${day}-${index}`} className="border border-slate-400 bg-slate-100 p-3 text-center font-bold"><span className="capitalize">{day}</span><span className="mt-0.5 block font-normal text-slate-500">{dates[index] ? formatDate(dates[index], document.language) : ""}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {document.content.rows.map(row => {
                const section = sectionById.get(row.section_id);
                return <tr key={row.section_id}>
                  <th scope="row" className="border border-slate-400 bg-slate-50 p-3 align-top font-bold">{section ? localizedLabel(section.title, document.language, language) || row.section_id : row.section_id}</th>
                  {row.cells.map((cell, day) => <td key={day} className="border border-slate-400 p-0 align-top"><button type="button" onClick={() => onSelectCell(row.section_id, day)} className="min-h-28 w-full whitespace-pre-wrap p-3 text-left align-top transition hover:bg-teal-50 focus-visible:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600" aria-label={`${section ? localizedLabel(section.title, document.language, language) || row.section_id : row.section_id}, ${days[day]}`}>{cell || "—"}</button></td>)}
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        <div className="cyclogram-mobile-table xl:hidden">
          <div className="cyclogram-no-print grid grid-cols-5 border-x border-b border-slate-300" role="tablist" aria-label={copy.week}>
            {shortDays.map((day, index) => <button key={day} type="button" role="tab" aria-selected={mobileDay === index} onClick={() => setMobileDay(index)} className={`min-h-12 border-r border-slate-200 text-xs font-bold last:border-r-0 ${mobileDay === index ? "bg-teal-700 text-white" : "bg-slate-50 text-slate-700"}`}>{day}<span className="mt-0.5 block text-[10px] font-normal">{dates[index]?.slice(8)}</span></button>)}
          </div>
          <dl className="divide-y divide-slate-200 border-x border-b border-slate-300">
            {document.content.rows.map(row => {
              const section = sectionById.get(row.section_id);
              return <div key={row.section_id} className="px-4 py-4"><dt className="text-xs font-bold text-slate-500">{section ? localizedLabel(section.title, document.language, language) || row.section_id : row.section_id}</dt><dd className="mt-2"><button type="button" onClick={() => onSelectCell(row.section_id, mobileDay)} className="w-full whitespace-pre-wrap text-left text-sm leading-6 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">{row.cells[mobileDay] || "—"}</button></dd></div>;
            })}
          </dl>
        </div>

        <footer className="border-x border-b border-slate-300 px-4 py-3 text-xs text-slate-500">
          {documentCopy.regulatory} · {documentCopy.version}: {document.template_version}
        </footer>
      </article>
      {pendingCell ? <p className="cyclogram-no-print text-sm font-semibold text-sky-800" aria-live="polite">{copy.cellLoading}</p> : null}
    </div>
  );
}

export default function CyclogramWorkspace() {
  const { language } = useLanguage();
  const copy = cyclogramCopy[language];
  const { user } = useAuth();
  const { balance, refreshBalance } = useTokens();
  const [view, setView] = useState<View>("create");
  const [config, setConfig] = useState<CyclogramConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [input, setInput] = useState<CyclogramInput>(emptyInput);
  const [pending, setPending] = useState<PendingOperation | null>(null);
  const [jobProgress, setJobProgress] = useState<GenerationJob["progress"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[] | null>(null);
  const [document, setDocument] = useState<CyclogramDocument | null>(null);
  const [persisted, setPersisted] = useState<CyclogramDocument | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [conflict, setConflict] = useState(false);
  const [mobileDay, setMobileDay] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{ sectionId: string; day: number; original: string } | null>(null);
  const [editorText, setEditorText] = useState("");
  const [history, setHistory] = useState<CyclogramSummary[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [downloading, setDownloading] = useState<"docx" | "pdf" | null>(null);
  const documentRef = useRef<CyclogramDocument | null>(null);
  const persistedRef = useRef<CyclogramDocument | null>(null);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { documentRef.current = document; }, [document]);
  useEffect(() => { persistedRef.current = persisted; }, [persisted]);

  const showError = useCallback((cause: unknown, fallback = copy.error) => {
    setError(teacherFacingErrorMessage(cause, language, { fallback }));
  }, [copy.error, language]);

  useEffect(() => {
    let cancelled = false;
    setConfigLoading(true);
    cyclogramApi.config().then(value => {
      if (cancelled) return;
      setConfig(value);
      setConfigError(null);
      setInput(previous => {
        const group = value.age_groups.find(item => item.id === previous.group_id) ?? value.age_groups[0];
        return {
          ...previous,
          group_id: previous.group_id || group?.id || "",
          age: previous.group_id ? previous.age : group?.default_age ?? previous.age,
          language: resolveInitialCyclogramLanguage(
            previous.language,
            language,
            value.languages.map(item => item.code),
          ),
          teacher_name: previous.teacher_name || value.teacher_name || user?.fullName || "",
        };
      });
    }).catch(cause => {
      if (!cancelled) setConfigError(teacherFacingErrorMessage(cause, language, { fallback: copy.error }));
    }).finally(() => { if (!cancelled) setConfigLoading(false); });
    return () => { cancelled = true; };
  }, [copy.error, language, user?.fullName]);

  useEffect(() => {
    if (!user?.userId) return;
    const stored = window.localStorage.getItem(pendingKey(user.userId));
    if (stored) {
      try {
        const restored = JSON.parse(stored) as PendingOperation;
        if (restored && typeof restored.jobId === "string") setPending(restored);
      } catch {
        window.localStorage.removeItem(pendingKey(user.userId));
      }
    }
    const requestedJob = new URLSearchParams(window.location.search).get("job");
    if (requestedJob && /^[0-9a-f-]{36}$/i.test(requestedJob)) {
      setPending(previous => previous ?? { jobId: requestedJob, type: "unknown" });
    }
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId) return;
    if (pending) window.localStorage.setItem(pendingKey(user.userId), JSON.stringify(pending));
    else window.localStorage.removeItem(pendingKey(user.userId));
  }, [pending, user?.userId]);

  const installDocument = useCallback((value: CyclogramDocument, allowDraft = true) => {
    if (!isCyclogramDocument(value)) throw new Error("INVALID_CYCLOGRAM_DOCUMENT");
    let next = value;
    if (allowDraft && user?.userId) {
      const draft = contentDraft(window.localStorage.getItem(draftKey(user.userId, value.id)));
      if (draft && draft.version === value.version) {
        next = { ...value, content: draft.content };
        setSaveState("unsaved");
      } else if (draft) {
        setConflict(true);
      }
    }
    persistedRef.current = value;
    documentRef.current = next;
    setPersisted(value);
    setDocument(next);
    setView("document");
    setMobileDay(0);
  }, [user?.userId]);

  const fetchDocument = useCallback(async (id: string, allowDraft = true) => {
    const value = await cyclogramApi.get(id);
    installDocument(value, allowDraft);
    return value;
  }, [installDocument]);

  const loadHistory = useCallback(async (offset = 0) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const page = await cyclogramApi.list(offset);
      setHistory(previous => offset === 0 ? page.items : [...previous, ...page.items.filter(item => !previous.some(existing => existing.id === item.id))]);
      setHistoryTotal(page.total);
      setHistoryLoaded(true);
    } catch (cause) {
      setHistoryError(teacherFacingErrorMessage(cause, language, { fallback: copy.error }));
    } finally {
      setHistoryLoading(false);
    }
  }, [copy.error, language]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") !== "history") return;
    setView("history");
    if (!historyLoaded && !historyLoading) void loadHistory(0);
  }, [historyLoaded, historyLoading, loadHistory]);

  const finishJob = useCallback(async (job: GenerationJob, operation: PendingOperation) => {
    const type = operation.type === "unknown" ? inferPendingType(job.kind) : operation.type;
    clearCyclogramIntentForJob(job.id);
    setPending(null);
    setJobProgress(null);
    invalidateCachedBalance();
    void refreshBalance();
    if ((job.status === "failed" || job.status === "cancelled" || job.status === "billing_error") && job.result === null) {
      setError(copy.failedJob);
      return;
    }
    try {
      if (type === "topics") {
        const values = topicsFromResult(job.result);
        if (values.length === 0) throw new Error("INVALID_TOPICS_RESULT");
        setTopics(values);
        return;
      }
      const embedded = documentFromResult(job.result);
      if (embedded) installDocument(embedded, false);
      else {
        const id = documentIdFromResult(job.result) || operation.documentId;
        if (!id) throw new Error("MISSING_CYCLOGRAM_ID");
        await fetchDocument(id, false);
      }
      setSelectedCell(null);
      setConflict(false);
      setSaveState("saved");
      void loadHistory(0);
    } catch (cause) {
      showError(cause);
    }
  }, [copy.failedJob, fetchDocument, installDocument, loadHistory, refreshBalance, showError]);

  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    let timer: number | undefined;
    const poll = async () => {
      try {
        const job = await cyclogramApi.job(pending.jobId);
        if (cancelled) return;
        setJobProgress(job.progress);
        if (ACTIVE_STATUSES.has(job.status)) {
          timer = window.setTimeout(poll, 1_800);
          return;
        }
        await finishJob(job, pending);
      } catch (cause) {
        if (cancelled) return;
        if (cause instanceof ApiRequestError && (cause.status === 0 || cause.status >= 500)) {
          timer = window.setTimeout(poll, 4_000);
          return;
        }
        setPending(null);
        showError(cause);
      }
    };
    void poll();
    return () => { cancelled = true; if (timer !== undefined) window.clearTimeout(timer); };
  }, [finishJob, pending, showError]);

  const saveNow = useCallback((): Promise<boolean> => {
    if (savePromiseRef.current) return savePromiseRef.current;
    const current = documentRef.current;
    const base = persistedRef.current;
    if (!current || !base || current.id !== base.id) return Promise.resolve(false);
    let cells;
    try { cells = changedCells(base.content, current.content); } catch { return Promise.resolve(false); }
    if (cells.length === 0) {
      setSaveState("saved");
      return Promise.resolve(true);
    }
    setSaveState("saving");
    const promise = cyclogramApi.save(current.id, base.version, cells).then(response => {
      if (!isCyclogramDocument(response)) throw new Error("INVALID_CYCLOGRAM_DOCUMENT");
      persistedRef.current = response;
      setPersisted(response);
      setDocument(previous => previous?.id === response.id ? { ...previous, version: response.version, updated_at: response.updated_at } : previous);
      setConflict(false);
      const latest = documentRef.current;
      const remaining = latest?.id === response.id ? changedCells(response.content, latest.content) : [];
      if (remaining.length === 0) {
        setSaveState("saved");
        if (user?.userId) window.localStorage.removeItem(draftKey(user.userId, response.id));
      } else setSaveState("unsaved");
      return true;
    }).catch(cause => {
      setSaveState("error");
      if (cause instanceof ApiRequestError && cause.status === 409) setConflict(true);
      else showError(cause, copy.saveError);
      return false;
    }).finally(() => { savePromiseRef.current = null; });
    savePromiseRef.current = promise;
    return promise;
  }, [copy.saveError, showError, user?.userId]);

  const flushSaves = useCallback(async (): Promise<boolean> => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (!(await saveNow())) return false;
      const current = documentRef.current;
      const base = persistedRef.current;
      if (!current || !base || current.id !== base.id) return false;
      try {
        if (changedCells(base.content, current.content).length === 0) return true;
      } catch {
        return false;
      }
    }
    return false;
  }, [saveNow]);

  useEffect(() => {
    if (conflict || !document || !persisted || document.id !== persisted.id) return;
    let changes;
    try { changes = changedCells(persisted.content, document.content); } catch { return; }
    if (changes.length === 0) return;
    setSaveState(previous => previous === "saving" ? previous : "unsaved");
    if (user?.userId) {
      try {
        window.localStorage.setItem(draftKey(user.userId, document.id), JSON.stringify({ version: persisted.version, content: document.content }));
      } catch {
        setError(copy.draftWarning);
      }
    }
    const timer = window.setTimeout(() => { void saveNow(); }, 900);
    return () => window.clearTimeout(timer);
  }, [conflict, copy.draftWarning, document, persisted, saveNow, user?.userId]);

  useEffect(() => {
    if (!selectedCell) return;
    const frame = window.requestAnimationFrame(() => editorRef.current?.focus());
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && pending?.type !== "cell") setSelectedCell(null); };
    globalThis.document.addEventListener("keydown", close);
    return () => { window.cancelAnimationFrame(frame); globalThis.document.removeEventListener("keydown", close); };
  }, [pending?.type, selectedCell]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!config || pending) return;
    const normalized = normalizeInput(input);
    setInput(normalized);
    if (validateInput(normalized)) {
      setError(copy.required);
      return;
    }
    if (balance !== null && balance < config.token_cost) {
      setError(copy.insufficient);
      return;
    }
    setError(null);
    try {
      const job = await cyclogramApi.generate(normalized);
      setPending({ jobId: job.id, type: "generate" });
    } catch (cause) { showError(cause); }
  };

  const suggestTopics = async () => {
    if (!config || pending) return;
    const normalized = normalizeInput(input);
    if (!normalized.group_id || !normalized.language || !weekDates(normalized.week_start).length) {
      setError(copy.required);
      return;
    }
    if (balance !== null && balance < config.topic_token_cost) {
      setError(copy.insufficient);
      return;
    }
    setTopics([]);
    setError(null);
    try {
      const job = await cyclogramApi.topics({ age: normalized.age, group_id: normalized.group_id, language: normalized.language, week_start: normalized.week_start });
      setPending({ jobId: job.id, type: "topics" });
    } catch (cause) { setTopics(null); showError(cause); }
  };

  const selectCell = (sectionId: string, day: number) => {
    if (!document) return;
    const text = document.content.rows.find(row => row.section_id === sectionId)?.cells[day] ?? "";
    setSelectedCell({ sectionId, day, original: text });
    setEditorText(text);
  };

  const editCell = (value: string) => {
    setEditorText(value);
    setDocument(previous => previous ? { ...previous, content: replaceCell(previous.content, selectedCell?.sectionId ?? "", selectedCell?.day ?? -1, value) } : previous);
  };

  const aiCellAction = async (action: CellAction) => {
    if (!selectedCell || pending || !config) return;
    if (balance !== null && balance < config.cell_token_cost) {
      setError(copy.insufficient);
      return;
    }
    if (!(await flushSaves())) return;
    const base = persistedRef.current;
    if (!base) return;
    setError(null);
    try {
      const job = await cyclogramApi.cell(base.id, base.version, selectedCell.sectionId, selectedCell.day, action);
      setPending({ jobId: job.id, type: "cell", documentId: base.id, sectionId: selectedCell.sectionId, dayIndex: selectedCell.day });
    } catch (cause) { showError(cause); }
  };

  const openHistory = () => {
    setView("history");
    setError(null);
    if (!historyLoaded) void loadHistory(0);
  };

  const adapt = (source: CyclogramInput & { id: string }) => {
    setInput({ ...inputFromDocument(source), week_start: nextWeek(source.week_start), source_id: source.id });
    setView("create");
    setError(null);
    setSelectedCell(null);
  };

  const openDocument = async (id: string) => {
    setHistoryError(null);
    try { await fetchDocument(id); } catch (cause) { setHistoryError(teacherFacingErrorMessage(cause, language, { fallback: copy.error })); }
  };

  const exportDocument = async (format: "docx" | "pdf") => {
    if (!document || downloading) return;
    if (!(await flushSaves())) return;
    setDownloading(format);
    try {
      const blob = await cyclogramApi.export(document.id, format);
      saveBlob(blob, `${safeFilePart(document.weekly_theme)}_${document.week_start}.${format}`);
    } catch (cause) { showError(cause); }
    finally { setDownloading(null); }
  };

  const printDocument = async () => {
    if (!(await flushSaves())) return;
    window.print();
  };

  const reloadDocument = async () => {
    if (!document) return;
    try {
      if (user?.userId) window.localStorage.removeItem(draftKey(user.userId, document.id));
      setConflict(false);
      await fetchDocument(document.id, false);
    } catch (cause) { showError(cause); }
  };

  if (configLoading) {
    return <div className="flex min-h-72 items-center justify-center" aria-live="polite"><div className="text-center"><span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-teal-600 border-r-transparent" /><p className="mt-3 text-sm font-semibold text-slate-600">{copy.configLoading}</p></div></div>;
  }
  if (!config) {
    return <div className="mx-auto max-w-2xl border-l-4 border-rose-500 bg-rose-50 px-5 py-6 text-rose-900"><p className="font-bold">{configError || copy.error}</p><button type="button" onClick={() => window.location.reload()} className="mt-3 font-bold underline">{copy.retry}</button></div>;
  }

  const selectedSection = selectedCell && document?.sections.find(section => section.id === selectedCell.sectionId);
  const selectedDayLabel = selectedCell && document ? weekdayLabels(document, copy)[selectedCell.day] : "";
  const progressText = jobProgress?.message || (pending?.type === "cell" ? copy.cellLoading : pending?.type === "topics" ? copy.topicLoading : copy.loading);
  const selectedDocumentCopy = generatedContentCopy(
    tryNormalizeContentLanguage(
      cyclogramDisplayLanguage(view, input.language, document?.language),
    ) ?? language,
  ).cyclogram;

  return (
    <div className="mx-auto max-w-[1500px] bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
      <nav className="cyclogram-no-print mb-6 flex flex-wrap gap-1 border-b border-slate-200" aria-label={copy.create}>
        <button type="button" onClick={() => setView("create")} aria-current={view === "create" ? "page" : undefined} className={`min-h-11 border-b-2 px-4 text-sm font-bold ${view === "create" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{copy.createTab}</button>
        <button type="button" onClick={openHistory} aria-current={view === "history" ? "page" : undefined} className={`min-h-11 border-b-2 px-4 text-sm font-bold ${view === "history" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{copy.history}</button>
        {document ? <button type="button" onClick={() => setView("document")} aria-current={view === "document" ? "page" : undefined} className={`min-h-11 border-b-2 px-4 text-sm font-bold ${view === "document" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{copy.ready}</button> : null}
      </nav>

      {pending && view !== "create" ? <div className="cyclogram-no-print mb-5 flex items-center gap-3 border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950" aria-live="polite"><span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-600 border-r-transparent" /><span><strong>{progressText}</strong>{jobProgress?.total ? ` · ${jobProgress.current ?? 0}/${jobProgress.total}` : ""}</span></div> : null}

      {view === "create" ? <FormView copy={copy} config={config} input={input} setInput={setInput} balance={balance} busy={Boolean(pending)} error={error} pendingType={pending?.type ?? null} onSubmit={submit} onTopics={() => void suggestTopics()} onCancelSource={() => setInput(previous => ({ ...previous, source_id: undefined }))} /> : null}
      {view === "history" ? <HistoryView copy={copy} items={history} total={historyTotal} loading={historyLoading} error={historyError} search={historySearch} setSearch={setHistorySearch} onOpen={id => void openDocument(id)} onAdapt={adapt} onLoadMore={() => void loadHistory(history.length)} /> : null}
      {view === "document" && document ? <DocumentView copy={copy} language={language} document={document} mobileDay={mobileDay} setMobileDay={setMobileDay} saveState={saveState} conflict={conflict} error={error} pendingCell={pending?.type === "cell"} downloading={downloading} onSelectCell={selectCell} onBack={() => setView("create")} onAdapt={() => adapt(document)} onExport={format => void exportDocument(format)} onPrint={() => void printDocument()} onReload={() => void reloadDocument()} onRetrySave={() => void saveNow()} /> : null}

      <p className="cyclogram-no-print mt-8 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">{selectedDocumentCopy.regulatory}</p>

      {topics !== null ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && pending?.type !== "topics") setTopics(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="cyclogram-topics-title" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl sm:rounded-lg sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><h2 id="cyclogram-topics-title" className="text-xl font-bold text-slate-950">{copy.topicChoice}</h2><p className="mt-1 text-sm text-slate-500">{input.age} {copy.years}</p></div><button type="button" onClick={() => setTopics(null)} disabled={pending?.type === "topics"} aria-label={copy.close} className="h-10 w-10 text-2xl text-slate-500 disabled:opacity-40">×</button></div>
            {pending?.type === "topics" ? <div className="flex min-h-40 items-center justify-center gap-3 text-sm font-semibold text-slate-600"><span className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-r-transparent" />{copy.topicLoading}</div> : <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">{topics.map((topic, index) => <button key={`${topic}-${index}`} type="button" onClick={() => { setInput(previous => ({ ...previous, weekly_theme: topic })); setTopics(null); }} className="flex min-h-12 w-full items-center gap-3 px-2 py-3 text-left text-sm font-semibold text-slate-900 hover:bg-teal-50"><span className="w-6 shrink-0 text-xs text-slate-400">{index + 1}</span><span>{topic}</span></button>)}</div>}
          </section>
        </div>
      ) : null}

      {selectedCell && document ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && pending?.type !== "cell") setSelectedCell(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="cyclogram-cell-title" className="w-full max-w-3xl bg-white p-5 shadow-2xl sm:rounded-lg sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><h2 id="cyclogram-cell-title" className="text-xl font-bold text-slate-950">{copy.cellTitle}</h2><p className="mt-1 text-sm text-slate-500">{selectedSection ? localizedLabel(selectedSection.title, document.language, language) : selectedCell.sectionId} · <span className="capitalize">{selectedDayLabel}</span></p></div><button type="button" onClick={() => setSelectedCell(null)} disabled={pending?.type === "cell"} aria-label={copy.close} className="h-10 w-10 text-2xl text-slate-500 disabled:opacity-40">×</button></div>
            <p className="mt-4 text-sm text-slate-600">{copy.cellHint}</p>
            <textarea ref={editorRef} value={editorText} onChange={event => editCell(event.target.value)} disabled={pending?.type === "cell"} className="mt-3 min-h-48 w-full resize-y rounded-lg border border-slate-300 p-4 text-sm leading-6 text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100" />
            {pending?.type === "cell" ? <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-sky-800"><span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-600 border-r-transparent" />{copy.cellLoading}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {(["regenerate", "shorten", "expand", "other_game"] as CellAction[]).map(action => <button key={action} type="button" onClick={() => void aiCellAction(action)} disabled={Boolean(pending)} className="min-h-10 rounded-lg border border-teal-700 bg-white px-3 text-sm font-bold text-teal-800 hover:bg-teal-50 disabled:opacity-40">{copy[action]}</button>)}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4"><p className="text-xs text-slate-500">{copy.cellPrice}: {config.cell_token_cost} {copy.token}</p><div className="flex gap-2"><button type="button" onClick={() => editCell(selectedCell.original)} disabled={Boolean(pending)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700 disabled:opacity-40">↶ {copy.undo}</button><button type="button" onClick={() => setSelectedCell(null)} disabled={pending?.type === "cell"} className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-40">{copy.close}</button></div></div>
          </section>
        </div>
      ) : null}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #cyclogram-print-root, #cyclogram-print-root * { visibility: visible !important; }
          #cyclogram-print-root { position: absolute; inset: 0; width: 100%; }
          .cyclogram-no-print, .cyclogram-mobile-table { display: none !important; }
          .cyclogram-desktop-table { display: block !important; overflow: visible !important; }
          #cyclogram-print-root table { min-width: 0 !important; font-size: 8pt !important; }
          #cyclogram-print-root tr { break-inside: avoid; }
          #cyclogram-print-root button { min-height: 0 !important; padding: 5px !important; }
          @page { size: landscape; margin: 8mm; }
        }
      `}</style>
    </div>
  );
}
