"use client";

import { useState, type FormEvent } from "react";
import { MATERIAL_TYPE_CONFIG, SEGMENT_LABELS, localize } from "../config";
import {
  CONTENT_SEGMENTS,
  MATERIAL_TYPES,
  type ContentCategory,
  type ContentListParams,
  type ContentSegment,
  type ContentSubject,
  type MaterialType,
} from "../types";
import { SearchableSelect } from "./TaxonomySelect";
import { SCHOOL_GRADES } from "@/lib/school-grades";

type CatalogFiltersProps = {
  params: ContentListParams;
  categories: ContentCategory[];
  categoriesLoading: boolean;
  subjects: ContentSubject[];
  subjectsLoading: boolean;
  language: "ru" | "kk";
  onChange: (changes: Partial<ContentListParams>) => void;
};

export function CatalogFilters({
  params,
  categories,
  categoriesLoading,
  subjects,
  subjectsLoading,
  language,
  onChange,
}: CatalogFiltersProps) {
  const [query, setQuery] = useState(params.q ?? "");
  const hasFilters = Boolean(
    params.q || params.segment || params.type || params.grade || params.subject || params.category,
  );
  const gradeDisabled = Boolean(params.segment && params.segment !== "school");
  const availableTypes = params.segment === "library"
    ? MATERIAL_TYPES.filter((type) => type === "event")
    : MATERIAL_TYPES;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onChange({ q: query.trim() || undefined, page: 1 });
  };

  const reset = () => {
    setQuery("");
    onChange({
      q: undefined,
      segment: undefined,
      type: undefined,
      grade: undefined,
      subject: undefined,
      category: undefined,
      page: 1,
      sort: "newest",
    });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_auto]">
        <label className="block">
          <span className="sr-only">{language === "kk" ? "Іздеу" : "Поиск"}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={language === "kk" ? "Барлық материалдардан іздеу…" : "Поиск по всем материалам…"}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[color:var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
        >
          {language === "kk" ? "Табу" : "Найти"}
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500">{language === "kk" ? "Бөлім" : "Раздел"}</span>
          <select
            value={params.segment ?? ""}
            onChange={(event) => {
              const nextSegment = (event.target.value || undefined) as ContentSegment | undefined;
              onChange({
                segment: nextSegment,
                type: nextSegment === "library" && params.type !== "event" ? undefined : params.type,
                grade: nextSegment && nextSegment !== "school" ? undefined : params.grade,
                page: 1,
              });
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400"
          >
            <option value="">{language === "kk" ? "Барлығы" : "Все"}</option>
            {CONTENT_SEGMENTS.map((segment) => (
              <option key={segment} value={segment}>{localize(SEGMENT_LABELS[segment], language)}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500">{language === "kk" ? "Материал түрі" : "Тип материала"}</span>
          <select
            value={params.type ?? ""}
            onChange={(event) => {
              const nextType = (event.target.value || undefined) as MaterialType | undefined;
              onChange({
                type: nextType,
                grade: params.grade,
                page: 1,
              });
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400"
          >
            <option value="">{language === "kk" ? "Барлық түрлер" : "Все типы"}</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>{localize(MATERIAL_TYPE_CONFIG[type].label, language)}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500">{language === "kk" ? "Сынып" : "Класс"}</span>
          <select
            value={params.grade ?? ""}
            disabled={gradeDisabled}
            onChange={(event) => onChange({ grade: event.target.value ? Number(event.target.value) : undefined, page: 1 })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">{language === "kk" ? "Барлық сыныптар" : "Все классы"}</option>
            {SCHOOL_GRADES.map((grade) => (
              <option key={grade} value={grade}>{grade} {language === "kk" ? "сынып" : "класс"}</option>
            ))}
          </select>
        </label>

        <SearchableSelect
          label={language === "kk" ? "Пән" : "Предмет"}
          options={subjects}
          value={params.subject}
          valueKey="slug"
          onChange={(subject) => onChange({ subject, page: 1 })}
          language={language}
          loading={subjectsLoading}
          placeholder={language === "kk" ? "Барлық пәндер" : "Все предметы"}
          clearLabel={language === "kk" ? "Барлық пәндер" : "Все предметы"}
          searchPlaceholder={language === "kk" ? "Пәнді іздеу…" : "Найти предмет…"}
        />

        <SearchableSelect
          label={language === "kk" ? "Санат" : "Категория"}
          options={categories}
          value={params.category}
          valueKey="slug"
          onChange={(category) => onChange({ category, page: 1 })}
          language={language}
          loading={categoriesLoading}
          placeholder={language === "kk" ? "Барлық санаттар" : "Все категории"}
          clearLabel={language === "kk" ? "Барлық санаттар" : "Все категории"}
          searchPlaceholder={language === "kk" ? "Санатты іздеу…" : "Найти категорию…"}
        />

      </div>

      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={reset} className="text-xs font-semibold text-slate-500 underline-offset-4 hover:text-orange-700 hover:underline">
            {language === "kk" ? "Сүзгілерді тазарту" : "Сбросить фильтры"}
          </button>
        </div>
      )}
    </form>
  );
}
