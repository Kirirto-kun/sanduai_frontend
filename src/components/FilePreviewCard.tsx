"use client";

import { useEffect, useState } from "react";

interface FilePreviewCardProps {
  file: File;
  title?: string;
  onTitleChange?: (title: string) => void;
  onRemove?: () => void;
  showTitleEdit?: boolean;
  compact?: boolean;
}

export function FilePreviewCard({
  file,
  title,
  onTitleChange,
  onRemove,
  showTitleEdit = false,
  compact = false,
}: FilePreviewCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  const defaultTitle = file.name.includes(".") ? file.name.slice(0, file.name.lastIndexOf(".")) : file.name;
  const displayTitle = (title !== undefined && title !== "") ? title : defaultTitle;
  const size = file.size < 1024 ? `${file.size} B` : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  if (compact) {
    return (
      <div className="group relative rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition hover:shadow-md">
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={file.name} className="aspect-square w-full rounded-lg object-cover" />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-slate-100">
            <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <p className="mt-1 truncate text-xs text-slate-600">{file.name}</p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition hover:bg-red-600 group-hover:opacity-100"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="group flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {showTitleEdit && onTitleChange ? (
          <input
            type="text"
            value={displayTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Название"
          />
        ) : (
          <p className="truncate font-medium text-slate-900">{displayTitle}</p>
        )}
        <p className="mt-0.5 text-xs text-slate-500">{size}</p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
