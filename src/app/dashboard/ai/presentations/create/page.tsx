"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/LanguageContext";
import { useTemplates, useCreatePresentation } from "@/hooks/usePresentations";
import CreateForm from "@/components/presentations/CreateForm";
import type { AsyncGeneratePayload, CreatePresentationPayload } from "@/types/presenton";

export default function CreatePresentationPage() {
  const t = useTranslations().aiPresentations;
  const router = useRouter();
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const createMutation = useCreatePresentation();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: AsyncGeneratePayload) => {
    setError(null);
    try {
      const createPayload: CreatePresentationPayload = {
        content: payload.prompt,
        n_slides: payload.n_slides,
        language: payload.language,
        instructions: payload.instructions,
        web_search: payload.web_search,
        include_table_of_contents: payload.include_table_of_contents,
        include_title_slide: payload.include_title_slide,
      };

      const pres = await createMutation.mutateAsync(createPayload);
      // Navigate to outline page where user can edit outlines and generate slides
      router.push(`/dashboard/ai/presentations/outline/${pres.id}`);
    } catch (e: any) {
      setError(e?.message || t.errorGeneration);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-md sm:px-8">
        <h2 className="text-2xl font-semibold text-slate-900">{t.create}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.createSubtitle}</p>
      </div>

      <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-md sm:px-8">
        <CreateForm
          templates={templates || []}
          templatesLoading={templatesLoading}
          onSubmit={handleSubmit}
          loading={createMutation.isPending}
          t={t}
        />
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
