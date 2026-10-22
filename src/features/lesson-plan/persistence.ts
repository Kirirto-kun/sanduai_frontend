import { createLessonDraft, editableLessonPlan, type EditableLessonPlan, type LessonPlanDraft } from "./model";
import type { LessonPlanResponse } from "@/lib/api";

type SessionStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const PREFIX = "sanduai:open-lesson:v1:";

export function lessonSessionStore(): SessionStore | null {
  try { return typeof window === "undefined" ? null : window.sessionStorage; }
  catch { return null; }
}

export function lessonSessionKey(userId: string | null, jobId?: string): string | null {
  return userId ? `${PREFIX}${encodeURIComponent(userId)}:${jobId ? `job:${encodeURIComponent(jobId)}` : "draft"}` : null;
}

function read(store: SessionStore, userId: string | null, jobId?: string): Record<string, unknown> | null {
  const key = lessonSessionKey(userId, jobId);
  if (!key) return null;
  try {
    const raw = store.getItem(key);
    if (!raw || raw.length > 2_000_000) return null;
    const value = JSON.parse(raw);
    return value?.version === 1 && value.user_id === userId && value.job_id === (jobId ?? null) ? value : null;
  } catch { return null; }
}

const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");

export function readLessonDraft(store: SessionStore, userId: string | null): { draft: LessonPlanDraft; omittedImages: number } | null {
  const saved = read(store, userId);
  const value = saved?.draft;
  if (!value || typeof value !== "object") return null;
  const draft = value as LessonPlanDraft;
  if (![draft.subject, draft.grade, draft.topic, draft.teacher_name, draft.section_name].every((item) => typeof item === "string") || !strings(draft.learning_objectives)) return null;
  if (draft.selected_objective_ids && !strings(draft.selected_objective_ids)) return null;
  if (draft.selected_objective_texts && !strings(draft.selected_objective_texts)) return null;
  if (draft.resources && !strings(draft.resources)) return null;
  if (draft.selected_objectives && (!Array.isArray(draft.selected_objectives) || !draft.selected_objectives.every((item) => item && typeof item.id === "string" && typeof item.code === "string" && typeof item.text === "string"))) return null;
  return { draft: { ...createLessonDraft(), ...draft, textbook_images: [] }, omittedImages: typeof saved?.omitted_images === "number" ? saved.omitted_images : 0 };
}

function write(store: SessionStore, userId: string | null, data: Record<string, unknown>, jobId?: string): boolean {
  const key = lessonSessionKey(userId, jobId);
  if (!key) return false;
  try {
    const text = JSON.stringify({ version: 1, user_id: userId, job_id: jobId ?? null, ...data });
    if (text.length > 2_000_000) return false;
    store.setItem(key, text); return true;
  } catch { return false; }
}

export function saveLessonDraft(store: SessionStore, userId: string | null, draft: LessonPlanDraft): boolean {
  const { textbook_images = [], ...withoutImages } = draft;
  const { textbook_images: emptyImages, ...emptyDraft } = createLessonDraft();
  void emptyImages;
  if (!textbook_images.length && JSON.stringify(withoutImages) === JSON.stringify(emptyDraft)) return clearLessonSession(store, userId);
  return write(store, userId, { draft: { ...withoutImages, textbook_images: [] }, omitted_images: textbook_images.length });
}

export function readLessonEdits(store: SessionStore, userId: string | null, jobId: string): EditableLessonPlan | null {
  const saved = read(store, userId, jobId);
  const plan = saved?.plan as LessonPlanResponse | undefined;
  if (!plan?.meta || !strings(plan.meta.learning_objectives) || !Array.isArray(plan.flow)) return null;
  try {
    const editable = editableLessonPlan(plan);
    if (!editable.flow.every((stage) => typeof stage.stage_name === "string" && stage.sub_blocks.every((block) => typeof block.teacher_activity === "string" && typeof block.student_activity === "string" && Array.isArray(block.descriptors) && strings(block.resource_urls) && strings(block.resource_materials)))) return null;
    return editable;
  } catch { return null; }
}

export function saveLessonEdits(store: SessionStore, userId: string | null, jobId: string, plan: EditableLessonPlan): boolean {
  return write(store, userId, { plan }, jobId);
}

export function clearLessonSession(store: SessionStore, userId: string | null, jobId?: string): boolean {
  try {
    const draftKey = lessonSessionKey(userId);
    const jobKey = jobId ? lessonSessionKey(userId, jobId) : null;
    if (draftKey) store.removeItem(draftKey);
    if (jobKey) store.removeItem(jobKey);
    return Boolean(userId);
  } catch { return false; }
}
