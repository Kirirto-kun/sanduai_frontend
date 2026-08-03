"use client";

import { useId, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { downloadExport, getDownloadFilename } from "@/lib/presentations-api";
import { useCreateExport, usePresentationExports } from "@/hooks/usePresentations";
import type { PresentationMode } from "@/types/presentations";
import { getPresentationCopy } from "../copy";
import { isSlidesNotReadyError, presentationErrorMessage } from "../error-copy";
import { useModalDialog } from "../PresentationUI";

type ExportErrorState = {
  userMessage: string;
  returnToSlides: boolean;
};

function slidesAreNotReady(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized === "slides_not_ready" ||
    normalized.includes("all slides must be generated before export") ||
    (normalized.includes("slide") && normalized.includes("generated") && normalized.includes("export"))
  );
}

function friendlyExportError(
  caught: unknown,
  copy: ReturnType<typeof getPresentationCopy>,
): ExportErrorState {
  if (isSlidesNotReadyError(caught)) {
    return { userMessage: copy.exportSlidesNotReady, returnToSlides: true };
  }
  return { userMessage: presentationErrorMessage(caught, copy), returnToSlides: false };
}

export default function ExportDialog({
  presentationId,
  mode,
  open,
  onClose,
}: {
  presentationId: string;
  mode: PresentationMode;
  open: boolean;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const titleId = useId();
  const exportsQuery = usePresentationExports(open ? presentationId : null);
  const createMutation = useCreateExport();
  const [format, setFormat] = useState<"pptx" | "pdf">("pptx");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<ExportErrorState | null>(null);
  const dialogRef = useModalDialog(open, onClose, createMutation.isPending);

  if (!open) return null;

  const create = async () => {
    setError(null);
    try {
      await createMutation.mutateAsync({
        presentationId,
        input: { format, variant: mode === "creative" || format === "pdf" ? "image" : "editable" },
      });
    } catch (caught) {
      setError(friendlyExportError(caught, copy));
    }
  };

  const download = async (exportId: string, itemFormat: string, filename?: string) => {
    setDownloadingId(exportId);
    setError(null);
    try {
      const blob = await downloadExport(presentationId, exportId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = getDownloadFilename(filename, `presentation.${itemFormat}`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (caught) {
      setError(friendlyExportError(caught, copy));
    } finally {
      setDownloadingId(null);
    }
  };

  const formatOptions = [
    {
      value: "pptx" as const,
      badge: "P",
      title: mode === "classic" ? copy.editablePptx : copy.imagePresentation,
      description: mode === "classic" ? copy.exportPowerPointDescription : copy.exportCreativePowerPointDescription,
      selectedClass: "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500",
      badgeClass: "bg-emerald-600 text-white",
    },
    {
      value: "pdf" as const,
      badge: "PDF",
      title: copy.exportPdfLabel,
      description: copy.exportPdfNotice,
      selectedClass: "border-rose-400 bg-rose-50 ring-1 ring-rose-400",
      badgeClass: "bg-rose-600 text-white",
    },
  ];
  const pendingExport = exportsQuery.data?.some((item) =>
    item.format === format && ["queued", "running", "processing"].includes(item.status.toLowerCase()),
  ) ?? false;
  const exportIsBeingPrepared = pendingExport || (createMutation.isSuccess && exportsQuery.isFetching);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && !createMutation.isPending && onClose()}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-2xl font-bold text-slate-950">{copy.exportTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{copy.exportSubtitle}</p>
          </div>
          <button type="button" onClick={onClose} disabled={createMutation.isPending} aria-label={copy.close} className="min-h-11 min-w-11 rounded-xl border border-slate-200 text-lg text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-40">×</button>
        </div>

        <fieldset className="mt-6">
          <legend className="sr-only">{copy.exportFormat}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {formatOptions.map((option) => {
              const selected = format === option.value;
              return (
                <label
                  key={option.value}
                  className={`relative flex min-h-32 cursor-pointer gap-3 rounded-2xl border p-4 transition focus-within:outline-none focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-2 ${
                    selected ? option.selectedClass : "border-slate-200 bg-white hover:border-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="export-format"
                    checked={selected}
                    onChange={() => setFormat(option.value)}
                  />
                  <span className={`flex h-11 min-w-11 items-center justify-center rounded-xl px-2 text-xs font-black ${option.badgeClass}`} aria-hidden="true">
                    {option.badge}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900">{option.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{option.description}</span>
                  </span>
                  <span className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-transparent"}`} aria-hidden="true">✓</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {mode === "creative" && <p className="mt-4 text-xs leading-5 text-slate-500">{copy.exportCreativeNotice}</p>}

        {error && (
          <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
            <p className="text-sm font-semibold leading-6">{error.userMessage}</p>
            {error.returnToSlides && (
              <button type="button" onClick={onClose} className="mt-3 min-h-11 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2">
                {copy.exportReturnToSlides}
              </button>
            )}
          </div>
        )}
        {exportIsBeingPrepared && !error && (
          <p role="status" className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-900">{copy.exportQueuedHint}</p>
        )}
        <button type="button" onClick={() => void create()} disabled={createMutation.isPending || pendingExport} className="mt-6 min-h-13 w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:opacity-50">{createMutation.isPending || pendingExport ? copy.preparingExport : copy.startExport}</button>

        <section className="mt-7 border-t border-slate-100 pt-5" aria-labelledby="ready-exports-title">
          <h3 id="ready-exports-title" className="text-sm font-bold text-slate-900">{copy.readyFiles}</h3>
          {exportsQuery.isLoading ? (
            <div className="mt-3 h-14 animate-pulse rounded-xl bg-slate-100" />
          ) : exportsQuery.data?.length ? (
            <ul className="mt-3 space-y-2">
              {exportsQuery.data.map((item) => {
                const id = item.export_id ?? item.id;
                const ready = item.status === "ready" || item.status === "completed";
                return (
                  <li key={id} className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{item.filename || (item.format === "pptx" ? (mode === "classic" ? copy.editablePptx : copy.imagePresentation) : copy.exportPdfLabel)}</p>
                      <p className={`text-xs ${item.status === "failed" ? "text-rose-700" : "text-slate-500"}`}>{ready ? copy.statusReady : item.status === "failed" ? (slidesAreNotReady(item.error_message ?? "") ? copy.exportSlidesNotReady : copy.statusFailed) : copy.preparingExport}</p>
                    </div>
                    {ready && <button type="button" onClick={() => void download(id, item.format, item.filename)} disabled={downloadingId === id} className="min-h-11 rounded-xl bg-white px-3 text-xs font-bold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50">{downloadingId === id ? copy.loading : copy.download}</button>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{copy.noExports}</p>
          )}
        </section>
      </div>
    </div>
  );
}
