"use client";

import { useState, useEffect } from "react";
import {
  getAllVisuals,
  getAllCategories,
  uploadVisualMaterial,
  updateVisualMaterial,
  deleteVisualMaterial,
  createCategory,
  updateCategory,
  deleteCategory,
  type VisualMaterial,
  type VisualMaterialCategory,
} from "../../../../lib/api";

export default function AdminVisualsPage() {
  const [materials, setMaterials] = useState<VisualMaterial[]>([]);
  const [categories, setCategories] = useState<VisualMaterialCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Upload form
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategoryIds, setUploadCategoryIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Edit form
  const [editingMaterial, setEditingMaterial] = useState<VisualMaterial | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);

  // Category management
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryNameKk, setCategoryNameKk] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [editingCategory, setEditingCategory] = useState<VisualMaterialCategory | null>(null);

  useEffect(() => {
    loadCategories();
    loadMaterials();
  }, [offset, searchQuery]);

  const loadCategories = async () => {
    try {
      const cats = await getAllCategories();
      setCategories(cats);
    } catch (err: any) {
      console.error("Failed to load categories:", err);
    }
  };

  const loadMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllVisuals({
        limit,
        offset,
        search: searchQuery || undefined,
      });
      setMaterials(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки материалов");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || uploadCategoryIds.length === 0) {
      setError("Заполните все поля");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await uploadVisualMaterial(uploadFile, uploadTitle, uploadCategoryIds);
      setSuccess("Материал успешно загружен");
      setShowUploadForm(false);
      setUploadFile(null);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить этот материал?")) return;

    try {
      await deleteVisualMaterial(id);
      setSuccess("Материал удален");
      loadMaterials();
    } catch (err: any) {
      setError(err.message || "Ошибка удаления");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName || !categorySlug) {
      setError("Заполните обязательные поля категории");
      return;
    }

    try {
      await createCategory({
        name: categoryName,
        name_kk: categoryNameKk || undefined,
        slug: categorySlug,
      });
      setSuccess("Категория создана");
      setShowCategoryForm(false);
      setCategoryName("");
      setCategoryNameKk("");
      setCategorySlug("");
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
      setCategorySlug("");
      loadCategories();
    } catch (err: any) {
      setError(err.message || "Ошибка обновления категории");
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

  const startEditCategory = (category: VisualMaterialCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryNameKk(category.name_kk || "");
    setCategorySlug(category.slug);
    setShowCategoryForm(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Управление көрнекіліктер
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Загрузка и редактирование визуальных материалов
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Категории
          </button>
          <button
            type="button"
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Загрузить материал
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Category Management */}
      {showCategoryForm && (
        <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingCategory ? "Редактировать категорию" : "Создать категорию"}
          </h3>
          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Название (RU) *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Название (KK)
                </label>
                <input
                  type="text"
                  value={categoryNameKk}
                  onChange={(e) => setCategoryNameKk(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Slug * {editingCategory && "(не изменяется)"}
              </label>
              <input
                type="text"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                disabled={!!editingCategory}
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {editingCategory ? "Обновить" : "Создать"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                  setCategoryName("");
                  setCategoryNameKk("");
                  setCategorySlug("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Отмена
              </button>
            </div>
          </form>

          {/* Categories list */}
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">Существующие категории:</h4>
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
                    onClick={() => startEditCategory(cat)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Загрузить материал</h3>
          <form onSubmit={handleUpload}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Файл *</label>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-sm"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Название *</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Категории * (выберите несколько)
              </label>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={uploadCategoryIds.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setUploadCategoryIds([...uploadCategoryIds, cat.id]);
                        } else {
                          setUploadCategoryIds(uploadCategoryIds.filter((id) => id !== cat.id));
                        }
                      }}
                    />
                    <span className="text-sm">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? "Загрузка..." : "Загрузить"}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editingMaterial && (
        <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Редактировать: {editingMaterial.title}
          </h3>
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
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editCategoryIds.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditCategoryIds([...editCategoryIds, cat.id]);
                        } else {
                          setEditCategoryIds(editCategoryIds.filter((id) => id !== cat.id));
                        }
                      }}
                    />
                    <span className="text-sm">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                />
                <span className="text-sm font-medium text-slate-700">Активный (виден пользователям)</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => setEditingMaterial(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Materials Table */}
      <div className="glass-card rounded-2xl border border-white/60 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                  Превью
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                  Название
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                  Категории
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                  Размер
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    Загрузка...
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    Материалы не найдены
                  </td>
                </tr>
              ) : (
                materials.map((material) => {
                  const isImage = material.mime_type.startsWith("image/");
                  return (
                    <tr key={material.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        {isImage ? (
                          <img
                            src={material.url}
                            alt={material.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-slate-500">FILE</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        <div className="font-medium">{material.title}</div>
                        <div className="text-xs text-slate-500">{material.mime_type}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {material.categories.slice(0, 2).map((cat) => (
                            <span
                              key={cat.id}
                              className="inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full"
                            >
                              {cat.name}
                            </span>
                          ))}
                          {material.categories.length > 2 && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                              +{material.categories.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatFileSize(material.file_size)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            material.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {material.is_active ? "Активный" : "Неактивный"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingMaterial(material);
                              setEditTitle(material.title);
                              setEditCategoryIds(material.categories.map((c) => c.id));
                              setEditIsActive(material.is_active);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Изменить
                          </button>
                          <button
                            onClick={() => handleDelete(material.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
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
      </div>
    </div>
  );
}
