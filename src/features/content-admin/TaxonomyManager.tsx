"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { createCategory, deleteCategory, updateCategory } from "@/lib/api";
import {
  ApiError,
  createAdminLibrarySubject,
  deleteAdminLibrarySubject,
  updateAdminLibrarySubject,
} from "@/features/content-library/api";
import type { TaxonomyOption } from "@/features/content-library/types";
import { Pagination } from "@/features/content-library/components/Pagination";

type TaxonomyKind = "category" | "subject";
const TAXONOMY_PAGE_SIZE = 20;

type TaxonomyManagerProps = {
  kind: TaxonomyKind;
  items: TaxonomyOption[];
  loading: boolean;
  loadError?: Error | null;
  onRetry: () => void;
  language: "ru" | "kk";
};

export function TaxonomyManager({
  kind,
  items,
  loading,
  loadError,
  onRetry,
  language,
}: TaxonomyManagerProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameKk, setNameKk] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const isCategory = kind === "category";

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      [item.name, item.name_kk ?? "", item.slug]
        .some((value) => value.toLocaleLowerCase().includes(needle)),
    );
  }, [items, query]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / TAXONOMY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = filteredItems.slice(
    (currentPage - 1) * TAXONOMY_PAGE_SIZE,
    currentPage * TAXONOMY_PAGE_SIZE,
  );

  const refresh = async () => {
    const taxonomyKey = isCategory ? "library-content-categories" : "library-content-subjects";
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [taxonomyKey] }),
      queryClient.invalidateQueries({ queryKey: ["admin-library-content"] }),
      queryClient.invalidateQueries({ queryKey: ["library-content"] }),
    ]);
  };

  const reset = () => {
    setEditingId(null);
    setName("");
    setNameKk("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        // The legacy category API treats an empty string as an explicit clear.
        name_kk: editingId ? nameKk.trim() : nameKk.trim() || undefined,
      };
      if (isCategory) {
        return editingId ? updateCategory(editingId, payload) : createCategory(payload);
      }
      const subjectPayload = {
        name: name.trim(),
        name_kk: editingId ? nameKk.trim() || null : nameKk.trim() || undefined,
      };
      return editingId
        ? updateAdminLibrarySubject(editingId, subjectPayload)
        : createAdminLibrarySubject(subjectPayload);
    },
    onSuccess: async () => {
      const wasCreating = !editingId;
      reset();
      if (wasCreating) setPage(1);
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => isCategory ? deleteCategory(id) : deleteAdminLibrarySubject(id),
    onSuccess: async (_, deletedId) => {
      if (editingId === deletedId) reset();
      await refresh();
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim() && !saveMutation.isPending && !deleteMutation.isPending) saveMutation.mutate();
  };

  const startEditing = (item: TaxonomyOption) => {
    setEditingId(item.id);
    setName(item.name);
    setNameKk(item.name_kk ?? "");
  };

  const remove = (item: TaxonomyOption) => {
    const displayName = language === "kk" && item.name_kk ? item.name_kk : item.name;
    const confirmed = window.confirm(
      language === "kk"
        ? `«${displayName}» ${isCategory ? "санатын" : "пәнін"} жою керек пе? Материалдарда қолданылып тұрса, оны жою мүмкін емес.`
        : `Удалить ${isCategory ? "категорию" : "предмет"} «${displayName}»? Если значение используется в материалах, удалить его не получится.`,
    );
    if (confirmed) deleteMutation.mutate(item.id);
  };

  const mutationError = saveMutation.error ?? deleteMutation.error;
  const pending = saveMutation.isPending || deleteMutation.isPending;
  const title = isCategory
    ? language === "kk" ? "Санаттар" : "Категории"
    : language === "kk" ? "Пәндер" : "Предметы";

  return (
    <section className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-sm sm:p-6" aria-labelledby={`${kind}-manager-heading`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`${kind}-manager-heading`} className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            {isCategory
              ? language === "kk"
                ? "Материалдарды тақырып бойынша топтастыратын ортақ санаттар. Бір материалға бірнеше санат таңдауға болады."
                : "Общие тематические категории. Для одного материала можно выбрать несколько категорий."
              : language === "kk"
                ? "Барлық материал түрлері үшін ортақ пәндер. Материалда бір пән таңдалады."
                : "Единый список предметов для всех типов материалов. У материала выбирается один предмет."}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
          {language === "kk" ? `Барлығы: ${items.length}` : `Всего: ${items.length}`}
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(260px,0.75fr)_minmax(360px,1.25fr)]">
        <form onSubmit={submit} className="h-fit space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">
            {editingId
              ? language === "kk" ? `${isCategory ? "Санатты" : "Пәнді"} өңдеу` : `Редактировать ${isCategory ? "категорию" : "предмет"}`
              : language === "kk" ? `Жаңа ${isCategory ? "санат" : "пән"}` : isCategory ? "Новая категория" : "Новый предмет"}
          </h3>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">{language === "kk" ? "Негізгі атауы" : "Основное название"} *</span>
            <input
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={language === "kk" ? "Мысалы: Математика" : "Например: Математика"}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">{language === "kk" ? "Қазақша атауы" : "Название на казахском"}</span>
            <input
              maxLength={100}
              value={nameKk}
              onChange={(event) => setNameKk(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending || !name.trim()} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-50">
              {saveMutation.isPending
                ? language === "kk" ? "Сақталуда…" : "Сохранение…"
                : editingId
                  ? language === "kk" ? "Өзгерістерді сақтау" : "Сохранить изменения"
                  : language === "kk" ? "Қосу" : "Добавить"}
            </button>
            {editingId && (
              <button type="button" disabled={pending} onClick={reset} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50">
                {language === "kk" ? "Бас тарту" : "Отмена"}
              </button>
            )}
          </div>
          {mutationError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {mutationError instanceof ApiError || mutationError instanceof Error
                ? mutationError.message
                : language === "kk" ? "Әрекет орындалмады." : "Не удалось выполнить действие."}
            </p>
          )}
        </form>

        <div>
          <label className="block">
            <span className="sr-only">{language === "kk" ? `${title} ішінен іздеу` : `Поиск: ${title}`}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={language === "kk" ? `${title} ішінен іздеу…` : `Поиск: ${title.toLocaleLowerCase()}…`}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>
          <p className="mt-2 text-xs text-slate-500" aria-live="polite">
            {language === "kk"
              ? `${filteredItems.length} / ${items.length} табылды · ${currentPage} / ${totalPages} бет`
              : `Найдено ${filteredItems.length} из ${items.length} · страница ${currentPage} из ${totalPages}`}
          </p>

          {loadError ? (
            <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{loadError.message || (language === "kk" ? "Тізімді жүктеу мүмкін болмады." : "Не удалось загрузить список.")}</p>
              <button type="button" onClick={onRetry} className="mt-2 text-xs font-semibold underline">
                {language === "kk" ? "Қайталау" : "Повторить"}
              </button>
            </div>
          ) : loading ? (
            <div className="mt-3 space-y-2" role="status" aria-label={language === "kk" ? "Жүктелуде" : "Загрузка"}>
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              {items.length === 0
                ? language === "kk" ? "Тізім әзірге бос." : "Список пока пуст."
                : language === "kk" ? "Іздеу бойынша ештеңе табылмады." : "По вашему запросу ничего не найдено."}
            </p>
          ) : (
            <ul className="mt-3 max-h-[28rem] divide-y divide-slate-100 overflow-y-auto overscroll-contain rounded-xl border border-slate-200">
              {visibleItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {language === "kk" && item.name_kk ? item.name_kk : item.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">{item.name_kk && language !== "kk" ? `${item.name_kk} · ` : ""}{item.slug}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" disabled={pending} onClick={() => startEditing(item)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
                      {language === "kk" ? "Өңдеу" : "Изменить"}
                    </button>
                    <button type="button" disabled={pending} onClick={() => remove(item)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                      {language === "kk" ? "Жою" : "Удалить"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && !loadError && filteredItems.length > 0 && totalPages > 1 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                language={language}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
