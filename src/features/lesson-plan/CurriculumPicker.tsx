import { useEffect, useRef, useState } from "react";
import { searchLessonCurriculum, type CurriculumObjective, type CurriculumSearchResponse } from "@/lib/api";
import { buttonClass, TextField } from "./Fields";
import { safeSourceUrl } from "./model";
import { lessonWarning } from "./copy";

type Props = { subject: string; grade: string; teachingLanguage: string; selected: CurriculumObjective[]; onSelect: (items: CurriculumObjective[]) => void; kk: boolean };

export function CurriculumPicker({ subject, grade, teachingLanguage, selected, onSelect, kk }: Props) {
  const [query, setQuery] = useState("");
  const [programId, setProgramId] = useState("");
  const [programs, setPrograms] = useState<CurriculumSearchResponse["programs"]>([]);
  const [result, setResult] = useState<CurriculumSearchResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const sequence = useRef(0);
  const canSearch = Boolean(subject.trim() && grade);

  useEffect(() => {
    const requestId = ++sequence.current;
    const controller = new AbortController();
    if (!canSearch) return () => controller.abort();
    const timer = setTimeout(() => {
      setPending(true); setFailed(false); setResult(null);
      searchLessonCurriculum({ subject: subject.trim(), grade, teaching_language: teachingLanguage, query, program_id: programId, limit: 30 }, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted && sequence.current === requestId) {
            setResult(data);
            setPrograms((previous) => {
              const available = new Map(previous.map((program) => [program.id ?? program.program_id, program]));
              for (const program of data.programs ?? []) available.set(program.id ?? program.program_id, program);
              return Array.from(available.values());
            });
          }
        })
        .catch(() => { if (!controller.signal.aborted && sequence.current === requestId) setFailed(true); })
        .finally(() => { if (!controller.signal.aborted && sequence.current === requestId) setPending(false); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [canSearch, subject, grade, teachingLanguage, query, programId, retry]);

  const groups = new Map<string, CurriculumObjective[]>();
  for (const item of result?.items ?? []) groups.set(item.program_id, [...(groups.get(item.program_id) ?? []), item]);
  const toggle = (item: CurriculumObjective) => onSelect(selected.some((value) => value.id === item.id) ? selected.filter((value) => value.id !== item.id) : [...selected, item]);

  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div><h3 className="font-bold text-slate-900">{kk ? "Бағдарламадан оқу мақсатын таңдау" : "Выбрать цель из учебной программы"}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{kk ? "Пән мен сыныпты енгізіңіз. Қажетті мақсатты өзіңіз таңдаңыз немесе төменде қолмен жазыңыз." : "Укажите предмет и класс. Выберите подходящую цель или введите её вручную ниже."}</p></div>
    <TextField label={kk ? "Код немесе мақсат мәтіні бойынша іздеу" : "Поиск по коду или тексту цели"} value={query} onChange={(value) => { setQuery(value); setResult(null); setPending(true); setFailed(false); }} disabled={!canSearch} />
    <div role="status" aria-live="polite" className="text-sm leading-6 text-slate-600">
      {!canSearch ? (kk ? "Іздеу үшін пән мен сынып қажет." : "Для поиска нужны предмет и класс.") : pending ? (kk ? "Оқу мақсаттары ізделуде…" : "Ищем учебные цели…") : null}
      {failed ? <div><p>{kk ? "Анықтамалық қолжетімсіз. Мақсатты қолмен енгізіп жалғастыра аласыз." : "Справочник недоступен. Можно продолжить, введя цель вручную."}</p><button type="button" className={`${buttonClass} mt-2`} onClick={() => setRetry((value) => value + 1)}>{kk ? "Қайталау" : "Повторить поиск"}</button></div> : null}
      {canSearch && result && !result.items.length ? (kk ? "Бұл сұрау бойынша расталған мақсат табылмады. Код пен тұжырымды қолмен енгізіңіз; жүйе оны тексерілмеген деп белгілейді." : "По этому запросу подтверждённых целей нет. Введите код и формулировку вручную; система отметит, что они требуют проверки.") : null}
    </div>
    {programs.length > 1 || programId ? <label className="block text-sm font-semibold text-slate-700">{kk ? "Оқу бағдарламасы" : "Учебная программа"}<select value={programId} onChange={(event) => { setProgramId(event.target.value); setResult(null); setPending(true); setFailed(false); }} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"><option value="">{kk ? "Барлық бағдарламалар" : "Все программы"}</option>{programs.map((program) => <option key={program.id ?? program.program_id} value={program.id ?? program.program_id}>{program.title ?? program.program_title}</option>)}</select></label> : null}
    {result && result.total > result.items.length ? <p className="text-xs leading-5 text-slate-600">{kk ? `${result.items.length} / ${result.total} мақсат көрсетілген. Қажетті мақсатты табу үшін іздеуді нақтылаңыз.` : `Показано ${result.items.length} из ${result.total} целей. Уточните поиск, чтобы найти нужную.`}</p> : null}
    <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1" tabIndex={groups.size ? 0 : undefined} role="region" aria-label={kk ? "Табылған оқу мақсаттары" : "Найденные учебные цели"}>
    {Array.from(groups.entries()).map(([id, items]) => <fieldset key={id} className="space-y-2"><legend className="mb-2 text-sm font-bold text-slate-800">{items[0].program_title}</legend>{items.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3"><label className="flex cursor-pointer gap-3"><input type="checkbox" checked={selected.some((value) => value.id === item.id)} onChange={() => toggle(item)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--primary)]" /><span className="text-sm leading-6"><strong>{item.code}</strong> {item.text}</span></label><p className="mt-1 pl-8 text-xs leading-5 text-slate-600">{item.section} · {item.source_locator} · {item.source_version}</p>{safeSourceUrl(item.source_url) ? <a className="ml-8 text-xs font-semibold text-[var(--primary)] underline" href={safeSourceUrl(item.source_url)} target="_blank" rel="noopener noreferrer">{kk ? "Ресми дереккөз" : "Официальный источник"}</a> : null}</div>)}</fieldset>)}
    </div>
    {selected.length ? <div className="border-t border-slate-200 pt-3"><p className="text-sm font-semibold">{kk ? "Таңдалған мақсаттар" : "Выбранные цели"}: {selected.length}</p>{selected.map((item) => <div key={item.id} className="mt-2 flex items-center gap-2 text-sm"><span className="flex-1">{item.code} {item.text}</span><button type="button" className={buttonClass} onClick={() => toggle(item)} aria-label={`${kk ? "Мақсатты алып тастау" : "Убрать цель"} ${item.code}`}>{kk ? "Алып тастау" : "Убрать"}</button></div>)}</div> : null}
    {result?.warnings?.map((warning, i) => <p key={i} className="text-sm leading-6 text-amber-900">{lessonWarning(warning, kk)}</p>)}
  </section>;
}
