import { describe, expect, it } from "vitest";
import { canonicalWorkType, humanTaskLabel, taskReferenceOptions, workTypeOptions } from "./editor-labels";
import { lessonExportPayload, type EditableLessonPlan } from "./model";
import type { LessonSubBlock } from "@/lib/api";

const block: LessonSubBlock = { task_id: "task1", phase_name: "Сандарды салыстыру", work_type: "pair", time: "5 мин", minutes: 5, teacher_activity: "Салыстырыңыз", student_activity: "Салыстырады", descriptors: [], resource_urls: [], resource_materials: [] };
const plan: EditableLessonPlan = { meta: { subject: "Математика", grade: "4", topic: "Сандар", section_name: "", teacher_name: "", date: "", students_present: "", students_absent: "", learning_objectives: [], lesson_objectives: "" }, flow: [{ stage_name: "Сабақтың ортасы", sub_blocks: [block] }], answer_keys: [{ task_ref: "task1", content: "Жауабы" }] };

describe("teacher-facing editor labels", () => {
  it("shows localized work-format labels while retaining canonical select values", () => {
    expect(workTypeOptions(false).find((option) => option.value === "whole_class")?.label).toBe("Фронтальная работа");
    expect(workTypeOptions(true).find((option) => option.value === "pair")?.label).toBe("Жұптық жұмыс");
    expect(canonicalWorkType("ЖЖ")).toBe("individual");
    expect(canonicalWorkType("peer_pair")).toBe("peer_pair");
    expect(canonicalWorkType("__proto__")).toBeUndefined();
  });
  it("labels stable answer references with the actual task title without mutating the export ID", () => {
    expect(taskReferenceOptions(plan, "task1", 0, false)).toContainEqual({ value: "task1", label: "Сандарды салыстыру" });
    expect(lessonExportPayload(plan).answer_keys?.[0].task_ref).toBe("task1");
    expect(lessonExportPayload(plan).flow[0].sub_blocks?.[0].work_type).toBe("pair");
  });
  it("keeps legacy phase-name references and hides orphaned internal IDs behind a readable label", () => {
    expect(taskReferenceOptions(plan, "Сандарды салыстыру", 0, true)).toContainEqual({ value: "Сандарды салыстыру", label: "Сандарды салыстыру" });
    expect(taskReferenceOptions(plan, "engage", 2, false)).toContainEqual({ value: "engage", label: "Задание 3" });
    expect(humanTaskLabel({ ...block, phase_name: "task1", method_name: null }, 0, true)).toBe("Тапсырма 1");
  });
});
