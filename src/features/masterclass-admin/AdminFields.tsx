import type { ReactNode } from "react";
import { LANGUAGE_NAMES, moveOption } from "./model";
import { MASTERCLASS_LANGUAGES, type MasterclassLabels, type MasterclassLanguage, type MasterclassOption } from "./types";

export const fieldClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50 disabled:text-slate-500";
export const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-40";
export const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return <label className={`block text-sm font-semibold text-slate-700 ${className}`}>{label}{children}{hint ? <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500">{hint}</span> : null}</label>;
}

export function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-bold text-slate-900">{title}</h3>{description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}</div>{action}</div>;
}

export function LabelInput({ label, value, language, onChange, multiline = false }: {
  label: string; value: MasterclassLabels; language: MasterclassLanguage; onChange: (value: MasterclassLabels) => void; multiline?: boolean;
}) {
  return <Field label={`${label} · ${LANGUAGE_NAMES[language]}`}>
    {multiline
      ? <textarea rows={3} maxLength={1000} className={`${fieldClass} resize-y leading-6`} value={value[language]} onChange={event => onChange({ ...value, [language]: event.target.value })} />
      : <input data-option-label maxLength={1000} className={fieldClass} value={value[language]} onChange={event => onChange({ ...value, [language]: event.target.value })} />}
  </Field>;
}

export function OptionEditor<T extends MasterclassOption>({ title, description, rows, language, kk, max, onChange, onAdd, onIdChange, extra, canRemove, allowEmpty = false, emptyMessage, fixedIds = [] }: {
  title: string; description?: string; rows: T[]; language: MasterclassLanguage; kk: boolean; max: number;
  onChange: (rows: T[]) => void; onAdd: () => void; onIdChange?: (index: number, id: string) => void;
  extra?: (row: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
  canRemove?: (row: T) => boolean; allowEmpty?: boolean;
  emptyMessage?: string;
  fixedIds?: readonly string[];
}) {
  const patch = (index: number, changes: Partial<T>) => onChange(rows.map((row, position) => position === index ? { ...row, ...changes } : row));
  return <section>
    <SectionTitle title={title} description={description} action={<button type="button" disabled={rows.length >= max} className={secondaryButton} onClick={onAdd}>+ {kk ? "Қосу" : "Добавить"}</button>} />
    <div className="space-y-3">
      {!rows.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">{emptyMessage ?? (kk ? "Тізім бос. Бірінші жазбаны қосыңыз." : "Список пуст. Добавьте первую запись.")}</div> : null}
      {rows.map((row, index) => {
        const complete = MASTERCLASS_LANGUAGES.filter(code => Boolean(row.label[code].trim())).length;
        const removable = (allowEmpty || rows.length > 1) && (canRemove?.(row) ?? true);
        const fixedCode = fixedIds.includes(row.id);
        return <article key={index} data-option-id={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">{String(index + 1).padStart(2, "0")}</span><span className={`text-xs font-medium ${complete === 4 ? "text-emerald-600" : "text-amber-700"}`}>{complete}/4 {kk ? "аударма" : "перевода"}</span></div><div className="flex items-center gap-1"><button type="button" aria-label={`${kk ? "Жоғары" : "Выше"}: ${row.label[language] || row.id}`} disabled={index === 0} onClick={() => onChange(moveOption(rows, index, -1))} className={`${secondaryButton} h-9 min-h-9 w-8 px-0`}>↑</button><button type="button" aria-label={`${kk ? "Төмен" : "Ниже"}: ${row.label[language] || row.id}`} disabled={index === rows.length - 1} onClick={() => onChange(moveOption(rows, index, 1))} className={`${secondaryButton} h-9 min-h-9 w-8 px-0`}>↓</button><button type="button" disabled={!removable} title={!removable ? (kk ? "Байланыстарды немесе соңғы жазбаны тексеріңіз" : "Проверьте связи или последнюю запись списка") : undefined} aria-label={`${kk ? "Жою" : "Удалить"}: ${row.label[language] || row.id}`} onClick={() => onChange(rows.filter((_, position) => position !== index))} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-30">{kk ? "Жою" : "Удалить"}</button></div></div>
          <div className="grid gap-4 sm:grid-cols-[minmax(140px,0.65fr)_minmax(0,1.7fr)]"><Field label={kk ? "Код" : "Код"} hint={fixedCode ? (kk ? "Арнайы логика коды бекітілген. Атауларды өзгертуге болады." : "Код специальной функции закреплён. Названия можно менять.") : undefined}><input readOnly={fixedCode} maxLength={64} className={`${fieldClass} ${fixedCode ? "bg-slate-50 text-slate-500" : ""}`} value={row.id} onChange={event => { if (fixedCode) return; if (onIdChange) onIdChange(index, event.target.value); else patch(index, { id: event.target.value } as Partial<T>); }} /></Field><LabelInput label={kk ? "Атауы" : "Название"} language={language} value={row.label} onChange={label => patch(index, { label } as Partial<T>)} /></div>
          {extra ? <div className="mt-4 border-t border-slate-100 pt-4">{extra(row, index, changes => patch(index, changes))}</div> : null}
        </article>;
      })}
    </div>
  </section>;
}
