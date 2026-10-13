"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { ApiRequestError } from "@/lib/http-client";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { masterclassAdminApi } from "./api";
import { Field, fieldClass, LabelInput, OptionEditor, primaryButton, secondaryButton, SectionTitle } from "./AdminFields";
import { audienceMatches, configInput, emptyLabels, LANGUAGE_NAMES, nextDuration, nextOptionId, renameInstitution, replaceVisibleAudiences, toggleSelection, validateConfig, type AdminMessage } from "./model";
import { MASTERCLASS_LANGUAGES, type MasterclassAdminTab, type MasterclassConfigInput, type MasterclassExportTemplate, type MasterclassInteractiveKind, type MasterclassLanguage } from "./types";

const queryKey = ["admin-masterclasses-config"] as const;
const institutionIcons: Record<string, string> = { school: "🏫", kindergarten: "🧸", library: "📚", college: "🎓", mixed: "👥" };
const interactiveKinds: Array<[MasterclassInteractiveKind, string, string]> = [
  ["quiz", "Викторина", "Викторина"], ["matching", "Сәйкестендіру", "Сопоставление"],
  ["wheel", "Таңдау дөңгелегі", "Колесо выбора"], ["quest", "Квест", "Квест"],
  ["hand_tracking", "Қол қимылымен басқару", "Управление жестами"], ["three_d", "3D кеңістік", "3D-пространство"],
  ["board", "Интерактив тақта", "Интерактивная доска"], ["timeline", "Уақыт сызығы", "Временная шкала"],
];

export default function MasterclassAdminWorkspace() {
  const { language } = useLanguage();
  const kk = language === "kk";
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";
  const query = useQuery({ queryKey, queryFn: ({ signal }) => masterclassAdminApi.get(signal), enabled: isAdmin, refetchOnWindowFocus: false });
  const [editor, setEditor] = useState<MasterclassConfigInput | null>(null);
  const [activeTab, setActiveTab] = useState<MasterclassAdminTab>("audiences");
  const [labelLanguage, setLabelLanguage] = useState<MasterclassLanguage>(language);
  const [institutionFilter, setInstitutionFilter] = useState("school");
  const [audienceSearch, setAudienceSearch] = useState("");
  const [showInstitutions, setShowInstitutions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState<AdminMessage | null>(null);
  const [notice, setNotice] = useState(false);
  const [focusOption, setFocusOption] = useState<string | null>(null);
  const config = editor ?? (query.data ? configInput(query.data) : null);
  const dirty = Boolean(editor && query.data && JSON.stringify(editor) !== JSON.stringify(configInput(query.data)));
  const institutions = config?.institutions ?? [];
  const visibleInstitution = institutionFilter === "all" || institutions.some(item => item.id === institutionFilter) ? institutionFilter : institutions[0]?.id ?? "all";

  useEffect(() => { if (!authLoading && !isAdmin) router.replace("/dashboard"); }, [authLoading, isAdmin, router]);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  useEffect(() => {
    if (!focusOption) return;
    const row = document.querySelector(`[data-option-id="${CSS.escape(focusOption)}"]`);
    row?.querySelector<HTMLInputElement>("input[data-option-label]")?.focus({ preventScroll: true });
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusOption, activeTab, labelLanguage]);

  const patch = (changes: Partial<MasterclassConfigInput>) => {
    if (!config) return;
    setEditor({ ...config, ...changes });
    if (!conflict) setError(null);
    setNotice(false);
    setFocusOption(null);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!config || !query.data || saving || !dirty || conflict) return;
    const issue = validateConfig(config);
    if (issue) {
      setError(issue.message);
      setActiveTab(issue.tab);
      if (issue.label_language) setLabelLanguage(issue.label_language);
      if (issue.tab === "audiences") {
        const audience = config.audiences.find(item => item.id === issue.option_id);
        setAudienceSearch("");
        setShowInstitutions(!audience);
        setInstitutionFilter(audience?.institution_types[0] ?? "all");
      }
      setFocusOption(issue.option_id ?? null);
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(false);
    try {
      const updated = await masterclassAdminApi.update({ expected_version: query.data.version, config });
      queryClient.setQueryData(queryKey, updated);
      setEditor(null);
      setNotice(true);
      await queryClient.invalidateQueries({ queryKey: ["masterclass-config"] });
    } catch (cause) {
      if (cause instanceof ApiRequestError && cause.status === 409) {
        setConflict(true);
        setError({ ru: "Настройки уже изменил другой администратор. Ваши правки сохранены на экране. Загрузите актуальную версию и внесите их снова.", kk: "Баптауларды басқа әкімші өзгертті. Сіздің өзгерістеріңіз экранда сақталды. Өзекті нұсқаны жүктеп, оларды қайта енгізіңіз." });
      } else setError({
        ru: teacherFacingErrorMessage(cause, "ru", { fallback: "Не удалось сохранить настройки мастер-классов." }),
        kk: teacherFacingErrorMessage(cause, "kk", { fallback: "Шебер сынып баптауларын сақтау мүмкін болмады." }),
      });
    } finally { setSaving(false); }
  };

  const discard = () => {
    setEditor(null);
    setError(null);
    setNotice(false);
    setFocusOption(null);
    if (conflict) { setConflict(false); void query.refetch(); }
  };

  if (authLoading || !isAdmin || query.isPending) return <div className="flex min-h-80 items-center justify-center gap-3 text-sm text-slate-500"><span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-700 border-r-transparent" />{kk ? "Баптаулар жүктелуде…" : "Загружаем настройки…"}</div>;
  if (query.isError || !config) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800"><p>{teacherFacingErrorMessage(query.error, language, { fallback: kk ? "Баптауларды жүктеу мүмкін болмады." : "Не удалось загрузить настройки." })}</p><button type="button" className={`${secondaryButton} mt-4`} onClick={() => void query.refetch()}>{kk ? "Қайталау" : "Повторить"}</button></div>;

  const searchTerm = audienceSearch.trim().toLocaleLowerCase();
  const institutionAudiences = config.audiences.filter(option => audienceMatches(option, visibleInstitution));
  const audiences = institutionAudiences.filter(option => !searchTerm || [option.id, ...Object.values(option.label)].some(value => value.toLocaleLowerCase().includes(searchTerm)));
  const availableDuration = nextDuration(config);
  const tabs: Array<[MasterclassAdminTab, string, string]> = [
    ["audiences", "Аудиториялар", "Аудитории"], ["formats", "Форматтар мен бағыттар", "Форматы и направления"],
    ["generation", "Уақыт, тілдер және баға", "Время, языки и стоимость"], ["prompts", "ЖИ нұсқаулығы", "Инструкция ИИ"],
    ["materials", "Материалдар", "Материалы"],
  ];

  return <div className="mx-auto max-w-7xl space-y-6 pb-8">
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><Link href="/dashboard/admin" className="font-medium text-slate-500 hover:text-indigo-700">← {kk ? "Әкімші панелі" : "Админ-панель"}</Link><Link href="/dashboard/ai/masterclasses" className="font-semibold text-indigo-700 hover:underline">{kk ? "Шебер сыныпты ашу" : "Открыть мастер-классы"} ↗</Link></div>
    <header className="relative overflow-hidden rounded-3xl bg-slate-900 p-5 text-white sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-5"><div className="max-w-2xl"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-300">SANDU AI · {kk ? "ПРАКТИКА ОРТАЛЫҒЫ" : "ПРОСТРАНСТВО ПРАКТИКИ"}</p><h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">{kk ? "Шебер сынып баптаулары" : "Настройки мастер-классов"}</h1><p className="mt-3 text-xs leading-6 text-slate-300 sm:text-sm sm:leading-7">{kk ? "Әр аудиторияға сай сценарий, нақты практика және қатысушы алып кететін дайын өнім. Форматтарды, тілдерді және материалдарды осы жерден басқарыңыз." : "Сценарий под аудиторию, конкретная практика и готовый продукт для участника. Управляйте форматами, языками и материалами в одном месте."}</p></div><div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:block sm:rounded-2xl sm:px-4 sm:py-3"><p className="text-xs text-indigo-200">{kk ? "Баптау нұсқасы" : "Версия настроек"}</p><p className="text-lg font-semibold sm:mt-1 sm:text-2xl">{query.data?.version}</p></div></div>
    </header>
    <div className="grid grid-cols-3 gap-3">{[
      [config.institutions.length, kk ? "Өткізу ортасы" : "Сред проведения"], [config.audiences.length, kk ? "Аудитория" : "Аудиторий"], [config.languages.length, kk ? "Материал тілі" : "Языка материала"],
    ].map(([value, title]) => <div key={String(title)} className="flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-4"><span className="text-2xl font-semibold text-indigo-800 sm:text-3xl">{value}</span><p className="text-[11px] leading-5 text-slate-500 sm:text-sm">{title}</p></div>)}</div>

    <form onSubmit={save} noValidate className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6"><div><h2 className="text-lg font-semibold text-slate-900">{kk ? "Шебер сынып конструкторы" : "Конструктор мастер-класса"}</h2><p className="mt-1.5 text-xs text-slate-500">{dirty ? (kk ? "Сақталмаған өзгерістер бар" : "Есть несохранённые изменения") : (kk ? "Барлық өзгерістер сақталған" : "Все изменения сохранены")}</p></div><button type="submit" disabled={!dirty || saving || conflict} className={primaryButton}>{saving ? (kk ? "Сақталуда…" : "Сохраняем…") : (kk ? "Өзгерістерді сақтау" : "Сохранить изменения")}</button></div>
      <nav aria-label={kk ? "Баптау бөлімдері" : "Разделы настроек"} className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50/60 px-4 pt-2">{tabs.map(([id, kz, ru]) => <button key={id} type="button" aria-pressed={activeTab === id} onClick={() => setActiveTab(id)} className={`min-h-12 shrink-0 border-b-2 px-3 text-xs font-semibold sm:text-sm ${activeTab === id ? "border-indigo-600 text-indigo-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{kk ? kz : ru}</button>)}</nav>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><div><p className="text-xs font-semibold text-slate-700">{kk ? "Атауларды өңдеу тілі" : "Язык редактирования названий"}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{kk ? "Әр атау төрт тілде сақталады." : "Каждое название сохраняется на четырёх языках."}</p></div><div role="group" aria-label={kk ? "Аударма тілі" : "Язык перевода"} className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">{MASTERCLASS_LANGUAGES.map(code => <button key={code} type="button" aria-pressed={labelLanguage === code} onClick={() => setLabelLanguage(code)} className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition ${labelLanguage === code ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{LANGUAGE_NAMES[code]}</button>)}</div></div>
      <fieldset disabled={saving} className="min-w-0 space-y-7 p-5 disabled:opacity-60 sm:p-6">
        {error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">{error[language]}{conflict ? <button type="button" className={`${secondaryButton} mt-3 block`} onClick={discard}>{kk ? "Өзгерістерді алып тастап, өзекті нұсқаны жүктеу" : "Отменить правки и загрузить актуальную версию"}</button> : null}</div> : null}
        {notice ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{kk ? "Баптаулар сақталды. Жаңа шебер сыныптар осы нұсқаны қолданады." : "Настройки сохранены. Новые мастер-классы будут использовать эту версию."}</div> : null}

        {activeTab === "audiences" ? <>
          <section><SectionTitle title={kk ? "Өткізу ортасы" : "Среды проведения"} description={kk ? "Аудиториялар тек өз ортасына сәйкес көрсетіледі. Орта түрін өзгерту бар аудиториялардың байланысын сақтайды." : "Аудитории отображаются по своей среде. Изменение кода среды сохраняет связи с существующими аудиториями."} action={<button type="button" aria-expanded={showInstitutions} className={secondaryButton} onClick={() => setShowInstitutions(value => !value)}>{showInstitutions ? (kk ? "Тізімді жабу" : "Свернуть список") : (kk ? "Орта түрлерін өңдеу" : "Редактировать среды")}</button>} />
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setInstitutionFilter("all"); setAudienceSearch(""); }} aria-pressed={visibleInstitution === "all"} className={`${secondaryButton} ${visibleInstitution === "all" ? "border-indigo-300 bg-indigo-50 text-indigo-800" : ""}`}>{kk ? "Барлық аудиториялар" : "Все аудитории"}</button>{config.institutions.map(item => <button key={item.id} type="button" onClick={() => { setInstitutionFilter(item.id); setAudienceSearch(""); }} aria-pressed={visibleInstitution === item.id} className={`${secondaryButton} ${visibleInstitution === item.id ? "border-indigo-300 bg-indigo-50 text-indigo-800" : ""}`}><span aria-hidden="true">{institutionIcons[item.id] ?? "📍"}</span>{item.label[labelLanguage] || item.id}<span className="text-[10px] text-slate-400">{config.audiences.filter(audience => audience.institution_types.includes(item.id)).length}</span></button>)}</div>
            {showInstitutions ? <div className="mt-5"><OptionEditor title={kk ? "Орта түрлері" : "Типы среды"} fixedIds={["library"]} rows={config.institutions} language={labelLanguage} kk={kk} max={30} onChange={institutions => patch({ institutions })} onAdd={() => patch({ institutions: [...config.institutions, { id: nextOptionId("institution", config.institutions), label: emptyLabels() }] })} onIdChange={(index, id) => { const previous = config.institutions[index].id; patch(renameInstitution(config, index, id)); if (institutionFilter === previous) setInstitutionFilter(id); }} canRemove={item => !config.audiences.some(audience => audience.institution_types.includes(item.id))} /></div> : null}
          </section>
          <div className="border-t border-slate-100 pt-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="relative w-full sm:max-w-sm"><input type="search" aria-label={kk ? "Аудиторияны іздеу" : "Найти аудиторию"} placeholder={kk ? "Код немесе атау бойынша іздеу…" : "Поиск по коду или названию…"} className={`${fieldClass} mt-0 pr-10 [&::-webkit-search-cancel-button]:hidden`} value={audienceSearch} onChange={event => setAudienceSearch(event.target.value)} />{audienceSearch ? <button type="button" aria-label={kk ? "Іздеуді тазалау" : "Очистить поиск"} className="absolute right-2 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => setAudienceSearch("")}>×</button> : null}</div><p className="text-xs text-slate-500">{audiences.length} / {institutionAudiences.length} {kk ? "аудитория" : "аудиторий"}</p></div><OptionEditor title={kk ? "Аудиториялар" : "Аудитории"} description={kk ? "Аудиторияны бір немесе бірнеше ортаға байланыстыруға болады. Жаңа атауды төрт тілде толтырыңыз." : "Аудиторию можно связать с одной или несколькими средами. Новое название заполните на четырёх языках."} emptyMessage={searchTerm ? (kk ? "Ештеңе табылмады. Басқа код немесе атауды енгізіңіз." : "Ничего не найдено. Попробуйте другой код или название.") : undefined} rows={audiences} language={labelLanguage} kk={kk} max={100 - config.audiences.length + audiences.length} allowEmpty={audiences.length !== config.audiences.length} onChange={updated => patch({ audiences: replaceVisibleAudiences(config.audiences, audiences, updated) })} onAdd={() => { setAudienceSearch(""); patch({ audiences: [...config.audiences, { id: nextOptionId("audience", config.audiences), label: emptyLabels(), institution_types: [visibleInstitution === "all" ? config.institutions[0].id : visibleInstitution] }] }); }} extra={(audience, _index, update) => <fieldset><legend className="text-xs font-semibold text-slate-700">{kk ? "Қай ортаға қатысты" : "Для какой среды"}</legend><div className="mt-2 flex flex-wrap gap-2">{config.institutions.map(item => <label key={item.id} className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs ${audience.institution_types.includes(item.id) ? "border-indigo-200 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-600"}`}><input type="checkbox" className="h-4 w-4 accent-indigo-700" checked={audience.institution_types.includes(item.id)} onChange={() => update({ institution_types: toggleSelection(audience.institution_types, item.id) })} />{item.label[labelLanguage] || item.id}</label>)}</div></fieldset>} /></div>
        </> : null}

        {activeTab === "formats" ? <>
          <OptionEditor title={kk ? "Өткізу форматтары" : "Форматы проведения"} description={kk ? "Офлайн, онлайн, гибрид, workshop және басқа форматтар." : "Офлайн, онлайн, гибрид, workshop и другие форматы."} fixedIds={["online"]} rows={config.formats} language={labelLanguage} kk={kk} max={40} onChange={formats => patch({ formats })} onAdd={() => patch({ formats: [...config.formats, { id: nextOptionId("format", config.formats), label: emptyLabels() }] })} />
          <div className="border-t border-slate-100 pt-6"><OptionEditor title={kk ? "Мазмұн бағыттары" : "Направления содержания"} fixedIds={["ai", "steam", "national", "interactive"]} rows={config.directions} language={labelLanguage} kk={kk} max={40} onChange={directions => patch({ directions })} onAdd={() => patch({ directions: [...config.directions, { id: nextOptionId("direction", config.directions), label: emptyLabels() }] })} /></div>
          <div className="border-t border-slate-100 pt-6"><OptionEditor title={kk ? "Шебер сынып стильдері" : "Стили мастер-класса"} rows={config.styles} language={labelLanguage} kk={kk} max={40} onChange={styles => patch({ styles })} onAdd={() => patch({ styles: [...config.styles, { id: nextOptionId("style", config.styles), label: emptyLabels() }] })} /></div>
          <div className="border-t border-slate-100 pt-6"><OptionEditor title={kk ? "Күрделілік деңгейлері" : "Уровни сложности"} rows={config.difficulties} language={labelLanguage} kk={kk} max={20} onChange={difficulties => patch({ difficulties })} onAdd={() => patch({ difficulties: [...config.difficulties, { id: nextOptionId("difficulty", config.difficulties), label: emptyLabels() }] })} /></div>
        </> : null}

        {activeTab === "generation" ? <>
          <section><SectionTitle title={kk ? "Ұзақтық" : "Продолжительность"} description={kk ? "Педагог дайын уақытты таңдайды немесе берілген шектерде өз уақытын енгізеді." : "Педагог выбирает готовый вариант или вводит своё время в заданных границах."} /><div className="grid gap-4 sm:grid-cols-2"><Field label={kk ? "Ең аз ұзақтық, минут" : "Минимальная длительность, минут"}><input type="number" min={10} max={120} className={fieldClass} value={config.min_duration_minutes} onChange={event => patch({ min_duration_minutes: Number(event.target.value) })} /></Field><Field label={kk ? "Ең көп ұзақтық, минут" : "Максимальная длительность, минут"}><input type="number" min={15} max={480} className={fieldClass} value={config.max_duration_minutes} onChange={event => patch({ max_duration_minutes: Number(event.target.value) })} /></Field></div><fieldset className="mt-5"><legend className="text-sm font-semibold text-slate-700">{kk ? "Дайын уақыт нұсқалары" : "Готовые варианты времени"}</legend><div className="mt-3 flex flex-wrap items-center gap-2">{config.duration_options.map((minutes, index) => <label key={index} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><span className="sr-only">{kk ? "Ұзақтық нұсқасы" : "Вариант длительности"} {index + 1}</span><input type="number" min={config.min_duration_minutes} max={config.max_duration_minutes} className="min-h-9 w-16 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-indigo-600" value={minutes} onChange={event => patch({ duration_options: config.duration_options.map((value, position) => position === index ? Number(event.target.value) : value) })} /><span className="text-xs text-slate-500">{kk ? "мин" : "мин"}</span><button type="button" disabled={config.duration_options.length === 1} aria-label={`${kk ? "Уақыт нұсқасын жою" : "Удалить вариант времени"} ${minutes}`} className="h-8 w-6 text-slate-500 disabled:opacity-30" onClick={() => patch({ duration_options: config.duration_options.filter((_, position) => position !== index) })}>×</button></label>)}<button type="button" disabled={availableDuration === null} className={secondaryButton} onClick={() => { if (availableDuration !== null) patch({ duration_options: [...config.duration_options, availableDuration] }); }}>+ {kk ? "Уақыт қосу" : "Добавить время"}</button></div></fieldset></section>
          <section className="border-t border-slate-100 pt-6"><SectionTitle title={kk ? "Материал тілдері" : "Языки материала"} description={kk ? "Интерфейс тілі мен дайын материал тілі бөлек таңдалады." : "Язык интерфейса и язык готового материала выбираются отдельно."} /><div className="flex flex-wrap gap-3">{MASTERCLASS_LANGUAGES.map(code => <label key={code} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 ${config.languages.includes(code) ? "border-indigo-200 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-500"}`}><input type="checkbox" className="h-4 w-4 accent-indigo-700" checked={config.languages.includes(code)} onChange={() => patch({ languages: toggleSelection(config.languages, code) })} /><span className="text-sm font-semibold">{LANGUAGE_NAMES[code]}</span></label>)}</div></section>
          <section className="border-t border-slate-100 pt-6"><SectionTitle title={kk ? "Монета бағасы" : "Стоимость в монетах"} /><div className="grid gap-4 sm:grid-cols-3">{([
            ["token_cost", "Толық шебер сынып", "Полный мастер-класс"], ["topics_token_cost", "10 тақырып ұсыну", "Предложить 10 тем"], ["action_token_cost", "Бөлімді өзгерту", "Изменить раздел"],
          ] as const).map(([key, kz, ru]) => <Field key={key} label={kk ? kz : ru}><input type="number" min={1} max={10000} className={fieldClass} value={config[key]} onChange={event => patch({ [key]: Number(event.target.value) })} /></Field>)}</div><Field label={kk ? "ЖИ моделі" : "Модель ИИ"} className="mt-5 max-w-md"><input maxLength={80} className={fieldClass} value={config.model} onChange={event => patch({ model: event.target.value })} /></Field></section>
        </> : null}

        {activeTab === "prompts" ? <section><SectionTitle title={kk ? "ЖИ негізгі нұсқаулығы" : "Основная инструкция ИИ"} description={kk ? "Аудиторияны, практикалық өнімді, нақты қадамдарды және дәл хронометражды ескеретін нұсқаулық." : "Инструкция учитывает аудиторию, практический продукт, конкретные шаги и точный хронометраж."} /><div className="mb-5 grid gap-3 sm:grid-cols-3">{[
          ["20–30%", kk ? "Қысқа теория" : "Короткая теория"], ["70–80%", kk ? "Қатысушы практикасы" : "Практика участников"], ["✓", kk ? "Дайын өнім" : "Готовый продукт"],
        ].map(([value, title]) => <div key={title} className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3"><p className="text-lg font-semibold text-indigo-800">{value}</p><p className="mt-1 text-xs text-indigo-700">{title}</p></div>)}</div><Field label={kk ? "ЖИ-ға арналған нұсқаулық" : "Инструкция для ИИ"} hint={kk ? "100–30 000 таңба. Жаңа жұмыстарға қолданылады; сақталған жұмыстардың нұсқасы өзгермейді." : "100–30 000 символов. Применяется к новым работам; версии сохранённых работ остаются прежними."}><textarea rows={18} minLength={100} maxLength={30000} className={`${fieldClass} resize-y font-mono text-xs leading-6`} value={config.system_prompt} onChange={event => patch({ system_prompt: event.target.value })} /></Field><p className="mt-2 text-right text-xs text-slate-400">{config.system_prompt.length.toLocaleString(language === "kk" ? "kk-KZ" : "ru-RU")} / 30 000</p></section> : null}

        {activeTab === "materials" ? <>
          <section><SectionTitle title={kk ? "Экспорт пішімдері" : "Форматы экспорта"} /><div className="flex flex-wrap gap-3">{(["docx", "pdf", "pptx", "zip"] as const).map(format => <label key={format} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 ${config.file_formats.includes(format) ? "border-indigo-200 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-500"}`}><input type="checkbox" className="h-4 w-4 accent-indigo-700" checked={config.file_formats.includes(format)} onChange={() => patch({ file_formats: toggleSelection(config.file_formats, format) })} /><span className="text-sm font-semibold">{format === "docx" ? "Word" : format === "pptx" ? "PowerPoint" : format === "zip" ? (kk ? "Қатысушы пакеті ZIP" : "Пакет участника ZIP") : "PDF"}</span></label>)}</div></section>
          <section className="border-t border-slate-100 pt-6"><SectionTitle title={kk ? "Құжат үлгісі" : "Шаблон документа"} description={kk ? "Қаріп, акцент түсі және төрт тілдегі төменгі жазу дайын файлдарға қолданылады." : "Шрифт, акцентный цвет и подпись на четырёх языках применяются к готовым файлам."} /><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="space-y-4"><Field label={kk ? "Акцент түсі" : "Акцентный цвет"}><div className="mt-2 flex items-center gap-3"><input type="color" aria-label={kk ? "Акцент түсін таңдау" : "Выбрать акцентный цвет"} className="h-11 w-14 shrink-0 rounded-lg border border-slate-200 bg-white p-1" value={/^#[0-9a-fA-F]{6}$/.test(config.export_template.accent_color) ? config.export_template.accent_color : "#4338ca"} onChange={event => patch({ export_template: { ...config.export_template, accent_color: event.target.value } })} /><input aria-label={kk ? "Түс коды" : "Код цвета"} maxLength={7} className={`${fieldClass} mt-0`} value={config.export_template.accent_color} onChange={event => patch({ export_template: { ...config.export_template, accent_color: event.target.value } })} /></div></Field><Field label={kk ? "Құжат қарпі" : "Шрифт документа"}><select aria-label={kk ? "Құжат қарпі" : "Шрифт документа"} className={fieldClass} value={config.export_template.font_family} onChange={event => patch({ export_template: { ...config.export_template, font_family: event.target.value as MasterclassExportTemplate["font_family"] } })}>{["Arial", "Calibri", "DejaVu Sans"].map(font => <option key={font}>{font}</option>)}</select></Field><LabelInput multiline label={kk ? "Құжаттың төменгі жазуы" : "Подпись документа"} language={labelLanguage} value={config.export_template.footer} onChange={footer => patch({ export_template: { ...config.export_template, footer } })} /></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{kk ? "Құжат көрінісі" : "Вид документа"}</p><div className="min-h-64 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" style={{ fontFamily: config.export_template.font_family }}><div className="h-1 w-12 rounded-full" style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(config.export_template.accent_color) ? config.export_template.accent_color : "#4338ca" }} /><h4 className="mt-4 text-base font-bold text-slate-900">{kk ? "Шебер сынып" : "Мастер-класс"}</h4><p className="mt-2 text-xs text-slate-500">{kk ? "Идеядан — дайын өнімге" : "От идеи — к готовому продукту"}</p><div className="mt-5 space-y-2"><div className="h-1.5 rounded bg-slate-100" /><div className="h-1.5 w-4/5 rounded bg-slate-100" /><div className="h-1.5 w-3/5 rounded bg-slate-100" /></div><p className="mt-8 break-words border-t border-slate-100 pt-3 text-[10px] leading-4 text-slate-400">{config.export_template.footer[labelLanguage] || "Sandu AI"}</p></div></div></div></section>
          <div className="border-t border-slate-100 pt-6"><OptionEditor title={kk ? "Дайын интерактив үлгілері" : "Готовые интерактивные шаблоны"} description={kk ? "ЖИ сценарийге сәйкес үлгіні бейімдеп, Vibe Coding-ке дайын нұсқаулық береді." : "ИИ адаптирует шаблон под сценарий и передаёт готовую инструкцию в Vibe Coding."} rows={config.interactive_templates} language={labelLanguage} kk={kk} max={40} allowEmpty onChange={interactive_templates => patch({ interactive_templates })} onAdd={() => patch({ interactive_templates: [...config.interactive_templates, { id: nextOptionId("interactive", config.interactive_templates), label: emptyLabels(), kind: "quiz", prompt: "" }] })} extra={(template, _index, update) => <div className="space-y-4"><Field label={kk ? "Интерактив түрі" : "Вид интерактива"}><select aria-label={kk ? "Интерактив түрі" : "Вид интерактива"} className={fieldClass} value={template.kind} onChange={event => update({ kind: event.target.value as MasterclassInteractiveKind })}>{interactiveKinds.map(([id, kz, ru]) => <option key={id} value={id}>{kk ? kz : ru}</option>)}</select></Field><Field label={kk ? "Интерактив нұсқаулығы" : "Инструкция интерактива"}><textarea rows={4} minLength={10} maxLength={10000} className={`${fieldClass} resize-y leading-6`} value={template.prompt} onChange={event => update({ prompt: event.target.value })} /></Field></div>} /></div>
        </> : null}
      </fieldset>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4"><p className="text-xs leading-5 text-slate-500">{kk ? "Сақталған жұмыстар өз нұсқасын сақтайды." : "Сохранённые работы сохраняют свою версию настроек."}</p><div className="flex flex-wrap gap-2">{dirty ? <button type="button" disabled={saving} className={secondaryButton} onClick={discard}>{kk ? "Өзгерістерді алып тастау" : "Отменить изменения"}</button> : null}<button type="submit" disabled={!dirty || saving || conflict} className={primaryButton}>{saving ? (kk ? "Сақталуда…" : "Сохраняем…") : (kk ? "Сақтау" : "Сохранить")}</button></div></footer>
    </form>
  </div>;
}
