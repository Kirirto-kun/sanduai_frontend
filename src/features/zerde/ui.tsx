import type { ReactNode } from "react";
import { Icon as BaseIcon } from "@/features/pedagogical-competitions/ui";
import s from "./zerde.module.css";
import type { CheckStatus, Language, UploadedDocument } from "./types";

export function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    flask: <><path d="M9 3h6M10 3v7l-6 9a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2l-6-9V3M8 15h8"/><path d="M9 18h.01M14 17h.01"/></>,
    people: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3"/></>,
    layers: <><path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4"/></>,
    chart: <><path d="M4 3v18h17M8 16v-4m5 4V6m5 10v-7"/></>,
    upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4"/></>,
  };
  return paths[name] ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg> : <BaseIcon name={name} />;
}
export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return <div className={s.field}><label htmlFor={id}>{label}</label>{children}{hint && <p id={`${id}-hint`} className={s.hint}>{hint}</p>}</div>;
}
export function Artwork() {
  return <svg className={s.artwork} viewBox="0 0 300 195" fill="none" aria-hidden="true">
    <path d="M22 154C58 154 40 42 119 39c78-3 45 110 152 77" stroke="#d6ddd5" strokeDasharray="4 6"/>
    <circle cx="156" cy="93" r="78" fill="#edf1e7"/>
    <rect x="65" y="35" width="128" height="142" rx="9" fill="#e3d9c3" transform="rotate(-9 65 35)"/>
    <rect x="85" y="22" width="126" height="148" rx="8" fill="#fffdf5" stroke="#cdd6c8" transform="rotate(5 85 22)"/>
    <path d="m102 47 79 7m-80 7 50 4" stroke="#abb8a8" strokeWidth="3" strokeLinecap="round"/>
    <path d="M110 133h71M116 126v-17h13v17m9 0V91h13v35m9 0V76h13v50" stroke="#467360" strokeWidth="2"/>
    <path d="M116 103c19-11 28-22 49-32" stroke="#bd8952" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="62" cy="119" r="28" fill="#295d4d"/>
    <path d="M55 105h13m-10 0v14l-7 12a2 2 0 0 0 2 3h20a2 2 0 0 0 2-3l-10-12v-14m-8 19h15" stroke="#fffdf5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="218" cy="53" r="21" fill="#d1dcbf"/><path d="m210 53 6 6 10-13" stroke="#375a44" strokeWidth="2" strokeLinecap="round"/>
    <path d="m245 135 3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9Z" fill="#bc8855"/>
    <circle cx="48" cy="49" r="4" fill="#bc8855"/><path d="M55 181h190" stroke="#cdd6c8"/>
  </svg>;
}
export function DocumentInspection({ document, language }: { document: UploadedDocument; language: Language }) {
  const t = (kk: string, ru: string) => language === "kk" ? kk : ru;
  const statuses: Record<CheckStatus, string> = { matches: t("Сәйкес", "Соответствует"), needs_information: t("Толықтыру қажет", "Нужно дополнить"), does_not_match: t("Сәйкес емес", "Не соответствует"), not_provided: t("Ұсынылмаған", "Не предоставлено"), cannot_verify: t("Тексеру мүмкін емес", "Невозможно проверить") };
  return <details className={s.inspection}><summary>{t("Файлдан не тексерілді?", "Что проверено в файле?")}</summary>{document.format_checks.map((check, i) => <div key={i}><strong>{check.id === "pagination" ? t("Беттерді санау", "Количество страниц") : check.id.startsWith("margins_") ? t("Жиектер: сол / оң / жоғары / төмен", "Поля: слева / справа / сверху / снизу") : check.title}</strong><span className={`${s.status} ${check.status === "matches" ? s.good : check.status === "does_not_match" ? s.bad : s.pending}`}>{statuses[check.status]}</span><p>{check.id === "pdf_layout" ? t("Тек бет өлшемі тексерілді. Қаріп, жиектер, қолтаңба және дараланбау қолмен тексеріледі.", "Проверен размер страницы. Шрифт, поля, подписи и обезличивание требуют ручной проверки.") : check.id === "pagination" ? t("DOCX бет саны құжатты көрнекі ашқаннан кейін тексеріледі; сөз санынан болжанбайды.", "Число страниц DOCX проверяется после отображения документа; оно не оценивается по количеству слов.") : check.detail}</p></div>)}{document.extracted_text && <div><strong>{t("Оқылған мәтіннің басы", "Начало прочитанного текста")}</strong><p className={s.preWrap}>{document.extracted_text.slice(0, 1500)}{document.extracted_text.length > 1500 ? "…" : ""}</p></div>}{!document.format_checks.length && <p>{t("Бұл файл түрі үшін рәсімдеу параметрлері автоматты түрде расталмайды.", "Параметры оформления для этого типа файла автоматически не подтверждаются.")}</p>}</details>;
}
