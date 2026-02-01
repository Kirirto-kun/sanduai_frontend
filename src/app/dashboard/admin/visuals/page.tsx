"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "../../../../i18n/LanguageContext";
import {
  getAllVisuals,
  getAllCategories,
  uploadVisualMaterial,
  updateVisualMaterial,
  deleteVisualMaterial,
  createCategory,
  updateCategory,
  deleteCategory,
  createMaterialGroup,
  uploadBatchToGroup,
  deleteMaterialGroup,
  type VisualItem,
  type VisualMaterial,
  type VisualMaterialCategory,
} from "../../../../lib/api";
import { FilePreviewCard } from "../../../../components/FilePreviewCard";

type TabId = "materials" | "categories" | "upload";

export default function AdminVisualsPage() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<TabId>("materials");
  const [items, setItems] = useState<VisualItem[]>([]);
  const [categories, setCategories] = useState<VisualMaterialCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Upload form (unified)
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategoryIds, setUploadCategoryIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Quick create category (inline in upload form)
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryNameKk, setNewCategoryNameKk] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Edit form
  const [editingMaterial, setEditingMaterial] = useState<VisualMaterial | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);

  // Category management
  const [categoryName, setCategoryName] = useState("");
  const [categoryNameKk, setCategoryNameKk] = useState("");
  const [editingCategory, setEditingCategory] = useState<VisualMaterialCategory | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await getAllCategories();
      setCategories(cats);
    } catch (err: any) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllVisuals({
        limit,
        offset,
        search: searchQuery || undefined,
        category_id: categoryFilter || undefined,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки материалов");
    } finally {
      setLoading(false);
    }
  }, [limit, offset, searchQuery, categoryFilter]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setOffset(0);
  };

  const handleQuickCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setCreatingCategory(true);
    setError(null);
    try {
      const cat = await createCategory({ name, name_kk: newCategoryNameKk.trim() || undefined });
      await loadCategories();
      setUploadCategoryIds((ids) => [...ids, cat.id]);
      setNewCategoryName("");
      setNewCategoryNameKk("");
      setSuccess(`Категория «${cat.name}» создана и выбрана`);
    } catch (err: any) {
      setError(err.message || "Ошибка создания категории");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0 || !uploadTitle || uploadCategoryIds.length === 0) {
      setError("Добавьте файлы, название и категории");
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      if (uploadFiles.length === 1) {
        await uploadVisualMaterial(uploadFiles[0], uploadTitle, uploadCategoryIds);
        setSuccess("Материал загружен");
      } else {
        const group = await createMaterialGroup({
          title: uploadTitle,
          category_ids: uploadCategoryIds,
        });
        await uploadBatchToGroup(group.id, uploadFiles);
        setSuccess(`Пакет создан: ${uploadFiles.length} файлов`);
      }
      setUploadFiles([]);
      setUploadTitle("");
      setUploadCategoryIds([]);
      loadMaterials();
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    try {
      await updateVisualMaterial(editingMaterial.id, {
        title: editTitle,
        category_ids: editCategoryIds,
        is_active: editIsActive,
      });
      setSuccess("Материал обновлен");
      setEditingMaterial(null);
      loadMaterials();
    } catch (err: any) {
      setError(err.message || "Ошибка обновления");
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Удалить этот материал?")) return;
    try {
      await deleteVisualMaterial(id);
      setSuccess("Материал удален");
      loadMaterials();
    } catch (err: any) {
      setError(err.message || "Ошибка удаления");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Удалить этот пакет и все файлы?")) return;
    try {
      await deleteMaterialGroup(id);
      setSuccess("Пакет удален");
      loadMaterials();
    } catch (err: any) {
      setError(err.message || "Ошибка удаления");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) {
      setError("Заполните обязательные поля категории");
      return;
    }
    try {
      await createCategory({ name: categoryName, name_kk: categoryNameKk || undefined });
      setSuccess("Категория создана");
      setCategoryName("");
      setCategoryNameKk("");
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      setError(err.message || "Ошибка создания категории");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await updateCategory(editingCategory.id, {
        name: categoryName,
        name_kk: categoryNameKk || undefined,
      });
      setSuccess("Категория обновлена");
      setEditingCategory(null);
      setCategoryName("");
      setCategoryNameKk("");
      loadCategories();
    } catch (err: any) {
      setError(err.message || "Ошибка обновления");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Удалить эту категорию?")) return;
    try {
      await deleteCategory(id);
      setSuccess("Категория удалена");
      loadCategories();
    } catch (err: any) {
      setError(err.message || "Ошибка удаления категории");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileNameWithoutExt = (file: File) =>
    file.name.includes(".") ? file.name.slice(0, file.name.lastIndexOf(".")) : file.name;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadFiles((prev) => [...prev, ...files]);
    if (files[0] && uploadFiles.length === 0) setUploadTitle(getFileNameWithoutExt(files[0]));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles((prev) => [...prev, ...files]);
    if (files[0] && uploadFiles.length === 0) setUploadTitle(getFileNameWithoutExt(files[0]));
    e.target.value = "";
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "materials", label: t.visualAidsAdmin?.tabMaterials || "Материалы" },
    { id: "categories", label: t.visualAidsAdmin?.tabCategories || "Категории" },
    { id: "upload", label: t.visualAidsAdmin?.tabUpload || "Загрузить" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t.visualAidsAdmin?.title || "Управление наглядными пособиями"}</h1>
        <p className="text-sm text-slate-600 mt-1">{t.visualAidsAdmin?.subtitle || "Загрузка и редактирование визуальных материалов"}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              activeTab === tab.id
                ? "bg-slate-100 text-slate-900 border-b-2 border-blue-600 -mb-px"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Tab: Materials */}
      {activeTab === "materials" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t.visualAidsAdmin?.searchPlaceholder || "Поиск..."}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setOffset(0);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-full sm:w-48"
            >
              <option value="">{t.visualAidsAdmin?.allCategories || "Все категории"}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {t.visualAidsAdmin?.search || "Искать"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {viewMode === "table" ? "Сетка" : "Таблица"}
            </button>
          </div>

          {editingMaterial && (
            <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-md">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Редактировать: {editingMaterial.title}</h3>
              <form onSubmit={handleEdit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Название</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Категории</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={editCategoryIds.includes(cat.id)}
                          onChange={(e) =>
                            e.target.checked
                              ? setEditCategoryIds([...editCategoryIds, cat.id])
                              : setEditCategoryIds(editCategoryIds.filter((id) => id !== cat.id))
                          }
                        />
                        <span className="text-sm">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} />
                    <span className="text-sm font-medium text-slate-700">Активный</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingMaterial(null)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="glass-card rounded-2xl border border-white/60 overflow-hidden shadow-md">
            {loading ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">{t.visualAidsAdmin?.loading || "Загрузка..."}</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">{t.visualAidsAdmin?.noItems || "Материалы не найдены"}</div>
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Тип</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Превью</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Название</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Категории</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Размер/Файлов</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Статус</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                              item.type === "group" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.type === "group" ? "Пакет" : "Файл"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.type === "material" && item.url && item.mime_type?.startsWith("image/") ? (
                            <img src={item.url} alt={item.title} className="w-16 h-16 object-cover rounded-lg" />
                          ) : item.type === "group" && item.materials && item.materials[0]?.url ? (
                            <img
                              src={item.materials[0].url}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-slate-500">FILE</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          <div className="font-medium">{item.title}</div>
                          {item.type === "group" && (
                            <div className="text-xs text-slate-500">{item.material_count} файлов</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.categories.slice(0, 2).map((cat) => (
                              <span
                                key={cat.id}
                                className="inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full"
                              >
                                {cat.name}
                              </span>
                            ))}
                            {item.categories.length > 2 && (
                              <span className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                                +{item.categories.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {item.type === "material" && item.file_size != null
                            ? formatFileSize(item.file_size)
                            : `${item.material_count} файлов`}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                              item.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.is_active ? "Активный" : "Неактивный"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.type === "material" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingMaterial({
                                    id: item.id,
                                    title: item.title,
                                    url: item.url || "",
                                    file_size: item.file_size || 0,
                                    mime_type: item.mime_type || "",
                                    categories: item.categories,
                                    is_active: item.is_active,
                                    created_at: item.created_at,
                                  });
                                  setEditTitle(item.title);
                                  setEditCategoryIds(item.categories.map((c) => c.id));
                                  setEditIsActive(item.is_active);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Изменить
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(item.id)}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                              >
                                Удалить
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDeleteGroup(item.id)}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Удалить пакет
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-3 hover:shadow-md transition"
                  >
                    {item.type === "material" && item.url && item.mime_type?.startsWith("image/") ? (
                      <img src={item.url} alt={item.title} className="w-full aspect-video object-cover rounded-lg mb-2" />
                    ) : item.type === "group" && item.materials?.[0]?.url ? (
                      <img
                        src={item.materials[0].url}
                        alt={item.title}
                        className="w-full aspect-video object-cover rounded-lg mb-2"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-slate-200 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-xs text-slate-500">FILE</span>
                      </div>
                    )}
                    <div className="font-medium text-sm truncate">{item.title}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.type === "group" ? `${item.material_count} файлов` : formatFileSize(item.file_size || 0)}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {item.type === "material" && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMaterial({
                                id: item.id,
                                title: item.title,
                                url: item.url || "",
                                file_size: item.file_size || 0,
                                mime_type: item.mime_type || "",
                                categories: item.categories,
                                is_active: item.is_active,
                                created_at: item.created_at,
                              });
                              setEditTitle(item.title);
                              setEditCategoryIds(item.categories.map((c) => c.id));
                              setEditIsActive(item.is_active);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Изменить
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(item.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Удалить
                          </button>
                        </>
                      )}
                      {item.type === "group" && (
                        <button
                          onClick={() => handleDeleteGroup(item.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {total > limit && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab: Categories */}
      {activeTab === "categories" && (
        <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingCategory ? "Редактировать категорию" : "Создать категорию"}
          </h3>
          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Название (RU) *</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Название (KK)</label>
                <input
                  type="text"
                  value={categoryNameKk}
                  onChange={(e) => setCategoryNameKk(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            {editingCategory && (
              <p className="mb-4 text-sm text-slate-500">Slug: {editingCategory.slug}</p>
            )}
            <div className="flex gap-2 mb-6">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {editingCategory ? "Обновить" : "Создать"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryName("");
                  setCategoryNameKk("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Отмена
              </button>
            </div>
          </form>

          <h4 className="text-sm font-semibold text-slate-700 mb-2">Категории:</h4>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{cat.name}</span>
                  {cat.name_kk && <span className="text-slate-500 ml-2">({cat.name_kk})</span>}
                  <span className="text-slate-400 ml-2">• {cat.slug}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setCategoryName(cat.name);
                      setCategoryNameKk(cat.name_kk || "");
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Изменить
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 hover:text-red-700">
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Upload */}
      {activeTab === "upload" && (
        <div className="space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition ${
              dragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              multiple
              value=""
              onChange={handleFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <div className="pointer-events-none">
              <svg className="mx-auto h-14 w-14 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-3 text-base font-medium text-slate-700">
                {dragOver ? "Отпустите файлы" : "Перетащите файлы сюда или нажмите"}
              </p>
              <p className="mt-1 text-sm text-slate-500">Один или несколько — при нескольких будет ZIP</p>
            </div>
          </div>

          {uploadFiles.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Название {uploadFiles.length > 1 ? "(пакета)" : ""} *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder={uploadFiles.length > 1 ? "Например: Плакаты по биологии" : "Название материала"}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Категории *</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        uploadCategoryIds.includes(cat.id)
                          ? setUploadCategoryIds(uploadCategoryIds.filter((id) => id !== cat.id))
                          : setUploadCategoryIds([...uploadCategoryIds, cat.id])
                      }
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                        uploadCategoryIds.includes(cat.id) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 items-center rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <span className="text-xs text-slate-500 mr-1">Нет нужной категории?</span>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleQuickCreateCategory();
                      }
                    }}
                    placeholder="Название (RU)"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm w-40 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={newCategoryNameKk}
                    onChange={(e) => setNewCategoryNameKk(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleQuickCreateCategory();
                      }
                    }}
                    placeholder="Название (KK)"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm w-32 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleQuickCreateCategory}
                    disabled={creatingCategory || !newCategoryName.trim()}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingCategory ? "..." : "+ Создать"}
                  </button>
                </div>
              </div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Файлы ({uploadFiles.length})</label>
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {uploadFiles.map((file, i) => (
                  <FilePreviewCard key={`${file.name}-${i}`} file={file} onRemove={() => removeUploadFile(i)} compact />
                ))}
              </div>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !uploadTitle || uploadCategoryIds.length === 0}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Загрузка..." : uploadFiles.length > 1 ? "Загрузить пакет" : "Загрузить"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
