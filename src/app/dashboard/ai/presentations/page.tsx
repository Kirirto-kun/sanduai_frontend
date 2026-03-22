"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/i18n/LanguageContext";
import {
  usePresentationsList,
  useDeletePresentation,
  useTemplates,
  useStartAsyncGeneration,
  useTaskStatus,
} from "@/hooks/usePresentations";
import { downloadGenerationResult, uploadFiles } from "@/lib/presenton-api";
import PresentationCard from "@/components/presentations/PresentationCard";
import TemplateSelector from "@/components/presentations/TemplateSelector";
import GenerationOverlay from "@/components/presentations/GenerationOverlay";
import type { AsyncGeneratePayload } from "@/types/presenton";

export default function PresentationsPage() {
  const t = useTranslations().aiPresentations;
  const { data: presentations, isLoading: listLoading } = usePresentationsList();
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const deleteMutation = useDeletePresentation();
  const generateMutation = useStartAsyncGeneration();

  // Form state
  const [content, setContent] = useState("");
  const [nSlides, setNSlides] = useState(8);
  const [language, setLanguage] = useState("Russian");
  const [template, setTemplate] = useState("general");
  const [exportAs, setExportAs] = useState<"pptx" | "pdf">("pptx");
  const [instructions, setInstructions] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [includeToC, setIncludeToC] = useState(false);
  const [includeTitleSlide, setIncludeTitleSlide] = useState(true);

  // Generation state
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);

  const { data: taskStatus } = useTaskStatus(taskId);
  const isGenerating =
    generateMutation.isPending ||
    (!!taskId && taskStatus?.status !== "completed" && taskStatus?.status !== "error");

  const canGenerate = content.trim().length > 0 && !isGenerating;

  const handleUploadTemplate = async (file: File) => {
    setUploadingTemplate(true);
    try {
      await uploadFiles([file]);
    } catch (e: any) {
      setError(e?.message || t.error);
    } finally {
      setUploadingTemplate(false);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setTaskId(null);
    try {
      const payload: AsyncGeneratePayload = {
        prompt: content,
        n_slides: nSlides,
        language,
        template,
        export_as: exportAs,
        instructions: instructions.trim() || undefined,
        web_search: webSearch,
        include_table_of_contents: includeToC,
        include_title_slide: includeTitleSlide,
      };
      const resp = await generateMutation.mutateAsync(payload);
      setTaskId(resp.task_id);
    } catch (e: any) {
      setError(e?.message || t.errorGeneration);
    }
  };

  const handleDownload = async () => {
    if (!taskId) return;
    setDownloading(true);
    setError(null);
    try {
      const blob = await downloadGenerationResult(taskId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presentation.${exportAs}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      // Reset form after successful download
      setTaskId(null);
      setContent("");
    } catch (e: any) {
      setError(e?.message || t.error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t.deleteConfirm)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation overlay */}
      <GenerationOverlay
        show={isGenerating}
        status={taskStatus?.status || (generateMutation.isPending ? "pending" : null)}
        t={t}
      />

      {/* Header */}
      <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-md sm:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{t.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
          </div>
          <button
            onClick={() => {
              setShowCreate(!showCreate);
              if (taskId && taskStatus?.status === "completed") {
                setTaskId(null);
              }
            }}
            className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            {showCreate ? t.backToList : t.create}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="space-y-6">
          {/* Content input */}
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-md sm:px-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700">{t.contentLabel}</label>
                <textarea
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.contentPlaceholder}
                />

                <label className="mt-4 block text-sm font-medium text-slate-700">{t.instructionsLabel}</label>
                <textarea
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t.instructionsPlaceholder}
                />
              </div>

              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600">{t.slidesCount}</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={nSlides}
                        onChange={(e) => setNSlides(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">{t.format}</label>
                      <select
                        value={exportAs}
                        onChange={(e) => setExportAs(e.target.value as "pptx" | "pdf")}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        <option value="pptx">PPTX</option>
                        <option value="pdf">PDF</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-600">{t.language}</label>
                    <div className="mt-1 flex gap-1.5">
                      {([
                        ["English", t.langEnglish || "English"],
                        ["Russian", t.langRussian || "Русский"],
                        ["Kazakh", t.langKazakh || "Қазақша"],
                      ] as const).map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => setLanguage(val)}
                          className={`flex-1 rounded-xl px-2 py-2 text-xs font-medium transition ${
                            language === val
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "border border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="mt-4 space-y-2.5">
                    <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={includeTitleSlide}
                        onChange={(e) => setIncludeTitleSlide(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {t.titleSlide}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={includeToC}
                        onChange={(e) => setIncludeToC(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {t.tableOfContents}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={webSearch}
                        onChange={(e) => setWebSearch(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {t.webSearch}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Template selection */}
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-md sm:px-8">
            {templatesLoading ? (
              <div className="flex items-center gap-2 py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent" />
                <span className="text-sm text-slate-500">{t.loading}</span>
              </div>
            ) : (
              <TemplateSelector
                templates={templates || []}
                selected={template}
                onSelect={setTemplate}
                onUploadTemplate={handleUploadTemplate}
                uploading={uploadingTemplate}
                t={t}
              />
            )}
          </div>

          {/* Generate button + status */}
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
            {error && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            {/* Completed state */}
            {taskStatus?.status === "completed" && (
              <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-800">{t.statusCompleted}</p>
                  </div>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {downloading ? t.downloading : t.download}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {t.generate}
            </button>
          </div>
        </div>
      )}

      {/* Presentations list */}
      {!showCreate && (
        <div>
          {listLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
                <p className="text-sm text-slate-500">{t.loading}</p>
              </div>
            </div>
          ) : !presentations || presentations.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white/30 py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">{t.noPresentations}</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                {t.create}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {presentations.map((p) => (
                <PresentationCard
                  key={p.id}
                  presentation={p}
                  onDelete={handleDelete}
                  deleting={deleteMutation.isPending}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
