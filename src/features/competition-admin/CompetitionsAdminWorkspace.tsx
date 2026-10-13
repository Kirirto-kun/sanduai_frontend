"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { competitionAdminApi } from "./api";
import { Field, fieldClass, LocalizedField, secondaryButton, SectionHeading, StatusBadge } from "./EditorFields";
import { createAnnualDraft, dateTimeInput, dateTimeIso, needsVerification, presetInput, toggleValue, validatePreset } from "./model";
import { DirectionsEditor, RubricEditor, StructureEditor } from "./PresetCollections";
import type { CompetitionAdminList, CompetitionPresetInput, EditorTab, LocalizedText, VerificationStatus } from "./types";

const queryKey = ["admin-competitions"] as const;
const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-50";

function BookIcon({ className = "h-6 w-6" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5c-2.6-2-6.1-2.5-9-1v14c2.9-1.5 6.4-1 9 1 2.6-2 6.1-2.5 9-1v-14c-2.9-1.5-6.4-1-9 1Zm0 0v14M6 9h2m-2 4h2m8-4h2m-2 4h2" /></svg>;
}

export default function CompetitionsAdminWorkspace() {
  const { language } = useLanguage();
  const kk = language === "kk";
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";
  const query = useQuery({ queryKey, queryFn: ({ signal }) => competitionAdminApi.list(signal), enabled: isAdmin, refetchOnWindowFocus: false });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<CompetitionPresetInput | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("general");
  const [saving, setSaving] = useState(false);
  const [verifiedNow, setVerifiedNow] = useState(false);
  const [error, setError] = useState<LocalizedText | null>(null);
  const [notice, setNotice] = useState<LocalizedText | null>(null);
  const [yearFilter, setYearFilter] = useState("all");
  const [showNewYear, setShowNewYear] = useState(false);
  const [draftYear, setDraftYear] = useState(0);
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);
  const items = query.data?.items ?? [];
  const persisted = items.find(item => item.competition_id === selectedId) ?? items[0];
  const preset = editor ?? (persisted ? presetInput(persisted) : null);
  const dirty = isNew || Boolean(editor && persisted && JSON.stringify(editor) !== JSON.stringify(presetInput(persisted)));
  const currentYear = query.data?.current_year ?? Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Shanghai", year: "numeric" }).format(new Date()));

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace("/dashboard");
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const patch = (changes: Partial<CompetitionPresetInput>) => {
    if (!preset) return;
    setEditor({ ...preset, ...changes });
    setNotice(null);
    setError(null);
    setVerifiedNow(false);
  };

  const select = (id: string, discard = false) => {
    if (dirty && !discard) { setPendingSwitch(id); return; }
    setSelectedId(id);
    setEditor(null);
    setIsNew(false);
    setActiveTab("general");
    setVerifiedNow(false);
    setError(null);
    setNotice(null);
    setShowNewYear(false);
    setPendingSwitch(null);
  };

  const startAnnualDraft = () => {
    if (!persisted || dirty) return;
    setDraftYear(Math.max(currentYear + 1, persisted.year + 1));
    setShowNewYear(true);
    setError(null);
  };

  const createDraft = () => {
    if (!persisted || !Number.isInteger(draftYear) || draftYear < 2020 || draftYear > 2100) {
      setError({ kk: "2020–2100 аралығындағы жылды көрсетіңіз.", ru: "Укажите год от 2020 до 2100." });
      return;
    }
    if (items.some(item => item.kind === persisted.kind && item.year === draftYear)) {
      setError({ kk: "Бұл байқаудың осы жылғы ережесі бар. Оны сол жақтағы тізімнен таңдаңыз.", ru: "Правила этого конкурса на выбранный год уже есть. Выберите их в списке слева." });
      return;
    }
    setEditor(createAnnualDraft(persisted, draftYear));
    setIsNew(true);
    setActiveTab("general");
    setVerifiedNow(false);
    setNotice(null);
    setError(null);
    setShowNewYear(false);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!preset || saving) return;
    const validation = validatePreset(preset, kk, verifiedNow);
    if (validation) {
      setError({
        ru: validatePreset(preset, false, verifiedNow)!.message,
        kk: validatePreset(preset, true, verifiedNow)!.message,
      });
      setActiveTab(validation.tab);
      return;
    }
    if (needsVerification(preset, isNew ? undefined : persisted) && !verifiedNow) {
      setError({ kk: "Ереже өзгерді. Ресми дереккөзбен қайта салыстырып, тексеруді растаңыз.", ru: "Правила изменились. Сверьте их с официальным источником и подтвердите проверку." });
      setActiveTab("general");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const input = { ...preset, last_verified_at: verifiedNow ? new Date().toISOString() : preset.last_verified_at };
      const updated = isNew ? await competitionAdminApi.create(input) : await competitionAdminApi.update(preset.competition_id, input);
      queryClient.setQueryData<CompetitionAdminList>(queryKey, previous => previous ? {
        ...previous, items: [updated, ...previous.items.filter(item => item.competition_id !== updated.competition_id)],
      } : { items: [updated], current_year: currentYear, warnings: [] });
      setSelectedId(updated.competition_id);
      setEditor(null);
      setIsNew(false);
      setVerifiedNow(false);
      setNotice(updated.is_active
        ? { kk: "Ереже сақталды. Педагогтер осы нұсқаны қолданады.", ru: "Правила сохранены. Педагоги будут использовать эту версию." }
        : { kk: "Жоба сақталды. Педагогтерге қолжетімді болмайды.", ru: "Черновик сохранён. Он пока недоступен педагогам." });
      await queryClient.invalidateQueries({ queryKey: ["competition-config"] });
    } catch (cause) {
      setError({
        kk: teacherFacingErrorMessage(cause, "kk", { fallback: "Ережені сақтау мүмкін болмады." }),
        ru: teacherFacingErrorMessage(cause, "ru", { fallback: "Не удалось сохранить правила." }),
      });
    } finally { setSaving(false); }
  };

  if (authLoading || !isAdmin || query.isPending) return <div className="flex min-h-80 items-center justify-center gap-3 text-sm text-slate-500"><span className="h-6 w-6 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />{kk ? "Байқаулар жүктелуде…" : "Загружаем конкурсы…"}</div>;
  if (query.isError) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800"><p>{teacherFacingErrorMessage(query.error, language, { fallback: kk ? "Байқауларды жүктеу мүмкін болмады." : "Не удалось загрузить конкурсы." })}</p><button type="button" className={`${secondaryButton} mt-4`} onClick={() => void query.refetch()}>{kk ? "Қайталау" : "Повторить"}</button></div>;

  const tabs: Array<[EditorTab, string, number | null]> = [
    ["general", kk ? "Ереже және дереккөз" : "Правила и источник", null],
    ["directions", kk ? "Бағыттар" : "Направления", preset?.directions.length ?? 0],
    ["document", kk ? "Құжат және қорғау" : "Документ и защита", preset?.structure.length ?? 0],
    ["criteria", kk ? "Бағалау" : "Критерии", preset?.rubric.length ?? 0],
  ];
  const missingModes = (["panorama", "festival"] as const).filter(kind => !items.some(item => item.kind === kind && item.year === currentYear && item.is_active));
  const filteredItems = items.filter(item => yearFilter === "all" || item.year === Number(yearFilter)).toSorted((a, b) => b.year - a.year || a.kind.localeCompare(b.kind));

  return <div className="mx-auto max-w-7xl space-y-6 pb-8">
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><Link href="/dashboard/admin" className="font-medium text-slate-500 transition hover:text-teal-700">← {kk ? "Әкімші панелі" : "Админ-панель"}</Link><Link href="/dashboard/ai/pedagogical-ideas" className="font-semibold text-teal-700 hover:underline">{kk ? "Педагогтің жұмыс кеңістігі" : "Рабочее пространство педагога"} ↗</Link></div>

    <header className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-teal-600/20 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-6"><div className="max-w-2xl"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-300">SANDU AI · {kk ? "ЕРЕЖЕЛЕР КІТАПХАНАСЫ" : "БИБЛИОТЕКА ПРАВИЛ"}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{kk ? "Байқаулар" : "Конкурсы"}</h1><p className="mt-3 text-sm leading-7 text-slate-300">{kk ? "Панорама мен Фестивальдің ресми талаптарын әр жыл үшін бөлек басқарыңыз. Тексерілген ереже педагогтің авторлық жұмысының негізі болады." : "Управляйте официальными требованиями Панорамы и Фестиваля отдельно для каждого года. Проверенные правила становятся основой авторской работы педагога."}</p></div><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><BookIcon className="h-8 w-8 text-teal-300" /><div><p className="text-2xl font-semibold">{currentYear}</p><p className="text-xs text-slate-300">{kk ? "Ағымдағы байқау жылы" : "Текущий конкурсный год"}</p></div></div></div>
    </header>

    <div className="grid grid-cols-3 gap-3">{[
      [items.length, kk ? "Жылдық ереже" : "Годовых наборов правил", "text-slate-900"],
      [items.filter(item => item.is_active && item.year === currentYear).length, kk ? "Биыл қолжетімді" : "Доступно в этом году", "text-teal-700"],
      [items.filter(item => item.verification_status !== "verified").length, kk ? "Тексеру қажет" : "Требуют проверки", "text-amber-700"],
    ].map(([value, label, color]) => <div key={String(label)} className="flex flex-col items-start gap-1 rounded-2xl border border-slate-200/80 bg-white px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-4"><span className={`text-2xl font-semibold sm:text-3xl ${color}`}>{value}</span><p className="text-[11px] leading-5 text-slate-500 sm:text-sm">{label}</p></div>)}</div>

    {missingModes.length ? <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"><span aria-hidden="true" className="mt-0.5 font-bold">!</span><p>{kk ? `${currentYear} жылғы ${missingModes.map(kind => kind === "panorama" ? "Панорама" : "Фестиваль").join(" / ")} ережесі әлі қолжетімді емес. Өткен жылғы ереже автоматты қолданылмайды.` : `Правила ${missingModes.map(kind => kind === "panorama" ? "Панорамы" : "Фестиваля").join(" / ")} на ${currentYear} год ещё не доступны. Правила прошлых лет автоматически не применяются.`}</p></div> : null}

    <div className="grid items-start gap-5 xl:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white xl:sticky xl:top-5" aria-label={kk ? "Жылдық ережелер" : "Правила по годам"}>
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">{kk ? "Жылдық ережелер" : "Правила по годам"}</h2><span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">{items.length}</span></div>
          <label className="mt-3 hidden text-xs font-semibold text-slate-500 xl:block">{kk ? "Жыл бойынша" : "Фильтр по году"}<select className={`${fieldClass} mt-1`} value={yearFilter} onChange={event => setYearFilter(event.target.value)}><option value="all">{kk ? "Барлық жылдар" : "Все годы"}</option>{Array.from(new Set(items.map(item => item.year))).sort((a, b) => b - a).map(year => <option key={year} value={year}>{year}</option>)}</select></label>
          <label className="mt-3 block text-xs font-semibold text-slate-500 xl:hidden">
            {kk ? "Ережені таңдау" : "Выбрать правила"}
            <select aria-label={kk ? "Ережені таңдау" : "Выбрать правила"} disabled={saving} className={`${fieldClass} mt-1`} value={isNew ? "new" : persisted?.competition_id ?? ""} onChange={event => select(event.target.value)}>
              {isNew && preset ? <option value="new">{preset.kind === "panorama" ? "Панорама" : "Фестиваль"} · {preset.year} · {kk ? "Жаңа жоба" : "Новый черновик"}</option> : null}
              {items.toSorted((a, b) => b.year - a.year || a.kind.localeCompare(b.kind)).map(item => <option key={item.competition_id} value={item.competition_id}>{item.kind === "panorama" ? "Панорама" : "Фестиваль"} · {item.year}{!item.is_active ? ` · ${kk ? "Жоба" : "Черновик"}` : ""}</option>)}
            </select>
          </label>
        </div>
        <div className="hidden space-y-2 p-3 xl:block">{isNew && preset ? <div className="rounded-xl border border-teal-300 bg-teal-50 p-3"><p className="text-sm font-semibold text-teal-900">{preset.kind === "panorama" ? (kk ? "Панорама" : "Панорама") : (kk ? "Фестиваль" : "Фестиваль")} · {preset.year}</p><p className="mt-1 text-xs text-teal-700">{kk ? "Жаңа жоба · сақталмаған" : "Новый черновик · не сохранён"}</p></div> : null}{filteredItems.map(item => <button key={item.competition_id} type="button" disabled={saving} onClick={() => select(item.competition_id)} className={`w-full rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${!isNew && persisted?.competition_id === item.competition_id ? "border-teal-300 bg-teal-50/60" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}`} aria-current={!isNew && persisted?.competition_id === item.competition_id ? "true" : undefined}><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-slate-900">{item.kind === "panorama" ? "Панорама" : "Фестиваль"}</span><span className="text-xs font-semibold text-slate-500">{item.year}</span></div><p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{item.competition_name[language]}</p><div className="mt-2"><StatusBadge status={item.verification_status} active={item.is_active} kk={kk} /></div></button>)}{!filteredItems.length ? <p className="px-2 py-5 text-sm text-slate-500">{kk ? "Бұл жылға ереже жоқ." : "Правил на этот год нет."}</p> : null}</div>
        <div className="border-t border-slate-100 p-4"><button type="button" disabled={!persisted || dirty || saving} className={`${secondaryButton} w-full`} onClick={startAnnualDraft}>+ {kk ? "Жаңа жыл" : "Правила на новый год"}</button>{dirty ? <p className="mt-2 text-xs leading-5 text-slate-500">{kk ? "Алдымен ағымдағы өзгерістерді сақтаңыз." : "Сначала сохраните текущие изменения."}</p> : null}</div>
      </aside>

      <div className="min-w-0 space-y-4">
        {pendingSwitch ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">{kk ? "Сақталмаған өзгерістер бар" : "Есть несохранённые изменения"}</p><p className="mt-1 text-sm text-amber-800">{kk ? "Басқа ережеге өтсеңіз, өзгерістер жоғалады." : "При переходе к другим правилам изменения будут потеряны."}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className={secondaryButton} onClick={() => setPendingSwitch(null)}>{kk ? "Өңдеуге оралу" : "Вернуться к редактированию"}</button><button type="button" className={secondaryButton} onClick={() => select(pendingSwitch, true)}>{kk ? "Сақтамай өту" : "Перейти без сохранения"}</button></div></div> : null}
        {showNewYear ? <section className="rounded-2xl border border-teal-200 bg-white p-5"><SectionHeading title={kk ? "Жаңа жылға ереже дайындау" : "Подготовить правила на новый год"} description={kk ? "Жаңа жоба тексерілмеген күйде ашылады. Бағыттар, критерийлер мен талаптар бос болады: оларды жаңа ресми ережеден толтырыңыз." : "Новый набор создаётся как непроверенный черновик. Направления, критерии и требования останутся пустыми — заполните их по новым официальным правилам."} /><div className="flex flex-wrap items-end gap-3"><Field label={kk ? "Байқау жылы" : "Конкурсный год"}><input type="number" min={2020} max={2100} className={fieldClass} value={draftYear || ""} onChange={event => setDraftYear(Number(event.target.value))} /></Field><button type="button" className={primaryButton} onClick={createDraft}>{kk ? "Жобаны ашу" : "Открыть черновик"}</button><button type="button" className={secondaryButton} onClick={() => setShowNewYear(false)}>{kk ? "Болдырмау" : "Отмена"}</button></div></section> : null}
        {preset ? <form onSubmit={save} noValidate className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold tracking-tight text-slate-900">{preset.kind === "panorama" ? "Панорама" : "Фестиваль"} · {preset.year}</h2><StatusBadge status={preset.verification_status} active={preset.is_active} kk={kk} /></div><p className="mt-2 text-xs text-slate-500">{preset.competition_id} <span className="mx-1.5">·</span> {kk ? "Нұсқа" : "Версия"} {preset.rule_version}{dirty ? <span className="ml-2 font-semibold text-amber-700">· {kk ? "Сақталмаған" : "Не сохранено"}</span> : null}</p></div><button type="submit" disabled={saving || (!dirty && !verifiedNow)} className={primaryButton}>{saving ? (kk ? "Сақталуда…" : "Сохраняем…") : isNew ? (kk ? "Жобаны сақтау" : "Сохранить черновик") : (kk ? "Өзгерістерді сақтау" : "Сохранить изменения")}</button></div>
          <nav aria-label={kk ? "Ереже бөлімдері" : "Разделы правил"} className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50/60 px-4 pt-2">{tabs.map(([id, label, count]) => <button key={id} type="button" onClick={() => setActiveTab(id)} aria-pressed={activeTab === id} className={`flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition sm:text-sm ${activeTab === id ? "border-teal-600 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{label}{count !== null ? <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px]">{count}</span> : null}</button>)}</nav>
          <fieldset disabled={saving} className="min-w-0 space-y-7 p-5 disabled:opacity-60 sm:p-6">
            {error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">{error[language]}</div> : null}
            {notice ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">{notice[language]}</div> : null}
            {preset.year !== currentYear ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900">{preset.year > currentYear
              ? (kk ? `${preset.year} жылғы ереже ${preset.verification_status === "unverified" ? "әлі тексерілмеген" : "болашақ жылға арналған"}. Осы жылғы жұмыста қолданылмайды.` : `Правила ${preset.year} года ${preset.verification_status === "unverified" ? "ещё не проверены" : "относятся к будущему году"}. Они не применяются к работам текущего года.`)
              : (kk ? "Бұл — өткен жылғы ереже. Жаңа жұмыстар үшін автоматты қолданылмайды." : "Это правила прошлого года. Они не применяются автоматически к новым работам.")}</div> : null}
            {activeTab === "general" ? <>
              <section className="space-y-5"><SectionHeading title={kk ? "Байқау туралы" : "О конкурсе"} /><LocalizedField label={kk ? "Байқау атауы" : "Название конкурса"} value={preset.competition_name} onChange={competition_name => patch({ competition_name })} /><div className="grid gap-4 sm:grid-cols-2"><Field label={kk ? "Ұйымдастырушы" : "Организатор"}><input className={fieldClass} value={preset.organizer} onChange={event => patch({ organizer: event.target.value })} /></Field><Field label={kk ? "Ереже нұсқасы" : "Версия правил"} hint={kk ? "Мысалы: 2026.2. Материалдың жоғарғы жағында көрсетіледі." : "Например: 2026.2. Версия отображается в материалах педагога."}><input className={fieldClass} value={preset.rule_version} onChange={event => patch({ rule_version: event.target.value })} /></Field></div></section>
              <section className="space-y-5 border-t border-slate-100 pt-6"><SectionHeading title={kk ? "Ресми дереккөз және тексеру" : "Официальный источник и проверка"} description={kk ? "Жылдық талаптарды ресми ережемен салыстырыңыз. Өзгерген белсенді ереже қайта тексеруді талап етеді." : "Сверьте годовые требования с официальными правилами. После изменения активных правил нужно подтвердить новую проверку."} /><Field label={kk ? "Ресми ережеге сілтеме" : "Ссылка на официальные правила"}><input type="url" className={fieldClass} placeholder="https://…" value={preset.official_source_url ?? ""} onChange={event => patch({ official_source_url: event.target.value || null })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label={kk ? "Тексеру мәртебесі" : "Статус проверки"}><select className={fieldClass} value={preset.verification_status} onChange={event => patch({ verification_status: event.target.value as VerificationStatus })}><option value="unverified">{kk ? "Тексерілмеген" : "Не проверено"}</option><option value="partial">{kk ? "Ішінара тексерілген" : "Частично проверено"}</option><option value="verified">{kk ? "Толық тексерілген" : "Полностью проверено"}</option></select></Field><div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5"><p className="text-xs font-semibold text-slate-500">{kk ? "Соңғы тексеру" : "Последняя проверка"}</p><p className="mt-2 text-sm font-medium text-slate-800">{preset.last_verified_at ? new Intl.DateTimeFormat(kk ? "kk-KZ" : "ru-RU", { timeZone: "Asia/Shanghai", dateStyle: "medium", timeStyle: "short" }).format(new Date(preset.last_verified_at)) : (kk ? "Әлі тексерілмеген" : "Ещё не проверено")}</p></div></div><LocalizedField multiline label={kk ? "Тексеру түсіндірмесі" : "Примечание к проверке"} hint={kk ? "Ішінара тексеру болса, әлі нақтыланбаған талаптарды көрсетіңіз. Педагог бұл түсіндірмені көреді." : "Для частичной проверки укажите, какие требования ещё нужно уточнить. Педагог увидит это примечание."} value={preset.verification_notes} onChange={verification_notes => patch({ verification_notes })} />
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${verifiedNow ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-slate-50"}`}><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-teal-700" checked={verifiedNow} disabled={preset.verification_status === "unverified" || !preset.official_source_url} onChange={event => setVerifiedNow(event.target.checked)} /><span className="text-sm leading-6 text-slate-700"><span className="font-semibold">{kk ? `${preset.year} жылғы талаптарды ресми дереккөзбен салыстырдым` : `Я сверил требования ${preset.year} года с официальным источником`}</span><span className="mt-1 block text-xs text-slate-500">{kk ? "Сақтау кезінде тексерудің жаңа күні тіркеледі." : "При сохранении будет записана новая дата проверки."}</span></span></label>
                <label className="flex cursor-pointer items-start justify-between gap-5 rounded-xl border border-slate-200 p-4"><span><span className="text-sm font-semibold text-slate-900">{kk ? "Педагогтерге қолжетімді" : "Доступно педагогам"}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{kk ? "Белсенді, тексерілген және ағымдағы жылғы ереже ғана генерацияда қолданылады." : "В генерации используются активные проверенные правила текущего года."}</span></span><input type="checkbox" role="switch" className="mt-1 h-5 w-5 shrink-0 accent-teal-700" checked={preset.is_active} onChange={event => patch({ is_active: event.target.checked })} /></label>
              </section>
              <section className="border-t border-slate-100 pt-6"><SectionHeading title={kk ? "Генерация баптаулары" : "Настройки генерации"} /><div className="grid gap-4 sm:grid-cols-3"><Field label={kk ? "Толық жұмыс, монета" : "Полная работа, монет"}><input type="number" min={1} className={fieldClass} value={preset.token_cost} onChange={event => patch({ token_cost: Number(event.target.value) })} /></Field><Field label={kk ? "Қосымша әрекет, монета" : "Дополнительное действие, монет"}><input type="number" min={1} className={fieldClass} value={preset.action_token_cost} onChange={event => patch({ action_token_cost: Number(event.target.value) })} /></Field><Field label={kk ? "ЖИ моделі" : "Модель ИИ"}><input className={fieldClass} value={preset.model} onChange={event => patch({ model: event.target.value })} /></Field></div></section>
            </> : null}
            {activeTab === "directions" ? <DirectionsEditor preset={preset} kk={kk} onChange={patch} /> : null}
            {activeTab === "document" ? <>
              <section><SectionHeading title={kk ? "Файл және қорғау форматы" : "Формат файла и защиты"} /><div className="grid gap-5 sm:grid-cols-2"><fieldset><legend className="text-sm font-semibold text-slate-700">{kk ? "Файл форматтары" : "Форматы файлов"}</legend><div className="mt-3 flex gap-3">{(["docx", "pdf"] as const).map(format => <label key={format} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm"><input type="checkbox" className="h-4 w-4 accent-teal-700" checked={preset.file_formats.includes(format)} onChange={() => patch({ file_formats: toggleValue(preset.file_formats, format) })} />{format === "docx" ? "Word (.docx)" : "PDF"}</label>)}</div></fieldset><fieldset><legend className="text-sm font-semibold text-slate-700">{kk ? "Жұмыс тілдері" : "Языки работы"}</legend><div className="mt-3 flex gap-3">{(["kk", "ru"] as const).map(code => <label key={code} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm"><input type="checkbox" className="h-4 w-4 accent-teal-700" checked={preset.languages.includes(code)} onChange={() => patch({ languages: toggleValue(preset.languages, code) })} />{code === "kk" ? "Қазақша" : "Русский"}</label>)}</div></fieldset><Field label={kk ? "Қорғау регламенті, минут" : "Регламент защиты, минут"} hint={kk ? "Ресми ережеде көрсетілмесе, бос қалдырыңыз." : "Оставьте пустым, если в правилах не указан."}><input type="number" min={1} className={fieldClass} value={preset.time_limit_minutes ?? ""} onChange={event => patch({ time_limit_minutes: event.target.value ? Number(event.target.value) : null })} /></Field><Field label={kk ? "Қабылдау мерзімі (UTC+8)" : "Срок подачи (UTC+8)"} hint={kk ? "Ресми мерзім әлі белгісіз болса, бос қалдырыңыз." : "Оставьте пустым, если официальный срок ещё неизвестен."}><input type="datetime-local" className={fieldClass} value={dateTimeInput(preset.deadline)} onChange={event => patch({ deadline: dateTimeIso(event.target.value) })} /></Field></div></section>
              <section className="space-y-5 border-t border-slate-100 pt-6">
                <Field label={kk ? "Жұмыстың ең үлкен көлемі, сөз" : "Максимальный объём работы, слов"} hint={kk ? "Ресми ережеде шектеу болмаса, бос қалдырыңыз." : "Оставьте пустым, если в официальных правилах нет ограничения."} className="max-w-md">
                  <input type="number" min={100} max={50000} className={fieldClass} value={preset.word_limit ?? ""} onChange={event => patch({ word_limit: event.target.value ? Number(event.target.value) : null })} />
                </Field>
                <LocalizedField multiline label={kk ? "Рәсімдеу талаптары" : "Требования к оформлению"} hint={kk ? "Көлем, шрифт, интервал, өрістер және әдебиеттерді рәсімдеу." : "Объём, шрифт, интервал, поля и оформление литературы."} value={preset.format_requirements} onChange={format_requirements => patch({ format_requirements })} />
                <LocalizedField multiline label={kk ? "Видеоға қойылатын талаптар" : "Требования к видео"} hint={kk ? "Кезең, ұзақтық, кадрлар, диктор мәтіні және дәлел материалдары." : "Этап, длительность, кадры, дикторский текст и материалы с доказательствами."} value={preset.video_requirements} onChange={video_requirements => patch({ video_requirements })} />
              </section>
              <div className="border-t border-slate-100 pt-6"><StructureEditor preset={preset} kk={kk} onChange={patch} /></div>
            </> : null}
            {activeTab === "criteria" ? <><RubricEditor preset={preset} kk={kk} onChange={patch} /><section className="border-t border-slate-100 pt-6"><LocalizedField multiline label={kk ? "Авторлық және плагиат талаптары" : "Требования к авторству и плагиату"} hint={kk ? "Түпнұсқалық, бұрын жариялау, өзге байқаулар, дәйексөздер мен дереккөздер бойынша ресми талаптар." : "Официальные требования к оригинальности, прежним публикациям, участию в других конкурсах, цитатам и источникам."} value={preset.plagiarism_requirements} onChange={plagiarism_requirements => patch({ plagiarism_requirements })} /></section></> : null}
          </fieldset>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4"><p className="text-xs leading-5 text-slate-500">{kk ? "Әр байқау мен жыл бөлек сақталады." : "Каждый конкурс и год сохраняются отдельно."}</p><div className="flex flex-wrap gap-2">{dirty ? <button type="button" disabled={saving} className={secondaryButton} onClick={() => { setEditor(null); setIsNew(false); setVerifiedNow(false); setError(null); setNotice(null); }}>{kk ? "Өзгерістерді алып тастау" : "Отменить изменения"}</button> : null}<button type="submit" disabled={saving || (!dirty && !verifiedNow)} className={primaryButton}>{saving ? (kk ? "Сақталуда…" : "Сохраняем…") : (kk ? "Сақтау" : "Сохранить")}</button></div></footer>
        </form> : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">{kk ? "Байқау ережелері әлі қосылмаған." : "Правила конкурсов ещё не добавлены."}</div>}
      </div>
    </div>
  </div>;
}
