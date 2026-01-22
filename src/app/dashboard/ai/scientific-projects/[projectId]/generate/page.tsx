"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "../../../../../../i18n/LanguageContext";
import {
  generateSection,
  getProjectStatus,
  DraftPlanResponse,
  ProjectState,
} from "../../../../../../lib/api";

const SECTIONS = ["introduction", "chapter_1", "chapter_2", "conclusion"] as const;

export default function GenerateProgressPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [generatedSections, setGeneratedSections] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<DraftPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadState();
  }, [projectId]);

  useEffect(() => {
    if (plan && currentStep < SECTIONS.length && !isGenerating) {
      generateNextSection();
    } else if (currentStep >= SECTIONS.length) {
      router.push(`/dashboard/ai/scientific-projects/${projectId}/edit`);
    }
  }, [currentStep, plan]);

  const loadState = async () => {
    try {
      const state: ProjectState = await getProjectStatus(projectId);
      setPlan(state.plan);
      setGeneratedSections(state.sections || {});
      
      // Find current step based on generated sections
      const nextStep = SECTIONS.findIndex(
        (sec) => !state.sections || !state.sections[sec]
      );
      setCurrentStep(nextStep >= 0 ? nextStep : SECTIONS.length);
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const generateNextSection = async () => {
    if (!plan || currentStep >= SECTIONS.length || isGenerating) return;

    const sectionType = SECTIONS[currentStep];
    setIsGenerating(true);
    setLoading(true);
    setError(null);

    try {
      const res = await generateSection({
        project_id: projectId,
        section_type: sectionType,
        approved_plan: plan,
      });

      setGeneratedSections((prev) => ({
        ...prev,
        [sectionType]: res.content,
      }));

      setCurrentStep((prev) => prev + 1);
    } catch (err: any) {
      setError(err.message || "Ошибка генерации");
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const sectionLabels: Record<string, string> = {
    introduction: t.scientificProject.wizard.progress.introduction,
    chapter_1: t.scientificProject.wizard.progress.chapter1,
    chapter_2: t.scientificProject.wizard.progress.chapter2,
    conclusion: t.scientificProject.wizard.progress.conclusion,
  };

  if (loading && !plan) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--primary)] border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          {t.scientificProject.wizard.step3}
        </h1>

        <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md">
          {/* Progress Bar */}
          <div className="mb-8 space-y-4">
            {SECTIONS.map((sec, i) => (
              <div
                key={sec}
                className={`flex items-center gap-4 rounded-xl p-4 transition-all ${
                  i < currentStep
                    ? "bg-green-50 text-green-800"
                    : i === currentStep
                      ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)] ring-2 ring-[color:var(--primary)]"
                      : "bg-slate-50 text-slate-400"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                    i < currentStep
                      ? "bg-green-500 text-white"
                      : i === currentStep
                        ? "bg-[color:var(--primary)] text-white"
                        : "bg-slate-300 text-slate-600"
                  }`}
                >
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{sectionLabels[sec]}</div>
                  {i === currentStep && loading && (
                    <div className="mt-1 text-xs">Генерация...</div>
                  )}
                  {i < currentStep && (
                    <div className="mt-1 text-xs">Готово</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {currentStep < SECTIONS.length && (
            <div className="text-center text-sm text-slate-600">
              {sectionLabels[SECTIONS[currentStep]]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
