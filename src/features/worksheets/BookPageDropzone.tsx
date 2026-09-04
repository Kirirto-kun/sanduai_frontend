"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  MAX_SOURCE_PAGES,
  type SourcePageValidationIssue,
  validateSourcePages,
} from "./worksheet-image";


type BookPageDropzoneLabels = {
  prompt: string;
  hint: string;
  remove: string;
  page: string;
  errors: Record<SourcePageValidationIssue, string>;
};


function BookPagePreview({
  file,
  index,
  disabled,
  labels,
  onRemove,
}: {
  file: File;
  index: number;
  disabled: boolean;
  labels: Pick<BookPageDropzoneLabels, "page" | "remove">;
  onRemove: () => void;
}) {
  const [preview] = useState(() => URL.createObjectURL(file));

  useEffect(() => () => URL.revokeObjectURL(preview), [preview]);

  return (
    <li className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Blob previews cannot be optimized by next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={preview}
        alt={`${labels.page} ${index + 1}: ${file.name}`}
        className="aspect-[3/4] w-full object-cover"
      />
      <span className="absolute left-1.5 top-1.5 rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-white">
        {index + 1}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`${labels.remove}: ${file.name}`}
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-slate-700 shadow transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
      >
        ×
      </button>
      <p className="truncate px-2 py-1.5 text-[10px] text-slate-500" title={file.name}>
        {file.name}
      </p>
    </li>
  );
}


export function BookPageDropzone({
  files,
  onChange,
  disabled = false,
  labels,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  labels: BookPageDropzoneLabels;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const nextFiles = [...files, ...Array.from(incoming)];
    const issue = validateSourcePages(nextFiles);
    if (issue) {
      setValidationError(labels.errors[issue]);
      return;
    }
    setValidationError(null);
    onChange(nextFiles);
  }, [files, labels.errors, onChange]);

  const removeFile = (index: number) => {
    setValidationError(null);
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  return (
    <div>
      <button
        type="button"
        disabled={disabled || files.length >= MAX_SOURCE_PAGES}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && files.length < MAX_SOURCE_PAGES) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(event.dataTransfer.files);
        }}
        aria-describedby="worksheet-source-pages-hint worksheet-source-pages-error"
        className={`flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
          disabled || files.length >= MAX_SOURCE_PAGES
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
            : dragging
              ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5"
              : "border-slate-300 bg-slate-50/60 text-slate-600 hover:border-[color:var(--primary)] hover:bg-[color:var(--primary)]/5"
        }`}
      >
        <span className="text-2xl" aria-hidden="true">📖</span>
        <span className="text-xs font-semibold">{labels.prompt}</span>
        <span id="worksheet-source-pages-hint" className="text-[11px] text-slate-400">
          {labels.hint}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={disabled || files.length >= MAX_SOURCE_PAGES}
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div id="worksheet-source-pages-error" aria-live="polite">
        {validationError ? (
          <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {validationError}
          </p>
        ) : null}
      </div>

      {files.length > 0 ? (
        <ol className="mt-3 grid grid-cols-3 gap-2">
          {files.map((file, index) => (
            <BookPagePreview
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              file={file}
              index={index}
              disabled={disabled}
              labels={labels}
              onRemove={() => removeFile(index)}
            />
          ))}
        </ol>
      ) : null}
    </div>
  );
}
