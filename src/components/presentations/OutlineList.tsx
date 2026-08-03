"use client";

import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ExactTextItem, PlanSlide, PresentationMode } from "@/types/presentations";
import { getPresentationCopy } from "./copy";

const fieldClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-300/70 disabled:bg-slate-50";

function exactTextValues(value: PlanSlide["exact_text"]) {
  return (value ?? []).map((item) => (typeof item === "string" ? item : item.text)).filter(Boolean);
}

function textValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return textValue(item.text ?? item.label ?? item.title);
  }
  return "";
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(textValue).filter(Boolean);
}

function nestedContent(slide: PlanSlide): string[] {
  const content = slide.content ?? {};
  const items = [
    textValue(content.body),
    ...textList(content.bullets),
    textValue(content.callout),
    ...textList(content.items),
    ...textList(content.options),
    ...textList(content.steps),
  ];

  if (Array.isArray(content.columns)) {
    for (const rawColumn of content.columns) {
      if (!rawColumn || typeof rawColumn !== "object") continue;
      const column = rawColumn as Record<string, unknown>;
      items.push(textValue(column.title), ...textList(column.items));
    }
  }
  if (content.table && typeof content.table === "object") {
    const table = content.table as Record<string, unknown>;
    items.push(...textList(table.headers));
    if (Array.isArray(table.rows)) {
      for (const row of table.rows) items.push(...textList(row));
    }
  }
  if (Array.isArray(content.blocks)) {
    for (const rawBlock of content.blocks) {
      if (!rawBlock || typeof rawBlock !== "object") continue;
      const block = rawBlock as Record<string, unknown>;
      items.push(textValue(block.body), ...textList(block.items));
    }
  }

  return items.filter((item, index) => item && items.indexOf(item) === index);
}

function editableContent(slide: PlanSlide, mode: PresentationMode) {
  const hasSimpleContent = slide.body !== undefined || slide.bullets !== undefined;
  const structured = hasSimpleContent
    ? [slide.body?.trim() ?? "", ...(slide.bullets ?? []).map((item) => item.trim())].filter(Boolean)
    : nestedContent(slide);
  if (structured.length > 0) return structured;
  if (mode !== "creative") return structured;

  const exact = exactTextValues(slide.exact_text);
  return exact[0]?.trim() === slide.title.trim() ? exact.slice(1) : exact;
}

function editableContentValue(slide: PlanSlide, mode: PresentationMode) {
  if (slide.body !== undefined || slide.bullets !== undefined) {
    return [slide.body ?? "", ...(slide.bullets ?? [])].join("\n");
  }
  return editableContent(slide, mode).join("\n");
}

function exactText(slide: PlanSlide, title: string, content: string[]): ExactTextItem[] {
  return [title.trim(), ...content]
    .filter(Boolean)
    .map((text, itemIndex) => ({
      id: `${slide.slide_key}-text-${itemIndex}`,
      text,
      importance: itemIndex === 0 ? "primary" : "secondary",
    }));
}

function newSlide(order: number, mode: PresentationMode): PlanSlide {
  const key = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `slide-${Date.now()}-${order}`;
  return {
    slide_key: key,
    order,
    order_index: order - 1,
    role: "content",
    title: "",
    purpose: "",
    body: "",
    bullets: [],
    exact_text: mode === "creative" ? [] : undefined,
    facts: mode === "creative" ? [] : undefined,
    visual_scene: mode === "creative" ? "" : undefined,
    image_prompt: mode === "creative" ? "" : undefined,
    speaker_notes: "",
    layout: mode === "classic" ? "auto" : undefined,
  };
}

function renumber(slides: PlanSlide[]) {
  return slides.map((slide, index) => ({ ...slide, order: index + 1, order_index: index }));
}

export default function OutlineList({
  mode,
  slides,
  onChange,
  disabled = false,
}: {
  mode: PresentationMode;
  slides: PlanSlide[];
  onChange: (slides: PlanSlide[]) => void;
  disabled?: boolean;
}) {
  const { language } = useLanguage();
  const copy = getPresentationCopy(language);
  const [expandedSlideKey, setExpandedSlideKey] = useState<string | null>(null);
  const simple = language === "kk"
    ? {
        edit: "Өңдеу",
        close: "Жабу",
        details: "Толығырақ",
        content: "Слайд мәтіні",
        contentHint: "Негізгі ойларды әр жолға бөлек жазыңыз",
        empty: "Мәтін қосылмаған",
      }
    : {
        edit: "Изменить",
        close: "Закрыть",
        details: "Подробнее",
        content: "Текст слайда",
        contentHint: "Каждую основную мысль пишите с новой строки",
        empty: "Текст ещё не добавлен",
      };

  const patchSlide = (index: number, patch: Partial<PlanSlide>) => {
    const next = slides.map((slide, slideIndex) => slideIndex === index ? { ...slide, ...patch } : slide);
    onChange(next);
  };

  const updateTitle = (index: number, title: string) => {
    const slide = slides[index];
    const patch: Partial<PlanSlide> = { title };
    if (mode === "creative") {
      patch.exact_text = exactText(slide, title, editableContent(slide, mode));
    }
    patchSlide(index, patch);
  };

  const updateContent = (index: number, value: string) => {
    const slide = slides[index];
    const rawContent = value.split("\n");
    const content = rawContent.map((item) => item.trim()).filter(Boolean);
    const patch: Partial<PlanSlide> = {
      body: rawContent[0] ?? "",
      bullets: rawContent.slice(1),
    };
    if (mode === "creative") {
      patch.exact_text = exactText(slide, slide.title, content);
    }
    patchSlide(index, patch);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= slides.length) return;
    const next = [...slides];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(renumber(next));
  };

  const duplicate = (index: number) => {
    if (slides.length >= 30) return;
    const source = slides[index];
    const copySlide: PlanSlide = {
      ...source,
      id: undefined,
      slide_key: typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${source.slide_key}-copy-${Date.now()}`,
    };
    const next = [...slides];
    next.splice(index + 1, 0, copySlide);
    onChange(renumber(next));
    setExpandedSlideKey(copySlide.slide_key);
  };

  const remove = (index: number) => {
    if (slides.length <= 4) return;
    if (expandedSlideKey === slides[index].slide_key) setExpandedSlideKey(null);
    onChange(renumber(slides.filter((_, slideIndex) => slideIndex !== index)));
  };

  const addSlide = () => {
    const slide = newSlide(slides.length + 1, mode);
    onChange([...slides, slide]);
    setExpandedSlideKey(slide.slide_key);
  };

  return (
    <div>
      <div className="space-y-3" role="list">
        {slides.map((slide, index) => {
          const prefix = `plan-slide-${slide.slide_key}`;
          const content = editableContent(slide, mode);
          const expanded = expandedSlideKey === slide.slide_key;
          return (
            <article
              key={slide.slide_key}
              role="listitem"
              className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition focus-within:border-slate-300 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${mode === "creative" ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800"}`}>
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-900">{slide.title || `${copy.slide} ${index + 1}`}</h3>
                  {content.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm leading-5 text-slate-600">
                      {content.slice(0, 3).map((item, itemIndex) => (
                        <li key={`${slide.slide_key}-summary-${itemIndex}`} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                      {content.length > 3 && <li className="pl-3.5 text-xs font-semibold text-slate-400">+{content.length - 3}</li>}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">{simple.empty}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`${prefix}-editor`}
                  onClick={() => setExpandedSlideKey(expanded ? null : slide.slide_key)}
                  className="min-h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  {expanded ? simple.close : disabled ? simple.details : simple.edit}
                </button>
              </div>

              {expanded && (
                <div id={`${prefix}-editor`} className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                  <div>
                    <label htmlFor={`${prefix}-title`} className="text-sm font-bold text-slate-700">{copy.slideTitle}</label>
                    <input
                      id={`${prefix}-title`}
                      disabled={disabled}
                      value={slide.title}
                      onChange={(event) => updateTitle(index, event.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${prefix}-content`} className="text-sm font-bold text-slate-700">{simple.content}</label>
                    <textarea
                      id={`${prefix}-content`}
                      disabled={disabled}
                      rows={5}
                      value={editableContentValue(slide, mode)}
                      onChange={(event) => updateContent(index, event.target.value)}
                      placeholder={simple.contentHint}
                      className={`${fieldClass} resize-y`}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">{simple.contentHint}</p>
                  </div>

                  {!disabled && (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-35">
                        <span className="mr-1" aria-hidden="true">↑</span>{copy.moveUp}
                      </button>
                      <button type="button" disabled={index === slides.length - 1} onClick={() => move(index, index + 1)} className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-35">
                        <span className="mr-1" aria-hidden="true">↓</span>{copy.moveDown}
                      </button>
                      <button type="button" disabled={slides.length >= 30} onClick={() => duplicate(index)} className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-35">
                        {copy.duplicate}
                      </button>
                      <button type="button" disabled={slides.length <= 4} onClick={() => remove(index)} className="min-h-10 rounded-xl border border-rose-200 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-35">
                        {copy.deleteSlide}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!disabled && (
        <button
          type="button"
          disabled={slides.length >= 30}
          onClick={addSlide}
          className="mt-4 flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/50 text-sm font-bold text-slate-600 transition hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
        >
          <span className="mr-2 text-lg" aria-hidden="true">＋</span>
          {copy.addSlide}
        </button>
      )}
    </div>
  );
}
