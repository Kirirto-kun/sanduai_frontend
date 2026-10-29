import type { ContentLanguage } from "@/lib/content-languages";
import type { ProjectResult } from "./types";

const LABELS = {
  topic: ["Тема", "Тақырыбы", "Topic", "Тема", "Mavzu"],
  age: ["Возраст, лет", "Жасы", "Age in years", "Жашы", "Yoshi"],
  participants: ["Количество детей", "Балалар саны", "Number of children", "Балдардын саны", "Bolalar soni"],
  duration: ["Продолжительность", "Ұзақтығы", "Duration", "Узактыгы", "Davomiyligi"],
  overview: ["Паспорт проекта", "Жоба паспорты", "Project overview", "Долбоордун паспорту", "Loyiha pasporti"],
  goal: ["Цель", "Мақсаты", "Goal", "Максат", "Maqsad"],
  assumptions: ["Условия и уточнения", "Шарттар мен нақтылаулар", "Assumptions and clarifications", "Шарттар жана тактоолор", "Shartlar va aniqlashtirishlar"],
  ideas: ["Идеи проектов", "Жоба идеялары", "Project ideas", "Долбоор идеялары", "Loyiha g‘oyalari"],
  question: ["Исследовательский вопрос", "Зерттеу сұрағы", "Research question", "Изилдөө суроосу", "Tadqiqot savoli"],
  activity: ["Действие ребёнка", "Баланың әрекеті", "Child’s activity", "Баланын аракети", "Bolaning harakati"],
  product: ["Итоговый продукт", "Қорытынды өнім", "Final product", "Жыйынтык продукт", "Yakuniy mahsulot"],
  calendar: ["Календарный план", "Күнтізбелік жоспар", "Project schedule", "Календардык план", "Taqvim rejasi"],
  period: ["День или этап", "Күн немесе кезең", "Day or stage", "Күн же этап", "Kun yoki bosqich"],
  teacher: ["Действие педагога", "Педагогтің әрекеті", "Teacher’s activity", "Педагогдун аракети", "Pedagogning harakati"],
  materials: ["Материалы", "Материалдар", "Materials", "Материалдар", "Materiallar"],
  expected: ["Ожидаемый результат", "Күтілетін нәтиже", "Expected result", "Күтүлгөн натыйжа", "Kutilayotgan natija"],
  recording: ["Как фиксировать", "Тіркеу тәсілі", "How to record", "Каттоо ыкмасы", "Qayd etish usuli"],
  minutes: ["минут", "минут", "minutes", "мүнөт", "daqiqa"],
  experiments: ["Опыты и практические действия", "Тәжірибелер мен практикалық әрекеттер", "Experiments and practical activities", "Тажрыйбалар жана практикалык иштер", "Tajribalar va amaliy harakatlar"],
  hypothesis: ["Предположение", "Болжам", "Hypothesis", "Божомол", "Taxmin"],
  safety: ["Безопасность", "Қауіпсіздік", "Safety", "Коопсуздук", "Xavfsizlik"],
  preparation: ["Подготовка взрослого", "Ересектің дайындығы", "Adult preparation", "Чоң кишинин даярдыгы", "Kattalarning tayyorgarligi"],
  steps: ["Пошаговый порядок", "Қадамдық тәртіп", "Step by step", "Кадамдык тартип", "Bosqichma-bosqich tartib"],
  observation_period: ["Время наблюдения", "Бақылау уақыты", "Observation period", "Байкоо убактысы", "Kuzatuv vaqti"],
  comparison: ["Что сравнить", "Нені салыстырамыз", "What to compare", "Эмнени салыштыруу керек", "Nimani solishtirish kerak"],
  questions: ["Вопросы для вывода", "Қорытындыға арналған сұрақтар", "Questions for reflection", "Жыйынтык суроолор", "Xulosa uchun savollar"],
  diary: ["Дневник наблюдений", "Бақылау күнделігі", "Observation diary", "Байкоо күндөлүгү", "Kuzatuv kundaligi"],
  diary_note: ["Заполните после наблюдения. Пустые ячейки не являются результатами.", "Бақылаудан кейін толтырыңыз. Бос ұяшықтар нәтиже болып саналмайды.", "Complete after observing. Blank cells are not results.", "Байкоодон кийин толтуруңуз. Бош уячалар натыйжа эмес.", "Kuzatuvdan keyin to‘ldiring. Bo‘sh kataklar natija emas."],
  observation: ["Что заметили", "Не байқадық", "Observation", "Байкоо", "Kuzatuv"],
  actual: ["Реальные данные пользователя", "Пайдаланушының шынайы деректері", "User-provided observations", "Колдонуучунун чыныгы маалыматтары", "Foydalanuvchining haqiqiy ma’lumotlari"],
  actual_empty: ["Фактические результаты ещё не предоставлены. Записывайте только то, что действительно наблюдали.", "Нақты нәтижелер әлі берілмеген. Тек іс жүзінде байқағаныңызды жазыңыз.", "Actual results have not been provided. Record only what was really observed.", "Чыныгы натыйжалар бериле элек. Иш жүзүндө байкалганды гана жазыңыз.", "Haqiqiy natijalar hali berilmagan. Faqat amalda kuzatilganini yozing."],
  result: ["Результат", "Нәтиже", "Result", "Натыйжа", "Natija"],
  artifacts: ["Готовые материалы", "Дайын материалдар", "Ready-to-use materials", "Даяр материалдар", "Tayyor materiallar"],
  instructions: ["Как использовать", "Қолдану тәртібі", "How to use", "Колдонуу тартиби", "Foydalanish tartibi"],
  slides: ["План презентации", "Презентация жоспары", "Presentation plan", "Презентация планы", "Taqdimot rejasi"],
  screen: ["Текст на слайде", "Слайдтағы мәтін", "On-screen text", "Слайддагы текст", "Slayddagi matn"],
  visual: ["Визуальная идея", "Визуал идея", "Visual idea", "Визуалдык идея", "Vizual g‘oya"],
  photo: ["Место для реального фото", "Шынайы фотоға арналған орын", "Placeholder for a real photo", "Чыныгы сүрөт үчүн орун", "Haqiqiy surat uchun joy"],
  speech: ["Слова выступающего", "Сөйлеушінің сөзі", "Speaker notes", "Баяндамачынын сөзү", "Ma’ruzachining so‘zi"],
  defense: ["Речь для защиты", "Жобаны қорғау сөзі", "Project presentation speech", "Долбоорду коргоо сөзү", "Loyihani himoya qilish nutqi"],
  evaluation: ["Наблюдаемые показатели", "Бақыланатын көрсеткіштер", "Observable indicators", "Байкалуучу көрсөткүчтөр", "Kuzatiladigan ko‘rsatkichlar"],
  criterion: ["Показатель", "Көрсеткіш", "Indicator", "Көрсөткүч", "Ko‘rsatkich"],
  evidence: ["Как наблюдать", "Қалай бақылаймыз", "How to observe", "Кантип байкоо керек", "Qanday kuzatish kerak"],
  development: ["Направления развития", "Даму бағыттары", "Development areas", "Өнүгүү багыттары", "Rivojlanish yo‘nalishlari"],
  direction: ["Направление", "Бағыты", "Area", "Багыт", "Yo‘nalish"],
  values: ["Ценности в действии", "Іс-әрекеттегі құндылықтар", "Values in action", "Иш-аракеттеги баалуулуктар", "Amaldagi qadriyatlar"],
  value: ["Ценность", "Құндылық", "Value", "Баалуулук", "Qadriyat"],
  inclusion: ["Участие каждого ребёнка", "Әр баланың қатысуы", "Every child’s participation", "Ар бир баланын катышуусу", "Har bir bolaning ishtiroki"],
  sources: ["Источники и нормативная основа", "Дереккөздер мен нормативтік негіз", "Sources and regulatory basis", "Булактар жана ченемдик негиз", "Manbalar va me’yoriy asos"],
  unverified: ["Актуальная редакция требует проверки", "Қолданыстағы редакцияны тексеру қажет", "Current edition requires verification", "Учурдагы редакцияны текшерүү керек", "Amaldagi tahrirni tekshirish kerak"],
  competition: ["Условия конкурса", "Байқау шарттары", "Competition requirements", "Сынактын шарттары", "Tanlov shartlari"],
} as const;
export type DocumentLabel = keyof typeof LABELS;
export function projectLabel(language: ContentLanguage, key: DocumentLabel): string { return LABELS[key][({ ru: 0, kk: 1, en: 2, ky: 3, uz: 4 } as const)[language]]; }
export function projectDurationLabel(r: Pick<ProjectResult, "duration" | "language">): string {
  const labels = { one_day: ["1 день", "1 күн", "1 day", "1 күн", "1 kun"], short: ["3–5 дней", "3–5 күн", "3–5 days", "3–5 күн", "3–5 kun"], week: ["1 неделя", "1 апта", "1 week", "1 жума", "1 hafta"], two_weeks: ["2 недели", "2 апта", "2 weeks", "2 жума", "2 hafta"], month: ["1 месяц", "1 ай", "1 month", "1 ай", "1 oy"], quarter: ["1 квартал", "1 тоқсан", "1 quarter", "1 чейрек", "1 chorak"], half_year: ["Полгода", "Жарты жыл", "Half a year", "Жарым жыл", "Yarim yil"], year: ["1 год", "1 жыл", "1 year", "1 жыл", "1 yil"] };
  return labels[r.duration][({ ru: 0, kk: 1, en: 2, ky: 3, uz: 4 } as const)[r.language]];
}
const list = (items: string[], ordered = false) => items.map((x, i) => `${ordered ? `${i + 1}.` : "-"} ${x}`).join("\n");
const cell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
function table(headings: string[], rows: string[][]): string { return `| ${headings.map(cell).join(" | ")} |\n| ${headings.map(() => "---").join(" | ")} |\n${rows.map(row => `| ${row.map(cell).join(" | ")} |`).join("\n")}`; }
export function projectMarkdown(r: ProjectResult): string {
  const l = (key: DocumentLabel) => projectLabel(r.language, key);
  const out: string[] = [`# ${r.title}`, r.summary, `**${l("topic")}:** ${r.topic}\n\n**${l("age")}:** ${r.age_years}\n\n**${l("participants")}:** ${r.participant_count}\n\n**${l("duration")}:** ${projectDurationLabel(r)}`, `## ${l("goal")}\n\n${r.goal}`];
  const add = (key: DocumentLabel, content: string, visible = Boolean(content)) => { if (visible) out.push(`## ${l(key)}\n\n${content}`); };
  add("assumptions", list(r.assumptions));
  r.sections.forEach(section => out.push(`## ${section.title}\n\n${section.content}`));
  add("ideas", r.ideas.map((x, i) => `### ${i + 1}. ${x.title}\n\n**${l("question")}:** ${x.question}\n\n**${l("activity")}:** ${x.activity}\n\n**${l("product")}:** ${x.product}`).join("\n\n"));
  add("calendar", table([l("period"), l("goal"), l("activity"), l("teacher"), l("materials"), l("expected"), l("recording")], r.calendar.map(x => [`${x.period} (${x.session_minutes} ${l("minutes")})`, x.goal, x.child_action, x.teacher_action, x.materials.join(", "), x.expected_result, x.recording])), r.calendar.length > 0);
  add("experiments", r.experiments.map((x, i) => `### ${i + 1}. ${x.title}\n\n${x.duration_minutes} ${l("minutes")}\n\n${[
    ["question", x.question], ["hypothesis", x.hypothesis], ["materials", list(x.materials)], ["safety", list(x.safety)], ["preparation", x.adult_preparation], ["activity", x.child_action], ["steps", list(x.steps, true)], ["observation_period", x.observation_period], ["recording", x.recording], ["comparison", x.comparison], ["questions", list(x.conclusion_questions)],
  ].filter(([, text]) => text).map(([key, text]) => `**${l(key as DocumentLabel)}**\n\n${text}`).join("\n\n")}`).join("\n\n"));
  add("diary", `${l("diary_note")}\n\n${table([l("period"), l("activity"), l("observation"), l("result")], r.diary.map(x => [x.period, x.activity, x.observation, x.result]))}`, r.diary.length > 0);
  add("expected", list(r.expected_results));
  add("actual", r.actual_results.length ? list(r.actual_results) : l("actual_empty"), r.output_mode !== "ideas");
  add("artifacts", r.artifacts.map(x => `### ${x.title}\n\n**${l("instructions")}:** ${x.instructions}\n\n${x.content}`).join("\n\n"));
  add("slides", r.slides.map(x => `### ${x.number}. ${x.title}\n\n${[["screen", x.on_screen], ["visual", x.visual], ["photo", x.photo_placeholder], ["speech", x.speaker_notes], ["result", x.shown_result]].filter(([, text]) => text).map(([key, text]) => `**${l(key as DocumentLabel)}:** ${text}`).join("\n\n")}`).join("\n\n"));
  add("defense", r.defense_script);
  add("evaluation", table([l("criterion"), l("evidence")], r.evaluation.map(x => [x.criterion, x.evidence])), r.evaluation.length > 0);
  add("development", table([l("direction"), l("activity")], r.development.map(x => [x.direction, x.child_action])), r.development.length > 0);
  add("values", table([l("value"), l("activity")], r.values.map(x => [x.value, x.child_action])), r.values.length > 0);
  add("inclusion", list(r.inclusion)); add("safety", list(r.safety));
  add("competition", r.competition_note);
  add("sources", [r.regulatory_note, ...r.sources.map(x => `- ${x.organization}. ${x.title}${/^https?:\/\//i.test(x.url) ? ` — ${x.url}` : ""}. ${l("unverified")}.`)].filter(Boolean).join("\n\n"));
  return `${out.filter(Boolean).join("\n\n")}\n`;
}
