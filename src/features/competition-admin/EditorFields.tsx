import type { ReactNode } from "react";
import type { LocalizedText } from "./types";

export const fieldClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:bg-slate-50 disabled:text-slate-500";
export const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-40";

export function Field({ label, hint, children, className = "" }: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
    {label}{children}
    {hint ? <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500">{hint}</span> : null}
  </label>;
}

export function LocalizedField({ label, value, onChange, multiline = false, hint }: {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  multiline?: boolean;
  hint?: string;
}) {
  return <fieldset>
    <legend className="text-sm font-semibold text-slate-700">{label}</legend>
    {hint ? <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p> : null}
    <div className="mt-2 grid gap-3 md:grid-cols-2">
      {(["kk", "ru"] as const).map(code => <label key={code} className="block">
        <span className="text-[11px] font-bold tracking-wide text-slate-500">{code === "kk" ? "ҚАЗАҚША" : "РУССКИЙ"}</span>
        {multiline
          ? <textarea rows={4} className={`${fieldClass} mt-1 resize-y leading-6`} value={value[code]} onChange={event => onChange({ ...value, [code]: event.target.value })} />
          : <input className={`${fieldClass} mt-1`} value={value[code]} onChange={event => onChange({ ...value, [code]: event.target.value })} />}
      </label>)}
    </div>
  </fieldset>;
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
    <div><h3 className="text-base font-bold text-slate-900">{title}</h3>{description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}</div>
    {action}
  </div>;
}

export function RowControls({ index, count, label, kk, onMove, onRemove }: {
  index: number;
  count: number;
  label: string;
  kk: boolean;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return <div className="flex items-center gap-1">
    <button type="button" className={`${secondaryButton} h-9 min-h-9 w-9 px-0`} disabled={index === 0} aria-label={`${kk ? "Жоғары жылжыту" : "Переместить выше"}: ${label}`} onClick={() => onMove(-1)}>↑</button>
    <button type="button" className={`${secondaryButton} h-9 min-h-9 w-9 px-0`} disabled={index === count - 1} aria-label={`${kk ? "Төмен жылжыту" : "Переместить ниже"}: ${label}`} onClick={() => onMove(1)}>↓</button>
    <button type="button" className="ml-1 min-h-9 rounded-lg px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" aria-label={`${kk ? "Жою" : "Удалить"}: ${label}`} onClick={onRemove}>{kk ? "Жою" : "Удалить"}</button>
  </div>;
}

export function EmptyRows({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-10 text-center text-sm leading-6 text-slate-500">{message}</div>;
}

export function StatusBadge({ status, active, kk }: { status: string; active: boolean; kk: boolean }) {
  const verified = status === "verified";
  const partial = status === "partial";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${!active ? "bg-slate-100 text-slate-500" : verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${!active ? "bg-slate-400" : verified ? "bg-emerald-500" : "bg-amber-500"}`} />
    {!active ? (kk ? "Жоба" : "Черновик") : verified ? (kk ? "Тексерілген" : "Проверено") : partial ? (kk ? "Нақтылау қажет" : "Частично проверено") : (kk ? "Тексерілмеген" : "Не проверено")}
  </span>;
}
