"use client";
import { useState, type ReactNode } from "react";
import type { GenerationJob } from "@/lib/api";
import { downloadGenerationMaterial, saveBlob } from "@/lib/generation-download";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { contentLanguageLabel } from "@/lib/content-languages";
import { coachingMarkdown } from "./document";
import { stageLabel } from "./model";
import type { CoachingResult as Result } from "./types";
import { Icon } from "./ui";
import s from "./coaching.module.css";

function List({ items, ordered = false }: { items: string[]; ordered?: boolean }) { return ordered ? <ol>{items.map((item, index) => <li key={index}>{item}</li>)}</ol> : <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul>; }
export default function CoachingResult({ result: r, job, language }: { result: Result; job: GenerationJob; language: "ru" | "kk" }) {
  const t = (ru: string, kk: string) => language === "kk" ? kk : ru;
  const [feedback, setFeedback] = useState(""); const [error, setError] = useState<string | null>(null); const [downloading, setDownloading] = useState(false);
  const part = (title: string, body: ReactNode) => <><h4>{title}</h4>{body}</>;
  const speech = t("Готовые слова коуча", "Коучтың дайын сөзі");
  const action = t("Действия участников", "Қатысушылар әрекеті");
  const sections = [
    { id: "passport", title: t("Паспорт коучинга", "Коучинг паспорты"), content: <>
      {r.assumptions.length > 0 && <div className={s.notice}><strong>{t("Принятые условия", "Қабылданған шарттар")}</strong><List items={r.assumptions} /></div>}
      {part(t("Тема", "Тақырыбы"), <p>{r.topic}</p>)}{part(t("Цель", "Мақсаты"), <p>{r.goal}</p>)}
      {part(t("Задачи", "Міндеттері"), <List items={r.objectives} />)}{part(t("Измеримые результаты", "Өлшенетін нәтижелер"), <List items={r.outcomes} />)}
      {part(t("Ресурсы", "Ресурстар"), <List items={r.materials} />)}{part(t("Подготовка ведущего", "Жүргізушінің дайындығы"), <List items={r.preparation} ordered />)}
    </> },
    { id: "concept", title: t("Основная идея", "Негізгі идея"), content: <><p className={s.tag}>{r.concept.name}</p><p>{r.concept.description}</p>{part(t("Итоговый педагогический продукт", "Соңғы педагогикалық өнім"), <p>{r.concept.final_product}</p>)}{r.national_values.map((x, i) => <div key={i}>{part(x.value, <p>{x.action}</p>)}</div>)}</> },
    { id: "timeline", title: t("Временной план", "Уақыттық жоспар"), content: <><p>{t("Общее время", "Жалпы уақыт")}: <strong>{r.duration_minutes} {t("минут", "минут")}</strong></p><div className={s.tableWrap} tabIndex={0} role="region" aria-label={t("Временной план коучинга", "Коучинг уақыттық жоспары")}><table className={s.table}><thead><tr><th scope="col">{t("Время", "Уақыт")}</th><th scope="col">{t("Этап", "Кезең")}</th><th scope="col">{t("Метод", "Әдіс")}</th><th scope="col">{t("Результат", "Нәтиже")}</th></tr></thead><tbody>{r.stages.map(x => <tr key={x.kind}><td>{x.start_minute}–{x.end_minute}<br />{x.duration_minutes} {t("мин", "мин")}</td><td>{stageLabel(x.kind, language)}</td><td>{x.method}</td><td>{x.expected_result}</td></tr>)}</tbody></table></div></> },
    { id: "scenario", title: t("Полный сценарий", "Толық сценарий"), content: <><p className={s.hint}>{t("Раскройте этап: внутри готовая речь, действия участников и переход к следующему шагу.", "Кезеңді ашыңыз: ішінде дайын сөз, қатысушылар әрекеті және келесі қадамға өту сөзі бар.")}</p>{r.stages.map((x, i) => <details className={s.exercise} key={x.kind} open={i === 0}><summary><span>{i + 1}. {stageLabel(x.kind, language)} · {x.title}</span><small>{x.duration_minutes} {t("мин", "мин")}</small></summary><div className={s.exerciseBody}>
      {part(t("Цель и метод", "Мақсаты мен әдісі"), <><p>{x.purpose}</p><p>{x.method}</p></>)}{x.materials.length > 0 && part(t("Материалы", "Материалдар"), <List items={x.materials} />)}
      {part(speech, <blockquote className={s.quote}>{x.host_script}</blockquote>)}{part(action, <p>{x.participant_action}</p>)}{part(t("Ожидаемый результат", "Күтілетін нәтиже"), <p>{x.expected_result}</p>)}
      {x.kind === "grouping" && <>{part(r.grouping.method, <p>{r.grouping.instructions}</p>)}{r.grouping.groups.map((group, index) => <article className={s.paperCard} key={index}><h4>{group.name}</h4><p>{group.task}</p><p><strong>{t("Результат", "Нәтиже")}:</strong> {group.expected_result}</p></article>)}</>}
      {part(t("Переход к следующему этапу", "Келесі кезеңге өту"), <blockquote className={s.quote}>{x.transition}</blockquote>)}
    </div></details>)}</> },
    { id: "practice", title: t("Практические задания", "Практикалық тапсырмалар"), content: <>{r.practical_tasks.map((x, i) => <details className={s.exercise} key={x.kind} open={i === 0}><summary><span>{i + 1}. {x.title}</span><small>{x.duration_minutes} {t("мин", "мин")}</small></summary><div className={s.exerciseBody}>
      {part(t("Цель", "Мақсаты"), <p>{x.purpose}</p>)}{part(t("Метод", "Әдіс"), <p>{x.method}</p>)}{part(t("Материалы", "Материалдар"), <List items={x.materials} />)}
      {part(t("Пошаговая инструкция", "Қадамдық нұсқаулық"), <List items={x.steps} ordered />)}{part(speech, <blockquote className={s.quote}>{x.host_script}</blockquote>)}{part(action, <p>{x.participant_action}</p>)}
      {part(t("Готовый образец продукта", "Дайын өнім үлгісі"), <div className={s.handout}>{x.product_example}</div>)}{part(t("Критерии оценки", "Бағалау өлшемдері"), <List items={x.criteria} />)}
    </div></details>)}{r.ai_tools.map((x, i) => <article className={s.paperCard} key={i}><h4>{x.name}</h4><p>{x.purpose}</p>{part(t("Готовый промпт", "Дайын промпт"), <blockquote className={s.quote}>{x.prompt}</blockquote>)}{part(t("Критическая проверка", "Сыни тексеру"), <p>{x.critical_check}</p>)}{part(t("Альтернатива без интернета", "Интернетсіз балама"), <p>{x.offline_alternative}</p>)}</article>)}</> },
    { id: "materials", title: t("Наглядные и раздаточные материалы", "Көрнекіліктер мен таратпа материалдар"), content: <>{r.handouts.map((x, i) => <article className={s.paperCard} key={i}><p className={s.tag}>{t("Материал", "Материал")} {i + 1}</p><h4>{x.title}</h4><p>{x.instructions}</p><div className={s.handout}>{x.content}</div></article>)}
      <h4>{t("Содержание слайдов", "Слайдтардың мазмұны")}</h4><p className={s.hint}>{t("Текстовый план для подготовки презентации: текст на экране, визуал и заметки. Отдельный файл презентации не создаётся.", "Презентация дайындауға арналған мәтіндік жоспар: экран мәтіні, визуал және түсіндірме. Жеке презентация файлы жасалмайды.")}</p>
      {r.slides.map(x => <details className={s.exercise} key={x.number}><summary><span>{t("Слайд", "Слайд")} {x.number}. {x.title}</span></summary><div className={s.exerciseBody}>{part(t("Текст на экране", "Экрандағы мәтін"), <blockquote className={s.quote}>{x.on_screen}</blockquote>)}{part(t("Визуал", "Визуал"), <p>{x.visual}</p>)}{part(t("Заметки ведущего", "Жүргізушіге түсіндірме"), <p>{x.speaker_notes}</p>)}{part(action, <p>{x.participant_action}</p>)}</div></details>)}
    </> },
    { id: "reflection", title: t("Рефлексия", "Рефлексия"), content: <><h4>{r.reflection.title}</h4><p>{r.reflection.instructions}</p>{part(speech, <blockquote className={s.quote}>{r.reflection.host_script}</blockquote>)}<List items={r.reflection.questions} /></> },
    { id: "evaluation", title: t("Критерии оценки", "Бағалау өлшемдері"), content: <>{r.evaluation.map((x, i) => <article className={s.paperCard} key={i}><h4>{x.criterion}</h4><p>{x.evidence}</p></article>)}<p className={s.hint}>{t("Планируемая доля активной работы участников", "Қатысушылардың жоспарланған белсенді жұмыс үлесі")}: {r.participant_activity_percent}%</p></> },
    { id: "closing", title: t("Заключение", "Қорытынды"), content: <><blockquote className={s.quote}>{r.closing_script}</blockquote>{r.adaptations.length > 0 && <h4>{t("Адаптации и доступные альтернативы", "Бейімдеу және қолжетімді баламалар")}</h4>}{r.adaptations.map((x, i) => <div key={i}>{part(x.situation, <p>{x.instruction}</p>)}</div>)}</> },
  ];
  async function copy() { setError(null); try { await navigator.clipboard.writeText(coachingMarkdown(r)); setFeedback(t("Весь коучинг скопирован", "Коучинг толық көшірілді")); } catch { setError(t("Не удалось скопировать. Скачайте текстовый файл.", "Көшіру мүмкін болмады. Мәтін файлын жүктеңіз.")); } }
  async function download() { setDownloading(true); setError(null); try { await downloadGenerationMaterial(job); setFeedback(t("Word-файл скачан", "Word файлы жүктелді")); } catch (reason) { setError(teacherFacingErrorMessage(reason, language)); } finally { setDownloading(false); } }
  return <article className={s.result}><header className={s.resultHeader}><p className={s.miniLabel}>SANDUAI COACHING PRO · {t("ВАШ СЦЕНАРИЙ", "СІЗДІҢ СЦЕНАРИЙІҢІЗ")}</p><h2>{r.title}</h2><div className={s.resultMeta}><span>{r.duration_minutes} {t("минут", "минут")}</span><span>{r.participant_count} {t("участников", "қатысушы")}</span><span>{r.group_count} {t("группы", "топ")}</span><span>{r.audience}</span><span>{r.format === "hybrid" ? t("Смешанный", "Аралас") : r.format === "online" ? "Онлайн" : "Офлайн"}</span><span>{contentLanguageLabel(r.language)}</span></div><div className={s.toolbar}><button type="button" className={s.primary} disabled={downloading} onClick={() => void download()}><Icon name="download" />{downloading ? t("Готовим файл…", "Файл дайындалуда…") : t("Скачать Word", "Word жүктеу")}</button><button type="button" className={s.secondary} onClick={() => void copy()}><Icon name="file" />{t("Скопировать всё", "Барлығын көшіру")}</button><button type="button" className={s.secondary} onClick={() => saveBlob(new Blob([coachingMarkdown(r)], { type: "text/markdown;charset=utf-8" }), `${r.title.replace(/[\\/:*?"<>|]/g, " ").slice(0, 80) || "coaching"}.md`)}>{t("Скачать текст", "Мәтін жүктеу")}</button></div><p role="status" className={s.resultFeedback}>{feedback}</p>{error && <div className={s.error} role="alert">{error}</div>}</header>
    <div className={s.resultGrid}><nav className={s.toc} aria-label={t("Содержание коучинга", "Коучинг мазмұны")}>{sections.map((x, i) => <a key={x.id} href={`#coaching-${x.id}`}>{String(i + 1).padStart(2, "0")} · {x.title}</a>)}</nav><div className={s.resultBody}>{sections.map((x, i) => <section id={`coaching-${x.id}`} key={x.id} className={s.resultSection}><h3>{i + 1}. {x.title}</h3>{x.content}</section>)}</div></div>
  </article>;
}
