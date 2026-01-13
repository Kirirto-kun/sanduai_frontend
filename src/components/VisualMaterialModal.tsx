/**
 * Visual Material Modal Component
 * Modal for viewing visual materials in full size
 */

import type { VisualMaterial } from "../lib/api";

interface VisualMaterialModalProps {
  material: VisualMaterial;
  onClose: () => void;
}

export function VisualMaterialModal({ material, onClose }: VisualMaterialModalProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = material.mime_type.startsWith("image/");
  const isPDF = material.mime_type === "application/pdf";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-white rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 truncate">
              {material.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {material.categories.map((category) => (
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isImage ? (
            <img
              src={material.url}
              alt={material.title}
              className="w-full h-auto rounded-xl"
            />
          ) : isPDF ? (
            <iframe
              src={material.url}
              className="w-full h-full min-h-[600px] rounded-xl border border-slate-200"
              title={material.title}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <svg
                className="w-24 h-24 text-slate-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <p className="text-slate-600 mb-4">
                Предпросмотр недоступен для этого типа файла
              </p>
              <a
                href={material.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Скачать файл
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 flex-shrink-0">
          <div className="text-sm text-slate-600">
            <span>{formatFileSize(material.file_size)}</span>
            <span className="mx-2">•</span>
            <span>{material.mime_type}</span>
          </div>
          <a
            href={material.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Скачать
          </a>
        </div>
      </div>
    </div>
  );
}
