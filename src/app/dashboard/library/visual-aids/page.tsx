"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "../../../../i18n/LanguageContext";
import { useTokens } from "../../../../hooks/useTokens";
import {
  getVisuals,
  getVisualCategories,
  type VisualMaterial,
  type VisualMaterialCategory,
} from "../../../../lib/api";
import { VisualMaterialCard } from "../../../../components/VisualMaterialCard";
import { VisualMaterialModal } from "../../../../components/VisualMaterialModal";
import { CategoryFilter } from "../../../../components/CategoryFilter";

export default function VisualAidsPage() {
  const t = useTranslations();
  const { hasSubscription, loading: tokensLoading } = useTokens();
  
  const [materials, setMaterials] = useState<VisualMaterial[]>([]);
  const [categories, setCategories] = useState<VisualMaterialCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Selected material for viewing
  const [selectedMaterial, setSelectedMaterial] = useState<VisualMaterial | null>(null);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getVisualCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Load materials
  useEffect(() => {
    if (hasSubscription !== null && hasSubscription) {
      fetchMaterials();
    } else if (hasSubscription === false) {
      setLoading(false);
    }
  }, [hasSubscription, offset, selectedCategoryId, searchQuery]);

  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVisuals({
        limit,
        offset,
        category_id: selectedCategoryId || undefined,
        search: searchQuery || undefined,
      });
      setMaterials(data.items);
      setTotal(data.total);
    } catch (err: any) {
      if (err.message?.includes("403") || err.response?.status === 403) {
        setError("subscription_required");
      } else {
        setError(err.message || "Ошибка загрузки материалов");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setOffset(0); // Reset to first page
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setOffset(0); // Reset to first page
  };

  // Check subscription status
  if (!tokensLoading && hasSubscription === false) {
    return (
      <div className="glass-card rounded-3xl border border-white/60 px-6 py-12 shadow-md sm:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900">
            Требуется подписка
          </h2>
          <p className="mt-4 text-sm text-slate-600">
            Для просмотра көрнекіліктер необходима активная подписка. Обратитесь к
            администратору для оформления подписки.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Көрнекіліктер</h1>
        <p className="text-sm text-slate-600 mt-1">
          Библиотека визуальных материалов, схем и плакатов
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Поиск материалов..."
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Искать
            </button>
          </div>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={handleCategoryChange}
          />
        )}
      </div>

      {/* Error message */}
      {error && error !== "subscription_required" && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-slate-600">Загрузка...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="glass-card rounded-3xl border border-white/60 px-6 py-12 shadow-md sm:px-8">
          <div className="text-center">
            <p className="text-slate-500">Материалы не найдены</p>
            {(selectedCategoryId || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId(null);
                  setSearchQuery("");
                  setSearchInput("");
                  setOffset(0);
                }}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Materials grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {materials.map((material) => (
              <VisualMaterialCard
                key={material.id}
                material={material}
                onClick={() => setSelectedMaterial(material)}
              />
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Назад
              </button>
              <span className="text-sm text-slate-600">
                {offset + 1} - {Math.min(offset + limit, total)} из {total}
              </span>
              <button
                type="button"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}      {/* Material viewing modal */}
      {selectedMaterial && (
        <VisualMaterialModal
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </div>
  );
}
