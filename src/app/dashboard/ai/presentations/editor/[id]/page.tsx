"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "@/i18n/LanguageContext";
import { usePresentation } from "@/hooks/usePresentations";
import EditorShell from "@/components/presentations/editor/EditorShell";

export default function PresentationEditorPage() {
  const t = useTranslations().aiPresentations;
  const params = useParams();
  const presentationId = params.id as string;

  const { data: presentation, isLoading, error } = usePresentation(presentationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
          <p className="text-sm text-slate-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="space-y-4 py-20 text-center">
        <p className="text-sm text-rose-600">{t.error}</p>
        <Link
          href="/dashboard/ai/presentations"
          className="text-sm text-indigo-600 hover:underline"
        >
          {t.backToList}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {presentation.title || t.editor}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {presentation.slides.length} {t.slides} &middot; {presentation.language}
          </p>
        </div>
        <Link
          href="/dashboard/ai/presentations"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          {t.backToList}
        </Link>
      </div>

      <EditorShell
        presentationId={presentationId}
        slides={presentation.slides}
        t={t}
      />
    </div>
  );
}
