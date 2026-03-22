"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "@/i18n/LanguageContext";
import { usePresentation, usePreparePresentation } from "@/hooks/usePresentations";
import { fetchSSE } from "@/lib/sse-utils";
import OutlineList from "@/components/presentations/OutlineList";
import type { Outline } from "@/types/presenton";

export default function OutlinePage() {
  const t = useTranslations().aiPresentations;
  const params = useParams();
  const router = useRouter();
  const presentationId = params.id as string;

  const { data: presentation, isLoading } = usePresentation(presentationId);
  const prepareMutation = usePreparePresentation();

  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the presentation already has outlines, use them
  useEffect(() => {
    if (presentation?.outlines && presentation.outlines.length > 0) {
      setOutlines(presentation.outlines);
      setStreamDone(true);
    }
  }, [presentation]);

  // Stream outlines from SSE
  const startOutlineStream = useCallback(async () => {
    if (streamDone || streaming) return;
    setStreaming(true);
    setError(null);
    const accumulated: Outline[] = [];

    try {
      for await (const evt of fetchSSE(
        `/api/v1/presentations/presenton/generation/outlines/stream/${presentationId}`,
      )) {
        if (evt.event === "outline" || evt.event === "message") {
          try {
            const data = JSON.parse(evt.data);
            if (data.content) {
              accumulated.push({ content: data.content });
              setOutlines([...accumulated]);
            } else if (Array.isArray(data)) {
              const items = data.map((d: any) => ({
                content: d.content || d,
              }));
              accumulated.push(...items);
              setOutlines([...accumulated]);
            }
          } catch {
            // Not JSON, treat as raw text
            accumulated.push({ content: evt.data });
            setOutlines([...accumulated]);
          }
        }
        if (evt.event === "done" || evt.event === "complete") {
          break;
        }
      }
      setStreamDone(true);
    } catch (e: any) {
      setError(e?.message || t.error);
    } finally {
      setStreaming(false);
    }
  }, [presentationId, streamDone, streaming, t.error]);

  // Auto-start streaming if no outlines
  useEffect(() => {
    if (!isLoading && presentation && (!presentation.outlines || presentation.outlines.length === 0)) {
      startOutlineStream();
    }
  }, [isLoading, presentation, startOutlineStream]);

  const handlePrepare = async () => {
    setError(null);
    try {
      await prepareMutation.mutateAsync({
        presentation_id: presentationId,
        outlines,
      });
      // Navigate to editor
      router.push(`/dashboard/ai/presentations/editor/${presentationId}`);
    } catch (e: any) {
      setError(e?.message || t.error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-500">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-md sm:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{t.outlines}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.outlinesSubtitle}</p>
          </div>
          <Link
            href="/dashboard/ai/presentations"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            {t.backToList}
          </Link>
        </div>
      </div>

      <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-md sm:px-8">
        {streaming && (
          <div className="mb-4 flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent" />
            <span className="text-sm text-slate-600">{t.generating}</span>
          </div>
        )}

        <OutlineList outlines={outlines} onChange={setOutlines} t={t} />

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        {streamDone && outlines.length > 0 && (
          <button
            onClick={handlePrepare}
            disabled={prepareMutation.isPending}
            className="mt-6 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {prepareMutation.isPending ? t.generatingSlides : t.prepareSlides}
          </button>
        )}
      </div>
    </div>
  );
}
