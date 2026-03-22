"use client";

import { useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TemplateGroup } from "@/types/presenton";

interface Props {
  templates: TemplateGroup[];
  selected: string;
  onSelect: (templateId: string) => void;
  onUploadTemplate?: (file: File) => void;
  uploading?: boolean;
  t: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  i18n: template names per language                                  */
/* ------------------------------------------------------------------ */
const I18N: Record<string, Record<string, { name: string; desc: string }>> = {
  ru: {
    general:  { name: "Классический", desc: "Универсальный стиль для любых презентаций" },
    modern:   { name: "Современный",  desc: "Яркий и стильный дизайн с акцентами" },
    standard: { name: "Деловой",      desc: "Строгий профессиональный стиль" },
    swift:    { name: "Динамичный",   desc: "Лёгкий и энергичный дизайн" },
  },
  kk: {
    general:  { name: "Классикалық", desc: "Кез келген тақырыпқа сай әмбебап стиль" },
    modern:   { name: "Заманауи",    desc: "Жарқын және стильді дизайн" },
    standard: { name: "Іскерлік",     desc: "Қатаң кәсіби стиль" },
    swift:    { name: "Серпінді",     desc: "Жеңіл және қуатты дизайн" },
  },
};

/* ------------------------------------------------------------------ */
/*  Visual config per template                                         */
/* ------------------------------------------------------------------ */
interface VisualConfig {
  /** Tailwind gradient classes for the card header background */
  grad: string;
  /** Primary color hex for SVG elements */
  p: string;
  /** Secondary/accent color hex for SVG elements */
  s: string;
  emoji: string;
}

const VIS: Record<string, VisualConfig> = {
  general:        { grad: "from-indigo-600 to-blue-500",    p: "#4f46e5", s: "#818cf8", emoji: "\u{1F4CB}" },
  modern:         { grad: "from-emerald-600 to-teal-500",   p: "#059669", s: "#34d399", emoji: "\u2728" },
  standard:       { grad: "from-gray-700 to-slate-600",     p: "#374151", s: "#6b7280", emoji: "\u{1F4BC}" },
  swift:    { grad: "from-violet-600 to-purple-500",  p: "#7c3aed", s: "#a78bfa", emoji: "\u26A1" },
};
const FALLBACK_VIS = VIS.general;

/* ------------------------------------------------------------------ */
/*  SVG slide previews via dangerouslySetInnerHTML                     */
/*  Using raw SVG strings avoids React JSX SVG rendering quirks and   */
/*  CSS resets that can collapse inline SVG height in Next.js /        */
/*  Tailwind CSS v4.                                                   */
/* ------------------------------------------------------------------ */
function buildTitleSlideSvg(p: string, s: string): string {
  return `<svg viewBox="0 0 320 180" width="320" height="180" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;">
  <rect width="320" height="180" fill="#fff"/>
  <rect width="8" height="180" fill="${p}"/>
  <rect x="24" y="20" width="60" height="3" rx="1.5" fill="${p}" fill-opacity=".3"/>
  <rect x="24" y="45" width="180" height="12" rx="2" fill="${p}"/>
  <rect x="24" y="63" width="140" height="10" rx="2" fill="${p}" fill-opacity=".5"/>
  <rect x="24" y="88" width="200" height="6" rx="1" fill="#94a3b8" fill-opacity=".5"/>
  <rect x="24" y="100" width="160" height="6" rx="1" fill="#94a3b8" fill-opacity=".35"/>
  <rect x="230" y="35" width="70" height="75" rx="6" fill="${s}" fill-opacity=".18"/>
  <circle cx="265" cy="62" r="12" fill="${s}" fill-opacity=".25"/>
  <polygon points="240,100 265,80 290,100" fill="${s}" fill-opacity=".2"/>
  <rect y="165" width="320" height="15" fill="${p}" fill-opacity=".07"/>
  <rect x="24" y="169" width="50" height="5" rx="1" fill="${p}" fill-opacity=".25"/>
</svg>`;
}

function buildContentSlideSvg(p: string, s: string): string {
  return `<svg viewBox="0 0 320 180" width="320" height="180" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;">
  <rect width="320" height="180" fill="#fff"/>
  <rect width="320" height="6" fill="${p}"/>
  <rect x="20" y="18" width="120" height="8" rx="2" fill="${p}"/>
  <circle cx="28" cy="44" r="3" fill="${s}"/>
  <rect x="38" y="41" width="140" height="5" rx="1" fill="#64748b" fill-opacity=".35"/>
  <circle cx="28" cy="58" r="3" fill="${s}"/>
  <rect x="38" y="55" width="120" height="5" rx="1" fill="#64748b" fill-opacity=".3"/>
  <circle cx="28" cy="72" r="3" fill="${s}"/>
  <rect x="38" y="69" width="155" height="5" rx="1" fill="#64748b" fill-opacity=".25"/>
  <circle cx="28" cy="86" r="3" fill="${s}"/>
  <rect x="38" y="83" width="100" height="5" rx="1" fill="#64748b" fill-opacity=".2"/>
  <rect x="200" y="38" width="100" height="70" rx="4" fill="${p}" fill-opacity=".04" stroke="${s}" stroke-width=".5" stroke-opacity=".25"/>
  <rect x="215" y="80" width="12" height="20" rx="1" fill="${s}" fill-opacity=".45"/>
  <rect x="233" y="65" width="12" height="35" rx="1" fill="${p}" fill-opacity=".55"/>
  <rect x="251" y="72" width="12" height="28" rx="1" fill="${s}" fill-opacity=".35"/>
  <rect x="269" y="55" width="12" height="45" rx="1" fill="${p}" fill-opacity=".45"/>
  <rect y="165" width="320" height="15" fill="${p}" fill-opacity=".05"/>
</svg>`;
}

function TitleSlide({ p, s }: { p: string; s: string }) {
  return (
    <div
      style={{ aspectRatio: "320 / 180", width: "100%" }}
      dangerouslySetInnerHTML={{ __html: buildTitleSlideSvg(p, s) }}
    />
  );
}

function ContentSlide({ p, s }: { p: string; s: string }) {
  return (
    <div
      style={{ aspectRatio: "320 / 180", width: "100%" }}
      dangerouslySetInnerHTML={{ __html: buildContentSlideSvg(p, s) }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Main selector                                                      */
/* ------------------------------------------------------------------ */
export default function TemplateSelector({ templates, selected, onSelect, onUploadTemplate, uploading, t }: Props) {
  const { language } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">{t.template}</h3>
          <p className="mt-1 text-xs text-slate-500">{t.templateSubtitle}</p>
        </div>
        {onUploadTemplate && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".pptx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadTemplate(f);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {uploading ? t.loading : t.uploadTemplate}
            </button>
          </>
        )}
      </div>

      {/* Template cards grid */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {templates.map((tpl) => {
          const isSelected = selected === tpl.templateID;
          const vis = VIS[tpl.templateID] || FALLBACK_VIS;
          const loc = I18N[language]?.[tpl.templateID] || I18N["ru"]?.[tpl.templateID];
          const name = loc?.name ?? tpl.templateName;
          const desc = loc?.desc ?? tpl.settings?.description ?? "";

          return (
            <button
              key={tpl.templateID}
              onClick={() => onSelect(tpl.templateID)}
              className={`group relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? "border-indigo-500 shadow-lg shadow-indigo-200/60 ring-2 ring-indigo-200"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              {/* Title slide on gradient bg */}
              <div className={`bg-gradient-to-br ${vis.grad} p-3 pb-2`}>
                <div className="overflow-hidden rounded-lg border border-white/20 bg-white shadow-md">
                  <TitleSlide p={vis.p} s={vis.s} />
                </div>
              </div>

              {/* Content slide */}
              <div className="bg-slate-50 px-3 pt-2 pb-1.5">
                <div className="overflow-hidden rounded border border-slate-200/80 bg-white">
                  <ContentSlide p={vis.p} s={vis.s} />
                </div>
              </div>

              {/* Footer with name */}
              <div className={`border-t px-3 py-2.5 ${isSelected ? "border-indigo-100 bg-indigo-50/60" : "border-slate-100 bg-white"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{vis.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-indigo-700" : "text-slate-800"}`}>
                      {name}
                    </p>
                    {desc && (
                      <p className="mt-0.5 truncate text-[11px] leading-tight text-slate-400">{desc}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-indigo-600 shadow-md">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Recommended badge on default template */}
              {tpl.settings?.default && !isSelected && (
                <div className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 shadow">
                  {t.defaultBadge || ""}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
