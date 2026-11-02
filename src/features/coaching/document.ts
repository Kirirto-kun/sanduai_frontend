import type { CoachingResult } from "./types";
import { stageLabel } from "./model";
import { documentLabel, documentStageLabel } from "./document-labels";

/** The material's saved language is independent of the interface language. */
export function coachingMarkdown(r: CoachingResult): string {
  const lang = r.language === "kk" ? "kk" : "ru";
  const t = (ru: string, kk: string) => documentLabel(r.language, ru, kk);
  const stageName = (kind: CoachingResult["stages"][number]["kind"]) => documentStageLabel(kind, r.language, stageLabel(kind, lang));
  const lines: string[] = [`# ${r.title}`, "", "SANDUAI COACHING PRO", ""];
  const text = (label: string, value: string | number) => lines.push(`**${label}:** ${value}`, "");
  const list = (label: string, values: string[]) => { if (values.length) lines.push(`### ${label}`, "", ...values.map(x => `- ${x}`), ""); };
  const section = (n: number, title: string) => lines.push(`## ${n}. ${title}`, "");
  const quote = (label: string, value: string) => lines.push(`**${label}**`, "", ...value.split("\n").map(x => `> ${x}`), "");
  const speech = t("Готовые слова коуча", "Коучтың дайын сөзі");
  const action = t("Действия участников", "Қатысушылар әрекеті");
  const outcome = t("Ожидаемый результат", "Күтілетін нәтиже");
  section(1, t("Паспорт коучинга", "Коучинг паспорты"));
  list(t("Принятые условия", "Қабылданған шарттар"), r.assumptions);
  text(t("Тема", "Тақырыбы"), r.topic); text(t("Цель", "Мақсаты"), r.goal);
  text(t("Аудитория", "Қатысушылар санаты"), r.audience); text(t("Участники", "Қатысушылар"), r.participant_count);
  text(t("Группы", "Топтар"), r.group_count); text(t("Длительность, минут", "Ұзақтығы, минут"), r.duration_minutes);
  text(t("Формат", "Формат"), r.format === "hybrid" ? t("Смешанный", "Аралас") : r.format === "online" ? t("Онлайн", "Онлайн") : t("Офлайн", "Офлайн"));
  list(t("Задачи", "Міндеттері"), r.objectives); list(t("Измеримые результаты", "Өлшенетін нәтижелер"), r.outcomes);
  list(t("Ресурсы", "Ресурстар"), r.materials); list(t("Подготовка", "Дайындық"), r.preparation);
  section(2, t("Основная идея", "Негізгі идея")); text(t("Концепция", "Тұжырымдама"), r.concept.name); lines.push(r.concept.description, ""); text(t("Итоговый продукт", "Соңғы өнім"), r.concept.final_product);
  r.national_values.forEach(x => text(x.value, x.action));
  section(3, t("Временной план", "Уақыттық жоспар"));
  const cell = (x: string) => x.replaceAll("|", "\\|").replaceAll("\n", " ");
  lines.push(`| ${t("Время", "Уақыт")} | ${t("Этап", "Кезең")} | ${t("Метод", "Әдіс")} | ${t("Результат", "Нәтиже")} |`, "| --- | --- | --- | --- |");
  r.stages.forEach(x => lines.push(`| ${x.start_minute}–${x.end_minute} (${x.duration_minutes} ${t("мин", "мин")}) | ${stageName(x.kind)} | ${cell(x.method)} | ${cell(x.expected_result)} |`));
  lines.push(""); text(t("Общее время, минут", "Жалпы уақыт, минут"), r.duration_minutes);
  section(4, t("Полный сценарий", "Толық сценарий"));
  r.stages.forEach((x, i) => {
    lines.push(`### ${i + 1}. ${stageName(x.kind)} · ${x.title}`, "");
    text(t("Время, минут", "Уақыты, минут"), x.duration_minutes); text(t("Метод", "Әдіс"), x.method); text(t("Цель", "Мақсаты"), x.purpose); list(t("Материалы", "Материалдар"), x.materials);
    quote(speech, x.host_script); text(action, x.participant_action); text(outcome, x.expected_result); quote(t("Переход к следующему этапу", "Келесі кезеңге өту"), x.transition);
    if (x.kind === "grouping") { text(t("Способ деления", "Топқа бөлу әдісі"), r.grouping.method); lines.push(r.grouping.instructions, ""); r.grouping.groups.forEach(group => { text(group.name, group.task); text(outcome, group.expected_result); }); }
  });
  section(5, t("Практические задания", "Практикалық тапсырмалар"));
  r.practical_tasks.forEach((x, i) => {
    lines.push(`### ${i + 1}. ${x.title}`, ""); text(t("Время, минут", "Уақыты, минут"), x.duration_minutes); text(t("Метод", "Әдіс"), x.method); text(t("Цель", "Мақсаты"), x.purpose);
    list(t("Материалы", "Материалдар"), x.materials); list(t("Пошаговая инструкция", "Қадамдық нұсқаулық"), x.steps); quote(speech, x.host_script); text(action, x.participant_action); text(t("Готовый образец продукта", "Дайын өнім үлгісі"), x.product_example); list(t("Критерии оценки", "Бағалау өлшемдері"), x.criteria);
  });
  r.ai_tools.forEach(x => { lines.push(`### ${x.name}`, ""); text(t("Для чего", "Мақсаты"), x.purpose); quote(t("Промпт", "Промпт"), x.prompt); text(t("Критическая проверка", "Сыни тексеру"), x.critical_check); text(t("Офлайн-альтернатива", "Офлайн балама"), x.offline_alternative); });
  section(6, t("Наглядные и раздаточные материалы", "Көрнекіліктер мен таратпа материалдар"));
  r.handouts.forEach(x => { lines.push(`### ${x.title}`, "", x.instructions, "", x.content, ""); });
  lines.push(`### ${t("Содержание слайдов — текстовый план", "Слайд мазмұны — мәтіндік жоспар")}`, "");
  r.slides.forEach(x => { lines.push(`#### ${x.number}. ${x.title}`, ""); quote(t("Текст на экране", "Экрандағы мәтін"), x.on_screen); text(t("Визуал", "Визуал"), x.visual); text(t("Заметки ведущего", "Жүргізушіге түсіндірме"), x.speaker_notes); text(action, x.participant_action); });
  section(7, t("Рефлексия", "Рефлексия")); lines.push(`### ${r.reflection.title}`, "", r.reflection.instructions, ""); quote(speech, r.reflection.host_script); list(t("Вопросы", "Сұрақтар"), r.reflection.questions);
  section(8, t("Критерии оценки", "Бағалау өлшемдері")); r.evaluation.forEach(x => text(x.criterion, x.evidence));
  section(9, t("Заключение", "Қорытынды")); quote(speech, r.closing_script);
  if (r.adaptations.length) lines.push(`### ${t("Адаптации и доступные альтернативы", "Бейімдеу және қолжетімді баламалар")}`, "");
  r.adaptations.forEach(x => text(x.situation, x.instruction));
  return lines.join("\n");
}
