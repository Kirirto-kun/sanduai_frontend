import { CONTENT_LANGUAGE_CODES } from "@/lib/content-languages";
import type { CoachingInput, CoachingResult, StageKind } from "./types";

export const COACHING_PATH = "/dashboard/ai/coaching";
export const STAGE_KINDS: StageKind[] = ["organization", "engagement", "theory", "grouping", "practice", "energizer", "application", "reflection", "closing"];
export const AUDIENCES = [
  { ru: "Смешанный педагогический коллектив", kk: "Аралас педагогикалық ұжым" },
  { ru: "Воспитатели", kk: "Тәрбиешілер" },
  { ru: "Учителя начальных классов", kk: "Бастауыш сынып мұғалімдері" },
  { ru: "Учителя-предметники", kk: "Пән мұғалімдері" },
  { ru: "Администрация и методисты", kk: "Әкімшілік пен әдіскерлер" },
];
export function blankCoaching(): CoachingInput {
  return { topic: "", audience: AUDIENCES[0].kk, duration_minutes: 45, participant_count: 20, group_count: 4, format: "offline", goal: "", resources: [], experience: "", methods: [], include_ai: false, language: "kk", notes: "", defaults_accepted: false };
}
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
const text = (value: unknown): value is string => typeof value === "string";
const texts = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);
const integer = (value: unknown, min: number, max: number) => Number.isInteger(value) && Number(value) >= min && Number(value) <= max;
export function isCoachingDraft(value: unknown): value is CoachingInput {
  if (!isRecord(value)) return false;
  const defaults = blankCoaching();
  return Object.keys(value).every(key => key in defaults)
    && Object.entries(defaults).every(([key, sample]) => Array.isArray(sample) ? texts(value[key]) : typeof value[key] === typeof sample)
    && CONTENT_LANGUAGE_CODES.includes(value.language as CoachingInput["language"])
    && ["offline", "online", "hybrid"].includes(String(value.format))
    && integer(value.duration_minutes, 15, 240) && integer(value.participant_count, 2, 1000)
    && integer(value.group_count, 1, Math.min(50, Number(value.participant_count)))
    && Object.entries({ topic: 500, audience: 250, goal: 1500, experience: 500, notes: 2500 }).every(([key, max]) => (value[key] as string).length <= max)
    && (value.resources as string[]).length <= 20 && (value.methods as string[]).length <= 15
    && [...value.resources as string[], ...value.methods as string[]].every(item => item.length <= 1000);
}
export function coachingSubmission(input: CoachingInput) {
  const payload = { ...input, topic: input.topic.trim(), audience: input.audience.trim(), resources: splitItems(input.resources.join(",")), methods: splitItems(input.methods.join(",")) };
  if (!isCoachingDraft(payload) || payload.topic.length < 2 || payload.audience.length < 2 || !payload.defaults_accepted) throw new Error("INVALID_COACHING_INPUT");
  return { title: Array.from(payload.topic).slice(0, 240).join(""), payload };
}
export function splitItems(value: string) { return value.split(/[,;\n]/).map(x => x.trim()).filter(Boolean); }
export function stageLabel(kind: StageKind, language: "ru" | "kk") {
  const names = {
    organization: ["Организация", "Ұйымдастыру"], engagement: ["Пробуждение интереса", "Қызығушылықты ояту"],
    theory: ["Раскрытие темы", "Тақырыпты ашу"], grouping: ["Деление на группы", "Топқа бөлу"],
    practice: ["Практическая работа", "Практикалық жұмыс"], energizer: ["Разминка", "Сергіту"],
    application: ["Внедрение в практику", "Тәжірибеге енгізу"], reflection: ["Рефлексия", "Рефлексия"], closing: ["Заключение", "Қорытынды"],
  };
  return names[kind][language === "kk" ? 1 : 0];
}
/** Guard retained provider output before rendering nested fields. */
export function isCoachingResult(value: unknown): value is CoachingResult {
  if (!isRecord(value)) return false;
  const r = value;
  if (!["title", "topic", "audience", "goal", "closing_script"].every(key => text(r[key])) || !CONTENT_LANGUAGE_CODES.includes(r.language as CoachingInput["language"])) return false;
  if (!["assumptions", "objectives", "outcomes", "materials", "preparation"].every(key => texts(r[key]))) return false;
  if (!integer(r.duration_minutes, 15, 240) || !integer(r.participant_count, 2, 1000) || !integer(r.group_count, 1, Math.min(50, Number(r.participant_count))) || !["offline", "online", "hybrid"].includes(String(r.format))) return false;
  const fields = (item: unknown, keys: string[]) => isRecord(item) && keys.every(key => text(item[key]));
  if (!fields(r.concept, ["name", "description", "final_product"]) || !fields(r.reflection, ["title", "instructions", "host_script"]) || !texts((r.reflection as Record<string, unknown>).questions)) return false;
  if (!fields(r.grouping, ["method", "instructions"]) || !isRecord(r.grouping) || !Array.isArray(r.grouping.groups) || !r.grouping.groups.every(x => fields(x, ["name", "task", "expected_result"]))) return false;
  if (!Array.isArray(r.stages) || r.stages.length !== 9) return false;
  let minute = 0;
  for (const [index, stage] of r.stages.entries()) {
    if (!fields(stage, ["kind", "title", "method", "purpose", "host_script", "participant_action", "transition", "expected_result"]) || !isRecord(stage) || !texts(stage.materials) || stage.kind !== STAGE_KINDS[index] || !integer(stage.duration_minutes, 1, 240) || stage.start_minute !== minute) return false;
    minute += Number(stage.duration_minutes);
    if (stage.end_minute !== minute || !integer(stage.participant_minutes, 0, Number(stage.duration_minutes))) return false;
  }
  if (minute !== r.duration_minutes) return false;
  const collections: Record<string, string[]> = {
    practical_tasks: ["kind", "title", "method", "purpose", "host_script", "participant_action", "product_example"],
    handouts: ["kind", "title", "instructions", "content"], slides: ["title", "on_screen", "speaker_notes", "visual", "participant_action"],
    evaluation: ["criterion", "evidence"], adaptations: ["situation", "instruction"], national_values: ["value", "action"],
    ai_tools: ["name", "purpose", "prompt", "offline_alternative", "critical_check"],
  };
  if (!Object.entries(collections).every(([key, keys]) => Array.isArray(r[key]) && r[key].every(item => fields(item, keys)))) return false;
  const tasks = r.practical_tasks as Record<string, unknown>[];
  return tasks.length === 3 && tasks.every((x, i) => x.kind === ["analysis", "creation", "presentation"][i] && integer(x.duration_minutes, 1, 240) && ["materials", "steps", "criteria"].every(k => texts(x[k])))
    && tasks.reduce((sum, x) => sum + Number(x.duration_minutes), 0) === r.stages[4].duration_minutes
    && Array.isArray(r.quality_checks) && r.quality_checks.every(x => isRecord(x) && text(x.code) && typeof x.passed === "boolean")
    && integer(r.participant_activity_percent, 0, 100) && integer(r.cost_tokens, 0, 100000)
    && (r.slides as Record<string, unknown>[]).every((x, i) => x.number === i + 1);
}
