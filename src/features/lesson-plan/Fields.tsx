import { useId, type InputHTMLAttributes } from "react";

export const fieldClass = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/25 disabled:bg-slate-100";
export const buttonClass = "min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:cursor-wait disabled:opacity-60";

export function TextField({ label, value, onChange, multiline, hint, ...props }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = useId();
  return <div className="min-w-0">
    <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">{label}{props.required ? " *" : ""}</label>
    {multiline ? <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={3} className={fieldClass} aria-describedby={hint ? `${id}-hint` : undefined} required={props.required} disabled={props.disabled} /> : <input {...props} id={id} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} aria-describedby={hint ? `${id}-hint` : undefined} />}
    {hint ? <p id={`${id}-hint`} className="mt-1.5 text-xs leading-5 text-slate-600">{hint}</p> : null}
  </div>;
}
