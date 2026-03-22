"use client";

import { useState } from "react";
import type { TemplateGroup, AsyncGeneratePayload } from "@/types/presenton";

interface Props {
  templates: TemplateGroup[];
  templatesLoading: boolean;
  onSubmit: (payload: AsyncGeneratePayload) => void;
  loading: boolean;
  t: Record<string, string>;
}

export default function CreateForm({ templates, templatesLoading, onSubmit, loading, t }: Props) {
  const [content, setContent] = useState("");
  const [nSlides, setNSlides] = useState(8);
  const [language, setLanguage] = useState("Russian");
  const [template, setTemplate] = useState("general");
  const [exportAs, setExportAs] = useState<"pptx" | "pdf">("pptx");
  const [instructions, setInstructions] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [includeToC, setIncludeToC] = useState(false);
  const [includeTitleSlide, setIncludeTitleSlide] = useState(true);

  const canSubmit = content.trim().length > 0 && !loading;

  const handleSubmit = () => {
    onSubmit({
      prompt: content,
      n_slides: nSlides,
      language,
      template,
      export_as: exportAs,
      instructions: instructions.trim() || undefined,
      web_search: webSearch,
      include_table_of_contents: includeToC,
      include_title_slide: includeTitleSlide,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left: content inputs */}
      <div className="lg:col-span-2">
        <label className="block text-sm font-medium text-slate-700">{t.contentLabel}</label>
        <textarea
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t.contentPlaceholder}
        />

        <label className="mt-5 block text-sm font-medium text-slate-700">{t.instructionsLabel}</label>
        <textarea
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
          rows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={t.instructionsPlaceholder}
        />
      </div>

      {/* Right: settings */}
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

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-600">{t.language}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="English">English</option>
              <option value="Russian">Русский</option>
              <option value="Kazakh">Қазақша</option>
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-600">{t.template}</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
              disabled={templatesLoading}
            >
              <option value="general">general</option>
              {templates.map((tpl) => (
                <option key={tpl.templateID} value={tpl.templateID}>
                  {tpl.templateName}
                </option>
              ))}
            </select>
          </div>

          {/* Toggles */}
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={includeTitleSlide}
                onChange={(e) => setIncludeTitleSlide(e.target.checked)}
                className="rounded"
              />
              {t.titleSlide}
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={includeToC}
                onChange={(e) => setIncludeToC(e.target.checked)}
                className="rounded"
              />
              {t.tableOfContents}
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={webSearch}
                onChange={(e) => setWebSearch(e.target.checked)}
                className="rounded"
              />
              {t.webSearch}
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="mt-5 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? t.generating : t.generate}
          </button>
        </div>
      </div>
    </div>
  );
}
