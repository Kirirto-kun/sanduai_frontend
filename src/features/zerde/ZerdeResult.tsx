"use client";
import { useEffect, useRef, useState } from "react";
import { currentSessionUserId } from "@/hooks/useTokens";
import { zerdeApi } from "./api";
import { barGeometry, MODE_TEMPLATE, MODES } from "./model";
import { Icon } from "./ui";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import type { Assessment, CheckStatus, Language, Template, ZerdeRequest } from "./types";
import s from "./zerde.module.css";

const STATUS: Record<CheckStatus, [string, string]> = { matches: ["Сәйкес", "Соответствует"], needs_information: ["Толықтыру қажет", "Нужно дополнить"], does_not_match: ["Сәйкес емес", "Не соответствует"], not_provided: ["Құжат ұсынылмаған", "Не предоставлено"], cannot_verify: ["Тексеру мүмкін емес", "Невозможно проверить"] };
const TEMPLATES: [Template, string, string][] = [["structure", "Жұмыс құрылымы", "Структура работы"], ["plan", "Зерттеу жоспары", "План исследования"], ["diary", "Зерттеу күнделігі", "Дневник исследования"], ["contribution", "Авторлық үлес парағы", "Лист вклада авторов"], ["ai_declaration", "ЖИ декларациясы", "Декларация ИИ"], ["ethics", "Этика және қауіпсіздік", "Этика и безопасность"], ["antiplagiarism", "Антиплагиат үлгісі", "Шаблон антиплагиата"], ["stand", "Көрме стенді", "Выставочный стенд"]];

export function DataChart({ data, language }: { data: ZerdeRequest["data"]; language: Language }) {
  const max = Math.max(...data.map(x => Math.abs(x.value)), 1);
  const t = (kk: string, ru: string) => language === "kk" ? kk : ru;
  if (!data.length) return null;
  return <figure className={s.chart}><figcaption>{t("Сіз енгізген деректер", "Введённые вами данные")}</figcaption><div role="img" aria-label={t("Деректердің жолақ диаграммасы. Нақты мәндер төмендегі кестеде.", "Столбчатая диаграмма. Точные значения приведены в таблице ниже.")}>{data.map((point, i) => <div key={i} className={s.chartRow}><span>{point.label}</span><div className={s.chartTrack}><span style={barGeometry(point.value, max)} /></div><strong>{point.value.toLocaleString(language === "kk" ? "kk-KZ" : "ru-RU")}</strong></div>)}</div><div className={s.tableWrap}><table><caption>{t("Бастапқы мәндер өзгертілген жоқ", "Исходные значения сохранены без изменений")}</caption><thead><tr><th>{t("Белгі", "Метка")}</th><th>{t("Мән", "Значение")}</th></tr></thead><tbody>{data.map((point, i) => <tr key={i}><td>{point.label}</td><td>{point.value}</td></tr>)}</tbody></table></div><p className={s.hint}>{t("Ортаңғы сызық — нөл. Теріс мәндер солға, оң мәндер оңға бағытталған. Түсіндірмені автор өзі жазады.", "Центральная линия — ноль. Отрицательные значения направлены влево, положительные — вправо. Интерпретацию пишет автор.")}</p></figure>;
}

export default function ZerdeResult({ result, request, language, projectId, userId, onEdit }: { result: Assessment; request: ZerdeRequest; language: Language; projectId: string | null; userId: string; onEdit: () => void }) {
  const t = (kk: string, ru: string) => language === "kk" ? kk : ru;
  const [template, setTemplate] = useState<Template>(MODE_TEMPLATE[request.mode]); const [audience, setAudience] = useState<"jury" | "administrative">("jury");
  const [exporting, setExporting] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const needsAttention = result.checks.filter(c => c.status !== "matches").length;
  async function download(format: "docx" | "pdf") {
    if (exporting) return; setExporting(format); setError(null);
    try {
      const blob = await zerdeApi.export({ ...request, language }, template, format, audience, projectId ?? undefined);
      if (!alive.current || currentSessionUserId() !== userId) return;
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `zerde-${template}-${audience}.${format}`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) { setError(teacherFacingErrorMessage(reason, language)); } finally { setExporting(null); }
  }
  return <div className={s.result}>
    <section className={s.resultHero}><div><p className={s.eyebrow}>{t("Келесі қадамға дайынсыз", "К следующему шагу")}</p><h2>{result.title}</h2><p>{t("Әдістемелік тексеріс. Ресми қазылар бағасы немесе қатысуға рұқсат емес.", "Методическая проверка. Результат не является оценкой жюри или допуском к участию.")}</p></div><div className={s.resultCount}><strong>{needsAttention}</strong><span>{t("назар аударатын тармақ", "пунктов требуют внимания")}</span></div></section>
    {result.provenance?.notice && <p className={s.sourceNote}><Icon name="book" />{result.provenance.notice}</p>}
    {!!result.provenance?.source_notes?.length && <details className={s.sourceConflicts}><summary>{t("Ресми құжаттағы нақтылауды қажет ететін тұстар", "Уточнения и несоответствия в официальном документе")}</summary><ul>{result.provenance.source_notes.map((note, i) => <li key={i}>{note}</li>)}</ul><a href={language === "kk" ? "https://daryn.kz/pol514/Zerdekz.pdf" : "https://daryn.kz/pol514/Zerderu.pdf"} target="_blank" rel="noopener noreferrer">{t("Ресми ереже (PDF)", "Официальные правила (PDF)")}</a></details>}
    <div className={s.resultColumns}><div>
      {request.mode === "visualization" && <DataChart data={request.data} language={language} />}
      {result.sections.map(section => <section key={section.id} className={s.resultSection}><h3>{section.title}</h3>{section.body && <p className={s.preWrap}>{section.body}</p>}{section.questions?.length > 0 && <ul className={s.questions}>{section.questions.map((q, i) => <li key={i}>{q}</li>)}</ul>}{section.table && <div className={s.tableWrap}><table><thead><tr>{section.table.columns.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr></thead><tbody>{section.table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell || "—"}</td>)}</tr>)}</tbody></table></div>}</section>)}
      {result.checks.length > 0 && <section className={s.resultSection}><h3>{t("Тексеру парағы", "Лист проверки")}</h3><div className={s.checks}>{result.checks.map((check, i) => <article key={`${check.id}-${i}`} className={s.checkItem}><span className={`${s.status} ${check.status === "matches" ? s.good : check.status === "does_not_match" ? s.bad : s.pending}`}>{STATUS[check.status]?.[language === "kk" ? 0 : 1] ?? check.status}</span><h4>{check.title}</h4><p>{check.detail}</p>{(check.location || check.reference) && <small>{[check.location, check.reference].filter(Boolean).join(" · ")}</small>}</article>)}</div></section>}
    </div><aside className={s.resultAside}>
      <section className={s.nextSteps}><div className={s.asideHeading}><Icon name="arrow" /><h3>{t("Автордың келесі қадамы", "Следующие шаги автора")}</h3></div><ol>{result.next_steps.map((step, i) => <li key={i}>{step}</li>)}</ol><button className={s.secondary} type="button" onClick={onEdit}><Icon name="edit" />{t("Материалды толықтыру", "Дополнить материалы")}</button></section>
      <section className={s.exportBox}><div className={s.asideHeading}><Icon name="download" /><h3>{t("Толтыруға арналған үлгілер", "Шаблоны для заполнения")}</h3></div><p className={s.hint}>{t("Бос үлгі — орындалған жұмыс емес. Нақты деректер мен қорытындыны автор өзі енгізеді.", "Пустой шаблон не означает выполненное исследование. Данные и выводы вносит автор.")}</p><label htmlFor="zerde-template">{t("Құжат", "Документ")}</label><select id="zerde-template" value={template} onChange={e => setTemplate(e.target.value as Template)}>{TEMPLATES.map(([id, kk, ru]) => <option key={id} value={id}>{t(kk, ru)}</option>)}</select><label htmlFor="zerde-audience">{t("Нұсқа", "Версия")}</label><select id="zerde-audience" value={audience} onChange={e => setAudience(e.target.value as typeof audience)}><option value="jury">{t("Қазыларға · дараланбаған", "Для жюри · обезличенная")}</option><option value="administrative">{t("Ұйымдастырушыға · әкімшілік", "Для организатора · административная")}</option></select><div className={s.exportActions}>{(["docx", "pdf"] as const).map(format => <button type="button" key={format} className={s.secondary} disabled={!!exporting} onClick={() => void download(format)}><Icon name="download" />{exporting === format ? t("Дайындалуда…", "Подготовка…") : format.toUpperCase()}</button>)}</div>{error && <p role="alert" className={s.error}>{error}</p>}<small className={s.hint}>{t("A4 · Times New Roman 14 · 1,5 интервал", "A4 · Times New Roman 14 · интервал 1,5")}</small></section>
      <p className={s.principle}>{t("Оқушы зерттейді — SanduAI бағыт береді!", "Ученик исследует — SanduAI направляет!")}</p>
      <p className={s.hint}>{MODES.find(m => m.id === result.mode)?.[language === "kk" ? "kk" : "ru"]}</p>
    </aside></div>
  </div>;
}
