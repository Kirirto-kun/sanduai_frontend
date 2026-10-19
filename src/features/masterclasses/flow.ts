import type { MasterclassConfigInput } from "@/features/masterclass-admin/types";
import type { Locale, MasterclassInput } from "./types";
export function blankMasterclassInput(language: Locale): MasterclassInput { return { institution_type: "school", audience_id: "", topic: "", goal: "", duration_minutes: 60, participant_count: 20, format_id: "offline", style_id: "practical", direction_ids: [], difficulty_level: "beginner", language, include_host_speech: true, include_case: true, library_mode: "standard", context: "", available_resources: "" }; }
export function alignMasterclassInput(input: MasterclassInput, config: MasterclassConfigInput): MasterclassInput {
  const known = (id: string, options: { id: string }[]) => options.some(item => item.id === id) ? id : options[0]?.id ?? "";
  const institution = known(input.institution_type, config.institutions);
  return { ...input, institution_type: institution, audience_id: known(input.audience_id, config.audiences.filter(item => item.institution_types.includes(institution))), format_id: known(input.format_id, config.formats), style_id: known(input.style_id, config.styles), difficulty_level: known(input.difficulty_level, config.difficulties), direction_ids: input.direction_ids.filter(id => config.directions.some(item => item.id === id)).slice(0, 5), language: config.languages.includes(input.language) ? input.language : config.languages[0], duration_minutes: Math.max(config.min_duration_minutes, Math.min(config.max_duration_minutes, input.duration_minutes)), library_mode: institution === "library" ? input.library_mode : "standard" };
}
export function validateMasterclassStep(input: MasterclassInput, config: MasterclassConfigInput, step: number): string | null {
  if (step === 0 && (!config.institutions.some(item => item.id === input.institution_type) || !config.audiences.some(item => item.id === input.audience_id && item.institution_types.includes(input.institution_type)))) return "audience";
  if (step === 1 && (input.topic.trim().length < 5 || input.topic.length > 300)) return "topic";
  if (step === 2) {
    if (!Number.isInteger(input.duration_minutes) || input.duration_minutes < config.min_duration_minutes || input.duration_minutes > config.max_duration_minutes) return "duration";
    if (!Number.isInteger(input.participant_count) || input.participant_count < 1 || input.participant_count > 1000) return "participants";
    if (!input.direction_ids.length || input.direction_ids.length > 5 || new Set(input.direction_ids).size !== input.direction_ids.length || input.direction_ids.some(id => !config.directions.some(item => item.id === id))) return "directions";
    if (!config.formats.some(item => item.id === input.format_id) || !config.styles.some(item => item.id === input.style_id) || !config.difficulties.some(item => item.id === input.difficulty_level) || !config.languages.includes(input.language)) return "options";
  }
  return null;
}
export function masterclassInputIsValid(input: MasterclassInput, config: MasterclassConfigInput) { return [0, 1, 2].every(step => !validateMasterclassStep(input, config, step)); }
export function isMasterclassDraft(value: unknown): value is MasterclassInput {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<MasterclassInput>;
  return [v.institution_type, v.audience_id, v.topic, v.goal, v.format_id, v.style_id, v.difficulty_level, v.context, v.available_resources].every(item => typeof item === "string") && Array.isArray(v.direction_ids) && v.direction_ids.every(item => typeof item === "string") && typeof v.duration_minutes === "number" && Number.isFinite(v.duration_minutes) && typeof v.participant_count === "number" && Number.isFinite(v.participant_count) && ["kk", "ru", "en", "ky"].includes(v.language ?? "") && typeof v.include_host_speech === "boolean" && typeof v.include_case === "boolean" && ["standard", "exhibition", "reading_club", "qr_quest", "literary_evening", "book_discussion", "author_evening", "poetry", "children_reading"].includes(v.library_mode ?? "");
}
