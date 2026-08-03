/**
 * Visual Group Modal Component
 * Modal for viewing group contents and downloading as ZIP
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import type { VisualItem, VisualMaterial } from "../lib/api";
import { downloadVisualGroupZip, getVisualGroup } from "../lib/api";

interface VisualGroupModalProps {
  item: VisualItem;
  onClose: () => void;
}

export function VisualGroupModal({ item, onClose }: VisualGroupModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [materials, setMaterials] = useState<VisualMaterial[]>(item.materials ?? []);

  // Sync materials when item changes; fetch full group if list didn't include materials
  useEffect(() => {
    if (item.materials?.length) {
      setMaterials(item.materials);
    } else if (item.slug) {
      getVisualGroup(item.slug).then((group) => setMaterials(group.materials ?? []));
    } else {
      setMaterials([]);
    }
  }, [item.id, item.slug, item.materials]);

  const handleDownloadZip = async () => {
    if (!item.slug) return;
    setDownloading(true);
    try {
      await downloadVisualGroupZip(item.slug);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{item.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              {item.categories.map((category) => (
                <span
                  key={category.id}
                  className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition ml-4 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - list of files with thumbnails */}
        <div className="flex-1 overflow-auto p-4">
          <p className="text-sm text-slate-600 mb-4">
            В пакете {materials.length || item.material_count} файлов. Скачайте архив ZIP для загрузки всех материалов.
          </p>
          {materials.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {materials.map((m) => {
                const isImage = m.mime_type?.startsWith("image/");
                return (
                  <div key={m.id} className="flex flex-col rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                    <div className="aspect-video bg-slate-200 flex items-center justify-center overflow-hidden">
                      {isImage && m.url ? (
                        <Image
                          src={m.url}
                          alt={m.title}
                          width={640}
                          height={360}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="p-2 text-xs font-medium text-slate-700 truncate" title={m.title}>
                      {m.title}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Загрузка списка файлов...</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 flex-shrink-0">
          <span className="text-sm text-slate-600">{materials.length || item.material_count} файлов</span>
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={downloading}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            {downloading ? "Загрузка..." : "Скачать ZIP"}
          </button>
        </div>
      </div>
    </div>
  );
}
