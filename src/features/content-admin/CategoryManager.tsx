"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { createCategory, deleteCategory, updateCategory } from "@/lib/api";
import { ApiError } from "@/features/content-library/api";
import type { ContentCategory } from "@/features/content-library/types";

type CategoryManagerProps = {
  categories: ContentCategory[];
  loading: boolean;
  language: "ru" | "kk";
};

export function CategoryManager({ categories, loading, language }: CategoryManagerProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameKk, setNameKk] = useState("");

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["library-content-categories"] }),
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
      const payload = { name: name.trim(), name_kk: nameKk.trim() || undefined };
      return editingId ? updateCategory(editingId, payload) : createCategory(payload);
    },
    onSuccess: async () => {
      reset();
      await refresh();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async (_, deletedId) => {
      if (editingId === deletedId) reset();
      await refresh();
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim()) saveMutation.mutate();
  };
  const startEditing = (category: ContentCategory) => {
    setEditingId(category.id);
    setName(category.name);
    setNameKk(category.name_kk ?? "");
  };
  const remove = (category: ContentCategory) => {
    const confirmed = window.confirm(
      language === "kk"
        ? `«${category.name_kk || category.name}» санатын жою керек пе? Қолданыстағы санатты жоюға болмайды.`
        : `Удалить категорию «${category.name}»? Категорию, которая используется материалами, удалить нельзя.`,
    );
    if (confirmed) deleteMutation.mutate(category.id);
  };
  const error = saveMutation.error ?? deleteMutation.error;
  const pending = saveMutation.isPending || deleteMutation.isPending;

  return (
    <details className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800">
      <summary className="cursor-pointer font-semibold">
        {language === "kk" ? "Тақырыптық санаттарды басқару" : "Управление тематическими категориями"}
      </summary>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(260px,0.8fr)_minmax(320px,1.2fr)]">
        <form onSubmit={submit} className="space-y-3 rounded-xl bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">
            {editingId
              ? language === "kk" ? "Санатты өңдеу" : "Редактировать категорию"
              : language === "kk" ? "Жаңа санат" : "Новая категория"}
          </h3>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">{language === "kk" ? "Атауы" : "Название"} *</span>
            <input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-orange-400" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">{language === "kk" ? "Қазақша атауы" : "Название на казахском"}</span>
            <input maxLength={100} value={nameKk} onChange={(event) => setNameKk(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-orange-400" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending || !name.trim()} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
              {saveMutation.isPending
                ? language === "kk" ? "Сақталуда…" : "Сохранение…"
                : editingId
                  ? language === "kk" ? "Өзгерістерді сақтау" : "Сохранить изменения"
                  : language === "kk" ? "Санат қосу" : "Добавить категорию"}
            </button>
            {editingId && <button type="button" disabled={pending} onClick={reset} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">{language === "kk" ? "Бас тарту" : "Отмена"}</button>}
          </div>
          {error && <p role="alert" className="text-xs font-medium text-red-700">{error instanceof ApiError || error instanceof Error ? error.message : language === "kk" ? "Әрекет орындалмады." : "Не удалось выполнить действие."}</p>}
        </form>

        <div>
          <p className="mb-2 text-xs leading-relaxed text-slate-500">
            {language === "kk" ? "Сынып — бөлек сүзгі. Бұл жерде тек тақырыптық санаттар басқарылады." : "Класс остаётся отдельным фильтром; здесь управляются только тематические категории."}
          </p>
          {loading ? (
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" role="status" />
          ) : categories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">{language === "kk" ? "Санаттар әлі жоқ." : "Категорий пока нет."}</p>
          ) : (
            <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{language === "kk" && category.name_kk ? category.name_kk : category.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{category.slug}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" disabled={pending} onClick={() => startEditing(category)} className="rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">{language === "kk" ? "Өңдеу" : "Изменить"}</button>
                    <button type="button" disabled={pending} onClick={() => remove(category)} className="rounded-lg px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{language === "kk" ? "Жою" : "Удалить"}</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </details>
  );
}
