"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PresentationMode } from "@/types/presentations";
import { ModeBadge } from "../PresentationUI";
import { getPresentationCopy } from "../copy";

export default function SlideToolbar({
  presentationId,
  title,
  mode,
  canExport,
  exportBlockedReason,
  onExport,
}: {
  presentationId: string;
  title: string;
  mode: PresentationMode;
  canExport: boolean;
  exportBlockedReason?: string;
  onExport: () => void;
}) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="max-w-xl truncate text-base font-bold text-slate-950 sm:text-lg">{title}</h1>
          <ModeBadge mode={mode} />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href={`/dashboard/ai/presentations/outline/${presentationId}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:text-sm">{copy.returnToPlan}</Link>
        <div className="text-right">
          <button type="button" onClick={onExport} disabled={!canExport} aria-describedby={!canExport && exportBlockedReason ? "presentation-export-help" : undefined} className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-40">{copy.export}</button>
          {!canExport && exportBlockedReason && <p id="presentation-export-help" className="mt-1 max-w-64 text-[11px] leading-4 text-slate-500">{exportBlockedReason}</p>}
        </div>
      </div>
    </div>
  );
}
