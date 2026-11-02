import { CONTENT_LANGUAGE_CODES } from "@/lib/content-languages";
import type { AgeGroup, Duration, OutputMode, ProjectInput, ProjectResult, ProjectType } from "./types";

export const PROJECT_PATH = "/dashboard/ai/preschool-projects";
export const PROJECT_KIND = "preschool_project.generate";
export const PROJECT_TYPES: { id: ProjectType; ru: string; kk: string; icon: "flask" | "leaf" | "blocks" | "palette" | "sun" | "heart" | "pattern" | "people" | "clock" | "book" | "award" }[] = [
  { id: "scientific", ru: "Исследование", kk: "Ғылыми зерттеу", icon: "flask" },
  { id: "ecological", ru: "Экология", kk: "Экология", icon: "leaf" },
  { id: "stem", ru: "STEM", kk: "STEM", icon: "blocks" },
  { id: "steam", ru: "STEAM", kk: "STEAM", icon: "palette" },
  { id: "cognitive", ru: "Познание мира", kk: "Таным", icon: "sun" },
  { id: "social", ru: "Добрые дела", kk: "Әлеуметтік жоба", icon: "heart" },
  { id: "national_values", ru: "Национальные ценности", kk: "Ұлттық құндылықтар", icon: "pattern" },
  { id: "creative", ru: "Творчество", kk: "Шығармашылық", icon: "palette" },
  { id: "family", ru: "Семья и детский сад", kk: "Отбасы мен балабақша", icon: "people" },
  { id: "long_term", ru: "Долгосрочное развитие", kk: "Ұзақмерзімді дамыту", icon: "clock" },
  { id: "pedagogical", ru: "Авторская методика", kk: "Авторлық жоба", icon: "book" },
  { id: "competition", ru: "Конкурс и выставка", kk: "Байқау мен көрме", icon: "award" },
];
export const OUTPUT_MODES: { id: OutputMode; ru: string; kk: string; ruHint: string; kkHint: string }[] = [
  { id: "full_package", ru: "Полный методический пакет", kk: "Толық әдістемелік пакет", ruHint: "Проект, сценарий, дневник, карточки, слайды и защита", kkHint: "Жоба, сценарий, күнделік, карточкалар, слайдтар мен қорғау сөзі" },
  { id: "ideas", ru: "10 идей для проекта", kk: "Жобаға арналған 10 идея", ruHint: "Вопрос, действие ребёнка и продукт для каждой идеи", kkHint: "Әр идеяға сұрақ, баланың әрекеті және өнім" },
  { id: "scientific_project", ru: "Полный научный проект", kk: "Толық ғылыми жоба", ruHint: "От вопроса и гипотезы до опыта и записи наблюдений", kkHint: "Сұрақ пен болжамнан тәжірибе мен бақылауды тіркеуге дейін" },
  { id: "ecological_project", ru: "Полный экологический проект", kk: "Толық экологиялық жоба", ruHint: "Полезное дело, этапы, наблюдение изменений", kkHint: "Пайдалы іс, кезеңдер мен өзгерістерді бақылау" },
  { id: "stem_project", ru: "STEM / STEAM проект", kk: "STEM / STEAM жоба", ruHint: "Проблема, конструирование, испытание и улучшение", kkHint: "Мәселе, құрастыру, сынақ және жетілдіру" },
  { id: "weekly_project", ru: "Проект на неделю", kk: "Бір апталық жоба", ruHint: "Посильные действия и материалы на каждый день", kkHint: "Күн сайынғы қолжетімді әрекеттер мен материалдар" },
  { id: "long_term_project", ru: "Месячный или годовой проект", kk: "Айлық немесе жылдық жоба", ruHint: "Последовательные этапы и промежуточные наблюдения", kkHint: "Бірізді кезеңдер мен аралық бақылаулар" },
  { id: "pedagogical_project", ru: "Авторский педагогический проект", kk: "Авторлық педагогикалық жоба", ruHint: "Проблема, методика, внедрение и оценка изменений", kkHint: "Мәселе, әдістеме, енгізу және өзгерістерді бағалау" },
  { id: "competition_project", ru: "Проект для конкурса", kk: "Байқауға арналған жоба", ruHint: "Оформление с учётом предоставленных правил", kkHint: "Ұсынылған ережелерді ескеріп рәсімдеу" },
  { id: "presentation_plan", ru: "План презентации", kk: "Презентация жоспары", ruHint: "Текст слайдов, визуальные идеи и слова выступающего", kkHint: "Слайд мәтіні, визуал идеялар мен сөйлеу сөзі" },
  { id: "defense", ru: "Речь для защиты", kk: "Жобаны қорғау сөзі", ruHint: "Короткий рассказ, понятный ребёнку", kkHint: "Балаға түсінікті қысқа әңгіме" },
];
export const AGE_GROUPS: { id: AgeGroup; age: number; ru: string; kk: string; ruHint: string; kkHint: string }[] = [
  { id: "early", age: 1, ru: "Ранняя", kk: "Ерте жас", ruHint: "Короткое знакомство с цветом, звуком и ощущениями при помощи взрослого.", kkHint: "Ересек көмегімен түс, дыбыс және сезімдерді қысқа танып-білу." },
  { id: "younger", age: 2, ru: "Младшая", kk: "Кіші", ruHint: "Игра, повторение и простое сравнение с поддержкой педагога.", kkHint: "Педагогтің қолдауымен ойын, қайталау және қарапайым салыстыру." },
  { id: "middle", age: 3, ru: "Средняя", kk: "Ортаңғы", ruHint: "Первые вопросы, безопасные опыты и ответы рисунком или жестом.", kkHint: "Алғашқы сұрақтар, қауіпсіз тәжірибелер және суретпен не ишарамен жауап беру." },
  { id: "older", age: 4, ru: "Старшая", kk: "Ересек", ruHint: "Простые предположения, сравнение двух условий и работа в группе.", kkHint: "Қарапайым болжамдар, екі жағдайды салыстыру және топпен жұмыс." },
  { id: "preparatory", age: 5, ru: "Предшкольная", kk: "Мектепалды", ruHint: "Вопрос, предположение, дневник наблюдений и представление результата.", kkHint: "Сұрақ, болжам, бақылау күнделігі және нәтижені таныстыру." },
];
export const DURATIONS: { id: Duration; ru: string; kk: string }[] = [
  { id: "one_day", ru: "1 день", kk: "1 күн" }, { id: "short", ru: "3–5 дней", kk: "3–5 күн" },
  { id: "week", ru: "1 неделя", kk: "1 апта" }, { id: "two_weeks", ru: "2 недели", kk: "2 апта" },
  { id: "month", ru: "1 месяц", kk: "1 ай" }, { id: "quarter", ru: "1 квартал", kk: "1 тоқсан" },
  { id: "half_year", ru: "Полгода", kk: "Жарты жыл" }, { id: "year", ru: "1 год", kk: "1 жыл" },
];
export const TOPIC_PRESETS = [
  { ru: "Путешествие одного семечка", kk: "Бір дәннің саяхаты", type: "scientific" as const },
  { ru: "Каждая капля важна", kk: "Әр тамшы маңызды", type: "ecological" as const },
  { ru: "Маленькие строители мостов", kk: "Кішкентай көпір құрылысшылары", type: "stem" as const },
];
export function blankProject(): ProjectInput {
  return { topic: "", project_type: "scientific", output_mode: "full_package", age_group: "older", participant_count: 20, duration: "week", goal: "", problem: "", venue: "", season: "", materials: [], expected_product: "", author: "", kindergarten: "", locality: "", academic_year: "", parent_participation: "optional", is_competition: false, competition_rules: "", accessibility_notes: "", notes: "", project_status: "planned", observations: "", language: "kk" };
}
export function selectOutput(input: ProjectInput, mode: OutputMode): ProjectInput {
  const typeForMode: Partial<Record<OutputMode, ProjectType>> = { scientific_project: "scientific", ecological_project: "ecological", pedagogical_project: "pedagogical", competition_project: "competition" };
  const next = { ...input, output_mode: mode, project_type: typeForMode[mode] ?? (mode === "stem_project" ? input.project_type === "steam" ? "steam" : "stem" : input.project_type) };
  if (mode === "weekly_project") { next.duration = "week"; if (next.project_type === "long_term") next.project_type = "cognitive"; }
  if (mode === "long_term_project" && !["month", "quarter", "half_year", "year"].includes(next.duration)) next.duration = "month";
  if (next.project_type === "long_term" && !["month", "quarter", "half_year", "year"].includes(next.duration)) next.duration = "month";
  if (mode === "competition_project") next.is_competition = true;
  return next;
}
export function selectProjectType(input: ProjectInput, type: ProjectType): ProjectInput {
  const fixed: Partial<Record<OutputMode, ProjectType[]>> = { scientific_project: ["scientific"], ecological_project: ["ecological"], stem_project: ["stem", "steam"], pedagogical_project: ["pedagogical"], competition_project: ["competition"] };
  const next = { ...input, project_type: type, output_mode: fixed[input.output_mode] && !fixed[input.output_mode]!.includes(type) || type === "long_term" && input.output_mode === "weekly_project" ? "full_package" as const : input.output_mode, is_competition: type === "competition" || input.is_competition };
  return selectOutput(next, next.output_mode);
}
export function ageYearsLabel(age: number, language: "ru" | "kk"): string { return `${age} ${language === "kk" ? "жас" : age === 1 ? "год" : age < 5 ? "года" : "лет"}`; }
const LIMITS = { topic: 500, goal: 1500, problem: 1500, venue: 300, season: 100, expected_product: 1500, author: 250, kindergarten: 300, locality: 200, academic_year: 100, competition_rules: 10000, accessibility_notes: 1500, notes: 2500, observations: 10000 } as const;
export function isProjectDraft(value: unknown): value is ProjectInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some(key => !Object.prototype.hasOwnProperty.call(blankProject(), key))) return false;
  if (!Object.entries(LIMITS).every(([key, limit]) => typeof v[key] === "string" && (v[key] as string).length <= limit)) return false;
  return PROJECT_TYPES.some(x => x.id === v.project_type) && OUTPUT_MODES.some(x => x.id === v.output_mode)
    && AGE_GROUPS.some(x => x.id === v.age_group) && DURATIONS.some(x => x.id === v.duration)
    && Number.isInteger(v.participant_count) && Number(v.participant_count) >= 1 && Number(v.participant_count) <= 100
    && Array.isArray(v.materials) && v.materials.length <= 25 && v.materials.every(x => typeof x === "string" && x.length <= 1000)
    && typeof v.is_competition === "boolean" && ["none", "optional", "active"].includes(String(v.parent_participation))
    && ["planned", "in_progress", "completed"].includes(String(v.project_status))
    && CONTENT_LANGUAGE_CODES.includes(v.language as ProjectInput["language"]);
}
export function projectSubmission(input: ProjectInput): { title: string; payload: Record<string, unknown> } {
  const normalized = selectOutput(input, input.output_mode);
  const payload = { ...normalized, materials: input.materials.map(x => x.trim()).filter(Boolean) };
  for (const key of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) payload[key] = input[key].trim();
  if (input.project_status === "planned") payload.observations = "";
  const fallback = input.language === "ru" ? "Идеи для дошкольного проекта" : "Балабақша жобасына арналған идеялар";
  return { title: Array.from(payload.topic || fallback).slice(0, 240).join(""), payload };
}
export function isProjectResult(value: unknown): value is ProjectResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return ["title", "summary", "goal", "language", "regulatory_note", "defense_script"].every(key => typeof v[key] === "string")
    && CONTENT_LANGUAGE_CODES.includes(v.language as ProjectInput["language"])
    && AGE_GROUPS.some(x => x.id === v.age_group) && DURATIONS.some(x => x.id === v.duration)
    && PROJECT_TYPES.some(x => x.id === v.project_type) && OUTPUT_MODES.some(x => x.id === v.output_mode)
    && ["assumptions", "sections", "ideas", "calendar", "experiments", "diary", "artifacts", "slides", "expected_results", "actual_results", "evaluation", "development", "values", "inclusion", "safety", "sources"].every(key => Array.isArray(v[key]));
}
