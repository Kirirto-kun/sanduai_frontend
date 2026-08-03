"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "../../../../../../i18n/LanguageContext";
import {
  getProjectStatus,
  regenerateSection,
  finalizeProject,
  exportScientificProjectDocx,
  ProjectState,
  CompleteProjectResponse,
} from "../../../../../../lib/api";
import Markdown from "react-markdown";
import { useTokens } from "../../../../../../hooks/useTokens";
import { InsufficientTokensError } from "../../../../../../lib/api";
import { getErrorMessage } from "../../../../../../lib/error-utils";

export default function EditProjectPage() {
  const t = useTranslations();
  const params = useParams();
  const projectId = params.projectId as string;
  const { refreshBalance, costs, checkBalance } = useTokens();

  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [finalized, setFinalized] = useState<CompleteProjectResponse | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [regenerateInstruction, setRegenerateInstruction] = useState("");

  useEffect(() => {
    let active = true;

    const loadState = async () => {
      try {
        const state: ProjectState = await getProjectStatus(projectId);
        if (active) setSections(state.sections || {});
      } catch (err: unknown) {
        if (active) setError(getErrorMessage(err, "Ошибка загрузки"));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadState();
    return () => {
      active = false;
    };
  }, [projectId]);

  const handleRegenerate = async (sectionType: string) => {
    if (!regenerateInstruction.trim()) {
      alert("Введите инструкцию для перегенерации");
      return;
    }

    setRegenerating(sectionType);
    setError(null);

    try {
      const res = await regenerateSection({
        project_id: projectId,
        section_type: sectionType,
        instruction: regenerateInstruction,
        current_content: sections[sectionType] || "",
      });

      setSections((prev) => ({
        ...prev,
        [sectionType]: res.content,
      }));

      setRegenerateInstruction("");
      refreshBalance();
    } catch (err: unknown) {
      if (err instanceof InsufficientTokensError) {
        setError(
          `${t.tokens?.insufficient || "Недостаточно токенов"}. ${t.tokens?.required || "Требуется"}: ${err.required}, ${t.tokens?.available || "Доступно"}: ${err.available}`
        );
      } else {
        setError(getErrorMessage(err, "Ошибка перегенерации"));
      }
    } finally {
      setRegenerating(null);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setError(null);

    try {
      const res = await finalizeProject({
        project_id: projectId,
      });
      setFinalized(res);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Ошибка финализации"));
    } finally {
      setFinalizing(false);
    }
  };

  const handleExport = async () => {
    if (!finalized) {
      alert("Сначала финализируйте проект");
      return;
    }

    try {
      const blob = await exportScientificProjectDocx({ content: finalized });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "scientific_project.docx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Ошибка экспорта");
    }
  };

  const sectionLabels: Record<string, string> = {
    introduction: t.scientificProject.results.introduction,
    chapter_1: t.scientificProject.results.chapterTheory,
    chapter_2: t.scientificProject.results.chapterResearch,
    conclusion: t.scientificProject.results.conclusion,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--primary)] border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          {t.scientificProject.wizard.step4}
        </h1>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {!finalized ? (
          <>
            {/* Sections */}
            <div className="space-y-6">
              {Object.entries(sections).map(([key, content]) => (
                <div
                  key={key}
                  className="glass-card rounded-3xl border border-white/60 p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">
                      {sectionLabels[key] || key}
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Инструкция для перегенерации..."
                        value={regenerating === key ? regenerateInstruction : ""}
                        onChange={(e) => setRegenerateInstruction(e.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                        disabled={regenerating === key}
                      />
                      <button
                        onClick={() => handleRegenerate(key)}
                        disabled={regenerating === key || !checkBalance("sciproject_regenerate")}
                        className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {regenerating === key ? "..." : `🔄 ${t.scientificProject.wizard.regenerateSection} (${costs.sciproject_regenerate || 3} ${t.tokens?.balance || "токенов"})`}
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none text-slate-800">
                    <Markdown>{content}</Markdown>
                  </div>
                </div>
              ))}
            </div>

            {/* Finalize Button */}
            <div className="mt-8">
              <button
                onClick={handleFinalize}
                disabled={finalizing}
                className="w-full rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
              >
                {finalizing ? (
                  <>
                    <div className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    Финализация...
                  </>
                ) : (
                  t.scientificProject.wizard.finalize
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Finalized Sections */}
            <div className="space-y-6">
              <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  {t.scientificProject.results.titlePage}
                </h3>
                <div className="prose prose-sm max-w-none text-slate-800">
                  <Markdown>{finalized.title_page}</Markdown>
                </div>
              </div>

              <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  {t.scientificProject.results.annotation}
                </h3>
                <div className="prose prose-sm max-w-none text-slate-800">
                  <Markdown>{finalized.annotation}</Markdown>
                </div>
              </div>

              {Object.entries({
                introduction: finalized.introduction,
                chapter_1_theory: finalized.chapter_1_theory,
                chapter_2_research: finalized.chapter_2_research,
                conclusion: finalized.conclusion,
              }).map(([key, content]) => (
                <div key={key} className="glass-card rounded-3xl border border-white/60 p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-slate-900">
                    {sectionLabels[key.replace("_theory", "").replace("_research", "")] || key}
                  </h3>
                  <div className="prose prose-sm max-w-none text-slate-800">
                    <Markdown>{content}</Markdown>
                  </div>
                </div>
              ))}

              <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  {t.scientificProject.results.references}
                </h3>
                <div className="prose prose-sm max-w-none text-slate-800">
                  <Markdown>{finalized.references}</Markdown>
                </div>
              </div>

              <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  {t.scientificProject.results.appendix}
                </h3>
                <div className="prose prose-sm max-w-none text-slate-800">
                  <Markdown>{finalized.appendix}</Markdown>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="mt-8">
              <button
                onClick={handleExport}
                className="w-full rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
              >
                {t.scientificProject.results.export}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
