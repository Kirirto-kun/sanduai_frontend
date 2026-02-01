"use client";

import { useState, useEffect, useCallback } from "react";
import { useTokens } from "../../../../hooks/useTokens";
import { useTranslations } from "../../../../i18n/LanguageContext";
import {
  getMaterials,
  getMaterialById,
  type MaterialListItem,
  type MaterialDetail,
} from "../../../../lib/api";
import { MaterialCard } from "../../../../components/MaterialCard";
import { MaterialViewModal } from "../../../../components/MaterialViewModal";

export default function PresentationsPage() {
  const t = useTranslations();
  const { hasSubscription, subscriptionPlan, loading: tokensLoading } = useTokens();

  const [items, setItems] = useState<MaterialListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialDetail | MaterialListItem | null>(null);
  const [materialDetail, setMaterialDetail] = useState<MaterialDetail | null>(null);
  const [premiumRequired, setPremiumRequired] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const userIsPremium = subscriptionPlan === "premium";

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMaterials({
        limit,
        offset,
        subject: selectedSubject || undefined,
        class: selectedClass || undefined,
        search: searchQuery || undefined,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ошибка загрузки материалов";
      if (message.includes("403") || (err as { response?: { status?: number } })?.response?.status === 403) {
        setError("subscription_required");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [limit, offset, selectedSubject, selectedClass, searchQuery]);

  useEffect(() => {
    if (hasSubscription !== null && hasSubscription) {
      fetchMaterials();
    } else if (hasSubscription === false) {
      setLoading(false);
    }
  }, [hasSubscription, fetchMaterials]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setOffset(0);
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setOffset(0);
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setOffset(0);
  };

  const handleCardClick = async (material: MaterialListItem) => {
    setSelectedMaterial(material);
    setMaterialDetail(null);
    setPremiumRequired(false);
    setModalLoading(true);

    try {
      const detail = await getMaterialById(material.id);
      setMaterialDetail(detail);
      setPremiumRequired(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("403") || (err as { response?: { status?: number } })?.response?.status === 403) {
        setPremiumRequired(true);
        setMaterialDetail(null);
      } else {
        setSelectedMaterial(null);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedMaterial(null);
    setMaterialDetail(null);
    setPremiumRequired(false);
  };

  if (!tokensLoading && hasSubscription === false) {
    return (
      <div className="glass-card rounded-3xl border border-white/60 px-6 py-12 shadow-md sm:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900">{t.presentationsPage?.subscriptionRequired || "Требуется подписка"}</h2>
          <p className="mt-4 text-sm text-slate-600">
            {t.presentationsPage?.subscriptionRequiredMessage || "Для просмотра интерактивных презентаций необходима активная подписка. Обратитесь к администратору для оформления подписки."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t.presentationsPage?.title || "Интерактивные презентации"}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {t.presentationsPage?.subtitle || "Фильтруйте по классу и предмету."}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={t.presentationsPage?.searchPlaceholder || "Поиск по названию..."}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                {t.presentationsPage?.search || "Искать"}
              </button>
            </div>
          </div>

          <input
            type="text"
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            placeholder={t.presentationsPage?.subject || "Предмет"}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
          />

          <input
            type="text"
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            placeholder={t.presentationsPage?.class || "Класс"}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
          />
        </div>
      </div>

      {error && error !== "subscription_required" && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-2 text-sm text-slate-600">{t.presentationsPage?.loading || "Загрузка..."}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-3xl border border-white/60 px-6 py-12 shadow-md sm:px-8">
          <div className="text-center">
            <p className="text-slate-500">{t.presentationsPage?.noItems || "Презентации не найдены"}</p>
            {(selectedSubject || selectedClass || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSubject("");
                  setSelectedClass("");
                  setSearchQuery("");
                  setSearchInput("");
                  setOffset(0);
                }}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t.presentationsPage?.resetFilters || "Сбросить фильтры"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <MaterialCard
                key={item.id}
                material={item}
                onClick={() => handleCardClick(item)}
                isPremiumLocked={!userIsPremium}
              />
            ))}
          </div>

          {total > limit && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.presentationsPage?.back || "Назад"}
              </button>
              <span className="text-sm text-slate-600">
                {offset + 1} - {Math.min(offset + limit, total)} {t.presentationsPage?.paginationOf || "из"} {total}
              </span>
              <button
                type="button"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.presentationsPage?.next || "Вперед"}
              </button>
            </div>
          )}
        </>
      )}

      {selectedMaterial && (
        <>
          {modalLoading ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="bg-white rounded-2xl p-8 flex flex-col items-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                <p className="mt-4 text-sm text-slate-600">{t.presentationsPage?.loading || "Загрузка..."}</p>
              </div>
            </div>
          ) : (
            <MaterialViewModal
              material={materialDetail || selectedMaterial}
              onClose={handleCloseModal}
              premiumRequired={premiumRequired}
            />
          )}
        </>
      )}
    </div>
  );
}
