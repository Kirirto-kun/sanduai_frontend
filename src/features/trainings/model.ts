import { CONTENT_LANGUAGE_CODES } from "@/lib/content-languages";
import type { EventType, OutputMode, TrainingInput } from "./types";

export const EVENTS: { id: EventType; ru: string; kk: string; icon: string }[] = [
  { id: "psychological_training", ru: "Психологический тренинг", kk: "Психологиялық тренинг", icon: "shield" },
  { id: "creative_seminar", ru: "Креативный семинар", kk: "Креативті семинар", icon: "spark" },
  { id: "masterclass", ru: "Педагогическая мастерская", kk: "Педагогикалық шеберхана", icon: "book" },
  { id: "teambuilding", ru: "Тимбилдинг", kk: "Тимбилдинг", icon: "team" },
  { id: "strategic_session", ru: "Стратегическая сессия", kk: "Стратегиялық сессия", icon: "target" },
  { id: "student_training", ru: "Тренинг для учеников", kk: "Оқушылар тренингі", icon: "school" },
];
export const MODES: { id: OutputMode; ru: string; kk: string; ruHint: string; kkHint: string; icon: string }[] = [
  { id: "full_package", ru: "Полный пакет", kk: "Толық пакет", ruHint: "Сценарий, раздатки, слайды и оценка", kkHint: "Сценарий, үлестірмелер, слайдтар және бағалау", icon: "layers" },
  { id: "full_scenario", ru: "Полный сценарий", kk: "Толық сценарий", ruHint: "План по минутам и слова ведущего", kkHint: "Минуттық жоспар мен жүргізушінің сөзі", icon: "file" },
  { id: "ideas", ru: "Только идеи", kk: "Тек идеялар", ruHint: "5–7 концепций на вашу тему", kkHint: "Тақырыбыңызға сай 5–7 концепция", icon: "spark" },
  { id: "games", ru: "Игры и упражнения", kk: "Ойындар мен жаттығулар", ruHint: "5–10 интерактивов с инструкциями", kkHint: "Нұсқаулықтары бар 5–10 интерактив", icon: "team" },
  { id: "handouts", ru: "Раздаточные материалы", kk: "Үлестірме материалдар", ruHint: "Готовые карточки и задания", kkHint: "Дайын карточкалар мен тапсырмалар", icon: "cards" },
  { id: "presentation_plan", ru: "План презентации", kk: "Презентация жоспары", ruHint: "Текст, визуал и заметки по слайдам", kkHint: "Слайд мәтіні, визуалы және түсіндірмесі", icon: "slides" },
  { id: "masterclass", ru: "Мастер-класс", kk: "Шеберлік сағаты", ruHint: "Показ → практика → готовый продукт", kkHint: "Көрсету → тәжірибе → дайын өнім", icon: "book" },
  { id: "express", ru: "Экспресс-тренинг", kk: "Экспресс-тренинг", ruHint: "Законченная встреча за 5–15 минут", kkHint: "5–15 минуттық толық кездесу", icon: "clock" },
];
export const AUDIENCES = [
  { id: "teachers", ru: "Учителя школы", kk: "Мектеп мұғалімдері" },
  { id: "preschool_teachers", ru: "Воспитатели и педагоги дошкольного образования", kk: "Тәрбиешілер мен мектепалды педагогтері" },
  { id: "primary_teachers", ru: "Учителя начальных классов", kk: "Бастауыш сынып мұғалімдері" },
  { id: "psychologists", ru: "Педагоги-психологи и социальные педагоги", kk: "Педагог-психологтер мен әлеуметтік педагогтер" },
  { id: "methodologists", ru: "Методисты", kk: "Әдіскерлер" },
  { id: "leaders", ru: "Директора, заместители и руководители", kk: "Директорлар, орынбасарлар мен басшылар" },
  { id: "young_professionals", ru: "Молодые специалисты и наставники", kk: "Жас мамандар мен тәлімгерлер" },
  { id: "college_teachers", ru: "Преподаватели колледжей", kk: "Колледж оқытушылары" },
  { id: "primary_students", ru: "Ученики 1–4 классов", kk: "1–4-сынып оқушылары" },
  { id: "secondary_students", ru: "Ученики 5–11 классов", kk: "5–11-сынып оқушылары" },
  { id: "preschool_children", ru: "Дети дошкольного возраста", kk: "Мектепке дейінгі балалар" },
  { id: "college_students", ru: "Студенты колледжей", kk: "Колледж студенттері" },
  { id: "parents", ru: "Родители", kk: "Ата-аналар" },
  { id: "mixed", ru: "Педагогический коллектив / смешанная группа", kk: "Педагогикалық ұжым / аралас топ" },
  { id: "other", ru: "Другая аудитория", kk: "Басқа аудитория" },
];
export function blankTraining(): TrainingInput {
  return { topic: "", event_type: "psychological_training", output_mode: "full_package", audience: "Мектеп мұғалімдері", participant_count: 20, duration_minutes: 45, age_group: "", format: "offline", experience: "", goal: "", venue: "", expected_result: "", accessibility_notes: "", notes: "", materials: [], digital_tools: [], creativity: "balanced", language: "kk", include_ai: false };
}
export function audienceDuration(id: string): number {
  return id === "preschool_children" ? 25 : id === "primary_students" ? 35 : 45;
}
export function selectOutput(input: TrainingInput, mode: OutputMode): TrainingInput {
  return { ...input, output_mode: mode, duration_minutes: mode === "express" ? Math.min(15, Math.max(5, input.duration_minutes === 45 ? 10 : input.duration_minutes)) : input.output_mode === "express" ? 45 : input.duration_minutes };
}
export function isTrainingDraft(value: unknown): value is TrainingInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return Object.entries(blankTraining()).every(([key, fallback]) => Array.isArray(fallback) ? Array.isArray(v[key]) && (v[key] as unknown[]).every(x => typeof x === "string") : typeof v[key] === typeof fallback)
    && EVENTS.some(x => x.id === v.event_type) && MODES.some(x => x.id === v.output_mode)
    && CONTENT_LANGUAGE_CODES.includes(v.language as typeof CONTENT_LANGUAGE_CODES[number])
    && ["offline", "online", "hybrid"].includes(String(v.format)) && ["balanced", "bold", "restrained"].includes(String(v.creativity))
    && Number.isInteger(v.participant_count) && Number(v.participant_count) >= 1 && Number(v.participant_count) <= 1000
    && Number.isInteger(v.duration_minutes) && Number(v.duration_minutes) >= 5 && Number(v.duration_minutes) <= 240
    && (v.output_mode !== "express" || Number(v.duration_minutes) <= 15);
}
export const splitItems = (value: string) => value.split(/[,;\n]/).map(x => x.trim()).filter(Boolean);
export const TRAINING_PATH = "/dashboard/ai/trainings";
