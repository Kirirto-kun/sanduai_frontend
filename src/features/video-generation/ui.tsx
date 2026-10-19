import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

type IconName =
  | "play"
  | "plus"
  | "sparkles"
  | "film"
  | "image"
  | "arrow"
  | "download"
  | "clock"
  | "check"
  | "chevron"
  | "trash"
  | "copy"
  | "volume"
  | "close"
  | "refresh"
  | "grid"
  | "scenes"
  | "shield"
  | "up"
  | "down";
const paths: Record<IconName, ReactNode> = {
  play: <path d="m9 5 11 7-11 7Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  sparkles: (
    <>
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" />
      <path d="M20 2v4M18 4h4" />
    </>
  ),
  film: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7 3v18M17 3v18M3 8h4m-4 8h4M17 8h4m-4 8h4" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1.5" />
      <path d="m3 17 5-5 4 4 4-6 5 7" />
    </>
  ),
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m8 10 4 4 4-4" />,
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 14h12l1-14M10 10v6m4-6v6" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M16 8V3H3v13h5" />
    </>
  ),
  volume: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  refresh: (
    <>
      <path d="M20 10a8 8 0 1 0 0 6M20 3v7h-7" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  scenes: (
    <>
      <rect x="3" y="5" width="12" height="14" rx="2" />
      <path d="M19 5v14M23 5v14m-16-9 4 2-4 2Z" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  up: <path d="m6 14 6-6 6 6" />,
  down: <path d="m6 10 6 6 6-6" />,
};
export function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400";
export function Button({
  children,
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "border-indigo-600 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:ring-indigo-300",
    secondary:
      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-indigo-200",
    ghost:
      "border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-indigo-200",
    danger:
      "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-200",
  };
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-45 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}
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
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-[11px] leading-5 text-slate-400">
          {hint}
        </span>
      )}
    </label>
  );
}
let openModalCount = 0;
let originalBodyOverflow = "";
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const element = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (openModalCount++ === 0) {
      originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    element.current
      ?.querySelector<HTMLElement>(
        "textarea, input:not([type=hidden]), select, button",
      )
      ?.focus();
    return () => {
      if (--openModalCount === 0)
        document.body.style.overflow = originalBodyOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
        if (e.key === "Tab") {
          const focusable = Array.from(
            element.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]",
            ) ?? [],
          ).filter((el) => el.offsetParent !== null);
          const first = focusable[0],
            last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <section
        ref={element}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`my-auto max-h-[92dvh] w-full overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7 ${wide ? "max-w-3xl" : "max-w-lg"}`}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <Button variant="ghost" onClick={onClose} aria-label="Закрыть / Жабу">
            <Icon name="close" />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}
