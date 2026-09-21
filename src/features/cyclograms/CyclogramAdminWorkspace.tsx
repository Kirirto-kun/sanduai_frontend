"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { useLanguage } from "@/i18n/LanguageContext";
import { CONTENT_LANGUAGE_OPTIONS } from "@/lib/content-languages";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { cyclogramApi } from "./api";
import type {
  CyclogramAdminConfig,
  CyclogramAdminUpdate,
  CyclogramGroup,
  CyclogramLanguage,
  CyclogramSection,
} from "./types";

const fieldClass = "mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100";
const labelClass = "block text-sm font-semibold text-slate-800";
const templateVersionPattern = "[A-Za-z0-9_.\\-]+";
const stableIdPattern = "[a-z][a-z0-9_\\-]{1,63}";
const languageCodePattern = "[a-z][a-z0-9\\-]*";
const defaultLanguageColumns: CyclogramLanguage[] = CONTENT_LANGUAGE_OPTIONS.map(
  ({ value, label }) => ({ code: value, label }),
);

function uniqueId(prefix: string, existing: string[]): string {
  let index = existing.length + 1;
  while (existing.includes(`${prefix}_${index}`)) index += 1;
  return `${prefix}_${index}`;
}

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function updatePayload(config: CyclogramAdminConfig): CyclogramAdminUpdate {
  return {
    template_version: config.template_version,
    regulatory_label: config.regulatory_label,
    sections: config.sections,
    age_groups: config.age_groups,
    languages: config.languages,
    token_cost: config.token_cost,
    cell_token_cost: config.cell_token_cost,
    topic_token_cost: config.topic_token_cost,
    prompt: config.prompt,
    model: config.model,
    word_template: config.word_template,
  };
}

export default function CyclogramAdminWorkspace() {
  const { language } = useLanguage();
  const kk = language === "kk";
  const [config, setConfig] = useState<CyclogramAdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try { setConfig(await cyclogramApi.adminConfig()); }
    catch (cause) { setError(teacherFacingErrorMessage(cause, language, { fallback: kk ? "Циклограмма баптауларын жүктеу мүмкін болмады." : "Не удалось загрузить настройки циклограммы." })); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const languageColumns = useMemo(
    () => config?.languages.length ? config.languages : defaultLanguageColumns,
    [config?.languages],
  );

  const patchSection = (index: number, patch: Partial<CyclogramSection>) => setConfig(previous => previous ? {
    ...previous,
    sections: previous.sections.map((section, position) => position === index ? { ...section, ...patch } : section),
  } : previous);
  const patchGroup = (index: number, patch: Partial<CyclogramGroup>) => setConfig(previous => previous ? {
    ...previous,
    age_groups: previous.age_groups.map((group, position) => position === index ? { ...group, ...patch } : group),
  } : previous);
  const patchLanguage = (index: number, patch: Partial<CyclogramLanguage>) => setConfig(previous => previous ? {
    ...previous,
    languages: previous.languages.map((item, position) => position === index ? { ...item, ...patch } : item),
  } : previous);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!config || saving) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await cyclogramApi.updateAdminConfig(updatePayload(config));
      setConfig(updated);
      setNotice(kk ? "Циклограмма баптаулары сақталды." : "Настройки циклограммы сохранены.");
    } catch (cause) {
      setError(teacherFacingErrorMessage(cause, language, { fallback: kk ? "Баптауларды сақтау мүмкін болмады." : "Не удалось сохранить настройки." }));
    } finally {
      setSaving(false);
    }
  };

  const uploadTemplate = async (file: File | undefined) => {
    if (!file || uploading) return;
    if (!file.name.toLocaleLowerCase().endsWith(".docx")) {
      setError(kk ? "Тек .docx файлын таңдаңыз." : "Выберите файл .docx.");
      return;
    }
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await cyclogramApi.uploadWordTemplate(file);
      setConfig(updated);
      setNotice(kk ? "Word шаблоны жүктелді." : "Шаблон Word загружен.");
    } catch (cause) {
      setError(teacherFacingErrorMessage(cause, language, { fallback: kk ? "Word шаблонын жүктеу мүмкін болмады." : "Не удалось загрузить шаблон Word." }));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex min-h-72 items-center justify-center"><span className="h-9 w-9 animate-spin rounded-full border-4 border-teal-600 border-r-transparent" aria-label={kk ? "Жүктелуде" : "Загрузка"} /></div>;
  if (!config) return <div className="border-l-4 border-rose-500 bg-rose-50 px-5 py-6 text-rose-900"><p className="font-bold">{error}</p><button type="button" onClick={() => void load()} className="mt-3 font-bold underline">{kk ? "Қайталау" : "Повторить"}</button></div>;

  return (
    <form onSubmit={save} className="mx-auto max-w-6xl space-y-8 bg-white px-5 py-6 shadow-sm sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase text-teal-700">{kk ? "Әкімші панелі" : "Админ-панель"}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">{kk ? "Циклограмма баптаулары" : "Настройки циклограммы"}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{kk ? "Нормативтік нысанды, ЖИ нұсқауларын және токен бағасын кодты өзгертпей басқарыңыз." : "Управляйте нормативной формой, инструкциями ИИ и стоимостью без изменения кода."}</p>
        </div>
        <button type="submit" disabled={saving || uploading} className="min-h-11 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50">{saving ? (kk ? "Сақталуда…" : "Сохраняем…") : (kk ? "Өзгерістерді сақтау" : "Сохранить изменения")}</button>
      </header>

      {error ? <div role="alert" className="border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {notice ? <div role="status" className="border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div> : null}

      <section aria-labelledby="admin-cyclogram-general" className="border-b border-slate-200 pb-8">
        <h2 id="admin-cyclogram-general" className="text-lg font-bold text-slate-950">{kk ? "Нормативтік нұсқа" : "Нормативная версия"}</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>{kk ? "Шаблон нұсқасы" : "Версия шаблона"}<input required pattern={templateVersionPattern} className={fieldClass} value={config.template_version} onChange={event => setConfig(previous => previous ? { ...previous, template_version: event.target.value } : previous)} /></label>
          <label className={labelClass}>{kk ? "ЖИ моделі" : "Модель ИИ"}<input required className={fieldClass} value={config.model} onChange={event => setConfig(previous => previous ? { ...previous, model: event.target.value } : previous)} /></label>
          <label className={`${labelClass} sm:col-span-2`}>{kk ? "Нормативтік түсіндірме" : "Нормативная подпись"}<textarea required className={`${fieldClass} min-h-24 resize-y`} value={config.regulatory_label} onChange={event => setConfig(previous => previous ? { ...previous, regulatory_label: event.target.value } : previous)} /></label>
          <label className={`${labelClass} sm:col-span-2`}>{kk ? "ЖИ-ға арналған негізгі prompt" : "Основной prompt для ИИ"}<textarea required minLength={50} className={`${fieldClass} min-h-64 resize-y font-mono text-xs leading-5`} value={config.prompt} onChange={event => setConfig(previous => previous ? { ...previous, prompt: event.target.value } : previous)} /></label>
        </div>
      </section>

      <section aria-labelledby="admin-cyclogram-costs" className="border-b border-slate-200 pb-8">
        <h2 id="admin-cyclogram-costs" className="text-lg font-bold text-slate-950">{kk ? "Токен бағасы" : "Стоимость в токенах"}</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          {([
            ["token_cost", kk ? "Толық циклограмма" : "Полная циклограмма"],
            ["cell_token_cost", kk ? "Бір ұяшық әрекеті" : "Действие с ячейкой"],
            ["topic_token_cost", kk ? "10 тақырып ұсыну" : "10 вариантов темы"],
          ] as const).map(([key, label]) => <label key={key} className={labelClass}>{label}<input required min={1} max={10000} type="number" className={fieldClass} value={config[key]} onChange={event => setConfig(previous => previous ? { ...previous, [key]: Number(event.target.value) } : previous)} /></label>)}
        </div>
      </section>

      <section aria-labelledby="admin-cyclogram-sections" className="border-b border-slate-200 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="admin-cyclogram-sections" className="text-lg font-bold text-slate-950">{kk ? "Ресми бөлімдер және реті" : "Официальные разделы и порядок"}</h2><p className="mt-1 text-sm text-slate-500">{config.sections.length} {kk ? "бөлім" : "разделов"}</p></div><button type="button" onClick={() => setConfig(previous => previous ? { ...previous, sections: [...previous.sections, { id: uniqueId("section", previous.sections.map(item => item.id)), kind: "text", title: Object.fromEntries(previous.languages.map(item => [item.code, kk ? "Жаңа бөлім" : "Новый раздел"])) }] } : previous)} className="min-h-10 rounded-lg border border-teal-700 px-4 text-sm font-bold text-teal-800">+ {kk ? "Бөлім қосу" : "Добавить раздел"}</button></div>
        <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {config.sections.map((section, index) => <div key={`${section.id}-${index}`} className="py-5">
            <div className="grid gap-4 lg:grid-cols-[auto_minmax(140px,0.7fr)_minmax(120px,0.6fr)_minmax(0,2fr)_auto] lg:items-end">
              <div className="flex gap-1"><button type="button" title={kk ? "Жоғары" : "Выше"} aria-label={kk ? "Бөлімді жоғары жылжыту" : "Переместить раздел выше"} disabled={index === 0} onClick={() => setConfig(previous => previous ? { ...previous, sections: move(previous.sections, index, -1) } : previous)} className="h-10 w-10 border border-slate-300 font-bold disabled:opacity-30">↑</button><button type="button" title={kk ? "Төмен" : "Ниже"} aria-label={kk ? "Бөлімді төмен жылжыту" : "Переместить раздел ниже"} disabled={index === config.sections.length - 1} onClick={() => setConfig(previous => previous ? { ...previous, sections: move(previous.sections, index, 1) } : previous)} className="h-10 w-10 border border-slate-300 font-bold disabled:opacity-30">↓</button></div>
              <label className={labelClass}>ID<input required pattern={stableIdPattern} className={fieldClass} value={section.id} onChange={event => patchSection(index, { id: event.target.value })} /></label>
              <label className={labelClass}>{kk ? "Түрі" : "Тип"}<input required className={fieldClass} value={section.kind} onChange={event => patchSection(index, { kind: event.target.value })} /></label>
              <div className="grid gap-3 sm:grid-cols-2">{languageColumns.map(item => <label key={item.code} className={labelClass}>{item.label}<input className={fieldClass} value={section.title[item.code] ?? ""} onChange={event => patchSection(index, { title: { ...section.title, [item.code]: event.target.value } })} /></label>)}</div>
              <button type="button" disabled={config.sections.length === 1} onClick={() => setConfig(previous => previous ? { ...previous, sections: previous.sections.filter((_, position) => position !== index) } : previous)} className="min-h-10 px-3 text-sm font-bold text-rose-700 disabled:opacity-30">{kk ? "Жою" : "Удалить"}</button>
            </div>
          </div>)}
        </div>
      </section>

      <section aria-labelledby="admin-cyclogram-groups" className="border-b border-slate-200 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="admin-cyclogram-groups" className="text-lg font-bold text-slate-950">{kk ? "Жас топтары" : "Возрастные группы"}</h2><button type="button" onClick={() => setConfig(previous => previous ? { ...previous, age_groups: [...previous.age_groups, { id: uniqueId("group", previous.age_groups.map(item => item.id)), default_age: 3, label: Object.fromEntries(previous.languages.map(item => [item.code, kk ? "Жаңа топ" : "Новая группа"])) }] } : previous)} className="min-h-10 rounded-lg border border-teal-700 px-4 text-sm font-bold text-teal-800">+ {kk ? "Топ қосу" : "Добавить группу"}</button></div>
        <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">{config.age_groups.map((group, index) => <div key={`${group.id}-${index}`} className="grid gap-4 py-5 lg:grid-cols-[minmax(140px,0.7fr)_110px_minmax(0,2fr)_auto] lg:items-end"><label className={labelClass}>ID<input required pattern={stableIdPattern} className={fieldClass} value={group.id} onChange={event => patchGroup(index, { id: event.target.value })} /></label><label className={labelClass}>{kk ? "Жасы" : "Возраст"}<input required type="number" min={2} max={6} className={fieldClass} value={group.default_age} onChange={event => patchGroup(index, { default_age: Number(event.target.value) })} /></label><div className="grid gap-3 sm:grid-cols-2">{languageColumns.map(item => <label key={item.code} className={labelClass}>{item.label}<input className={fieldClass} value={group.label[item.code] ?? ""} onChange={event => patchGroup(index, { label: { ...group.label, [item.code]: event.target.value } })} /></label>)}</div><button type="button" disabled={config.age_groups.length === 1} onClick={() => setConfig(previous => previous ? { ...previous, age_groups: previous.age_groups.filter((_, position) => position !== index) } : previous)} className="min-h-10 px-3 text-sm font-bold text-rose-700 disabled:opacity-30">{kk ? "Жою" : "Удалить"}</button></div>)}</div>
      </section>

      <section aria-labelledby="admin-cyclogram-languages" className="border-b border-slate-200 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="admin-cyclogram-languages" className="text-lg font-bold text-slate-950">{kk ? "Құжат тілдері" : "Языки документа"}</h2><button type="button" onClick={() => setConfig(previous => previous ? { ...previous, languages: [...previous.languages, { code: uniqueId("lang", previous.languages.map(item => item.code)).replace("_", "-"), label: kk ? "Жаңа тіл" : "Новый язык" }] } : previous)} className="min-h-10 rounded-lg border border-teal-700 px-4 text-sm font-bold text-teal-800">+ {kk ? "Тіл қосу" : "Добавить язык"}</button></div>
        <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">{config.languages.map((item, index) => <div key={`${item.code}-${index}`} className="grid gap-4 py-4 sm:grid-cols-[minmax(120px,0.5fr)_minmax(0,1fr)_auto] sm:items-end"><label className={labelClass}>{kk ? "Тіл коды" : "Код языка"}<input required pattern={languageCodePattern} className={fieldClass} value={item.code} onChange={event => patchLanguage(index, { code: event.target.value })} /></label><label className={labelClass}>{kk ? "Атауы" : "Название"}<input required className={fieldClass} value={item.label} onChange={event => patchLanguage(index, { label: event.target.value })} /></label><button type="button" disabled={config.languages.length === 1} onClick={() => setConfig(previous => previous ? { ...previous, languages: previous.languages.filter((_, position) => position !== index) } : previous)} className="min-h-10 px-3 text-sm font-bold text-rose-700 disabled:opacity-30">{kk ? "Жою" : "Удалить"}</button></div>)}</div>
      </section>

      <section aria-labelledby="admin-cyclogram-word" className="pb-2">
        <h2 id="admin-cyclogram-word" className="text-lg font-bold text-slate-950">{kk ? "Word шаблоны" : "Шаблон Word"}</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border border-slate-300 px-4 py-4">
          <div><p className="font-semibold text-slate-900">{config.word_template?.filename || (kk ? "Шаблон жүктелмеген" : "Шаблон не загружен")}</p>{config.word_template?.uploaded_at ? <p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat(kk ? "kk-KZ" : "ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(config.word_template.uploaded_at))} · {config.word_template.size ? `${Math.ceil(config.word_template.size / 1024)} KB` : ""}</p> : null}</div>
          <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg bg-slate-950 px-4 text-sm font-bold text-white"><span>{uploading ? (kk ? "Жүктелуде…" : "Загружаем…") : (kk ? "DOCX таңдау" : "Выбрать DOCX")}</span><input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={uploading || saving} onChange={event => { void uploadTemplate(event.target.files?.[0]); event.currentTarget.value = ""; }} className="sr-only" /></label>
        </div>
      </section>

      <div className="flex justify-end border-t border-slate-200 pt-5"><button type="submit" disabled={saving || uploading} className="min-h-11 rounded-lg bg-teal-700 px-6 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50">{saving ? (kk ? "Сақталуда…" : "Сохраняем…") : (kk ? "Өзгерістерді сақтау" : "Сохранить изменения")}</button></div>
    </form>
  );
}
