/**
 * Material View Modal Component
 * Modal for viewing materials with different display logic by file type
 */

import type { MaterialDetail, MaterialListItem } from "../lib/api";
import { useTranslations } from "../i18n/LanguageContext";

interface MaterialViewModalProps {
  material: MaterialDetail | MaterialListItem;
  onClose: () => void;
  premiumRequired?: boolean;
}

export function MaterialViewModal({
  material,
  onClose,
  premiumRequired = false,
}: MaterialViewModalProps) {
  const t = useTranslations();
  const mime = material.mime_type?.toLowerCase() || "";
  const fileUrl = "file_url" in material ? material.file_url || "" : "";
  const isPresentation =
    mime.includes("presentation") ||
    mime === "application/pdf" ||
    mime.includes("word") ||
    mime.includes("powerpoint") ||
    mime.includes("vnd.ms-powerpoint") ||
    mime.includes("vnd.openxmlformats");
  const isHTML5 =
    mime === "text/html" || fileUrl.toLowerCase().endsWith("index.html");
  const isVideo = mime.startsWith("video/");

  if (premiumRequired) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-semibold text-slate-900">{material.title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {t.presentationsPage?.premiumRequired || "Требуется премиум-подписка"}
            </h3>
            <p className="text-sm text-slate-600">
              {t.presentationsPage?.premiumRequiredMessage || "Презентации доступны только премиум-подписчикам. Обратитесь к администратору для оформления подписки."}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {material.metadata?.class && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                  {material.metadata.class} {t.presentationsAdmin?.classSuffix || "класс"}
                </span>
              )}
              {material.metadata?.subject && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                  {material.metadata.subject}
                </span>
              )}
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

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isVideo ? (
            <video
              src={fileUrl}
              controls
              className="w-full rounded-xl"
              title={material.title}
            />
          ) : isHTML5 ? (
            <iframe
              src={fileUrl}
              className="w-full h-[70vh] min-h-[500px] rounded-xl border border-slate-200"
              title={material.title}
              sandbox="allow-downloads allow-forms allow-pointer-lock allow-presentation allow-scripts"
              referrerPolicy="no-referrer"
            />
          ) : isPresentation ? (
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
                {t.presentationsPage?.downloadHint || "Скачайте материал для просмотра"}
              </p>
              <a
                href={fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                {t.presentationsPage?.downloadMaterial || "СКАЧАТЬ МАТЕРИАЛ"}
              </a>
            </div>
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
                {t.presentationsPage?.previewUnavailable || "Предпросмотр недоступен для этого типа файла"}
              </p>
              <a
                href={fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                {t.presentationsPage?.downloadFile || "Скачать файл"}
              </a>
            </div>
          )}
        </div>

        {/* Footer - Download button for non-video, non-HTML5 */}
        {!isVideo && !isHTML5 && (
          <div className="flex items-center justify-end p-4 border-t border-slate-200 flex-shrink-0">
            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {t.presentationsPage?.download || "Скачать"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
