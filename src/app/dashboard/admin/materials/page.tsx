"use client";

import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { useTranslations } from "../../../../i18n/LanguageContext";
import {
  uploadMaterial,
  getAllMaterialsAdmin,
  deleteMaterial,
  type MaterialListItem,
} from "../../../../lib/api";

export default function AdminMaterialsPage() {
  const router = useRouter();
  const t = useTranslations();
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [class_, setClass_] = useState("");
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<MaterialListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setTitle("");
    setSubject("");
    setClass_("");
    setPreviewImageFile(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (previewInputRef.current) previewInputRef.current.value = "";
  }, []);

  const loadMaterials = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await getAllMaterialsAdmin({ limit: 100 });
      setItems(data.items);
    } catch (err) {
      console.error("Failed to load materials:", err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      loadMaterials();
    }
  }, [user?.role, loadMaterials]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError(t.presentationsAdmin?.addFileAndName || "Добавьте файл и название");
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      await uploadMaterial({
        file,
        title: title.trim(),
        subject: subject.trim() || undefined,
        class: class_.trim() || undefined,
        preview_image: previewImageFile || undefined,
      });
      setSuccess(t.presentationsAdmin?.uploadSuccess || "Презентация загружена успешно");
      resetForm();
      loadMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : (t.presentationsAdmin?.uploadError || "Ошибка загрузки"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.presentationsAdmin?.deleteConfirm || "Удалить презентацию?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteMaterial(id);
      setSuccess(t.presentationsAdmin?.deleteSuccess || "Презентация удалена");
      loadMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : (t.presentationsAdmin?.deleteError || "Ошибка удаления"));
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || !user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t.presentationsAdmin?.title || "Интерактивные презентации"}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {t.presentationsAdmin?.subtitle || "Загрузка интерактивных презентаций в Bunny CDN"}
        </p>
      </div>

      <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-md">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t.presentationsAdmin?.uploadTitle || "Загрузить презентацию"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.presentationsAdmin?.nameLabel || "Название *"}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.presentationsAdmin?.namePlaceholder || "Урок математики 5 класс"}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.presentationsAdmin?.subjectLabel || "Предмет"}</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t.presentationsAdmin?.subjectPlaceholder || "Математика"}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.presentationsAdmin?.classLabel || "Класс"}</label>
              <input
                type="text"
                value={class_}
                onChange={(e) => setClass_(e.target.value)}
                placeholder={t.presentationsAdmin?.classPlaceholder || "5"}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.presentationsAdmin?.coverLabel || "Обложка (необязательно)"}
            </label>
            <input
              ref={previewInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPreviewImageFile(e.target.files?.[0] || null)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {previewImageFile && (
              <p className="mt-1 text-xs text-slate-500">{t.presentationsAdmin?.coverSelected || "Выбрано"}: {previewImageFile.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.presentationsAdmin?.fileLabel || "Файл *"}</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pptx,.pdf,.doc,.docx,.mp4,.webm,.html,.zip"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              {t.presentationsAdmin?.fileHint || "PPTX, PDF, Word, видео, HTML5 (index.html)"}
            </p>
          </div>

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

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (t.presentationsAdmin?.uploading || "Загрузка...") : (t.presentationsAdmin?.upload || "Загрузить")}
            </button>
            <a
              href="/dashboard/library/presentations"
              className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {t.presentationsAdmin?.toLibrary || "К библиотеке"}
            </a>
          </div>
        </form>
      </div>

      {/* List of presentations with delete */}
      <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-md">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t.presentationsAdmin?.uploadedList || "Загруженные презентации"}</h2>
        {loadingList ? (
          <p className="text-sm text-slate-500">{t.presentationsAdmin?.loading || "Загрузка..."}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">{t.presentationsAdmin?.noItems || "Презентаций пока нет"}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{item.title}</p>
                  <div className="flex gap-2 mt-1 text-xs text-slate-500">
                    {item.metadata?.subject && <span>{item.metadata.subject}</span>}
                    {item.metadata?.class && <span>{item.metadata.class} {t.presentationsAdmin?.classSuffix || "класс"}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="ml-4 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === item.id ? (t.presentationsAdmin?.deleting || "Удаление...") : (t.presentationsAdmin?.delete || "Удалить")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
