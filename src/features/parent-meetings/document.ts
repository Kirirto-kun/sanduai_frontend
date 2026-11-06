import type { ContentLanguage } from "@/lib/content-languages";
import type { MeetingResult, StageKind } from "./types";

const words = {
  passport: ["Паспорт собрания", "Жиналыс паспорты", "Meeting overview", "Жыйын паспорту", "Yig‘ilish ma’lumotlari"],
  concept: ["Особая идея встречи", "Жиналыстың ерекше идеясы", "Creative meeting concept", "Жыйындын өзгөчө идеясы", "Yig‘ilishning o‘ziga xos g‘oyasi"],
  timeline: ["Временной план", "Уақыттық жоспар", "Timing plan", "Убакыт планы", "Vaqt rejasi"],
  scenario: ["Полный сценарий", "Толық сценарий", "Complete scenario", "Толук сценарий", "To‘liq ssenariy"],
  training: ["Психологический тренинг", "Психологиялық тренинг", "Psychological training", "Психологиялык тренинг", "Psixologik trening"],
  tasks: ["Интерактивные задания", "Интерактивті тапсырмалар", "Interactive tasks", "Интерактивдүү тапшырмалар", "Interaktiv topshiriqlar"],
  materials: ["Дополнительные материалы", "Қосымша материалдар", "Supporting materials", "Кошумча материалдар", "Qo‘shimcha materiallar"],
  reflection: ["Рефлексия", "Рефлексия", "Reflection", "Рефлексия", "Refleksiya"],
  closing: ["Заключительное слово", "Қорытынды сөз", "Closing speech", "Жыйынтык сөз", "Yakuniy so‘z"],
  protocol: ["Шаблон протокола", "Хаттама үлгісі", "Minutes template", "Протоколдун үлгүсү", "Bayonnoma namunasi"],
  topic: ["Тема", "Тақырыбы", "Topic", "Темасы", "Mavzu"], goal: ["Цель", "Мақсаты", "Goal", "Максаты", "Maqsad"],
  class: ["Класс или группа", "Сынып немесе топ", "Class or group", "Класс же топ", "Sinf yoki guruh"],
  institution: ["Организация", "Ұйым", "Institution", "Уюм", "Tashkilot"],
  duration: ["Длительность, минут", "Ұзақтығы, минут", "Duration, minutes", "Узактыгы, мүнөт", "Davomiyligi, daqiqa"],
  parents: ["Количество родителей", "Ата-аналар саны", "Number of parents", "Ата-энелердин саны", "Ota-onalar soni"],
  delivery: ["Условия проведения", "Өткізу тәсілі", "Delivery format", "Өткөрүү форматы", "O‘tkazish shakli"],
  format: ["Формат собрания", "Жиналыс форматы", "Meeting format", "Жыйындын форматы", "Yig‘ilish formati"],
  assumptions: ["Принятые условия и допущения", "Қабылданған шарттар мен болжамдар", "Accepted conditions and assumptions", "Кабыл алынган шарттар жана божомолдор", "Qabul qilingan shartlar va taxminlar"],
  objectives: ["Задачи", "Міндеттері", "Objectives", "Милдеттер", "Vazifalar"],
  outcomes: ["Ожидаемые результаты", "Күтілетін нәтижелер", "Expected outcomes", "Күтүлгөн натыйжалар", "Kutilgan natijalar"],
  resources: ["Материалы", "Материалдар", "Materials", "Материалдар", "Materiallar"],
  preparation: ["Подготовка", "Дайындық", "Preparation", "Даярдык", "Tayyorgarlik"],
  product: ["Практический результат", "Практикалық нәтиже", "Practical result", "Практикалык натыйжа", "Amaliy natija"],
  time: ["Время", "Уақыт", "Time", "Убакыт", "Vaqt"], method: ["Метод", "Әдіс", "Method", "Ыкма", "Usul"],
  stage: ["Этап", "Кезең", "Stage", "Этап", "Bosqich"],
  speech: ["Готовые слова ведущего", "Жүргізушінің дайын сөзі", "Ready facilitator speech", "Алып баруучунун даяр сөзү", "Boshlovchining tayyor so‘zlari"],
  action: ["Действия родителей", "Ата-аналардың әрекеті", "Parent actions", "Ата-энелердин аракеттери", "Ota-onalar harakatlari"],
  instructions: ["Инструкция", "Нұсқаулық", "Instructions", "Нускама", "Ko‘rsatma"],
  transition: ["Переход к следующему этапу", "Келесі кезеңге өту", "Transition to the next stage", "Кийинки этапка өтүү", "Keyingi bosqichga o‘tish"],
  case: ["Жизненная ситуация — вымышленный пример", "Өмірлік жағдаят — ойдан алынған мысал", "Fictional family case", "Турмуштук кырдаал — ойдон алынган мисал", "Hayotiy vaziyat — to‘qima misol"],
  steps: ["Порядок действий", "Орындалу қадамдары", "Steps", "Аткаруу кадамдары", "Bajarish bosqichlari"],
  example: ["Готовый образец", "Дайын үлгі", "Worked example", "Даяр үлгү", "Tayyor namuna"],
  invitation: ["Приглашение для родителей", "Ата-аналарға шақыру", "Parent invitation", "Ата-энелерге чакыруу", "Ota-onalar uchun taklifnoma"],
  date: ["Дата", "Күні", "Date", "Күнү", "Sana"], clock: ["Время начала", "Басталу уақыты", "Start time", "Башталуу убактысы", "Boshlanish vaqti"],
  venue: ["Место", "Өтетін орны", "Venue", "Өткөрүлүүчү жер", "Manzil"],
  slides: ["План презентации — текстовые материалы", "Презентация жоспары — мәтіндік материалдар", "Presentation plan — text content", "Презентация планы — тексттик материалдар", "Taqdimot rejasi — matnli materiallar"],
  screen: ["Текст слайда", "Слайд мәтіні", "Slide text", "Слайд тексти", "Slayd matni"],
  visual: ["Рекомендуемый визуал", "Ұсынылатын көрнекілік", "Suggested visual", "Сунушталган көрүнүш", "Tavsiya etilgan ko‘rgazma"],
  cards: ["Карточки тренинга", "Тренинг карточкалары", "Training cards", "Тренинг карточкалары", "Trening kartochkalari"],
  survey: ["Родительская анкета", "Ата-аналар сауалнамасы", "Parent questionnaire", "Ата-энелердин анкетасы", "Ota-onalar so‘rovnomasi"],
  anonymous: ["Анонимно", "Анонимді", "Anonymous", "Анонимдүү", "Anonim"],
  worksheets: ["Рабочие листы", "Жұмыс парақтары", "Worksheets", "Жумуш барактары", "Ish varaqlari"],
  question: ["Вопрос для вывода", "Қорытынды сұрақ", "Conclusion question", "Жыйынтык суроо", "Yakuniy savol"],
  reflectionSheet: ["Лист рефлексии", "Рефлексия парағы", "Reflection sheet", "Рефлексия барагы", "Refleksiya varag‘i"],
  recommendations: ["Рекомендации родителям", "Ата-аналарға ұсыныстар", "Recommendations for parents", "Ата-энелерге сунуштар", "Ota-onalar uchun tavsiyalar"],
  tools: ["Цифровые инструменты", "Цифрлық құралдар", "Digital tools", "Санарип куралдар", "Raqamli vositalar"],
  prompt: ["Готовый промпт", "Дайын промпт", "Ready prompt", "Даяр промпт", "Tayyor so‘rov"],
  offline: ["Альтернатива без интернета", "Интернетсіз балама", "Offline alternative", "Интернетсиз альтернатива", "Internetsiz muqobil"],
  safety: ["Бережное участие и конфиденциальность", "Қауіпсіз қатысу және құпиялық", "Safe participation and privacy", "Коопсуз катышуу жана купуялуулук", "Xavfsiz ishtirok va maxfiylik"],
  references: ["Источники", "Дереккөздер", "Sources", "Булактар", "Manbalar"],
  welcome: ["Тёплая встреча", "Ерекше қарсы алу", "Warm welcome", "Жылуу тосуп алуу", "Samimiy kutib olish"],
  introduction: ["Раскрытие темы", "Тақырыпты ашу", "Topic exploration", "Теманы ачуу", "Mavzuni ochish"],
  grouping: ["Объединение в группы", "Топқа бөлу", "Group formation", "Топко бөлүү", "Guruhlarga ajratish"],
  practice: ["Интерактивная практика", "Интерактивті тәжірибе", "Interactive practice", "Интерактивдүү практика", "Interaktiv amaliyot"],
  information: ["Информационный блок", "Ақпараттық бөлім", "Information block", "Маалыматтык бөлүк", "Axborot qismi"],
  game: ["Игра для родителей", "Ата-аналарға ойын", "Parent game", "Ата-энелерге оюн", "Ota-onalar uchun o‘yin"],
} as const;
type Word = keyof typeof words;
const index: Record<ContentLanguage, number> = { ru: 0, kk: 1, en: 2, ky: 3, uz: 4 };
export const documentWord = (key: Word, language: ContentLanguage) => words[key][index[language]];
export const documentStage = (kind: StageKind, language: ContentLanguage) => documentWord(kind === "closing" ? "closing" : kind, language);

/** A complete portable text package; labels follow the saved content language. */
export function meetingMarkdown(r: MeetingResult): string {
  const w = (key: Word) => documentWord(key, r.language);
  const lines = [`# ${r.title}`, "", "SANDUAI PARENT MEETING PRO", ""];
  const text = (key: Word, value: string | number) => lines.push(`**${w(key)}:** ${value}`, "");
  const list = (key: Word, values: string[]) => { if (values.length) lines.push(`### ${w(key)}`, "", ...values.map(x => `- ${x}`), ""); };
  const quote = (key: Word, value: string) => lines.push(`**${w(key)}**`, "", ...value.split("\n").map(x => `> ${x}`), "");
  const section = (n: number, key: Word) => lines.push(`## ${n}. ${w(key)}`, "");
  section(1, "passport");
  text("topic", r.topic); text("goal", r.goal); text("class", r.class_group); if (r.institution_name) text("institution", r.institution_name);
  text("duration", r.duration_minutes); text("parents", r.participant_count); text("delivery", r.delivery_format); text("format", r.selected_format); lines.push(r.format_reason, "");
  list("assumptions", r.assumptions); list("objectives", r.objectives); list("outcomes", r.outcomes); list("resources", r.materials); list("preparation", r.preparation);
  section(2, "concept"); lines.push(`### ${r.concept.name}`, "", r.concept.description, ""); text("product", r.concept.final_product); r.national_values.forEach(x => lines.push(`**${x.value}:** ${x.action}`, ""));
  section(3, "timeline");
  const cell = (v: string) => v.replaceAll("|", "\\|").replaceAll("\n", " ");
  lines.push(`| ${w("stage")} | ${w("time")} | ${w("method")} | ${w("speech")} | ${w("action")} | ${w("resources")} |`, "| --- | --- | --- | --- | --- | --- |");
  r.stages.forEach(x => lines.push(`| ${cell(documentStage(x.kind, r.language))} | ${x.start_minute}–${x.end_minute} | ${cell(x.method)} | ${cell(x.host_script)} | ${cell(x.participant_action)} | ${cell(x.materials.join(", "))} |`)); lines.push("");
  const activity = (x: MeetingResult["stages"][number]) => { lines.push(`### ${x.title}`, ""); text("duration", x.duration_minutes); text("goal", x.purpose); text("method", x.method); list("resources", x.materials); text("instructions", x.instructions); quote("speech", x.host_script); text("action", x.participant_action); text("product", x.expected_result); quote("transition", x.transition); };
  section(4, "scenario"); r.stages.forEach(activity);
  section(5, "training"); const training = r.stages.find(x => x.kind === "training"); if (training) activity(training); r.training_cards.forEach(x => lines.push(`### ${x.title}`, "", x.instructions, "", x.content, ""));
  section(6, "tasks"); r.interactive_tasks.forEach(x => { lines.push(`### ${x.title}`, ""); text("duration", x.duration_minutes); text("goal", x.purpose); text("method", x.method); list("resources", x.materials); if (x.case_text) text("case", x.case_text); list("steps", x.steps); quote("speech", x.host_script); text("action", x.participant_action); text("example", x.product_example); text("product", x.expected_result); });
  section(7, "materials"); lines.push(`### ${w("invitation")}: ${r.invitation.title}`, "", r.invitation.text, ""); text("date", r.invitation.date); text("clock", r.invitation.time); text("venue", r.invitation.venue);
  lines.push(`### ${w("slides")}`, ""); r.slides.forEach(x => { lines.push(`#### ${x.number}. ${x.title}`, ""); text("screen", x.on_screen); text("visual", x.visual); });
  lines.push(`### ${w("cards")}`, ""); r.training_cards.forEach(x => lines.push(`#### ${x.title}`, "", x.instructions, "", x.content, ""));
  lines.push(`### ${w("survey")}: ${r.questionnaire.title}`, "", r.questionnaire.anonymous ? w("anonymous") : "", r.questionnaire.instructions, ""); r.questionnaire.questions.forEach((x, i) => lines.push(`${i + 1}. ${x.question}`, ...x.options.map(option => `   - [ ] ${option}`), ""));
  lines.push(`### ${w("worksheets")}`, ""); r.worksheets.forEach(x => { lines.push(`#### ${x.task_title}`, "", x.instructions, "", x.content, ""); text("question", x.conclusion_question); });
  list("recommendations", r.recommendations);
  if (r.digital_tools.length) lines.push(`### ${w("tools")}`, ""); r.digital_tools.forEach(x => { lines.push(`#### ${x.name}`, "", x.purpose, ""); quote("prompt", x.prompt); text("offline", x.offline_alternative); });
  section(8, "reflection"); lines.push(`### ${r.reflection.title}`, "", r.reflection.instructions, ""); quote("speech", r.reflection.host_script); list("question", r.reflection.questions); text("reflectionSheet", r.reflection_sheet);
  section(9, "closing"); quote("speech", r.closing_script); list("safety", r.safety_notes); list("references", r.references);
  section(10, "protocol"); lines.push(r.protocol_template, "");
  return lines.join("\n");
}
