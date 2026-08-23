"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import {
  ApiError,
  StreamingDownloadRequiredError,
  downloadLibraryFile,
  getLibraryContentItem,
} from "../api";
import {
  ASSET_ROLE_LABELS,
  CONTENT_LANGUAGE_LABELS,
  MATERIAL_TYPE_CONFIG,
  SEGMENT_LABELS,
  localize,
} from "../config";
import type { ContentItem } from "../types";
import { ContentPreview } from "./ContentPreview";

type ContentDetailsDialogProps = {
  item: ContentItem;
  onClose: () => void;
};

function formatBytes(bytes: number, language: "ru" | "kk"): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = language === "kk" ? ["Б", "КБ", "МБ", "ГБ"] : ["Б", "КБ", "МБ", "ГБ"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.getAttribute("aria-hidden") !== "true");
}

export function ContentDetailsDialog({ item, onClose }: ContentDetailsDialogProps) {
  const { language } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedVisualId, setSelectedVisualId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["library-content-detail", item.id],
    queryFn: ({ signal }) => getLibraryContentItem(item.id, signal),
  });
  const content = detailQuery.data ?? item;
  const assets = useMemo(
    () => [...(content.assets ?? [])].sort((left, right) => left.sort_order - right.sort_order),
    [content.assets],
  );
  const visualAssets = assets.filter((asset) => asset.role === "visual");
  const downloadableAssets = assets.filter((asset) => asset.role !== "preview");
  const selectedVisual = visualAssets.find((asset) => asset.id === selectedVisualId) ?? visualAssets[0];
  const config = MATERIAL_TYPE_CONFIG[content.material_type];
  const subjectLabel = content.subject_option
    ? language === "kk" && content.subject_option.name_kk
      ? content.subject_option.name_kk
      : content.subject_option.name
    : content.subject;

  useEffect(() => {
    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = focusableElements(dialogRef.current);
      if (focusable.length === 0) return;
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
      previousActiveElement?.focus();
    };
  }, [onClose]);

  const download = async (url: string, filename: string, downloadKey: string) => {
    setDownloading(downloadKey);
    setDownloadError(null);
    try {
      await downloadLibraryFile(url, filename);
    } catch (error) {
      setDownloadError(
        error instanceof StreamingDownloadRequiredError
          ? language === "kk"
            ? "Бұл үлкен файлды қауіпсіз жүктеу үшін Chrome немесе Edge браузерін қолданыңыз."
            : "Для безопасного скачивания этого большого файла используйте Chrome или Edge."
          : error instanceof ApiError
          ? teacherFacingErrorMessage(error, language, {
              fallback: language === "kk"
                ? "Файлды жүктеу мүмкін болмады. Қайталап көріңіз."
                : "Не удалось скачать файл. Попробуйте ещё раз.",
            })
          : language === "kk"
            ? "Файлды жүктеу мүмкін болмады. Қайталап көріңіз."
            : "Не удалось скачать файл. Попробуйте ещё раз.",
      );
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`content-dialog-title-${content.id}`}
        aria-describedby={`content-dialog-description-${content.id}`}
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-orange-700">
              <span aria-hidden="true">{config.icon}</span>
              <span>{localize(config.label, language)}</span>
              {subjectLabel && <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{subjectLabel}</span>}
            </div>
            <h2 id={`content-dialog-title-${content.id}`} className="mt-1 text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">
              {content.title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label={language === "kk" ? "Жабу" : "Закрыть"}
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {detailQuery.isLoading && (
            <div role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-xs font-medium text-orange-800">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-orange-500 border-r-transparent" />
              {language === "kk" ? "Файлдар тізімі жүктелуде…" : "Загружается список файлов…"}
            </div>
          )}
          {detailQuery.isError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {detailQuery.error instanceof ApiError && detailQuery.error.status === 403
                ? language === "kk"
                  ? "Бұл материалға қол жеткізу үшін белсенді жазылым қажет."
                  : "Для доступа к этому материалу нужна активная подписка."
                : language === "kk"
                  ? "Материалдың толық мәліметтерін жүктеу мүмкін болмады."
                  : "Не удалось загрузить полную информацию о материале."}
            </div>
          )}

          <section aria-label={visualAssets.length > 0 ? (language === "kk" ? "Көрнекіліктер галереясы" : "Галерея наглядных материалов") : (language === "kk" ? "Материал мұқабасы" : "Обложка материала")}>
              <ContentPreview
                src={selectedVisual?.preview_url ?? content.preview_url}
                alt={selectedVisual?.original_filename ?? content.title}
                materialType={content.material_type}
                previewStatus={content.preview_status}
                language={language}
                sizes="(max-width: 1024px) 100vw, 900px"
                className="aspect-[16/9] w-full rounded-2xl border border-slate-200"
                fit="contain"
              />
              {visualAssets.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {visualAssets.map((asset, index) => (
                    <button
                      key={asset.id}
                      type="button"
                      aria-label={`${language === "kk" ? "Көрнекілік" : "Материал"} ${index + 1}: ${asset.original_filename}`}
                      aria-pressed={selectedVisual?.id === asset.id}
                      onClick={() => setSelectedVisualId(asset.id)}
                      className={`min-w-28 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                        selectedVisual?.id === asset.id
                          ? "border-orange-400 bg-orange-50 text-orange-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="block truncate">{index + 1}. {asset.original_filename}</span>
                    </button>
                  ))}
                </div>
              )}
          </section>

          <div className="mt-6">
            <p id={`content-dialog-description-${content.id}`} className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {content.description || (language === "kk" ? "Материал сипаттамасы берілмеген." : "Описание материала не добавлено.")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {content.segments.map((segment) => (
                <span key={segment} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {localize(SEGMENT_LABELS[segment], language)}
                </span>
              ))}
              {content.grades.map((grade) => (
                <span key={grade} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {grade} {language === "kk" ? "сынып" : "класс"}
                </span>
              ))}
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {localize(CONTENT_LANGUAGE_LABELS[content.language], language)}
              </span>
              {content.categories.map((category) => (
                <span key={category.id} className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                  {language === "kk" && category.name_kk ? category.name_kk : category.name}
                </span>
              ))}
            </div>
          </div>

          {downloadableAssets.length > 0 && (
            <section className="mt-7" aria-labelledby={`content-files-title-${content.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 id={`content-files-title-${content.id}`} className="text-base font-semibold text-slate-900">
                  {language === "kk" ? "Жүктеп алу файлдары" : "Файлы для скачивания"}
                </h3>
                {content.download_all_url && downloadableAssets.length > 1 && (
                  <button
                    type="button"
                    disabled={downloading !== null}
                    onClick={() => download(content.download_all_url!, `${content.title}.zip`, "all")}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {downloading === "all"
                      ? language === "kk" ? "Дайындалуда…" : "Подготовка…"
                      : language === "kk" ? "Барлығын жүктеу" : "Скачать всё"}
                  </button>
                )}
              </div>

              <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {downloadableAssets.map((asset) => (
                  <li key={asset.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">
                          {localize(ASSET_ROLE_LABELS[asset.role], language)}
                        </span>
                        <span className="text-xs text-slate-400">{formatBytes(asset.file_size, language)}</span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-slate-800" title={asset.original_filename}>
                        {asset.original_filename}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={downloading !== null}
                      onClick={() => download(asset.download_url, asset.original_filename, asset.id)}
                      className="shrink-0 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-800 transition hover:bg-orange-100 disabled:opacity-50"
                    >
                      {downloading === asset.id
                        ? language === "kk" ? "Жүктелуде…" : "Скачивание…"
                        : language === "kk" ? "Жүктеу" : "Скачать"}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {downloadError && (
            <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {downloadError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
