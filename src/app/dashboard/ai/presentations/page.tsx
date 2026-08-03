"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { useDeletePresentation, usePresentationsList } from "@/hooks/usePresentations";
import type { PresentationMode, PresentationProject } from "@/types/presentations";
import PresentationCard from "@/components/presentations/PresentationCard";
import { ConfirmDialog, ErrorNotice } from "@/components/presentations/PresentationUI";
import { getPresentationCopy } from "@/components/presentations/copy";
import { presentationErrorMessage } from "@/components/presentations/error-copy";

function ModeCard({ mode }: { mode: PresentationMode }) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const creative = mode === "creative";
  const features = creative
    ? [copy.creativeFeatureOne, copy.creativeFeatureTwo, copy.creativeFeatureThree]
    : [copy.classicFeatureOne, copy.classicFeatureTwo, copy.classicFeatureThree];
  return (
    <article
      className={`relative isolate overflow-hidden rounded-[2rem] border p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-8 ${
        creative
          ? "border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-amber-50"
          : "border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-emerald-50"
      }`}
    >
      <div
        aria-hidden="true"
        className={`absolute -right-20 -top-20 -z-10 h-56 w-56 rounded-full blur-3xl ${
          creative ? "bg-violet-300/35" : "bg-cyan-300/35"
        }`}
      />
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-lg ${
          creative
            ? "bg-gradient-to-br from-violet-600 to-fuchsia-500"
            : "bg-gradient-to-br from-sky-600 to-emerald-500"
        }`}
        aria-hidden="true"
      >
        {creative ? "✦" : "▦"}
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
        {creative ? copy.creativeTitle : copy.classicTitle}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
        {creative ? copy.creativeDescription : copy.classicDescription}
      </p>
      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
            <span
              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                creative ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"
              }`}
              aria-hidden="true"
            >
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={`/dashboard/ai/presentations/create?mode=${mode}`}
        className={`mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-bold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto ${
          creative
            ? "bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500"
            : "bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-500"
        }`}
      >
        {creative ? copy.chooseCreative : copy.chooseClassic}
        <span className="ml-2" aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

export default function PresentationsPage() {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const projectsQuery = usePresentationsList();
  const deleteMutation = useDeletePresentation();
  const [deleteTarget, setDeleteTarget] = useState<PresentationProject | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (caught) {
      setDeleteError(presentationErrorMessage(caught, copy));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-8">
      <header className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 px-6 py-8 shadow-sm backdrop-blur sm:px-10 sm:py-10">
        <div aria-hidden="true" className="absolute right-0 top-0 h-48 w-48 rounded-full bg-orange-200/25 blur-3xl" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--primary)]">
          {copy.newPresentation}
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {copy.hubTitle}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          {copy.hubSubtitle}
        </p>
      </header>

      <section aria-label={copy.newPresentation} className="grid gap-5 lg:grid-cols-2">
        <ModeCard mode="classic" />
        <ModeCard mode="creative" />
      </section>

      <section aria-labelledby="presentation-projects-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="presentation-projects-title" className="text-2xl font-bold tracking-tight text-slate-950">
              {copy.recentTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{copy.recentSubtitle}</p>
          </div>
          {projectsQuery.data?.items.length ? (
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
              {projectsQuery.data.total ?? projectsQuery.data.items.length}
            </span>
          ) : null}
        </div>

        {deleteError && <div className="mb-4"><ErrorNotice message={deleteError} /></div>}

        {projectsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite" aria-busy="true">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-3xl bg-white/70 ring-1 ring-slate-200" />
            ))}
          </div>
        ) : projectsQuery.isError ? (
          <ErrorNotice message={copy.genericError} onRetry={() => projectsQuery.refetch()} />
        ) : projectsQuery.data?.items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projectsQuery.data.items.map((project) => (
              <PresentationCard
                key={project.id}
                presentation={project}
                deleting={deleteMutation.isPending}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/55 px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl" aria-hidden="true">▤</div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{copy.emptyTitle}</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{copy.emptyDescription}</p>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={copy.deleteTitle}
        body={copy.deleteBody}
        confirmLabel={copy.confirmDelete}
        cancelLabel={copy.cancel}
        dangerous
        busy={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
      />
    </div>
  );
}
