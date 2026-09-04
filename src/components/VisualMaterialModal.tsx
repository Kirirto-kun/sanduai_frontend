/**
 * Visual Material Modal Component
 * Modal for viewing visual materials in full size
 */

import { useEffect, useState } from "react";
import type { VisualMaterial } from "../lib/api";
import { fetchPresentationAsset } from "../lib/presentations-api";
import { ProtectedImage } from "./presentations/PresentationUI";

interface VisualMaterialModalProps {
  material: VisualMaterial;
  onClose: () => void;
}

function ProtectedPdfPreview({ source, title }: { source: string; title: string }) {
  const [state, setState] = useState<{
    source?: string;
    objectUrl?: string;
    failed?: boolean;
  }>({});

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    let disposed = false;

    void fetchPresentationAsset(source, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (!disposed) setState({ source, objectUrl });
      })
      .catch((error) => {
        if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) {
          setState({ source, failed: true });
        }
      });

    return () => {
      disposed = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  const current = state.source === source ? state : {};
  if (current.failed) {
    return (
      <div role="alert" className="flex min-h-[420px] items-center justify-center rounded-xl bg-slate-100 px-6 text-center text-sm text-slate-600">
        Предпросмотр PDF недоступен. Файл можно скачать.
      </div>
    );
  }
  if (!current.objectUrl) {
    return (
      <div role="status" aria-label="Загрузка предпросмотра PDF" className="min-h-[600px] animate-pulse rounded-xl bg-slate-100" />
    );
  }
  return (
    <iframe
      src={current.objectUrl}
      className="min-h-[600px] w-full rounded-xl border border-slate-200"
      title={title}
    />
  );
}

export function VisualMaterialModal({ material, onClose }: VisualMaterialModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = material.mime_type.startsWith("image/");
  const isPDF = material.mime_type === "application/pdf";

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadFailed(false);
    try {
      const blob = await fetchPresentationAsset(material.url);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safeTitle = material.title.trim().replace(/[\\/:*?"<>|]+/g, "-") || "material";
      const mimeExtension = material.mime_type === "application/pdf"
        ? "pdf"
        : material.mime_type === "image/jpeg"
          ? "jpg"
          : material.mime_type.split("/")[1]?.split("+")[0] || "bin";
      anchor.href = objectUrl;
      anchor.download = /\.[a-z0-9]{1,8}$/i.test(safeTitle) ? safeTitle : `${safeTitle}.${mimeExtension}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
    } catch {
      setDownloadFailed(true);
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
            <ProtectedImage
              source={material.url}
              alt={material.title}
              className="w-full min-h-80 max-h-[70vh] rounded-xl bg-slate-100 object-contain"
            />
          ) : isPDF ? (
            <ProtectedPdfPreview source={material.url} title={material.title} />
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
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                {downloading ? "Подготовка…" : "Скачать файл"}
              </button>
            </div>
          )}
          {downloadFailed && (
            <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Не удалось скачать файл. Попробуйте ещё раз.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 flex-shrink-0">
          <div className="text-sm text-slate-600">
            <span>{formatFileSize(material.file_size)}</span>
            <span className="mx-2">•</span>
            <span>{material.mime_type}</span>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {downloading ? "Подготовка…" : "Скачать"}
          </button>
        </div>
      </div>
    </div>
  );
}
