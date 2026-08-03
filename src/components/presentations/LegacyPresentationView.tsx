"use client";

import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePresentationExports } from "@/hooks/usePresentations";
import {
  downloadExport,
  getDownloadFilename,
} from "@/lib/presentations-api";
import type { PresentationExport, PresentationProject } from "@/types/presentations";
import { getPresentationCopy } from "./copy";
import { presentationErrorMessage } from "./error-copy";
import { isLegacySourceMissing } from "./legacy-utils";
import { ProjectStatusBadge } from "./PresentationUI";

function readableSize(bytes: number | undefined, locale: string) {
  if (!bytes || bytes < 1) return null;
  if (bytes < 1024) return `${bytes.toLocaleString(locale)} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toLocaleString(locale, { maximumFractionDigits: 1 })} KB`;
  return `${(bytes / 1024 ** 2).toLocaleString(locale, { maximumFractionDigits: 1 })} MB`;
}

function exportFallbackName(project: PresentationProject, item: PresentationExport) {
  const safeTitle = project.title.trim() || "presentation";
  return `${safeTitle}.${item.format.toLowerCase()}`;
}

export default function LegacyPresentationView({ project }: { project: PresentationProject }) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const sourceMissing = isLegacySourceMissing(project);
  const exportsQuery = usePresentationExports(sourceMissing ? null : project.id);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const locale = language === "kk" ? "kk-KZ" : "ru-RU";
  const text = language === "kk"
    ? {
        eyebrow: "Ескі презентациялар мұрағаты",
        title: "Тек оқуға арналған презентация",
        explanation:
          "Бұл жоба бұрынғы сервистен көшірілді. Мазмұны өзгертілмейді және қайта жасалмайды; тек сақталған түпнұсқа файлдарды жүктеуге болады.",
        missingTitle: "Бастапқы презентация табылмады",
        missingBody:
          "Сақталған сілтеме жоғалмауы үшін мұрағат жазбасы қалдырылды, бірақ көшіру кезінде бастапқы файл болмаған. Бұл бет күтуде қалмайды және жасалу әрекетін бастамайды.",
        metadata: "Мұрағат деректері",
        topic: "Атауы",
        subject: "Пән",
        grade: "Сынып",
        language: "Тіл",
        slides: "Слайд саны",
        imported: "Көшірілген күні",
        legacyId: "Бұрынғы жоба ID",
        notSpecified: "Көрсетілмеген",
        originalFiles: "Сақталған түпнұсқа файлдар",
        filesHelp: "Бұл — көшіру кезінде табылған өзгертілмеген PPTX/PDF файлдары.",
        noFiles: "Көшіру кезінде жүктеуге болатын PPTX немесе PDF табылмады.",
        file: "Түпнұсқа",
        unavailable: "Файл қолжетімсіз",
        retryFiles: "Файлдар тізімін қайталау",
        artifactCount: "Табылған мұрағат артефактілері",
      }
    : {
        eyebrow: "Архив старых презентаций",
        title: "Презентация только для чтения",
        explanation:
          "Этот проект перенесён из прежнего сервиса. Его нельзя редактировать или генерировать заново — доступны только сохранённые оригинальные файлы.",
        missingTitle: "Исходная презентация не найдена",
        missingBody:
          "Архивная запись сохранена, чтобы старые ссылки не пропали, но на момент переноса исходника уже не было. Эта страница не ждёт генерацию и не запускает никаких задач.",
        metadata: "Данные архива",
        topic: "Название",
        subject: "Предмет",
        grade: "Класс",
        language: "Язык",
        slides: "Количество слайдов",
        imported: "Дата переноса",
        legacyId: "ID прежнего проекта",
        notSpecified: "Не указано",
        originalFiles: "Сохранённые оригинальные файлы",
        filesHelp: "Это неизменённые PPTX/PDF, найденные во время переноса.",
        noFiles: "При переносе не найдено доступного для скачивания PPTX или PDF.",
        file: "Оригинал",
        unavailable: "Файл недоступен",
        retryFiles: "Повторить загрузку списка",
        artifactCount: "Найдено архивных артефактов",
      };
  const originalExports = (exportsQuery.data ?? []).filter(
    (item) => item.variant === "legacy_original",
  );
  const importedAt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(project.updated_at ?? project.created_at));
  const metadata = [
    [text.topic, project.title],
    [text.subject, project.subject],
    [text.grade, project.grade],
    [text.language, project.language === "kk" ? "Қазақша" : project.language === "ru" ? "Русский" : project.language],
    [text.slides, String(project.slide_count ?? 0)],
    [text.imported, importedAt],
    [text.legacyId, project.legacy_presenton_id],
    [text.artifactCount, String(project.artifacts?.length ?? 0)],
  ] as const;

  const download = async (item: PresentationExport) => {
    const id = item.export_id ?? item.id;
    setDownloadingId(id);
    setDownloadError(null);
    try {
      const blob = await downloadExport(project.id, id);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = getDownloadFilename(
        item.filename,
        exportFallbackName(project, item),
      );
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (error) {
      setDownloadError(presentationErrorMessage(error, copy));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-slate-500 via-slate-300 to-amber-300" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
              {text.eyebrow}
            </span>
            <ProjectStatusBadge status="legacy_read_only" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {project.title || text.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            {text.explanation}
          </p>
        </div>
      </header>

      {sourceMissing && (
        <section role="status" className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl text-amber-800 ring-1 ring-amber-200">!</span>
            <div>
              <h2 className="text-lg font-bold text-amber-950">{text.missingTitle}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">{text.missingBody}</p>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <section aria-labelledby="legacy-metadata-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 id="legacy-metadata-title" className="text-lg font-bold text-slate-950">{text.metadata}</h2>
          <dl className="mt-5 divide-y divide-slate-100">
            {metadata.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
                <dt className="text-sm font-medium text-slate-500">{label}</dt>
                <dd className="break-words text-sm font-semibold text-slate-900">{value || text.notSpecified}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="legacy-files-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 id="legacy-files-title" className="text-lg font-bold text-slate-950">{text.originalFiles}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{text.filesHelp}</p>

          {downloadError && (
            <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {downloadError}
            </p>
          )}

          {sourceMissing ? (
            <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{text.noFiles}</p>
          ) : exportsQuery.isLoading ? (
            <div className="mt-5 space-y-2" aria-busy="true" aria-label={copy.loading}>
              <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : exportsQuery.isError ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-rose-800">{copy.genericError}</p>
              <button type="button" onClick={() => exportsQuery.refetch()} className="mt-3 min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
                {text.retryFiles}
              </button>
            </div>
          ) : originalExports.length ? (
            <ul className="mt-5 space-y-2">
              {originalExports.map((item) => {
                const id = item.export_id ?? item.id;
                const ready = item.status === "completed" || item.status === "ready";
                const artifact = project.artifacts?.find((entry) => entry.kind === item.format);
                const size = readableSize(artifact?.size ?? item.size_bytes, locale);
                return (
                  <li key={id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {text.file} · {item.format.toUpperCase()}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[size, ready ? copy.statusReady : text.unavailable].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {ready && (
                      <button type="button" onClick={() => void download(item)} disabled={downloadingId === id} className="min-h-11 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50">
                        {downloadingId === id ? copy.loading : copy.download}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{text.noFiles}</p>
          )}
        </section>
      </div>
    </div>
  );
}
