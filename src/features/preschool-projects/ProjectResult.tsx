"use client";
import { useState, type ReactNode } from "react";
import Markdown from "react-markdown";
import type { GenerationJob } from "@/lib/api";
import { contentLanguageLabel } from "@/lib/content-languages";
import { downloadGenerationMaterial, saveBlob } from "@/lib/generation-download";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { AGE_GROUPS, DURATIONS, OUTPUT_MODES, ageYearsLabel } from "./model";
import { projectLabel, projectMarkdown, type DocumentLabel } from "./document";
import type { Experiment, ProjectResult as Result } from "./types";
import { Icon } from "./ui";
import s from "./projects.module.css";

function List({ items, ordered = false }: { items: string[]; ordered?: boolean }) { return !items.length ? null : ordered ? <ol>{items.map((x, i) => <li key={i}>{x}</li>)}</ol> : <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>; }
function Rich({ children }: { children: string }) { return <Markdown components={{ a: ({ href, children: text }) => <a href={href} target="_blank" rel="noopener noreferrer">{text}</a> }}>{children}</Markdown>; }
function Table({ headings, rows, caption }: { headings: string[]; rows: ReactNode[][]; caption?: string }) { return <div className={s.tableWrap} tabIndex={0} role="region" aria-label={caption ?? headings.join(", ")}><table>{caption && <caption>{caption}</caption>}<thead><tr>{headings.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((x, j) => <td key={j}>{x}</td>)}</tr>)}</tbody></table></div>; }
export default function ProjectResult({ result: r, job, language }: { result: Result; job: GenerationJob; language: "ru" | "kk" }) {
  const t = (ru: string, kk: string) => language === "kk" ? kk : ru;
  const l = (key: DocumentLabel) => projectLabel(r.language, key);
  const [feedback, setFeedback] = useState(""); const [error, setError] = useState<string | null>(null); const [downloading, setDownloading] = useState(false);
  const sections: { id: string; title: string; content: ReactNode }[] = [];
  const add = (id: string, title: string, content: ReactNode, visible = true) => { if (visible) sections.push({ id, title, content }); };
  const part = (key: DocumentLabel, content: ReactNode, visible = true) => visible ? <><h4>{l(key)}</h4>{content}</> : null;
  function experiment(x: Experiment, i: number) { return <details key={i} open={i === 0} className={s.experiment}><summary><span>{i + 1}. {x.title}</span><small>{x.duration_minutes} {l("minutes")}</small></summary><div className={s.experimentBody}>
    {part("question", <p>{x.question}</p>)}{part("hypothesis", <p>{x.hypothesis}</p>, Boolean(x.hypothesis))}{part("materials", <List items={x.materials} />)}{part("safety", <div className={s.safePanel}><List items={x.safety} /></div>)}{part("preparation", <p>{x.adult_preparation}</p>)}{part("activity", <p>{x.child_action}</p>)}{part("steps", <List items={x.steps} ordered />)}{part("observation_period", <p>{x.observation_period}</p>)}{part("recording", <p>{x.recording}</p>)}{part("comparison", <p>{x.comparison}</p>)}{part("questions", <List items={x.conclusion_questions} />)}
  </div></details>; }
  add("overview", l("overview"), <>{part("topic", <p>{r.topic}</p>)}{part("goal", <p>{r.goal}</p>)}{part("assumptions", <List items={r.assumptions} />, r.assumptions.length > 0)}</>);
  r.sections.forEach((x, i) => add(`content-${i}`, x.title, <Rich>{x.content}</Rich>));
  add("ideas", l("ideas"), r.ideas.map((x, i) => <div className={s.card} key={i}><h4>{String(i + 1).padStart(2, "0")} · {x.title}</h4><dl><div><dt>{l("question")}</dt><dd>{x.question}</dd></div><div><dt>{l("activity")}</dt><dd>{x.activity}</dd></div><div><dt>{l("product")}</dt><dd>{x.product}</dd></div></dl></div>), r.ideas.length > 0);
  add("calendar", l("calendar"), <Table headings={[l("period"), l("goal"), l("activity"), l("teacher"), l("materials"), l("expected"), l("recording")]} rows={r.calendar.map(x => [<><strong>{x.period}</strong><br /><small>{x.session_minutes} {l("minutes")}</small></>, x.goal, x.child_action, x.teacher_action, x.materials.join(", "), x.expected_result, x.recording])} />, r.calendar.length > 0);
  add("experiments", l("experiments"), r.experiments.map(experiment), r.experiments.length > 0);
  add("diary", l("diary"), <Table caption={l("diary_note")} headings={[l("period"), l("activity"), l("observation"), l("result")]} rows={r.diary.map(x => [x.period, x.activity, x.observation || <span className={s.blankCell} aria-label={t("Заполнить после наблюдения", "Бақылаудан кейін толтыру")} />, x.result || <span className={s.blankCell} aria-label={t("Заполнить после наблюдения", "Бақылаудан кейін толтыру")} />])} />, r.diary.length > 0);
  add("outcomes", l("expected"), <List items={r.expected_results} />, r.expected_results.length > 0);
  add("observations", l("actual"), r.actual_results.length ? <div className={s.quote}><List items={r.actual_results} /></div> : <div className={s.emptyResult}>{l("actual_empty")}</div>, r.output_mode !== "ideas");
  add("artifacts", l("artifacts"), r.artifacts.map((x, i) => <div className={s.card} key={i}><h4>{x.title}</h4><p><strong>{l("instructions")}: </strong>{x.instructions}</p><Rich>{x.content}</Rich></div>), r.artifacts.length > 0);
  add("slides", l("slides"), r.slides.map((x, i) => <details className={s.experiment} open={i === 0} key={x.number}><summary><span>{x.number}. {x.title}</span></summary><div className={s.experimentBody}>{part("screen", <p>{x.on_screen}</p>)}{part("visual", <p>{x.visual}</p>)}{part("photo", <p>{x.photo_placeholder}</p>, Boolean(x.photo_placeholder))}{part("speech", <blockquote className={s.quote}>{x.speaker_notes}</blockquote>)}{part("result", <p>{x.shown_result}</p>)}</div></details>), r.slides.length > 0);
  add("defense", l("defense"), <Rich>{r.defense_script}</Rich>, Boolean(r.defense_script));
  add("evaluation", l("evaluation"), <Table headings={[l("criterion"), l("evidence")]} rows={r.evaluation.map(x => [x.criterion, x.evidence])} />, r.evaluation.length > 0);
  add("development", l("development"), <Table headings={[l("direction"), l("activity")]} rows={r.development.map(x => [x.direction, x.child_action])} />, r.development.length > 0);
  add("values", l("values"), <Table headings={[l("value"), l("activity")]} rows={r.values.map(x => [x.value, x.child_action])} />, r.values.length > 0);
  add("inclusion", l("inclusion"), <List items={r.inclusion} />, r.inclusion.length > 0);
  add("safety", l("safety"), <div className={s.safePanel}><List items={r.safety} /></div>, r.safety.length > 0);
  add("competition", l("competition"), <p>{r.competition_note}</p>, Boolean(r.competition_note));
  add("sources", l("sources"), <><div className={s.notice}>{r.regulatory_note}</div><ul className={s.sourceList}>{r.sources.map((x, i) => <li key={i}><strong>{x.organization}</strong><br />{/^https?:\/\//i.test(x.url) ? <a href={x.url} target="_blank" rel="noopener noreferrer">{x.title}</a> : <span>{x.title}</span>}<small>{l("unverified")}</small></li>)}</ul></>);
  async function copy() { setError(null); try { await navigator.clipboard.writeText(projectMarkdown(r)); setFeedback(t("Весь проект скопирован", "Толық жоба көшірілді")); } catch { setError(t("Не удалось скопировать. Скачайте текстовый файл.", "Көшіру мүмкін болмады. Мәтін файлын жүктеңіз.")); } }
  async function download() { setDownloading(true); setError(null); try { await downloadGenerationMaterial(job); setFeedback(t("Word-файл скачан", "Word файлы жүктелді")); } catch (reason) { setError(teacherFacingErrorMessage(reason, language)); } finally { setDownloading(false); } }
  return <article className={s.result}>
    <header className={s.resultHeader}><p className={s.eyebrow}>{t("ВАШ ПРОЕКТ ГОТОВ", "ЖОБАҢЫЗ ДАЙЫН")} · SANDUAI</p><h2>{r.title}</h2><p>{r.summary}</p><div className={s.resultMeta}><span>{OUTPUT_MODES.find(x => x.id === r.output_mode)?.[language]}</span><span>{AGE_GROUPS.find(x => x.id === r.age_group)?.[language]} · {ageYearsLabel(r.age_years, language)}</span><span>{DURATIONS.find(x => x.id === r.duration)?.[language]}</span><span>{r.participant_count} {t("детей", "бала")}</span><span>{contentLanguageLabel(r.language)}</span><span>{r.project_status === "completed" ? t("Наблюдения завершены", "Бақылау аяқталды") : r.project_status === "in_progress" ? t("Проект в работе", "Жоба өткізілуде") : t("План будущего проекта", "Болашақ жобаның жоспары")}</span></div></header>
    <div className={s.resultActions}><button type="button" className={s.secondary} onClick={() => void download()} disabled={downloading}><Icon name="download" />{downloading ? t("Готовим файл…", "Файл дайындалуда…") : t("Скачать Word", "Word жүктеу")}</button><button type="button" className={s.secondary} onClick={() => void copy()}><Icon name="copy" />{t("Скопировать всё", "Барлығын көшіру")}</button><button type="button" className={s.secondary} onClick={() => saveBlob(new Blob([projectMarkdown(r)], { type: "text/markdown;charset=utf-8" }), `${r.title.replace(/[\\/:*?"<>|]/g, " ").slice(0, 80)}.md`)}><Icon name="file" />{t("Скачать текст", "Мәтін жүктеу")}</button><span className={s.feedback} role="status">{feedback}</span></div>{error && <p className={s.error} role="alert">{error}</p>}
    <div className={s.resultColumns}><nav className={s.toc} aria-label={t("Содержание проекта", "Жоба мазмұны")}><h3>{t("В этом проекте", "Осы жобада")}</h3>{sections.map((x, i) => <a key={x.id} href={`#project-${x.id}`}><span>{String(i + 1).padStart(2, "0")}</span>{x.title}</a>)}</nav><div className={s.resultBody} lang={r.language}>{sections.map((x, i) => <section key={x.id} id={`project-${x.id}`} className={s.resultSection}><h3><span>{String(i + 1).padStart(2, "0")}</span>{x.title}</h3><div className={s.prose}>{x.content}</div></section>)}</div></div>
  </article>;
}
