import { describe, expect, it } from "vitest";
import { createLessonDraft, editableLessonPlan } from "./model";
import { clearLessonSession, lessonSessionKey, readLessonDraft, readLessonEdits, saveLessonDraft, saveLessonEdits } from "./persistence";
import type { LessonPlanResponse } from "@/lib/api";

function storage() {
  const entries = new Map<string, string>();
  return { entries, getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); }, removeItem: (key: string) => { entries.delete(key); } };
}
const plan = editableLessonPlan({
  meta: { subject: "Математика", grade: "4", section_name: "", teacher_name: "", date: "", topic: "Тема", students_present: "", students_absent: "", learning_objectives: ["4.1.1.1"], lesson_objectives: "Объясняет" },
  flow: [{ stage_name: "Середина", sub_blocks: [{ time: "45 мин", minutes: 45, phase_name: "Задание", teacher_activity: "Правка учителя", student_activity: "Объясняет", descriptors: [{ text: "Сравнил", points: 1 }], resource_urls: [], resource_materials: [], quiz: [{ text: "Вопрос", options: ["A", "B"], correct: "B" }] }] }],
  answer_keys: [{ task_ref: "Задание", content: "Ответ B" }],
} satisfies LessonPlanResponse);

describe("lesson tab persistence", () => {
  it("restores the teacher's draft and selected objective fallback without storing large images", () => {
    const store = storage();
    const draft = { ...createLessonDraft(), topic: "Мой урок", textbook_images: ["data:image/png;base64,PRIVATE_IMAGE"], selected_objective_ids: ["official-1"], selected_objective_texts: ["4.1.1.1 Сравнить"] };
    expect(saveLessonDraft(store, "teacher-1", draft)).toBe(true);
    expect(readLessonDraft(store, "teacher-1")).toMatchObject({ omittedImages: 1, draft: { topic: "Мой урок", textbook_images: [], selected_objective_ids: ["official-1"], selected_objective_texts: ["4.1.1.1 Сравнить"] } });
    expect(Array.from(store.entries.values()).join("")).not.toContain("PRIVATE_IMAGE");
  });
  it("separates accounts and jobs, preserving canonical rich content only in its own scope", () => {
    const store = storage();
    saveLessonEdits(store, "teacher-1", "job-1", plan);
    expect(readLessonEdits(store, "teacher-1", "job-1")).toEqual(plan);
    expect(readLessonEdits(store, "teacher-2", "job-1")).toBeNull();
    expect(readLessonEdits(store, "teacher-1", "job-2")).toBeNull();
    expect(lessonSessionKey(null)).toBeNull();
  });
  it("discards malformed, foreign-owner and unsupported-version snapshots", () => {
    const store = storage();
    const key = lessonSessionKey("teacher-1")!;
    for (const value of ["{broken", JSON.stringify({ version: 1, user_id: "teacher-2", job_id: null, draft: createLessonDraft() }), JSON.stringify({ version: 99, user_id: "teacher-1", job_id: null, draft: createLessonDraft() })]) {
      store.setItem(key, value);
      expect(readLessonDraft(store, "teacher-1")).toBeNull();
    }
  });
  it("handles blocked storage and quota exhaustion without claiming success", () => {
    const blocked = { getItem: () => { throw new Error("SecurityError"); }, setItem: () => { throw new Error("QuotaExceededError"); }, removeItem: () => { throw new Error("SecurityError"); } };
    expect(readLessonDraft(blocked, "teacher-1")).toBeNull();
    expect(saveLessonDraft(blocked, "teacher-1", { ...createLessonDraft(), topic: "Тема" })).toBe(false);
    expect(saveLessonEdits(blocked, "teacher-1", "job-1", plan)).toBe(false);
    expect(clearLessonSession(blocked, "teacher-1", "job-1")).toBe(false);
  });
  it("new-plan cleanup removes the current draft and edits without touching another job or user", () => {
    const store = storage();
    saveLessonDraft(store, "teacher-1", { ...createLessonDraft(), topic: "Старый урок" });
    saveLessonEdits(store, "teacher-1", "job-1", plan);
    saveLessonEdits(store, "teacher-1", "job-2", plan);
    saveLessonDraft(store, "teacher-2", { ...createLessonDraft(), topic: "Чужой урок" });
    expect(clearLessonSession(store, "teacher-1", "job-1")).toBe(true);
    expect(saveLessonDraft(store, "teacher-1", createLessonDraft())).toBe(true);
    expect(readLessonDraft(store, "teacher-1")).toBeNull();
    expect(readLessonEdits(store, "teacher-1", "job-1")).toBeNull();
    expect(readLessonEdits(store, "teacher-1", "job-2")).toEqual(plan);
    expect(readLessonDraft(store, "teacher-2")?.draft.topic).toBe("Чужой урок");
  });
});
