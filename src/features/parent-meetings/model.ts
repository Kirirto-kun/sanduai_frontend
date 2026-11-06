import { CONTENT_LANGUAGE_CODES } from "@/lib/content-languages";
import type { InterfaceLanguage, MeetingFormat, MeetingInput, MeetingResult, StageKind } from "./types";

export const MEETING_PATH = "/dashboard/ai/parent-meetings";
export const MEETING_KIND = "parent_meeting.generate";
export const MEETING_FORMATS: { value: MeetingFormat; ru: string; kk: string }[] = [
  { value: "auto", ru: "Подобрать под тему", kk: "Тақырыпқа сай таңдау" },
  { value: "traditional", ru: "Информационное собрание", kk: "Ақпараттық жиналыс" },
  { value: "training", ru: "Собрание-тренинг", kk: "Тренинг-жиналыс" },
  { value: "interactive", ru: "Интерактивное собрание", kk: "Интерактивті жиналыс" },
  { value: "workshop", ru: "Мастер-класс", kk: "Шебер сынып" },
  { value: "family_values", ru: "Семейные ценности", kk: "Отбасылық құндылықтар" },
  { value: "quest", ru: "Педагогический квест", kk: "Педагогикалық квест" },
  { value: "round_table", ru: "Круглый стол", kk: "Дөңгелек үстел" },
  { value: "conference", ru: "Родительская конференция", kk: "Ата-аналар конференциясы" },
];
export function blankMeeting(): MeetingInput {
  return { organization: "school", class_group: "", topic: "", duration_minutes: 45, participant_count: 20,
    delivery_format: "offline", meeting_format: "auto", goal: "", school_period: "", issues: [],
    specialists: [], resources: [], special_requests: "", institution_name: "", meeting_date: "",
    meeting_time: "", venue: "", include_digital_tools: false, language: "kk", defaults_accepted: false };
}
export const splitItems = (value: string) => value.split(/[,;\n]/).map(x => x.trim()).filter(Boolean);
export const isRecord = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === "object" && !Array.isArray(v));
export const isText = (v: unknown): v is string => typeof v === "string";
export const isTexts = (v: unknown): v is string[] => Array.isArray(v) && v.every(isText);
export const isInteger = (v: unknown, min: number, max: number) => Number.isInteger(v) && Number(v) >= min && Number(v) <= max;

/** Validate device drafts before restoring anything into a controlled field. */
export function isMeetingDraft(v: unknown): v is MeetingInput {
  if (!isRecord(v)) return false;
  const defaults = blankMeeting();
  return Object.keys(v).every(key => Object.prototype.hasOwnProperty.call(defaults, key))
    && Object.entries(defaults).every(([key, sample]) => Array.isArray(sample) ? isTexts(v[key]) : typeof v[key] === typeof sample)
    && ["school", "kindergarten"].includes(String(v.organization))
    && ["offline", "online", "hybrid"].includes(String(v.delivery_format))
    && MEETING_FORMATS.some(x => x.value === v.meeting_format)
    && CONTENT_LANGUAGE_CODES.includes(v.language as MeetingInput["language"])
    && isInteger(v.duration_minutes, 15, 180) && isInteger(v.participant_count, 1, 300)
    && Object.entries({ class_group: 200, topic: 500, goal: 1500, school_period: 250, special_requests: 2500, institution_name: 250, meeting_date: 100, meeting_time: 100, venue: 250 }).every(([key, max]) => (v[key] as string).length <= max)
    && [[v.issues, 12], [v.specialists, 10], [v.resources, 20]].every(([list, max]) => (list as string[]).length <= Number(max) && (list as string[]).every(item => item.length <= 1200));
}
export function meetingSubmission(input: MeetingInput) {
  const payload: MeetingInput = { ...input, topic: input.topic.trim(), class_group: input.class_group.trim(),
    goal: input.goal.trim(), issues: splitItems(input.issues.join(",")), resources: splitItems(input.resources.join(",")), specialists: splitItems(input.specialists.join(",")) };
  if (!isMeetingDraft(payload) || payload.topic.length < 2 || payload.class_group.length < 1 || !payload.defaults_accepted
    || [...payload.issues, ...payload.specialists, ...payload.resources].some(item => item.length < 2)) throw new Error("INVALID_MEETING_INPUT");
  return { title: Array.from(payload.topic).slice(0, 240).join(""), payload };
}
export function meetingFormatLabel(format: string, language: InterfaceLanguage) { return MEETING_FORMATS.find(x => x.value === format)?.[language] ?? format; }
export function deliveryLabel(format: string, language: InterfaceLanguage) { return format === "hybrid" ? language === "kk" ? "Аралас" : "Смешанный" : format === "online" ? "Онлайн" : "Офлайн"; }
export const STAGE_KINDS: StageKind[] = ["welcome", "training", "introduction", "grouping", "practice", "information", "game", "reflection", "closing"];
export function stageLabel(kind: StageKind, language: InterfaceLanguage) {
  const labels: Record<StageKind, [string, string]> = {
    welcome: ["Тёплая встреча", "Ерекше қарсы алу"], training: ["Психологический тренинг", "Психологиялық тренинг"],
    introduction: ["Раскрытие темы", "Тақырыпты ашу"], grouping: ["Объединение в группы", "Топқа бөлу"],
    practice: ["Интерактивная практика", "Интерактивті тәжірибе"], information: ["Информационный блок", "Ақпараттық бөлім"],
    game: ["Игра для родителей", "Ата-аналарға ойын"], reflection: ["Обратная связь", "Кері байланыс"], closing: ["Заключение", "Қорытынды"],
  };
  return labels[kind][language === "kk" ? 1 : 0];
}
const fields = (v: unknown, keys: string[]) => isRecord(v) && keys.every(key => isText(v[key]));
const collection = (v: unknown, keys: string[], min = 0, max = 100): v is Record<string, unknown>[] => Array.isArray(v) && v.length >= min && v.length <= max && v.every(x => fields(x, keys));

/** Retained output is untrusted. Validate every nested field used by the reader. */
export function isMeetingResult(v: unknown): v is MeetingResult {
  if (!isRecord(v) || v.schema_version !== "parent-meeting.v1") return false;
  if (!fields(v, ["title", "topic", "class_group", "institution_name", "goal", "format_reason", "reflection_sheet", "closing_script", "protocol_template"])) return false;
  if (!["school", "kindergarten"].includes(String(v.organization)) || !["offline", "online", "hybrid"].includes(String(v.delivery_format)) || !CONTENT_LANGUAGE_CODES.includes(v.language as MeetingInput["language"])) return false;
  if (!MEETING_FORMATS.some(x => x.value === v.selected_format && x.value !== "auto") || !isInteger(v.duration_minutes, 15, 180) || !isInteger(v.participant_count, 1, 300) || !isInteger(v.tokens_used, 0, 10000000)) return false;
  if (!["objectives", "outcomes", "assumptions", "preparation", "materials", "recommendations", "safety_notes", "references"].every(key => isTexts(v[key]))) return false;
  if (![[v.objectives, 2, 5], [v.outcomes, 2, 5], [v.preparation, 2, 10], [v.safety_notes, 3, 8]].every(([items, min, max]) => (items as unknown[]).length >= Number(min) && (items as unknown[]).length <= Number(max))) return false;
  if (!fields(v.concept, ["name", "description", "final_product"]) || !fields(v.invitation, ["title", "text", "date", "time", "venue"])) return false;
  if (!fields(v.reflection, ["title", "instructions", "host_script"]) || !isRecord(v.reflection) || !isTexts(v.reflection.questions) || v.reflection.questions.length < 2 || v.reflection.questions.length > 5) return false;
  if (!collection(v.stages, ["kind", "title", "method", "purpose", "host_script", "participant_action", "instructions", "expected_result", "transition"], 8, 9)) return false;
  let minute = 0;
  const expectedKinds = v.stages.length === 8 ? STAGE_KINDS.filter(x => x !== "grouping") : STAGE_KINDS;
  for (const [i, stage] of v.stages.entries()) {
    if (stage.kind !== expectedKinds[i] || !isTexts(stage.materials) || !isInteger(stage.duration_minutes, 1, 180) || stage.start_minute !== minute) return false;
    minute += Number(stage.duration_minutes);
    if (stage.end_minute !== minute) return false;
  }
  if (minute !== v.duration_minutes) return false;
  if (!collection(v.interactive_tasks, ["kind", "title", "method", "purpose", "host_script", "participant_action", "case_text", "product_example", "expected_result"], 2, 3)) return false;
  if (!v.interactive_tasks.every(x => ["case", "laboratory", "agreement"].includes(String(x.kind)) && ["materials", "steps"].every(key => isTexts(x[key])) && (x.steps as string[]).length >= 2 && (x.steps as string[]).length <= 8 && isInteger(x.duration_minutes, 1, 180))) return false;
  if (new Set(v.interactive_tasks.map(x => x.kind)).size !== v.interactive_tasks.length || !v.interactive_tasks.some(x => x.kind === "case" && String(x.case_text).trim().length >= 30)) return false;
  if (v.interactive_tasks.reduce((sum, x) => sum + Number(x.duration_minutes), 0) !== v.stages.find(x => x.kind === "practice")?.duration_minutes) return false;
  if (!collection(v.slides, ["title", "on_screen", "visual"], 8, 12) || !v.slides.every((x, i) => x.number === i + 1)) return false;
  if (!collection(v.training_cards, ["title", "instructions", "content"], 2, 8) || !collection(v.worksheets, ["task_title", "instructions", "content", "conclusion_question"], 2, 3)) return false;
  if (v.worksheets.length !== v.interactive_tasks.length || !v.worksheets.every((x, i) => x.task_title === (v.interactive_tasks as Record<string, unknown>[])[i].title)) return false;
  if (!fields(v.questionnaire, ["title", "instructions"]) || !isRecord(v.questionnaire) || typeof v.questionnaire.anonymous !== "boolean" || !collection(v.questionnaire.questions, ["question"], 5, 10) || !v.questionnaire.questions.every(x => isTexts(x.options) && x.options.length >= 2 && x.options.length <= 6)) return false;
  if (!collection(v.national_values, ["value", "action"], 1, 5) || !collection(v.digital_tools, ["name", "purpose", "prompt", "offline_alternative"], 0, 5)) return false;
  return Array.isArray(v.quality_checks) && v.quality_checks.every(x => isRecord(x) && isText(x.code) && isText(x.label) && typeof x.passed === "boolean") && (v.recommendations as string[]).length >= 5 && (v.recommendations as string[]).length <= 7;
}
