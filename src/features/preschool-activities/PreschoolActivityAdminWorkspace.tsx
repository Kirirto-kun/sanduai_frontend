"use client";

import { useEffect, useState } from "react";

import { useLanguage } from "@/i18n/LanguageContext";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import {
  completeLocalizedProfile,
  PRESCHOOL_PROFILE_LANGUAGES,
  validatePreschoolAdminSettings,
  type PreschoolAdminValidationIssue,
} from "./admin-model";
import { preschoolActivityApi } from "./api";
import type {
  LocalizedLabel,
  PreschoolAdminSettings,
  PreschoolAdminSettingsUpdate,
  PreschoolProfileEntry,
} from "./types";

const inputClass = "min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100";

function LabelEditor({ value, onChange }: { value: LocalizedLabel; onChange: (value: LocalizedLabel) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {PRESCHOOL_PROFILE_LANGUAGES.map((language) => (
        <label key={language} className="text-[10px] font-black uppercase tracking-wide text-slate-500">
          {language}
          <input value={value[language] ?? ""} onChange={(event) => onChange({ ...value, [language]: event.target.value })} className={`${inputClass} mt-1 normal-case`} />
        </label>
      ))}
    </div>
  );
}

function LocalizedTextEditor({ value, onChange }: { value: LocalizedLabel; onChange: (value: LocalizedLabel) => void }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {PRESCHOOL_PROFILE_LANGUAGES.map((language) => (
        <label key={language} className="text-[10px] font-black uppercase tracking-wide text-slate-500">
          {language}
          <textarea value={value[language] ?? ""} onChange={(event) => onChange({ ...value, [language]: event.target.value })} rows={4} className={`${inputClass} mt-1 resize-y normal-case leading-5 lg:min-h-28`} />
        </label>
      ))}
    </div>
  );
}

function SettingsSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      {hint ? <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProfileCollectionEditor({
  items,
  label,
  contentLabel,
  onChange,
}: {
  items: PreschoolProfileEntry[];
  label: string;
  contentLabel: string;
  onChange: (items: PreschoolProfileEntry[]) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <details key={item.id} className="group rounded-2xl border border-slate-200 bg-slate-50/40 p-4 open:bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-black text-slate-900">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs text-emerald-800">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate">{item.label.ru || item.label.kk || item.id}</span>
            <code className="rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">{item.id}</code>
            <span aria-hidden className="text-slate-400 transition group-open:rotate-180">⌄</span>
          </summary>
          <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">
            <div><p className="mb-2 text-xs font-black text-slate-700">{label}</p><LabelEditor value={item.label} onChange={(nextLabel) => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: nextLabel } : entry))} /></div>
            <div><p className="mb-2 text-xs font-black text-slate-700">{contentLabel}</p><LocalizedTextEditor value={item.content} onChange={(content) => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, content } : entry))} /></div>
          </div>
        </details>
      ))}
    </div>
  );
}

export default function PreschoolActivityAdminWorkspace() {
  const { language } = useLanguage();
  const isKk = language === "kk";
  const [settings, setSettings] = useState<PreschoolAdminSettings | null>(null);
  const [durationText, setDurationText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    preschoolActivityApi.adminSettings().then((value) => {
      if (!active) return;
      const regulatoryNotes = completeLocalizedProfile(value.regulatory_notes, value.regulatory_note);
      setSettings({
        ...value,
        regulatory_note: regulatoryNotes.kk ?? value.regulatory_note,
        regulatory_notes: regulatoryNotes,
        main_objectives: (value.main_objectives ?? []).map((item) => ({
          ...item,
          label: completeLocalizedProfile(item.label),
          content: completeLocalizedProfile(item.content),
        })),
        program_requirements: (value.program_requirements ?? []).map((item) => ({
          ...item,
          label: completeLocalizedProfile(item.label),
          content: completeLocalizedProfile(item.content),
        })),
      });
      setDurationText(value.duration_options.join(", "));
    }).catch((requestError) => {
      if (active) setError(teacherFacingErrorMessage(requestError, language));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [language, loadAttempt]);

  const update = <K extends keyof PreschoolAdminSettings>(key: K, value: PreschoolAdminSettings[K]) => {
    setSettings((current) => current ? { ...current, [key]: value } : current);
    setSaved(false);
  };

  const save = async () => {
    if (!settings || saving) return;
    setError("");
    const durations = [...new Set(durationText.split(/[,;\s]+/).filter(Boolean).map(Number))].sort((a, b) => a - b);
    const next = { ...settings, duration_options: durations };
    const issue = validatePreschoolAdminSettings(next);
    if (issue) {
      const messages: Record<PreschoolAdminValidationIssue, string> = isKk ? {
        standard_version: "Стандарт нұсқасын толтырыңыз.", regulatory_notes: "Нормативтік ескертуді бес тілде толтырыңыз.", model: "ЖИ моделін көрсетіңіз.", prompt: "Негізгі prompt кемінде 50 таңбадан тұруы керек.", costs: "Монета құны кемінде 1 болатын бүтін сан болуы керек.", durations: "Ұзақтық 10–90 минут аралығында болуы керек.", ids: "Бөлімдер бос болмауы және ID қайталанбауы керек.", ages: "Топ жасы 2–6 аралығында болуы керек.", ranges: "Бағыттардың жас шегін тексеріңіз.", labels: "Әр атауды бес тілде толтырыңыз.", profile: "Мақсаттар мен бағдарлама талаптарының атауы мен мазмұнын бес тілде толтырыңыз.",
      } : {
        standard_version: "Заполните версию стандарта.", regulatory_notes: "Заполните нормативное примечание на пяти языках.", model: "Укажите модель ИИ.", prompt: "Основной prompt должен содержать не менее 50 символов.", costs: "Стоимость должна быть целым числом не меньше 1.", durations: "Продолжительность должна быть от 10 до 90 минут.", ids: "Разделы не должны быть пустыми, а ID — повторяться.", ages: "Возраст группы должен быть от 2 до 6 лет.", ranges: "Проверьте возрастные диапазоны направлений.", labels: "Заполните каждое название на пяти языках.", profile: "Заполните названия и содержание целей и требований программы на пяти языках.",
      };
      setError(messages[issue]);
      return;
    }
    setSaving(true);
    try {
      const payload: PreschoolAdminSettingsUpdate = {
        standard_version: next.standard_version.trim(),
        regulatory_note: (next.regulatory_notes.kk ?? next.regulatory_note).trim(),
        regulatory_notes: next.regulatory_notes,
        main_objectives: next.main_objectives,
        program_requirements: next.program_requirements,
        age_groups: next.age_groups,
        activity_areas: next.activity_areas,
        styles: next.styles,
        support_needs: next.support_needs,
        languages: next.languages,
        duration_options: next.duration_options,
        token_cost: next.token_cost,
        task_token_cost: next.task_token_cost,
        topic_token_cost: next.topic_token_cost,
        prompt: next.prompt.trim(),
        model: next.model.trim(),
      };
      const updated = await preschoolActivityApi.updateAdminSettings(payload);
      setSettings(updated);
      setDurationText(updated.duration_options.join(", "));
      setSaved(true);
    } catch (requestError) {
      setError(teacherFacingErrorMessage(requestError, language));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div aria-live="polite" className="mx-auto max-w-5xl rounded-3xl bg-white px-6 py-14 text-center"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent" /><p className="mt-4 text-sm font-bold text-slate-600">{isKk ? "Баптаулар жүктелуде…" : "Загружаем настройки…"}</p></div>;
  if (!settings) return <div role="alert" className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"><p>{error}</p><button type="button" onClick={() => setLoadAttempt((current) => current + 1)} className="mt-4 min-h-10 rounded-xl bg-slate-950 px-4 font-black text-white">{isKk ? "Қайталау" : "Повторить"}</button></div>;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12">
      <header className="rounded-3xl border border-white bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">ADMIN · PRESCHOOL</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{isKk ? "Ашық іс-әрекет баптаулары" : "Настройки открытых занятий"}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{isKk ? "Жас топтарын, бағыттарды, бес тілдегі атауларды, нормативтік профильді және ЖИ генерациясын код өзгертпей басқарыңыз." : "Управляйте возрастными группами, направлениями, названиями на пяти языках, нормативным профилем и генерацией ИИ без изменения кода."}</p>
      </header>

      {error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</div> : null}
      {saved ? <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">✓ {isKk ? "Баптаулар сақталды" : "Настройки сохранены"}</div> : null}

      <SettingsSection title={isKk ? "Нормативтік профиль" : "Нормативный профиль"} hint={isKk ? "Заңнама өзгергенде нұсқа мен ескертуді осы жерден жаңартыңыз." : "Обновляйте версию и примечание здесь при изменениях нормативной базы."}>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">{isKk ? "Стандарт нұсқасы" : "Версия стандарта"}<input value={settings.standard_version} onChange={(event) => update("standard_version", event.target.value)} className={`${inputClass} mt-1.5`} /></label>
          <label className="text-sm font-bold text-slate-700">{isKk ? "Ұзақтықтар (минут)" : "Варианты времени (минуты)"}<input value={durationText} onChange={(event) => { setDurationText(event.target.value); setSaved(false); }} className={`${inputClass} mt-1.5`} placeholder="15, 20, 25, 30" /></label>
          <div className="lg:col-span-2">
            <p className="mb-2 text-sm font-bold text-slate-700">{isKk ? "Нормативтік ескерту · 5 тіл" : "Нормативное примечание · 5 языков"}</p>
            <LocalizedTextEditor value={settings.regulatory_notes} onChange={(regulatoryNotes) => {
              setSettings((current) => current ? {
                ...current,
                regulatory_notes: regulatoryNotes,
                regulatory_note: regulatoryNotes.kk ?? current.regulatory_note,
              } : current);
              setSaved(false);
            }} />
          </div>
        </div>
      </SettingsSection>

      <div className="grid gap-6 2xl:grid-cols-2">
        <SettingsSection title={isKk ? "Негізгі мақсаттар" : "Основные цели"} hint={isKk ? "Әр мақсаттың атауы мен мазмұны генерация тіліне сай беріледі. Тұрақты ID өзгертілмейді." : "Название и содержание каждой цели подставляются на языке генерации. Стабильный ID не изменяется."}>
          <ProfileCollectionEditor
            items={settings.main_objectives}
            label={isKk ? "Атауы · 5 тіл" : "Название · 5 языков"}
            contentLabel={isKk ? "Мазмұны · 5 тіл" : "Содержание · 5 языков"}
            onChange={(items) => update("main_objectives", items)}
          />
        </SettingsSection>
        <SettingsSection title={isKk ? "Бағдарлама талаптары" : "Требования программы"} hint={isKk ? "Генератор таңдаған тілдегі барлық талаптарды ескереді." : "Генератор учитывает все требования в выбранном языке документа."}>
          <ProfileCollectionEditor
            items={settings.program_requirements}
            label={isKk ? "Атауы · 5 тіл" : "Название · 5 языков"}
            contentLabel={isKk ? "Мазмұны · 5 тіл" : "Содержание · 5 языков"}
            onChange={(items) => update("program_requirements", items)}
          />
        </SettingsSection>
      </div>

      <SettingsSection title={isKk ? "Жас топтары" : "Возрастные группы"} hint={isKk ? "ID тұрақты қалады; атауы мен жасын өзгертуге болады." : "ID остаётся стабильным; название и возраст можно менять."}>
        <div className="space-y-4">
          {settings.age_groups.map((group, index) => <div key={group.id} className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 flex items-center gap-3"><code className="rounded bg-slate-100 px-2 py-1 text-xs">{group.id}</code><label className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-600">{isKk ? "Жасы" : "Возраст"}<input type="number" min={2} max={6} value={group.age} onChange={(event) => update("age_groups", settings.age_groups.map((item, itemIndex) => itemIndex === index ? { ...item, age: Number(event.target.value) } : item))} className="h-9 w-20 rounded-lg border border-slate-300 px-2" /></label></div><LabelEditor value={group.label} onChange={(label) => update("age_groups", settings.age_groups.map((item, itemIndex) => itemIndex === index ? { ...item, label } : item))} /></div>)}
        </div>
      </SettingsSection>

      <SettingsSection title={isKk ? "Іс-әрекет бағыттары" : "Направления деятельности"}>
        <div className="space-y-4">
          {settings.activity_areas.map((area, index) => <div key={area.id} className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 flex flex-wrap items-center gap-3"><code className="rounded bg-slate-100 px-2 py-1 text-xs">{area.id}</code><label className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-600">min<input type="number" min={2} max={6} value={area.min_age} onChange={(event) => update("activity_areas", settings.activity_areas.map((item, itemIndex) => itemIndex === index ? { ...item, min_age: Number(event.target.value) } : item))} className="h-9 w-16 rounded-lg border border-slate-300 px-2" /></label><label className="flex items-center gap-2 text-xs font-bold text-slate-600">max<input type="number" min={2} max={6} value={area.max_age} onChange={(event) => update("activity_areas", settings.activity_areas.map((item, itemIndex) => itemIndex === index ? { ...item, max_age: Number(event.target.value) } : item))} className="h-9 w-16 rounded-lg border border-slate-300 px-2" /></label></div><LabelEditor value={area.label} onChange={(label) => update("activity_areas", settings.activity_areas.map((item, itemIndex) => itemIndex === index ? { ...item, label } : item))} /></div>)}
        </div>
      </SettingsSection>

      <div className="grid gap-6 xl:grid-cols-2">
        {(["styles", "support_needs"] as const).map((key) => <SettingsSection key={key} title={key === "styles" ? (isKk ? "Стильдер" : "Стили") : (isKk ? "Қолдау қажеттіліктері" : "Потребности поддержки")}><div className="space-y-4">{settings[key].map((item, index) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><code className="mb-3 inline-block rounded bg-slate-100 px-2 py-1 text-xs">{item.id}</code><LabelEditor value={item.label} onChange={(label) => update(key, settings[key].map((entry, itemIndex) => itemIndex === index ? { ...entry, label } : entry))} /></div>)}</div></SettingsSection>)}
      </div>

      <SettingsSection title={isKk ? "ЖИ және құны" : "ИИ и стоимость"}>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["token_cost", "task_token_cost", "topic_token_cost"] as const).map((key) => <label key={key} className="text-sm font-bold text-slate-700">{key}<input type="number" min={1} value={settings[key]} onChange={(event) => update(key, Number(event.target.value))} className={`${inputClass} mt-1.5`} /></label>)}
          <label className="text-sm font-bold text-slate-700 sm:col-span-3">Model<input value={settings.model} onChange={(event) => update("model", event.target.value)} className={`${inputClass} mt-1.5`} /></label>
          <label className="text-sm font-bold text-slate-700 sm:col-span-3">System prompt<textarea value={settings.prompt} onChange={(event) => update("prompt", event.target.value)} rows={14} className={`${inputClass} mt-1.5 resize-y font-mono text-xs leading-5`} /></label>
        </div>
      </SettingsSection>

      <div className="sticky bottom-4 flex justify-end">
        <button type="button" onClick={() => void save()} disabled={saving} className="min-h-12 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-xl hover:bg-emerald-700 disabled:opacity-50">{saving ? (isKk ? "Сақталуда…" : "Сохраняем…") : (isKk ? "Баптауларды сақтау" : "Сохранить настройки")}</button>
      </div>
    </div>
  );
}
