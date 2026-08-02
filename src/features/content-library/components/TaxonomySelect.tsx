"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { TaxonomyOption } from "../types";

const MAX_SELECTOR_RESULTS = 100;

type CommonProps = {
  options: TaxonomyOption[];
  language: "ru" | "kk";
  loading?: boolean;
  disabled?: boolean;
  label: string;
  labelClassName?: string;
  searchPlaceholder?: string;
  emptyResultsLabel?: string;
};

function optionLabel(option: TaxonomyOption, language: "ru" | "kk"): string {
  return language === "kk" && option.name_kk ? option.name_kk : option.name;
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function matchesQuery(option: TaxonomyOption, query: string): boolean {
  const needle = normalized(query);
  if (!needle) return true;
  return [option.name, option.name_kk ?? "", option.slug]
    .some((value) => normalized(value).includes(needle));
}

function nextIndex(current: number, direction: -1 | 1, count: number): number {
  if (count <= 0) return -1;
  if (current < 0) return direction === 1 ? 0 : count - 1;
  return (current + direction + count) % count;
}

function scrollActiveOption(listboxId: string, index: number): void {
  if (index < 0) return;
  window.requestAnimationFrame(() => {
    document.getElementById(`${listboxId}-option-${index}`)?.scrollIntoView({ block: "nearest" });
  });
}

function useCloseOnOutsideClick(
  containerRef: React.RefObject<HTMLDivElement | null>,
  close: () => void,
): void {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [close, containerRef]);
}

function ResultsSummary({
  filteredCount,
  totalCount,
  language,
}: {
  filteredCount: number;
  totalCount: number;
  language: "ru" | "kk";
}) {
  const capped = filteredCount > MAX_SELECTOR_RESULTS;
  return (
    <div className="border-t border-slate-100 px-2 pt-2 text-[10px] text-slate-400">
      <p>
        {language === "kk"
          ? `${Math.min(filteredCount, MAX_SELECTOR_RESULTS)} / ${filteredCount} нәтиже көрсетілді · барлығы ${totalCount}`
          : `Показано ${Math.min(filteredCount, MAX_SELECTOR_RESULTS)} из ${filteredCount} результатов · всего ${totalCount}`}
      </p>
      {capped && (
        <p className="mt-1 font-medium text-amber-700">
          {language === "kk"
            ? `Алғашқы ${MAX_SELECTOR_RESULTS} нәтиже көрсетілді. Тізімді қысқарту үшін іздеуді нақтылаңыз.`
            : `Показаны первые ${MAX_SELECTOR_RESULTS} результатов. Уточните поиск, чтобы сузить список.`}
        </p>
      )}
    </div>
  );
}

type SearchableSelectProps = CommonProps & {
  value?: string;
  valueKey?: "id" | "slug";
  onChange: (value: string | undefined) => void;
  placeholder: string;
  clearLabel: string;
};

type SingleEntry = {
  key: string;
  label: string;
  value: string | undefined;
  selected: boolean;
};

export function SearchableSelect({
  options,
  value,
  valueKey = "id",
  onChange,
  language,
  loading = false,
  disabled = false,
  label,
  labelClassName,
  placeholder,
  clearLabel,
  searchPlaceholder,
  emptyResultsLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const filtered = useMemo(
    () => options.filter((option) => matchesQuery(option, query)),
    [options, query],
  );
  const renderedOptions = filtered.slice(0, MAX_SELECTOR_RESULTS);
  const selected = options.find((option) => option[valueKey] === value);
  const entries = useMemo<SingleEntry[]>(() => {
    const optionEntries = renderedOptions.map((option) => {
      const optionValue = option[valueKey];
      return {
        key: option.id,
        label: optionLabel(option, language),
        value: optionValue,
        selected: optionValue === value,
      };
    });
    if (normalized(query)) return optionEntries;
    return [{ key: "__clear__", label: clearLabel, value: undefined, selected: !value }, ...optionEntries];
  }, [clearLabel, language, query, renderedOptions, value, valueKey]);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);
  const closeFromOutside = useCallback(() => close(false), [close]);
  useCloseOnOutsideClick(containerRef, closeFromOutside);

  const openMenu = (preferLast = false) => {
    const selectedIndex = entries.findIndex((entry) => entry.selected);
    const nextActive = preferLast
      ? entries.length - 1
      : selectedIndex >= 0 ? selectedIndex : entries.length > 0 ? 0 : -1;
    setOpen(true);
    setActiveIndex(nextActive);
    scrollActiveOption(listboxId, nextActive);
  };

  const moveActive = (direction: -1 | 1) => {
    const next = nextIndex(activeIndex, direction, entries.length);
    setActiveIndex(next);
    scrollActiveOption(listboxId, next);
  };

  const choose = (entry: SingleEntry) => {
    onChange(entry.value);
    close(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <span className={labelClassName ?? "mb-1 block text-[11px] font-semibold text-slate-500"}>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        disabled={disabled || loading}
        onClick={() => open ? close(false) : openMenu()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) openMenu(event.key === "ArrowUp");
            else moveActive(event.key === "ArrowDown" ? 1 : -1);
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (!open) openMenu();
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            close(true);
          }
        }}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 outline-none transition hover:border-slate-300 focus-visible:border-orange-400 focus-visible:ring-2 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <span className="truncate">
          {loading
            ? language === "kk" ? "Жүктелуде…" : "Загрузка…"
            : selected
              ? optionLabel(selected, language)
              : placeholder}
        </span>
        <span aria-hidden="true" className="shrink-0 text-slate-400">{open ? "▴" : "▾"}</span>
      </button>

      {open && !disabled && !loading && (
        <div className="absolute z-40 mt-2 w-full min-w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <label className="block">
            <span className="sr-only">{searchPlaceholder ?? (language === "kk" ? "Тізімнен іздеу" : "Поиск по списку")}</span>
            <input
              type="search"
              role="combobox"
              autoFocus
              value={query}
              aria-label={searchPlaceholder ?? (language === "kk" ? "Тізімнен іздеу" : "Поиск по списку")}
              aria-expanded="true"
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
              onChange={(event) => {
                const nextQuery = event.target.value;
                const nextCount = options.filter((option) => matchesQuery(option, nextQuery)).length;
                setQuery(nextQuery);
                setActiveIndex(nextCount > 0 || !normalized(nextQuery) ? 0 : -1);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  moveActive(event.key === "ArrowDown" ? 1 : -1);
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  const entry = entries[activeIndex];
                  if (entry) choose(entry);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  close(true);
                } else if (event.key === "Tab") {
                  close(false);
                }
              }}
              placeholder={searchPlaceholder ?? (language === "kk" ? "Іздеу…" : "Поиск…")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400"
            />
          </label>
          <div id={listboxId} role="listbox" className="mt-2 max-h-60 overflow-y-auto overscroll-contain">
            {entries.map((entry, index) => (
              <button
                id={`${listboxId}-option-${index}`}
                key={entry.key}
                type="button"
                tabIndex={-1}
                role="option"
                aria-selected={entry.selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(entry)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                  activeIndex === index
                    ? "bg-orange-100 text-orange-900"
                    : entry.selected
                      ? "bg-orange-50 font-semibold text-orange-800"
                      : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{entry.label}</span>
                {entry.selected && <span aria-hidden="true">✓</span>}
              </button>
            ))}
            {entries.length === 0 && (
              <p className="px-3 py-5 text-center text-xs text-slate-500">
                {emptyResultsLabel ?? (language === "kk" ? "Ештеңе табылмады" : "Ничего не найдено")}
              </p>
            )}
          </div>
          <ResultsSummary filteredCount={filtered.length} totalCount={options.length} language={language} />
        </div>
      )}
    </div>
  );
}

type SearchableMultiSelectProps = CommonProps & {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
};

export function SearchableMultiSelect({
  options,
  values,
  onChange,
  language,
  loading = false,
  disabled = false,
  label,
  placeholder,
  searchPlaceholder,
  emptyResultsLabel,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const selected = options.filter((option) => values.includes(option.id));
  const filtered = useMemo(
    () => options.filter((option) => matchesQuery(option, query)),
    [options, query],
  );
  const renderedOptions = filtered.slice(0, MAX_SELECTOR_RESULTS);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);
  const closeFromOutside = useCallback(() => close(false), [close]);
  useCloseOnOutsideClick(containerRef, closeFromOutside);

  const toggle = (id: string) => {
    onChange(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
  };

  const openMenu = (preferLast = false) => {
    const firstSelected = renderedOptions.findIndex((option) => values.includes(option.id));
    const nextActive = preferLast
      ? renderedOptions.length - 1
      : firstSelected >= 0 ? firstSelected : renderedOptions.length > 0 ? 0 : -1;
    setOpen(true);
    setActiveIndex(nextActive);
    scrollActiveOption(listboxId, nextActive);
  };

  const moveActive = (direction: -1 | 1) => {
    const next = nextIndex(activeIndex, direction, renderedOptions.length);
    setActiveIndex(next);
    scrollActiveOption(listboxId, next);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">
          {language === "kk" ? `Таңдалды: ${values.length}` : `Выбрано: ${values.length}`}
        </span>
      </div>
      {selected.length > 0 && (
        <div className="mb-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto" aria-label={language === "kk" ? "Таңдалған санаттар" : "Выбранные категории"}>
          {selected.map((option) => (
            <span key={option.id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800">
              <span className="truncate">{optionLabel(option, language)}</span>
              <button
                type="button"
                onClick={() => toggle(option.id)}
                aria-label={`${language === "kk" ? "Алып тастау" : "Убрать"}: ${optionLabel(option, language)}`}
                className="rounded-full px-0.5 text-orange-600 hover:bg-orange-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        disabled={disabled || loading}
        onClick={() => open ? close(false) : openMenu()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) openMenu(event.key === "ArrowUp");
            else moveActive(event.key === "ArrowDown" ? 1 : -1);
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (!open) openMenu();
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            close(true);
          }
        }}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm text-slate-700 outline-none transition hover:border-slate-300 focus-visible:border-orange-400 focus-visible:ring-2 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <span className="truncate">
          {loading
            ? language === "kk" ? "Санаттар жүктелуде…" : "Категории загружаются…"
            : values.length > 0
              ? language === "kk" ? `${values.length} санат таңдалды` : `Выбрано категорий: ${values.length}`
              : placeholder}
        </span>
        <span aria-hidden="true" className="shrink-0 text-slate-400">{open ? "▴" : "▾"}</span>
      </button>

      {open && !disabled && !loading && (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <label className="block">
            <span className="sr-only">{searchPlaceholder ?? (language === "kk" ? "Санаттарды іздеу" : "Поиск категорий")}</span>
            <input
              type="search"
              role="combobox"
              autoFocus
              value={query}
              aria-label={searchPlaceholder ?? (language === "kk" ? "Санаттарды іздеу" : "Поиск категорий")}
              aria-expanded="true"
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
              onChange={(event) => {
                const nextQuery = event.target.value;
                const nextCount = options.filter((option) => matchesQuery(option, nextQuery)).length;
                setQuery(nextQuery);
                setActiveIndex(nextCount > 0 ? 0 : -1);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  moveActive(event.key === "ArrowDown" ? 1 : -1);
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  const option = renderedOptions[activeIndex];
                  if (option) toggle(option.id);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  close(true);
                } else if (event.key === "Tab") {
                  close(false);
                }
              }}
              placeholder={searchPlaceholder ?? (language === "kk" ? "Санатты іздеу…" : "Найти категорию…")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400"
            />
          </label>
          <div id={listboxId} role="listbox" aria-multiselectable="true" className="mt-2 max-h-60 overflow-y-auto overscroll-contain">
            {renderedOptions.map((option, index) => {
              const isSelected = values.includes(option.id);
              return (
                <button
                  id={`${listboxId}-option-${index}`}
                  key={option.id}
                  type="button"
                  tabIndex={-1}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => toggle(option.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                    activeIndex === index
                      ? "bg-orange-100 text-orange-900"
                      : isSelected ? "bg-orange-50 text-orange-800" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span aria-hidden="true" className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300"}`}>
                    {isSelected ? "✓" : ""}
                  </span>
                  <span className="truncate">{optionLabel(option, language)}</span>
                </button>
              );
            })}
            {renderedOptions.length === 0 && (
              <p className="px-3 py-5 text-center text-xs text-slate-500">
                {emptyResultsLabel ?? (language === "kk" ? "Ештеңе табылмады" : "Ничего не найдено")}
              </p>
            )}
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-2">
            <ResultsSummary filteredCount={filtered.length} totalCount={options.length} language={language} />
            <div className="flex justify-end px-2">
              <button type="button" onClick={() => close(true)} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                {language === "kk" ? "Дайын" : "Готово"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
