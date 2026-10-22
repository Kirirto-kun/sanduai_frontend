import { useState, type FormEvent, type Dispatch, type SetStateAction } from "react";
import type { LessonPlanRequest } from "@/lib/api";
import { CurriculumPicker } from "./CurriculumPicker";
import { buttonClass, fieldClass, TextField } from "./Fields";
import type { LessonPlanDraft } from "./model";

type Props = { draft: LessonPlanDraft; onChange: Dispatch<SetStateAction<LessonPlanDraft>>; onSubmit: (event: FormEvent) => void; busy: boolean; kk: boolean; cost?: number; balance: number | null; error: string };
const languageOptions = [["kazakh", "Қазақша"], ["russian", "Русский"], ["english", "English"], ["kyrgyz", "Кыргызча"], ["uzbek", "O‘zbekcha"]] as const;

export function PlannerForm({ draft, onChange, onSubmit, busy, kk, cost, balance, error }: Props) {
  const selected = draft.selected_objectives ?? [];
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof LessonPlanRequest,>(key: K, value: LessonPlanRequest[K]) => {
    const selectionChanged = ["subject", "grade", "teaching_language"].includes(key);
    onChange({ ...draft, [key]: value, ...(selectionChanged ? { selected_objective_ids: [], selected_objective_texts: [], selected_objectives: [], program_id: undefined } : {}) });
  };
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError(""); setUploading(true);
    try {
      const images = await Promise.all(Array.from(files).map((file) => {
        if (!file.type.startsWith("image/")) throw new Error(kk ? "Сурет файлын таңдаңыз." : "Выберите файл изображения.");
        if (file.size > 10 * 1024 * 1024) throw new Error(kk ? "Әр сурет 10 МБ-тан аспауы керек." : "Каждое изображение должно быть меньше 10 МБ.");
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error(kk ? "Суретті оқу мүмкін болмады." : "Не удалось прочитать изображение.")); reader.readAsDataURL(file);
        });
      }));
      onChange((current) => ({ ...current, textbook_images: [...(current.textbook_images ?? []), ...images] }));
    } catch (failure) { setUploadError(failure instanceof Error ? failure.message : (kk ? "Суретті қайта жүктеңіз." : "Попробуйте загрузить изображение снова.")); }
    finally { setUploading(false); }
  };

  return <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-7">
    <p className="text-sm leading-6 text-slate-600">{kk ? "Міндетті өрістер * белгісімен көрсетілген. Бос қосымша деректер жоспарға ойдан қосылмайды." : "Обязательные поля отмечены *. Пустые дополнительные сведения останутся незаполненными."}</p>
    <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2">
      <legend className="mb-4 text-lg font-bold text-slate-900">{kk ? "Сабақ туралы" : "Об уроке"}</legend>
      <TextField label={kk ? "Пән" : "Предмет"} required value={draft.subject} onChange={(value) => set("subject", value)} />
      <label className="text-sm font-semibold text-slate-700">{kk ? "Сынып" : "Класс"} *<select required value={draft.grade} onChange={(event) => set("grade", event.target.value)} className={`${fieldClass} mt-1.5`}><option value="">{kk ? "Таңдаңыз" : "Выберите"}</option>{Array.from({ length: 11 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
      <div className="sm:col-span-2"><TextField label={kk ? "Сабақтың тақырыбы" : "Тема урока"} required value={draft.topic} onChange={(value) => set("topic", value)} /></div>
      <label className="text-sm font-semibold text-slate-700">{kk ? "Оқыту тілі" : "Язык обучения"}<select value={draft.teaching_language} onChange={(event) => set("teaching_language", event.target.value)} className={`${fieldClass} mt-1.5`}>{languageOptions.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select><span className="mt-1.5 block text-xs font-normal leading-5 text-slate-600">{kk ? "Сыныптың оқу бағдарламасын таңдау үшін." : "Определяет учебную программу класса."}</span></label>
      <label className="text-sm font-semibold text-slate-700">{kk ? "ҚМЖ құжатының тілі" : "Язык документа КМЖ"}<select value={draft.language} onChange={(event) => set("language", event.target.value as LessonPlanRequest["language"])} className={`${fieldClass} mt-1.5`}>{languageOptions.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
      <TextField label={kk ? "Сабақ ұзақтығы, минут" : "Продолжительность, минут"} type="number" min={10} max={180} step={1} required value={String(draft.duration ?? 45)} onChange={(value) => set("duration", value === "" ? undefined : Number(value))} hint={kk ? "Әдепкі мәні — 45 минут. Өзгертуге болады." : "По умолчанию 45 минут. Можно изменить."} />
      <TextField label={kk ? "Оқушылар саны" : "Количество учеников"} type="number" min={1} max={1000} step={1} value={draft.student_count == null ? "" : String(draft.student_count)} onChange={(value) => set("student_count", value === "" ? null : Number(value))} />
    </fieldset>
    <CurriculumPicker key={`${draft.subject}|${draft.grade}|${draft.teaching_language}`} subject={draft.subject} grade={draft.grade} teachingLanguage={draft.teaching_language ?? "kazakh"} selected={selected} onSelect={(items) => { const programs = new Set(items.map((item) => item.program_id)); onChange({ ...draft, selected_objectives: items, selected_objective_ids: items.map((item) => item.id), selected_objective_texts: items.map((item) => `${item.code} ${item.text}`), program_id: programs.size === 1 ? items[0]?.program_id : undefined }); }} kk={kk} />
    <TextField label={kk ? "Оқу мақсатының коды және толық тұжырымы (қолмен)" : "Код и полная формулировка цели (вручную)"} multiline value={draft.learning_objectives.join("\n")} onChange={(value) => set("learning_objectives", value.split("\n"))} hint={kk ? "Әр мақсатты жаңа жолға жазыңыз. Анықтамалықта мақсат болмаса да, жалғастыра аласыз." : "Каждую цель пишите с новой строки. Можно продолжить, даже если цели нет в справочнике."} />
    <details className="rounded-2xl border border-slate-200 p-4" open>
      <summary className="cursor-pointer text-base font-bold text-slate-900">{kk ? "Мектеп, педагог және сабақ күні" : "Школа, учитель и дата"}</summary>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <TextField label={kk ? "Білім беру ұйымының атауы" : "Название организации образования"} value={draft.school_name ?? ""} onChange={(value) => set("school_name", value)} />
        <TextField label={kk ? "Педагогтің аты-жөні" : "ФИО педагога"} value={draft.teacher_name} onChange={(value) => set("teacher_name", value)} />
        <TextField label={kk ? "Бөлім атауы" : "Раздел"} value={draft.section_name} onChange={(value) => set("section_name", value)} />
        <TextField label={kk ? "Күні (КК.АА.ЖЖЖЖ)" : "Дата (ДД.ММ.ГГГГ)"} value={draft.date ?? ""} onChange={(value) => set("date", value)} placeholder="22.10.2026" pattern="\d{2}\.\d{2}\.\d{4}" />
      </div>
    </details>
    <details className="rounded-2xl border border-slate-200 p-4">
      <summary className="cursor-pointer text-base font-bold text-slate-900">{kk ? "Қолдау, ресурстар және қосымша талаптар" : "Поддержка, ресурсы и дополнительные требования"}</summary>
      <div className="mt-4 space-y-5">
        <TextField label={kk ? "ЕББҚ оқушыға қажетті қолдау" : "Необходимая поддержка ученику с ООП"} multiline value={draft.inclusive_support ?? ""} onChange={(value) => set("inclusive_support", value)} hint={kk ? "Оқу қажеттілігі мен бекітілген қолдауды сипаттаңыз. Диагноз қажет емес." : "Опишите учебную потребность и согласованную поддержку. Диагноз не требуется."} />
        <TextField label={kk ? "Қолжетімді ресурстар" : "Доступные ресурсы"} multiline value={(draft.resources ?? []).join("\n")} onChange={(value) => set("resources", value.split("\n"))} hint={kk ? "Әр ресурсты жаңа жолға жазыңыз; интернеттің бар-жоғын көрсетіңіз." : "Каждый ресурс с новой строки; укажите, есть ли интернет."} />
        <TextField label={kk ? "Қосымша талаптар" : "Дополнительные требования"} multiline value={draft.additional_requirements ?? ""} onChange={(value) => set("additional_requirements", value)} />
        <TextField label={kk ? "Оқулықтағы мәтін немесе тапсырма" : "Текст или задание из учебника"} multiline value={draft.textbook_text ?? ""} onChange={(value) => set("textbook_text", value)} />
        <label className="block text-sm font-semibold text-slate-700">{kk ? "Оқулық беттерінің суреттері" : "Изображения страниц учебника"}<span className="mt-1 block text-xs font-normal leading-5 text-slate-600">{kk ? "Суреттер бет жаңартылғанда сақталмайды. Қайта тіркеу қажет болады." : "Изображения не сохраняются при обновлении страницы. Их нужно прикрепить повторно."}</span><input type="file" accept="image/*" multiple onChange={(event) => void upload(event.target.files)} disabled={uploading || busy} className={`${fieldClass} mt-1.5`} /></label>
        {uploading ? <p role="status" className="text-sm">{kk ? "Суреттер жүктелуде…" : "Загружаем изображения…"}</p> : null}
        {uploadError ? <p role="alert" className="text-sm text-red-700">{uploadError}</p> : null}
        {(draft.textbook_images ?? []).map((image, index) => <div key={index} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-2"><div className="flex items-center gap-3">
          {/* Teacher-selected data URLs are displayed locally without an image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={`${kk ? "Оқулық беті" : "Страница учебника"} ${index + 1}`} width={60} height={80} className="h-20 w-15 rounded-lg object-cover" />
          <span className="text-sm">{kk ? "Оқулық беті" : "Страница учебника"} {index + 1}</span></div><button type="button" className={buttonClass} onClick={() => set("textbook_images", draft.textbook_images?.filter((_, i) => i !== index))}>{kk ? "Жою" : "Удалить"}</button></div>)}
      </div>
    </details>
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p> : null}
    <div className="flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
      <div className="text-sm text-slate-600">{cost != null ? <p>{kk ? "Құны" : "Стоимость"}: <strong className="text-slate-900">{cost} {kk ? "монета" : "монет"}</strong></p> : null}{balance != null ? <p>{kk ? "Балансыңыз" : "Ваш баланс"}: {balance}</p> : null}</div>
      <button type="submit" disabled={busy || uploading} className="min-h-12 w-full rounded-2xl bg-[var(--primary)] px-7 py-3 font-bold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:cursor-wait disabled:opacity-60 sm:w-auto">{busy ? (kk ? "Жіберілуде…" : "Отправляем…") : (kk ? "Ашық сабаққа ҚМЖ жасау" : "Создать КМЖ открытого урока")}</button>
    </div>
  </form>;
}
