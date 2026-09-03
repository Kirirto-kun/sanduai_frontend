"use client";

/**
 * Общие блоки интерфейса генераторов изображений.
 *
 * Один набор компонентов на комикс, көрнекілік и инфографику — чтобы три
 * страницы выглядели как один продукт, а не как три разных.
 */

import { ReactNode, useCallback, useRef, useState } from "react";
import { downloadImage } from "../../lib/api";
import { generationServerStatusCopy } from "../../lib/generation-history";
import { useLanguage } from "../../i18n/LanguageContext";

// --- Каркас страницы ---------------------------------------------------------

export function GeneratorLayout({
  icon,
  title,
  subtitle,
  cost,
  costLabel,
  form,
  result,
}: {
  icon: string;
  title: string;
  subtitle: string;
  cost: number;
  costLabel: string;
  form: ReactNode;
  result: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--secondary)] text-2xl shadow-md">
            {icon}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2">
          <span className="text-lg">🪙</span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-amber-900">{cost}</p>
            <p className="text-[10px] uppercase tracking-wide text-amber-700">
              {costLabel}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
            {form}
          </div>
        </div>
        <div className="min-w-0">{result}</div>
      </div>
    </div>
  );
}

// --- Поле формы --------------------------------------------------------------

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/20 disabled:bg-slate-50 disabled:text-slate-400";

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} resize-y`} />;
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClass} />;
}

// --- Переключатель вариантов -------------------------------------------------

export type Option<T extends string> = { value: T; label: string; icon?: string };

export function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  disabled,
  columns = 2,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10 text-[color:var(--primary)] shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {option.icon && <span>{option.icon}</span>}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// --- Загрузка фото -----------------------------------------------------------

export function PhotoDropzone({
  files,
  onChange,
  disabled,
  max = 3,
  labels,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  max?: number;
  labels: { prompt: string; hint: string; remove: string };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const images = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
      onChange([...files, ...images].slice(0, max));
    },
    [files, max, onChange]
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            : dragging
              ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5"
              : "border-slate-300 bg-slate-50/60 hover:border-[color:var(--primary)] hover:bg-[color:var(--primary)]/5"
        }`}
      >
        <span className="text-2xl">📷</span>
        <p className="text-xs font-medium text-slate-600">{labels.prompt}</p>
        <p className="text-[10px] text-slate-400">{labels.hint}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
              />
              <button
                type="button"
                title={labels.remove}
                disabled={disabled}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white opacity-0 shadow transition group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Кнопка генерации --------------------------------------------------------

export function GenerateButton({
  loading,
  disabled,
  label,
  loadingLabel,
  onClick,
}: {
  loading: boolean;
  disabled: boolean;
  label: string;
  loadingLabel: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
      )}
      {loading ? loadingLabel : label}
    </button>
  );
}

// --- Состояния результата ----------------------------------------------------

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-10 text-center">
      <span className="mb-3 text-5xl opacity-40">{icon}</span>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-400">{hint}</p>
    </div>
  );
}

export function LoadingState({
  title,
  steps,
  serverAccepted,
}: {
  title: string;
  steps: string[];
  serverAccepted: boolean;
}) {
  const { language } = useLanguage();

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-white/70 bg-white/80 p-10 text-center shadow-sm backdrop-blur">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-[color:var(--primary)] border-r-transparent" />
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">
        {generationServerStatusCopy(language, serverAccepted)}
      </p>

      {steps.length > 0 && (
        <p className="mt-5 max-w-lg text-xs leading-5 text-slate-400">
          {steps.join(" · ")}
        </p>
      )}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <p className="flex items-start gap-2 text-sm text-red-800">
        <span className="text-base leading-none">⚠️</span>
        <span>{message}</span>
      </p>
    </div>
  );
}

// --- Картинка с действиями ---------------------------------------------------

export function ImageCard({
  imageUrl,
  filename,
  title,
  caption,
  labels,
  children,
}: {
  imageUrl: string;
  filename: string;
  title?: string;
  caption?: ReactNode;
  labels: { download: string; open: string; downloading: string };
  children?: ReactNode;
}) {
  const [downloading, setDownloading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Идём через прокси бэкенда: прямая ссылка на CDN упирается в CORS.
      const blob = await downloadImage(imageUrl);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, "_blank", "noopener");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
      {title && (
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-base font-bold leading-snug text-slate-900">{title}</h2>
        </div>
      )}

      <div className="bg-slate-100/70 p-3">
        {!loaded && (
          <div className="mx-auto flex h-64 items-center justify-center rounded-lg bg-slate-200/60">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-400 border-r-transparent" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title || filename}
          onLoad={() => setLoaded(true)}
          className={`mx-auto max-h-[75vh] w-auto max-w-full rounded-lg shadow-md ${
            loaded ? "" : "hidden"
          }`}
        />
      </div>

      {caption && <div className="border-t border-slate-100 px-4 py-3">{caption}</div>}

      <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {downloading ? labels.downloading : `⬇ ${labels.download}`}
        </button>
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          ↗ {labels.open}
        </a>
        {children}
      </div>
    </div>
  );
}
