import type { ReactNode } from "react";
import { Icon as BaseIcon } from "@/features/pedagogical-competitions/ui";
import { barGeometry, EVIDENCE_STATUSES } from "./model";
import type { CheckStatus, Datum, Language, UploadedDocument } from "./types";
import s from "./science-pro.module.css";

export function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    flask: <><path d="M9 3h6m-5 0v7l-6 9a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2l-6-9V3M8 15h8"/><path d="M9 18h.01M14 17h.01"/></>,
    people: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3"/></>,
    layers: <><path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4"/></>,
    chart: <path d="M4 3v18h17M8 16v-4m5 4V6m5 10v-7"/>,
    upload: <path d="M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4"/>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h2m6 0h2m-10 3h2"/></>,
    award: <><circle cx="12" cy="9" r="6"/><path d="m8 14-2 8 6-3 6 3-2-8m-7-5 2 2 4-4"/></>,
    history: <><path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7M12 7v5l3 2"/></>,
  };
  return paths[name] ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg> : <BaseIcon name={name}/>;
}
export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) { return <div className={s.field}><label htmlFor={id}>{label}</label>{children}{hint && <p id={`${id}-hint`} className={s.hint}>{hint}</p>}</div>; }
export function Artwork() {
  return <svg className={s.artwork} viewBox="0 0 300 220" fill="none" aria-hidden="true"><circle cx="158" cy="106" r="87" fill="#e8eedf"/><path d="M29 177c25-45 24-98 76-124 69-34 69 109 161 91" stroke="#c1ccba" strokeDasharray="3 6"/><rect x="66" y="50" width="135" height="148" rx="7" transform="rotate(-9 66 50)" fill="#d8d8be"/><rect x="89" y="28" width="135" height="160" rx="7" transform="rotate(5 89 28)" fill="#fffef6" stroke="#c0ccb9"/><path d="m109 53 79 7m-80 7 53 5" stroke="#acb8a5" strokeWidth="3" strokeLinecap="round"/><path d="M112 145h77m-73-7v-13h15v13m10 0v-25h15v25m10 0V90h15v48" stroke="#32634e" strokeWidth="2"/><path d="m118 111 25-17 22 3 19-23" stroke="#b08551" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="118" cy="111" r="2.5" fill="#b08551"/><circle cx="143" cy="94" r="2.5" fill="#b08551"/><circle cx="165" cy="97" r="2.5" fill="#b08551"/><circle cx="184" cy="74" r="2.5" fill="#b08551"/><circle cx="66" cy="137" r="32" fill="#285c4b"/><path d="M58 120h15m-12 0v15l-9 15a2 2 0 0 0 2 3h27a2 2 0 0 0 2-3l-13-15v-15m-13 22h20" stroke="#fffef6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="236" cy="65" r="23" fill="#d2ddc1"/><path d="m226 65 7 7 13-16" stroke="#39613e" strokeWidth="2" strokeLinecap="round"/><path d="m252 156 3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9Z" fill="#b08551"/><circle cx="49" cy="53" r="4" fill="#b08551"/><path d="M45 205h213" stroke="#d0d9c9"/></svg>;
}
export const STATUS: Record<CheckStatus, [string, string]> = { matches: ["Сәйкес", "Соответствует"], needs_information: ["Нақтылау қажет", "Нужно уточнить"], does_not_match: ["Сәйкес емес", "Не соответствует"], not_provided: ["Ұсынылмаған", "Не предоставлено"], cannot_verify: ["Тексеру мүмкін емес", "Невозможно проверить"] };
export function DocumentInspection({ document, language }: { document: UploadedDocument; language: Language }) {
  const t = (kk: string, ru: string) => language === "kk" ? kk : ru;
  return <details className={s.inspection}><summary>{t("Не оқылды және не тексерілді?", "Что прочитано и проверено?")}</summary>{document.format_checks.map((check, i) => <div key={i}><strong>{check.title}</strong><span className={`${s.status} ${check.status === "matches" ? s.good : check.status === "does_not_match" ? s.bad : s.pending}`}>{STATUS[check.status]?.[language === "kk" ? 0 : 1] ?? check.status}</span><p>{check.detail}</p>{check.location && <p>{check.location}</p>}</div>)}{document.unreadable_pages?.length ? <p>{t("Оқылмаған беттер: ", "Непрочитанные страницы: ")}{document.unreadable_pages.join(", ")}</p> : null}{document.extracted_text && <div><strong>{t("Оқылған мәтіннен үзінді", "Фрагмент прочитанного текста")}</strong><p>{document.extracted_text.slice(0, 1800)}{document.extracted_text.length > 1800 && "…"}</p></div>}<p>{t("Мәтіннің оқылуы ғылыми дұрыстықты немесе ресми бекітуді растамайды. Қаріп, беттеу және қолтаңбалар қолмен тексерілуі мүмкін.", "Прочитанный текст не подтверждает научную достоверность или официальное утверждение. Шрифты, вёрстка и подписи могут требовать ручной проверки.")}</p></details>;
}
export function DataChart({ data, language }: { data: Datum[]; language: Language }) {
  const groups = new Map<string, Datum[]>();
  for (const row of data) { const unit = row.unit ?? ""; groups.set(unit, [...(groups.get(unit) ?? []), row]); }
  return <>{[...groups.entries()].map(([unit, rows]) => <DataSeries key={unit} data={rows} language={language} unit={unit}/>)}</>;
}
function DataSeries({ data, language, unit }: { data: Datum[]; language: Language; unit: string }) {
  const t = (kk: string, ru: string) => language === "kk" ? kk : ru;
  if (!data.length) return null;
  const observed = data.filter(row => !["planned", "needs_verification"].includes(row.status ?? "measured"));
  const max = Math.max(...observed.map(x => Math.abs(x.value)), 1);
  return <figure className={s.chart}><figcaption>{t("Сіз енгізген деректер", "Введённые вами данные")}{unit ? ` · ${unit}` : ` · ${t("бірлік көрсетілмеген", "единица не указана")}`}</figcaption>{observed.length > 0 && <div className={s.chartRows} role="img" aria-label={t("Жолақ диаграмма. Теріс мәндер солға, оң мәндер оңға. Дәл мәндер кестеде берілген.", "Столбчатая диаграмма: отрицательные значения слева, положительные справа. Точные значения в таблице.")}>{observed.slice(0, 30).map((point, i) => <div className={s.chartRow} key={i}><span>{point.label}</span><div className={s.chartTrack}><span style={barGeometry(point.value, max)}/></div><strong>{point.value.toLocaleString(language === "kk" ? "kk-KZ" : "ru-RU")}</strong></div>)}</div>}{observed.length > 30 && <p className={s.hint}>{t("Диаграммада алғашқы 30 жол көрсетілген. Толық деректер кестеде.", "На диаграмме первые 30 строк. Полные данные в таблице.")}</p>}<div className={s.tableWrap}><table><caption>{t("Бастапқы мәндер мен дәлел мәртебелері", "Исходные значения и статусы доказательств")}</caption><thead><tr><th scope="col">{t("Белгі", "Метка")}</th><th scope="col">{t("Мән", "Значение")}</th><th scope="col">{t("Бірлік", "Единица")}</th><th scope="col">{t("Мәртебе", "Статус")}</th></tr></thead><tbody>{data.map((point, i) => <tr key={i}><td>{point.label}</td><td>{point.value}</td><td>{point.unit || "—"}</td><td>{EVIDENCE_STATUSES.find(([id]) => id === (point.status ?? "measured"))?.[language === "kk" ? 1 : 2]}</td></tr>)}</tbody></table></div><p className={s.hint}>{t("Ортадағы сызық — нөл. Өлшем бірліктері бөлек көрсетіледі. Жоспарланған және тексеруді қажет ететін мәндер диаграммаға енгізілмейді. Талдаудың қорытындысын автор дәлелмен тұжырымдайды.", "Линия в центре — ноль. Разные единицы показаны отдельно. Запланированные и требующие проверки значения не включены в диаграмму. Выводы формулирует автор на основании доказательств.")}</p></figure>;
}
