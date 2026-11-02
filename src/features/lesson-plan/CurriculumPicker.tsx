import { useEffect, useRef, useState } from "react";
import { searchLessonCurriculum, type CurriculumObjective, type CurriculumProgram, type CurriculumSearchResponse } from "@/lib/api";
import { buttonClass, fieldClass, TextField } from "./Fields";
import { safeSourceUrl } from "./model";
import { lessonWarning } from "./copy";
import { ObjectiveContent } from "./ObjectiveContent";

type Props = { subject: string; grade: string; teachingLanguage: string; programId?: string; selected: CurriculumObjective[]; onProgrammeChange: (id: string) => void; onSelect: (items: CurriculumObjective[]) => void; kk: boolean };
const programmeId = (program: CurriculumProgram) => program.program_id ?? program.id ?? "";

export function programmeLabel(program: CurriculumProgram, kk: boolean): string {
  const labels: string[] = [];
  if (program.stream === "natural_science_math") labels.push(kk ? "Жаратылыстану-математикалық бағыт" : "Естественно-математическое направление");
  if (program.stream === "social_humanities") labels.push(kk ? "Қоғамдық-гуманитарлық бағыт" : "Общественно-гуманитарное направление");
  if (program.school_type === "abai_specialized") labels.push(kk ? "Абай мектептері" : "Школы Абая");
  else if (program.school_type === "specialized") labels.push(kk ? "Мамандандырылған мектеп" : "Специализированная школа");
  else if (program.school_type === "general") labels.push(kk ? "Жалпы білім беретін мектеп" : "Общеобразовательная школа");
  if (program.workload === "reduced") labels.push(kk ? "Төмендетілген оқу жүктемесі" : "Сокращённая учебная нагрузка");
  else if (program.workload === "standard") labels.push(kk ? "Қалыпты оқу жүктемесі" : "Стандартная учебная нагрузка");
  labels.push(program.title ?? program.program_title ?? "");
  const appendix = programmeId(program).match(/:a([\d-]+):/);
  if (appendix) labels.push(kk ? appendix[1] + "-қосымша" : "Приложение " + appendix[1]);
  return labels.filter(Boolean).join(" · ");
}

export function CurriculumPicker({ subject, grade, teachingLanguage, programId = "", selected, onProgrammeChange, onSelect, kk }: Props) {
  const [query, setQuery] = useState("");
  const [catalogue, setCatalogue] = useState<CurriculumSearchResponse | null>(null);
  const [result, setResult] = useState<CurriculumSearchResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [notice, setNotice] = useState(false);
  const onProgrammeRef = useRef(onProgrammeChange);
  useEffect(() => { onProgrammeRef.current = onProgrammeChange; }, [onProgrammeChange]);
  const canSearch = Boolean(subject.trim() && grade);
  const programs = catalogue?.programs ?? [];
  const selectedProgramme = programs.find((program) => programmeId(program) === programId);
  const programmeSelected = Boolean(selectedProgramme);
  const needsProgramme = programs.length > 1 && !programmeSelected;

  useEffect(() => {
    if (!canSearch) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setPending(true); setFailed(false);
      searchLessonCurriculum({ subject: subject.trim(), grade, teaching_language: teachingLanguage, query: "", limit: 1 }, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
          setCatalogue(data);
          if (data.programs.length === 1) onProgrammeRef.current(programmeId(data.programs[0]));
        })
        .catch(() => { if (!controller.signal.aborted) setFailed(true); })
        .finally(() => { if (!controller.signal.aborted) setPending(false); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [canSearch, subject, grade, teachingLanguage, retry]);

  useEffect(() => {
    if (!canSearch || !catalogue || (programs.length > 0 && !programmeSelected)) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setPending(true); setFailed(false);
      searchLessonCurriculum({ subject: subject.trim(), grade, teaching_language: teachingLanguage, query, program_id: programId, limit: 30 }, controller.signal)
        .then((data) => { if (!controller.signal.aborted) setResult(data); })
        .catch(() => { if (!controller.signal.aborted) setFailed(true); })
        .finally(() => { if (!controller.signal.aborted) setPending(false); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [canSearch, catalogue, programs.length, programmeSelected, subject, grade, teachingLanguage, query, programId, retry]);

  const toggle = (item: CurriculumObjective) => {
    if (selected.some((value) => value.id === item.id)) onSelect(selected.filter((value) => value.id !== item.id));
    else if (programmeSelected && item.program_id === programId && item.selectable !== false) onSelect([...selected.filter((value) => value.program_id === programId), item]);
  };
  const coverage = result?.coverage ?? catalogue?.coverage;
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div><h3 className="font-bold text-slate-900">{kk ? "Бағдарламадан оқу мақсатын таңдау" : "Выбрать цель из учебной программы"}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{kk ? "Пән мен сыныпты енгізіп, сыныбыңызға арналған бір бағдарламаны таңдаңыз. Мақсаттар сол бағдарламадан алынады." : "Укажите предмет и класс, затем выберите одну программу своего класса. Цели берутся из этой программы."}</p></div>
    {programs.length > 0 ? <label className="block text-sm font-semibold text-slate-700">{kk ? "Оқу бағдарламасы және бағыты" : "Учебная программа и направление"}{programs.length > 1 ? " *" : ""}<select required={programs.length > 1} value={programmeSelected ? programId : ""} aria-describedby="lesson-programme-hint" onChange={(event) => { setNotice(selected.some((item) => item.program_id !== event.target.value)); onProgrammeChange(event.target.value); setResult(null); }} className={fieldClass + " mt-1.5"}><option value="">{kk ? "Сыныбыңыздың бағдарламасын таңдаңыз" : "Выберите программу своего класса"}</option>{programs.map((program) => <option key={programmeId(program)} value={programmeId(program)}>{programmeLabel(program, kk)}</option>)}</select><span id="lesson-programme-hint" className="mt-1.5 block text-xs font-normal leading-5 text-slate-600">{kk ? "Мектеп түрін, бағыт пен оқу жүктемесін тексеріңіз. Бағдарлама ауысса, бұрынғы сәйкес емес мақсаттар алынып тасталады." : "Проверьте тип школы, направление и нагрузку. При смене программы несовместимые выбранные цели будут сняты."}</span></label> : null}
    {selectedProgramme ? <p className="break-words rounded-xl bg-white p-3 text-sm leading-6 text-slate-700"><strong>{kk ? "Таңдалған бағдарлама: " : "Выбранная программа: "}</strong>{programmeLabel(selectedProgramme, kk)}</p> : null}
    {notice ? <p role="status" className="rounded-xl bg-sky-50 p-3 text-sm text-sky-900">{kk ? "Бағдарлама өзгерді. Бұрынғы бағдарламаның мақсаттары алынып тасталды; жаңа мақсаттарды таңдаңыз. Қолмен енгізілген мәтін сақталды." : "Программа изменена. Цели прежней программы сняты; выберите новые. Введённый вручную текст сохранён."}</p> : null}
    <TextField label={kk ? "Код немесе мақсат мәтіні бойынша іздеу" : "Поиск по коду или тексту цели"} value={query} onChange={(value) => { setQuery(value); setResult(null); }} disabled={!canSearch || needsProgramme} />
    <div role="status" aria-live="polite" className="text-sm leading-6 text-slate-600">
      {!canSearch ? (kk ? "Іздеу үшін пән мен сынып қажет." : "Для поиска нужны предмет и класс.") : pending ? (kk ? "Оқу мақсаттары ізделуде…" : "Ищем учебные цели…") : needsProgramme ? (kk ? "Бірнеше бағдарлама бар. Мақсат таңдаудан бұрын тиісті бағдарламаны белгілеңіз." : "Найдено несколько программ. Перед выбором целей укажите подходящую программу.") : null}
      {failed ? <div><p>{kk ? "Анықтамалық қолжетімсіз. Код пен толық тұжырымды қолмен енгізе аласыз; олар тексеруді қажет етеді." : "Справочник недоступен. Можно вручную ввести код и полную формулировку; их потребуется проверить."}</p><button type="button" className={buttonClass + " mt-2"} onClick={() => setRetry((value) => value + 1)}>{kk ? "Қайталау" : "Повторить поиск"}</button></div> : null}
      {result && !result.items.length ? (kk ? "Бұл сұрау бойынша таңдауға жарамды мақсат табылмады. Іздеуді өзгертіңіз немесе ресми мәтінді қолмен енгізіңіз." : "Доступных для выбора целей по этому запросу нет. Измените поиск или введите официальный текст вручную.") : null}
    </div>
    {coverage ? <p className="text-xs leading-5 text-slate-600">{kk ? "Каталогтағы мақсаттар" : "Цели в каталоге"}: {coverage.ready_objectives ?? result?.total ?? catalogue?.total ?? 0} {kk ? "таңдауға қолжетімді" : "доступны для выбора"}{typeof coverage.review_objectives === "number" ? " · " + coverage.review_objectives + " " + (kk ? "қайта тексеруді қажет етеді" : "требуют дополнительной сверки") : ""}{typeof coverage.blocked_objectives === "number" && coverage.blocked_objectives > 0 ? " · " + coverage.blocked_objectives + " " + (kk ? "дерек сапасына байланысты таңдаудан алынып тасталған" : "исключены из выбора из-за качества исходных данных") : ""}. {kk ? "Дереккөзбен автоматты салыстыру әдістемелік сараптаманы алмастырмайды." : "Автоматическая сверка с источником не заменяет методическую проверку."}</p> : null}
    {result && result.total > result.items.length ? <p className="text-xs leading-5 text-slate-600">{kk ? result.items.length + " / " + result.total + " мақсат көрсетілген. Іздеуді нақтылаңыз." : "Показано " + result.items.length + " из " + result.total + " целей. Уточните поиск."}</p> : null}
    <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1" tabIndex={result?.items.length ? 0 : undefined} role="region" aria-label={kk ? "Табылған оқу мақсаттары" : "Найденные учебные цели"}>
      {result?.items.filter((item) => item.program_id === programId).map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3"><label className="flex cursor-pointer gap-3"><input type="checkbox" checked={selected.some((value) => value.id === item.id)} disabled={item.selectable === false || !programmeSelected} onChange={() => toggle(item)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--primary)]" /><span className="min-w-0 text-sm leading-6"><strong>{item.code}</strong> <ObjectiveContent objective={item} kk={kk} /></span></label><p className="mt-1 pl-8 text-xs leading-5 text-slate-600">{item.section} · {item.source_version}</p>{safeSourceUrl(item.source_url) ? <a className="ml-8 text-xs font-semibold text-[var(--primary)] underline" href={safeSourceUrl(item.source_url)} target="_blank" rel="noopener noreferrer">{kk ? "Ресми дереккөз" : "Официальный источник"}</a> : null}</div>)}
    </div>
    {result?.review_items?.length ? <details><summary className="cursor-pointer py-2 text-sm font-semibold text-amber-900">{kk ? "Неге кейбір мақсаттар таңдауға қолжетімсіз?" : "Почему некоторые цели недоступны для выбора?"}</summary><p className="mt-2 text-sm leading-6">{kk ? "Бастапқы деректе код, тұжырым немесе формула қосымша тексеруді қажет етеді. Ресми түпнұсқаны ашып, дұрыс мәтінді қолмен енгізуге болады." : "Код, формулировка или формула в исходных данных требуют дополнительной сверки. Откройте официальный оригинал и при необходимости введите проверенный текст вручную."}</p>{result.review_items.map((item) => <div key={item.id} className="mt-3 text-sm leading-6"><strong>{item.code}</strong> <ObjectiveContent objective={item} kk={kk} />{item.quality_issues?.map((issue) => <p key={issue} className="mt-1 text-xs text-amber-900">{lessonWarning(issue, kk)}</p>)}{safeSourceUrl(item.source_url) ? <a className="ml-2 text-[var(--primary)] underline" href={safeSourceUrl(item.source_url)} target="_blank" rel="noopener noreferrer">{kk ? "Түпнұсқа" : "Оригинал"}</a> : null}</div>)}</details> : null}
    {selected.length ? <div className="border-t border-slate-200 pt-3"><p className="text-sm font-semibold">{kk ? "Таңдалған мақсаттар" : "Выбранные цели"}: {selected.length}</p>{selected.map((item) => <div key={item.id} className="mt-2 flex items-start gap-2 text-sm leading-6"><span className="min-w-0 flex-1"><strong>{item.code}</strong> <ObjectiveContent objective={item} kk={kk} /></span><button type="button" className={buttonClass} onClick={() => toggle(item)} aria-label={(kk ? "Мақсатты алып тастау " : "Убрать цель ") + item.code}>{kk ? "Алып тастау" : "Убрать"}</button></div>)}</div> : null}
    {[...new Set(result?.warnings ?? catalogue?.warnings ?? [])].map((warning) => <p key={warning} className="text-sm leading-6 text-amber-900">{lessonWarning(warning, kk)}</p>)}
  </section>;
}
