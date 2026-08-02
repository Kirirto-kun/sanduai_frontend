"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import { MATERIAL_TYPE_CONFIG, SEGMENT_LABELS, localize } from "../config";
import type { ContentItem } from "../types";
import { ContentPreview } from "./ContentPreview";

type ContentCardProps = {
  item: ContentItem;
  onOpen: (item: ContentItem) => void;
};

function categoryName(item: ContentItem, index: number, language: "ru" | "kk") {
  const category = item.categories[index];
  if (!category) return "";
  return language === "kk" && category.name_kk ? category.name_kk : category.name;
}

export function ContentCard({ item, onOpen }: ContentCardProps) {
  const { language } = useLanguage();
  const config = MATERIAL_TYPE_CONFIG[item.material_type];
  const locale = language === "kk" ? "kk-KZ" : "ru-RU";

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => onOpen(item)}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2"
    >
      <ContentPreview
        src={item.preview_url}
        alt={item.title}
        materialType={item.material_type}
        previewStatus={item.preview_status}
        language={language}
        className="aspect-[16/10] w-full"
      />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-700">
            <span aria-hidden="true">{config.icon}</span>
            {localize(config.label, language)}
          </span>
          {item.formats.length > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {item.formats.slice(0, 3).join(" · ")}
            </span>
          )}
        </div>

        <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-orange-700">
          {item.title}
        </h2>
        {item.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">{item.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.grades.slice(0, 4).map((grade) => (
            <span key={grade} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
              {grade} {language === "kk" ? "сынып" : "класс"}
            </span>
          ))}
          {item.segments.slice(0, 2).map((segment) => (
            <span key={segment} className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
              {localize(SEGMENT_LABELS[segment], language)}
            </span>
          ))}
          {item.categories.slice(0, 1).map((category, index) => (
            <span key={category.id} className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-700">
              {categoryName(item, index, language)}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4 text-[11px] text-slate-500">
          <span>{new Date(item.created_at).toLocaleDateString(locale)}</span>
          <span className="font-semibold text-[color:var(--primary)]">
            {language === "kk" ? "Ашу →" : "Открыть →"}
          </span>
        </div>
      </div>
    </button>
  );
}
