"use client";
import { useState, type ReactNode } from "react";
import { downloadGenerationMaterial, saveBlob } from "@/lib/generation-download";
import type { GenerationJob } from "@/lib/api";
import { contentLanguageLabel } from "@/lib/content-languages";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { EVENTS, MODES } from "./model";
import { trainingMarkdown } from "./document";
import type { Exercise, TrainingResult as Result } from "./types";
import { Icon } from "./ui";
import s from "./trainings.module.css";

function List({ items, ordered = false }: { items: string[]; ordered?: boolean }) { if (!items?.length) return null; return ordered ? <ol>{items.map((x, i) => <li key={i}>{x}</li>)}</ol> : <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>; }
export default function TrainingResult({ result: r, job, language }: { result: Result; job: GenerationJob; language: "ru" | "kk" }) {
  const t = (ru: string, kk: string) => language === "kk" ? kk : ru;
  const [feedback, setFeedback] = useState(""); const [error, setError] = useState<string | null>(null); const [downloading, setDownloading] = useState(false);
  const sections: { id: string; title: string; content: ReactNode }[] = [];
  const add = (id: string, title: string, content: ReactNode, visible = true) => { if (visible) sections.push({ id, title, content }); };
  const part = (title: string, body: ReactNode, visible = true) => visible ? <><h4>{title}</h4>{body}</> : null;
  function exercise(x: Exercise, key: string, index: number) { return <details key={key} className={s.exercise} open={index === 0}><summary><span>{index + 1}. {x.title}</span><small>{x.duration_minutes} {t("мин", "мин")}</small></summary><div className={s.exerciseBody}>
    {part(t("Цель", "Мақсаты"), <p>{x.purpose}</p>)}
    {part(t("Время и материалы", "Уақыт пен материалдар"), <><p>{x.duration_minutes} {t("минут", "минут")}</p><List items={x.materials} /></>)}
    {part(t("Организация", "Ұйымдастыру"), <p>{x.organization}</p>)}
    {part(t("Готовые слова ведущего", "Жүргізушінің дайын сөзі"), <blockquote className={s.quote}>{x.host_script}</blockquote>)}
    {part(t("Инструкция участникам", "Қатысушыларға нұсқаулық"), <p>{x.instructions}</p>)}
    {part(t("Пошаговые действия", "Қадамдық әрекеттер"), <List items={x.steps} ordered />)}
    {part(t("Правила", "Ережелер"), <List items={x.rules} />)}
    {part(t("Готовые задания", "Дайын тапсырмалар"), <List items={x.tasks} ordered />)}
    {part(t("Обсуждение", "Талқылау"), <List items={x.questions} />)}
    {part(t("Примеры ответов", "Жауап мысалдары"), <List items={x.example_answers} />, x.example_answers.length > 0)}
    {part(t("Ожидаемый результат", "Күтілетін нәтиже"), <p>{x.expected_result}</p>)}
    {part(t("Переход к следующему этапу", "Келесі кезеңге өту"), <blockquote className={s.quote}>{x.transition}</blockquote>)}
    {part(t("Доступная альтернатива", "Қолжетімді балама"), <p>{x.accessibility_alternative}</p>)}
  </div></details>; }
  add("passport", t("Паспорт встречи", "Іс-шара паспорты"), <>
    {part(t("Тема", "Тақырыбы"), <p>{r.topic}</p>)}
    {part(t("Формат проведения", "Өткізу форматы"), <p>{r.format === "online" ? t("Онлайн", "Онлайн") : r.format === "hybrid" ? t("Смешанный", "Аралас") : t("Офлайн", "Офлайн")}</p>)}
    {part(t("Цель", "Мақсаты"), <p>{r.goal}</p>)}{part(t("Задачи", "Міндеттері"), <List items={r.objectives} />, r.objectives.length > 0)}
    {part(t("Измеримые результаты", "Өлшенетін нәтижелер"), <List items={r.outcomes} />, r.outcomes.length > 0)}
    {part(t("Принятые условия", "Қабылданған шарттар"), <List items={r.assumptions} />, r.assumptions.length > 0)}
    {part(t("Методы", "Әдіс-тәсілдер"), <List items={r.methods} />, r.methods.length > 0)}
  </>);
  add("concept", t("Единая концепция", "Ерекше концепция"), <><p className={s.tag}>{r.concept.name}</p><p>{r.concept.rationale}</p>{part(t("Итоговый продукт", "Соңғы өнім"), <p>{r.concept.final_product}</p>)}</>);
  add("ideas", t("Идеи для вашей встречи", "Кездесуге арналған идеялар"), r.ideas.map((x, i) => <article key={i} className={s.paperCard}><p className={s.tag}>{String(i + 1).padStart(2, "0")}</p><h4>{x.title}</h4><p>{x.goal}</p>{part(t("Как это работает", "Қалай өткізіледі"), <p>{x.mechanic}</p>)}{part(t("Результат", "Нәтиже"), <p>{x.expected_result}</p>)}</article>), r.ideas.length > 0);
  add("prepare", t("Подготовка ведущего", "Жүргізушінің дайындығы"), <>{part(t("Материалы и оборудование", "Материалдар мен құралдар"), <List items={r.materials} />)}<List items={r.preparation} ordered />{part(t("Как организовать группы", "Топтарды ұйымдастыру"), <p>{r.grouping}</p>, Boolean(r.grouping))}</>, r.preparation.length > 0 || r.materials.length > 0);
  add("timeline", t("План по минутам", "Минут сайынғы жоспар"), <><p className="mb-4">{t("Общая продолжительность", "Жалпы ұзақтығы")}: <strong>{r.duration_minutes} {t("минут", "минут")}</strong></p><div className={s.timeline}>{r.stages.map(x => <article className={s.timelineRow} key={x.id}><div className={s.timelineTime}>{x.start_minute}–{x.end_minute}</div><div><h4>{x.title}</h4><p><strong>{t("Ведущий", "Жүргізуші")}:</strong> {x.host_script}</p><p><strong>{t("Участники", "Қатысушылар")}:</strong> {x.instructions}</p><p><strong>{t("Результат", "Нәтиже")}:</strong> {x.expected_result}</p></div></article>)}</div></>, r.stages.length > 0);
  add("scenario", t("Полный сценарий", "Толық сценарий"), <><p className={s.hint}>{t("Раскройте этап: внутри готовые реплики, задания и инструкции.", "Кезеңді ашыңыз: ішінде дайын сөздер, тапсырмалар мен нұсқаулықтар бар.")}</p>{r.stages.map((x, i) => exercise(x, x.id, i))}</>, r.stages.length > 0);
  add("games", t("Игры и интерактивы", "Ойындар мен интерактивтер"), <><p className={s.hint}>{t("Это подборка для выбора. Включите в одну встречу столько упражнений, сколько укладывается в её длительность, оставив время для вступления и рефлексии.", "Бұл — таңдауға арналған жинақ. Кіріспе мен рефлексияға уақыт қалдырып, кездесу ұзақтығына сай жаттығуларды таңдаңыз.")}</p>{r.games.map((x, i) => exercise(x, String(i), i))}</>, r.games.length > 0);
  add("outcome", t("От опыта к действию", "Тәжірибеден әрекетке"), <><p>{r.practical_result}</p>{r.reflection && <>{part(r.reflection.title, <><p>{r.reflection.instructions}</p><blockquote className={s.quote}>{r.reflection.host_script}</blockquote><List items={r.reflection.questions} /></>)}</>}{part(t("Заключительное слово", "Қорытынды сөз"), <blockquote className={s.quote}>{r.closing_script}</blockquote>, Boolean(r.closing_script))}</>, Boolean(r.practical_result || r.reflection || r.closing_script));
  add("handouts", t("Раздаточные материалы", "Үлестірме материалдар"), r.handouts.map((x, i) => <article key={i} className={s.paperCard}><p className={s.tag}>{t("Карточка", "Карточка")} {i + 1}</p><h4>{x.title}</h4><p>{x.instructions}</p><div className={s.handout}>{x.content}</div></article>), r.handouts.length > 0);
  add("slides", t("План презентации", "Презентация жоспары"), <><p className={s.hint}>{t("План слайдов для подготовки презентации. Это текстовый материал.", "Презентация дайындауға арналған слайд жоспары. Бұл — мәтіндік материал.")}</p>{r.slides.map(x => <article className={s.paperCard} key={x.number}><p className={s.tag}>{t("Слайд", "Слайд")} {x.number}</p><h4>{x.title}</h4><blockquote className={s.quote}>{x.on_screen}</blockquote>{part(t("Визуал", "Визуал"), <p>{x.visual}</p>)}{part(t("Ведущему", "Жүргізушіге"), <p>{x.speaker_notes}</p>)}{part(t("Действие участника", "Қатысушының әрекеті"), <p>{x.participant_action}</p>)}</article>)}</>, r.slides.length > 0);
  add("evaluation", t("Оценка и обратная связь", "Бағалау және кері байланыс"), <>{r.evaluation.map((x, i) => <div key={i}>{part(x.criterion, <p>{x.evidence}</p>)}</div>)}{part(t("Вопросы обратной связи", "Кері байланыс сұрақтары"), <List items={r.feedback_questions} />, r.feedback_questions.length > 0)}</>, r.evaluation.length > 0 || r.feedback_questions.length > 0);
  add("adaptations", t("Адаптации и альтернативы", "Бейімдеу мен баламалар"), r.adaptations.map((x, i) => <div key={i}>{part(x.situation, <p>{x.instruction}</p>)}</div>), r.adaptations.length > 0);
  add("ai", t("Практика с ИИ", "ЖИ практикасы"), r.ai_prompts.map((x, i) => <article key={i} className={s.paperCard}><h4>{x.title}</h4><blockquote className={s.quote}>{x.prompt}</blockquote>{part(t("Критическая проверка", "Сыни тексеру"), <p>{x.critical_check}</p>)}</article>), r.ai_prompts.length > 0);
  add("safety", t("Безопасное участие", "Қауіпсіз қатысу"), <><List items={r.safety_principles} /><p className={s.hint}>{r.safety_note}</p></>);
  async function copy() { setError(null); try { await navigator.clipboard.writeText(trainingMarkdown(r)); setFeedback(t("Весь материал скопирован", "Толық материал көшірілді")); } catch { setError(t("Не удалось скопировать. Скачайте текстовый файл.", "Көшіру мүмкін болмады. Мәтін файлын жүктеңіз.")); } }
  async function download() { setDownloading(true); setError(null); try { await downloadGenerationMaterial(job); setFeedback(t("Word-файл скачан", "Word файлы жүктелді")); } catch (e) { setError(teacherFacingErrorMessage(e, language)); } finally { setDownloading(false); } }
  return <article className={s.result}>
    <header className={s.resultHeader}><p className={s.miniLabel}>{t("ГОТОВО К ПРОВЕДЕНИЮ", "ӨТКІЗУГЕ ДАЙЫН")} · SANDUAI</p><h2>{r.title}</h2><div className={s.resultMeta}><span>{MODES.find(x => x.id === r.output_mode)?.[language]}</span><span>{EVENTS.find(x => x.id === r.event_type)?.[language]}</span><span>{r.duration_minutes} {t("мин", "мин")}</span><span>{r.participant_count} {t("участников", "қатысушы")}</span><span>{r.audience}</span><span>{contentLanguageLabel(r.language)}</span></div><div className={s.toolbar}><button type="button" className={s.primary} onClick={() => void download()} disabled={downloading}><Icon name="download" />{downloading ? t("Готовим файл…", "Файл дайындалуда…") : t("Скачать Word", "Word жүктеу")}</button><button type="button" className={s.secondary} onClick={() => void copy()}><Icon name="file" />{t("Скопировать всё", "Барлығын көшіру")}</button><button type="button" className={s.secondary} onClick={() => saveBlob(new Blob([trainingMarkdown(r)], { type: "text/markdown;charset=utf-8" }), `${r.title.replace(/[\\/:*?"<>|]/g, " ").slice(0, 80)}.md`)}>{t("Скачать текст", "Мәтін жүктеу")}</button></div><p className={s.resultFeedback} role="status">{feedback}</p>{error && <p role="alert" className={s.error}>{error}</p>}</header>
    <div className={s.resultGrid}><nav className={s.toc} aria-label={t("Содержание материала", "Материал мазмұны")}>{sections.map(x => <a key={x.id} href={`#training-${x.id}`}>{x.title}</a>)}</nav><div className={s.resultBody}>{sections.map(x => <section key={x.id} id={`training-${x.id}`} className={s.resultSection}><h3>{x.title}</h3>{x.content}</section>)}</div></div>
  </article>;
}
