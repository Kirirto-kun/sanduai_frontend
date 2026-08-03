"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { fetchPresentationAsset } from "@/lib/presentations-api";
import type { PresentationMode, PresentationStatus, SlideStatus } from "@/types/presentations";
import { getPresentationCopy } from "./copy";

export function PresentationStepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const steps = [copy.stepSetup, copy.stepPlan, copy.stepGenerate, copy.stepReview];
  return (
    <nav aria-label={language === "kk" ? "Презентация қадамдары" : "Этапы презентации"}>
      <ol className="grid grid-cols-4 gap-1 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-sm backdrop-blur">
        {steps.map((step, index) => {
          const number = index + 1;
          const active = number === current;
          const complete = number < current;
          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-center text-[11px] font-semibold transition sm:text-xs ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : complete
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-400"
              }`}
            >
              <span
                className={`hidden h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] sm:flex ${
                  active ? "bg-white/15" : complete ? "bg-emerald-100" : "bg-slate-100"
                }`}
              >
                {complete ? "✓" : number}
              </span>
              <span>{step}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ModeBadge({ mode }: { mode: PresentationMode }) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        mode === "creative"
          ? "bg-violet-100 text-violet-800"
          : "bg-sky-100 text-sky-800"
      }`}
    >
      <span aria-hidden="true">{mode === "creative" ? "✦" : "▦"}</span>
      {mode === "creative" ? copy.modeCreative : copy.modeClassic}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: PresentationStatus }) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const normalized = status.toLowerCase();
  const value =
    normalized === "legacy_read_only"
      ? language === "kk"
        ? "Мұрағат · тек оқу"
        : "Архив · только чтение"
      : normalized === "draft"
      ? copy.statusDraft
      : normalized === "planning"
        ? copy.statusPlanning
        : normalized === "plan_ready" || normalized === "awaiting_approval"
          ? copy.statusPlanReady
          : normalized === "approved"
            ? copy.statusApproved
            : normalized === "queued" || normalized === "generating"
              ? copy.statusGenerating
              : normalized === "review_required" || normalized === "needs_review" || normalized === "partial_failed"
                ? copy.statusReview
                : normalized === "ready" || normalized === "completed"
                  ? copy.statusReady
                  : normalized === "cancelled"
                    ? copy.statusCancelled
                    : copy.statusFailed;
  const tone =
    normalized === "legacy_read_only"
      ? "bg-slate-100 text-slate-700 ring-slate-300"
      : normalized === "ready" || normalized === "completed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : normalized === "failed" || normalized === "error" || normalized === "partial_failed"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : normalized === "review_required" || normalized === "needs_review"
          ? "bg-amber-50 text-amber-800 ring-amber-200"
          : normalized === "cancelled"
            ? "bg-slate-100 text-slate-600 ring-slate-200"
            : "bg-blue-50 text-blue-700 ring-blue-200";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${tone}`}>{value}</span>;
}

export function SlideStatusDot({ status }: { status: SlideStatus }) {
  const normalized = status.toLowerCase();
  const color =
    normalized === "accepted" || normalized === "ready"
      ? "bg-emerald-500"
      : normalized === "failed"
        ? "bg-rose-500"
        : normalized === "needs_review"
          ? "bg-amber-500"
          : normalized === "generating" || normalized === "uploading" || normalized === "qa"
            ? "animate-pulse bg-blue-500"
            : "bg-slate-300";
  return <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />;
}

export function useModalDialog(open: boolean, onClose: () => void, locked = false) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const lockedRef = useRef(locked);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      (first ?? dialogRef.current)?.focus();
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !lockedRef.current) {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) {
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
    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open]);

  return dialogRef;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  dangerous = false,
  busy = false,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  dangerous?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const titleId = useId();
  const dialogRef = useModalDialog(open, onClose, busy);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-7"
      >
        <h2 id={titleId} className="text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
        {children}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            className={`min-h-11 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ${
              dangerous
                ? "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500"
                : "bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-500"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProtectedImage({
  source,
  alt,
  className = "",
}: {
  source: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [state, setState] = useState<{ source?: string; url?: string; failed?: boolean }>({});

  useEffect(() => {
    if (!source) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    let disposed = false;
    void fetchPresentationAsset(source, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (!disposed) setState({ source, url: objectUrl });
      })
      .catch((error) => {
        if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) {
          setState({ source, failed: true });
        }
      });
    return () => {
      disposed = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  const current = state.source === source ? state : {};
  if (!source) return null;
  if (current.failed) {
    return <div className={`flex items-center justify-center bg-slate-100 text-sm text-slate-500 ${className}`}>{alt}</div>;
  }
  if (!current.url) return <div className={`animate-pulse bg-slate-100 ${className}`} aria-label={alt} />;
  // Authenticated object URLs cannot be passed through the Next image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={current.url} alt={alt} className={className} />;
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-11 rounded-xl bg-white px-4 font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          {copy.retry}
        </button>
      )}
    </div>
  );
}
