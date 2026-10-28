import { describe, expect, it } from "vitest";
import type { LessonPlanResponse } from "@/lib/api";
import { classicLessonExportPayload, createClassicLessonDraft, editableClassicLesson, isClassicLessonResult, updateClassicLessonBlock } from "./model";

const historical = (): LessonPlanResponse => ({
  language: "russian", meta: { section_name: "Дроби", subject: "Математика", teacher_name: "Учитель", date: "",
    grade: "5", students_present: "", students_absent: "", topic: "Доли", learning_objectives: ["5.1.1.9"], lesson_objectives: "Распознать доли" },
  flow: [{ stage_name: "Начало", stage_id: "start", tasks: [{ work_type: "ИР", method_name: "Проверка", teacher_activity: "Старый дубль", student_activity: "Старый ответ", descriptors: ["Старый дескриптор"], resources: "Старая карточка", time_marker: "5 мин" }],
    sub_blocks: [{ time: "5 мин", phase_name: "Проверка", teacher_activity: "Основная инструкция", student_activity: "Отвечает", descriptors: [{ text: "Верный ответ", points: 2 }], resource_urls: ["https://example.com"], resource_materials: ["Карточки"], quiz: [{ text: "Вопрос", options: ["A) один", "B) два"], correct: "B" }] }], homework: "Задание 1" }],
  answer_keys: [{ task_ref: "Проверка", content: "Две доли" }],
});

describe("classic lesson restoration", () => {
  it("selects the historical planner explicitly and keeps its manual fields", () => {
    expect(createClassicLessonDraft()).toMatchObject({ planner_version: "legacy_v2", schema_version: "v2", learning_objectives: [""], lesson_number: "1" });
  });

  it("recognizes historical unmarked plans while keeping open lessons separate", () => {
    expect(isClassicLessonResult(historical())).toBe(true);
    expect(isClassicLessonResult({ ...historical(), planner_version: "legacy_v2" })).toBe(true);
    expect(isClassicLessonResult({ ...historical(), planner_version: "open_lesson_v1" })).toBe(false);
    expect(isClassicLessonResult({})).toBe(false);
  });

  it("exports the edited canonical instruction, descriptors and resources with no stale shim", () => {
    const original = historical();
    let plan = editableClassicLesson(original);
    plan = updateClassicLessonBlock(plan, 0, 0, { teacher_activity: "Покажите три доли", student_activity: "Показывает три доли", descriptors: [{ text: "Выделил три доли", points: 3 }], resource_materials: ["Новые карточки"] });
    const exported = classicLessonExportPayload(plan);
    expect(exported.flow[0]).not.toHaveProperty("tasks");
    expect(exported.flow[0].sub_blocks?.[0]).toMatchObject({ teacher_activity: "Покажите три доли", student_activity: "Показывает три доли", descriptors: [{ text: "Выделил три доли", points: 3 }], resource_materials: ["Новые карточки"], resource_urls: ["https://example.com"], quiz: original.flow[0].sub_blocks?.[0].quiz });
    expect(exported.answer_keys).toEqual(original.answer_keys);
    expect(exported.flow[0].homework).toBe("Задание 1");
    expect(exported.meta.lesson_objectives).toEqual(["Распознать доли"]);
    expect(original.flow[0].sub_blocks?.[0].teacher_activity).toBe("Основная инструкция");
  });

  it("converts older task-only history into editable canonical blocks", () => {
    const original = historical();
    delete original.flow[0].sub_blocks;
    const exported = classicLessonExportPayload(updateClassicLessonBlock(editableClassicLesson(original), 0, 0, { teacher_activity: "Правка старого задания" }));
    expect(exported.flow[0].sub_blocks?.[0].teacher_activity).toBe("Правка старого задания");
    expect(exported.flow[0].sub_blocks?.[0].resource_materials).toEqual(["Старая карточка"]);
  });
});
