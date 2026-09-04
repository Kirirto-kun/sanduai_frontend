"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export type LocalFilePreviewKind = "image" | "video" | "pdf" | "presentation" | "document" | "file";

export function localFilePreviewKind(file: Pick<File, "name" | "type">): LocalFilePreviewKind {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) return "image";
  if (file.type.startsWith("video/") || ["mp4", "mov", "webm"].includes(extension)) return "video";
  if (file.type === "application/pdf" || extension === "pdf") return "pdf";
  if (["ppt", "pptx"].includes(extension)) return "presentation";
  if (["doc", "docx"].includes(extension)) return "document";
  return "file";
}

function readableSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} МБ`;
}

export function LocalFilePreview({
  file,
  language,
  onRemove,
  disabled = false,
  className = "",
}: {
  file: File;
  language: "ru" | "kk";
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const kind = useMemo(() => localFilePreviewKind(file), [file]);
  const needsObjectUrl = kind === "image" || kind === "video" || kind === "pdf";
  const [preview, setPreview] = useState<{ file: File; objectUrl: string } | null>(null);
  const [failedFile, setFailedFile] = useState<File | null>(null);
  const extension = file.name.split(".").pop()?.toUpperCase() || "FILE";

  useEffect(() => {
    if (!needsObjectUrl) return;
    const next = URL.createObjectURL(file);
    let active = true;
    queueMicrotask(() => {
      if (active) setPreview({ file, objectUrl: next });
    });
    return () => {
      active = false;
      URL.revokeObjectURL(next);
    };
  }, [file, needsObjectUrl]);

  const objectUrl = preview?.file === file ? preview.objectUrl : null;
  const failed = failedFile === file;

  const pendingMessage = language === "kk"
    ? "Нақты мұқаба сақтағаннан кейін автоматты түрде жасалады"
    : "Настоящая обложка автоматически появится после сохранения";
  const unavailableMessage = language === "kk"
    ? "Алдын ала қарауды көрсету мүмкін болмады"
    : "Не удалось показать превью";

  return (
    <article className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {needsObjectUrl && !objectUrl && !failed ? (
          <div className="absolute inset-0 animate-pulse bg-slate-200" aria-label={language === "kk" ? "Алдын ала қарау жүктелуде" : "Загрузка превью"} />
        ) : kind === "image" && objectUrl && !failed ? (
          <Image
            src={objectUrl}
            alt={file.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-cover"
            onError={() => setFailedFile(file)}
          />
        ) : kind === "video" && objectUrl && !failed ? (
          <video
            src={objectUrl}
            controls
            muted
            preload="metadata"
            className="h-full w-full bg-black object-contain"
            aria-label={file.name}
            onError={() => setFailedFile(file)}
          />
        ) : kind === "pdf" && objectUrl && !failed ? (
          <iframe
            src={`${objectUrl}#page=1&toolbar=0&navpanes=0`}
            title={`${language === "kk" ? "PDF алдын ала қарау" : "Предпросмотр PDF"}: ${file.name}`}
            className="h-full w-full border-0 bg-white"
            onError={() => setFailedFile(file)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-violet-50 px-4 text-center">
            <span className="rounded-xl bg-white px-3 py-2 text-lg font-black text-slate-700 shadow-sm ring-1 ring-slate-200">{extension}</span>
            <span className="mt-2 text-[10px] leading-4 text-slate-500">{failed ? unavailableMessage : pendingMessage}</span>
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 p-2.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-800" title={file.name}>{file.name}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">{extension} · {readableSize(file.size)}</p>
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`${language === "kk" ? "Файлды жою" : "Удалить файл"}: ${file.name}`}
            className="shrink-0 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {language === "kk" ? "Жою" : "Удалить"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
