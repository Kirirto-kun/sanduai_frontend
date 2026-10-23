import { describe, expect, it } from "vitest";
import type { LessonPlanResponse, LessonSubBlock } from "@/lib/api";
import { cleanLessonRequest, createLessonDraft, editableLessonPlan, lessonExportPayload, lessonMinutes, safeSourceUrl, updateLessonBlock, validStudentCount, selectLessonProgramme, selectLessonObjectives, lessonValidationIssues, confirmLessonAssessmentReview, lessonApiErrorMessage } from "./model";
import type { CurriculumObjective } from "@/lib/api";
import { getDocumentCopy, lessonWarning } from "./copy";

const block: LessonSubBlock = {
  task_id: "task1", objective_ids: ["lo1"], minutes: 45, time: "45 мин", phase_name: "Задание",
  teacher_activity: "Исследуйте", student_activity: "Сравнивает", descriptors: [{ text: "Объясняет", points: 1 }],
  expected_result: "Сравнивает результаты", assessment_criteria: "Объясняет способ сравнения", inclusive_support: "Пошаговая опора",
  resource_urls: [], resource_materials: ["Бумага"],
  quiz: [{ text: "Сколько?", options: ["A) 1", "B) 2"], correct: "B" }],
  template_table: null,
};
const response: LessonPlanResponse = {
  planner_version: "open_lesson_v1", language: "russian",
  meta: { subject: "Математика", grade: "4", section_name: "", teacher_name: "", date: "", topic: "Числа", students_present: "", students_absent: "", learning_objectives: ["4.1.1.1 цель"], lesson_objectives: "Сравнивает", duration: 45 },
  flow: [{ stage_id: "middle", stage_name: "Середина", sub_blocks: [block], tasks: [{ work_type: "", method_name: "Старый метод", teacher_activity: "СТАРОЕ", student_activity: "", descriptors: [], resources: "", time_marker: null }] }],
  answer_keys: [{ task_ref: "task1", content: "Ответ 2", table: { caption: "Ключ", columns: ["Ответ"], rows: [["2"]] } }],
  knowledge: { version: "2026-10", status: "partial", warnings: ["Проверьте"], objectives: [], sources: [] },
};

describe("open lesson canonical editor", () => {
  it("exports the edited canonical block, preserving quizzes, answer tables and provenance without stale tasks", () => {
    const edited = updateLessonBlock(editableLessonPlan(structuredClone(response)), 0, 0, { teacher_activity: "НОВОЕ", individual_check: true });
    const exported = lessonExportPayload(edited);
    expect(exported.flow[0]).not.toHaveProperty("tasks");
    expect(exported.flow[0].sub_blocks?.[0]).toMatchObject({ teacher_activity: "НОВОЕ", task_id: "task1", objective_ids: ["lo1"], individual_check: true, quiz: block.quiz });
    expect(exported.answer_keys).toEqual(response.answer_keys);
    expect(exported.knowledge).toEqual(response.knowledge);
    expect(response.flow[0].sub_blocks?.[0].teacher_activity).toBe("Исследуйте");
  });
  it("converts legacy history only when canonical blocks are unavailable", () => {
    const legacy = editableLessonPlan({ ...response, flow: [{ ...response.flow[0], sub_blocks: undefined }] });
    expect(legacy.flow[0].sub_blocks[0].teacher_activity).toBe("СТАРОЕ");
    expect(legacy.flow[0]).not.toHaveProperty("tasks");
  });
  it("keeps an unknown legacy duration unverified instead of pretending its sum is zero", () => {
    expect(lessonMinutes(editableLessonPlan(structuredClone(response)))).toBe(45);
    expect(lessonMinutes(updateLessonBlock(editableLessonPlan(structuredClone(response)), 0, 0, { minutes: null }))).toBeNull();
  });
  it("submits open planner mode with selected IDs and separates teaching language from output language", () => {
    const draft = createLessonDraft();
    const cleaned = cleanLessonRequest({ ...draft, subject: "  Математика ", learning_objectives: [" ", "4.1.1.1 код"], resources: ["Бумага", ""], language: "russian", teaching_language: "kazakh", selected_objective_ids: ["official-1"] });
    expect(cleaned).toMatchObject({ planner_version: "open_lesson_v1", schema_version: "v2", duration: 45, teacher_name: "", section_name: "", student_count: null, subject: "Математика", learning_objectives: ["4.1.1.1 код"], resources: ["Бумага"], language: "russian", teaching_language: "kazakh", selected_objective_ids: ["official-1"] });
  });
  it("does not turn arbitrary source content into an executable link", () => {
    expect(safeSourceUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeSourceUrl("/invented-source")).toBeUndefined();
    expect(safeSourceUrl("https://adilet.zan.kz/kaz/docs/V2000020317")).toBe("https://adilet.zan.kz/kaz/docs/V2000020317");
  });
  it("keeps exact selected text as a fallback after a catalogue revision and strips UI-only state", () => {
    const cleaned = cleanLessonRequest({ ...createLessonDraft(), learning_objectives: ["4.1.1.1 Сравнить"], selected_objective_ids: ["old-id"], selected_objective_texts: ["4.1.1.1 Сравнить", "4.1.1.2 Объяснить"] });
    expect(cleaned.learning_objectives).toEqual(["4.1.1.1 Сравнить", "4.1.1.2 Объяснить"]);
    expect(cleaned).not.toHaveProperty("selected_objective_texts");
  });
  it("shows readable verification warnings instead of server codes", () => {
    expect(lessonWarning("academic_year_guidance_not_verified", false)).toContain("учебный год");
    expect(lessonWarning("edited_objectives_require_verification", true)).toContain("Ресми");
    expect(lessonWarning("some_future_code", false)).not.toContain("some_future_code");
  });
  it("accepts an optional class count and matches backend boundaries without coercing invalid values", () => {
    for (const value of [null, undefined, 1, 1000]) expect(validStudentCount(value)).toBe(true);
    for (const value of [0, -1, 1001, 1.5, NaN]) expect(validStudentCount(value)).toBe(false);
  });
  it("uses document-language stage and metadata labels for Kyrgyz and Uzbek output", () => {
    expect(getDocumentCopy("ky")).toMatchObject({ stageTime: "Сабактын этабы / убакыт", field: "Көрсөткүч" });
    expect(getDocumentCopy("uz")).toMatchObject({ stageTime: "Dars bosqichi / vaqt", details: "Ma’lumot" });
  });
  it("does not export a missing, non-finite or nonpositive new-profile activity duration", () => {
    for (const minutes of [null, undefined, 0, -1, NaN, Infinity, 1.5, 181]) {
      const edited = updateLessonBlock(editableLessonPlan(structuredClone(response)), 0, 0, { minutes });
      expect(lessonValidationIssues(edited, false).some((issue) => issue.path.endsWith("-minutes"))).toBe(true);
      expect(lessonMinutes(edited)).toBeNull();
    }
    expect(lessonValidationIssues(editableLessonPlan(structuredClone(response)), false)).toEqual([]);
  });
  it("keeps legacy unknown durations usable while requiring positive minutes for new plans", () => {
    const legacy = { ...editableLessonPlan(structuredClone(response)), planner_version: "legacy_v2" };
    legacy.flow[0].sub_blocks[0] = { ...block, minutes: undefined };
    expect(lessonValidationIssues(legacy, false)).toEqual([]);
  });
  it("recomputes rubric totals and retains note and answers until the teacher reconciles them", () => {
    const original = editableLessonPlan(structuredClone(response));
    original.quality_review = { status: "passed", corrections: 0, signature: "old-signature" };
    original.flow[0].sub_blocks[0] = { ...block, total_points: 1, assessment_note: "Итого 1 балл" };
    const edited = updateLessonBlock(original, 0, 0, { descriptors: [{ text: "Объясняет", points: 2 }] });
    expect(edited.quality_review).toEqual({ status: "edited", corrections: 0 });
    expect(edited.flow[0].sub_blocks[0]).toMatchObject({ total_points: 2, assessment_note: "Итого 1 балл" });
    expect(edited.answer_keys).toEqual(original.answer_keys);
    expect(lessonValidationIssues(edited, false).some((issue) => issue.path.endsWith("-assessment"))).toBe(true);
    const confirmed = confirmLessonAssessmentReview(edited, "task1");
    expect(confirmed.editor_review?.task_ids).toEqual([]);
    expect(lessonExportPayload(confirmed)).not.toHaveProperty("editor_review");
  });
  it("invalidates answer review when the actual task is edited, without losing the key", () => {
    const edited = updateLessonBlock(editableLessonPlan(structuredClone(response)), 0, 0, { free_text_content: "Новое условие" });
    expect(edited.editor_review?.task_ids).toContain("task1");
    expect(edited.answer_keys).toEqual(response.answer_keys);
  });
  it("allows journal assessment only with a valid maximum while keeping rubric totals independent", () => {
    const edited = editableLessonPlan(structuredClone(response));
    edited.meta.assessment_mode = "recorded_formative"; edited.meta.lesson_score_max = 10;
    edited.flow[0].sub_blocks[0] = { ...block, total_points: 30, descriptors: [{ text: "Действия", points: 30 }] };
    expect(lessonValidationIssues(edited, false)).toEqual([]);
    edited.meta.lesson_score_max = 7;
    expect(lessonValidationIssues(edited, false).some((issue) => issue.path === "assessment-mode")).toBe(true);
  });
  it("switches programme atomically and never mixes objectives from different tracks", () => {
    const first = { id: "a", program_id: "standard", code: "4.1.1.1", text: "Стандарт" } as CurriculumObjective;
    const second = { id: "b", program_id: "reduced", code: "4.1.1.1", text: "Сокращённая" } as CurriculumObjective;
    const draft = { ...createLessonDraft(), learning_objectives: ["Моя ручная цель"], program_id: "standard", selected_objectives: [first], selected_objective_ids: ["a"], selected_objective_texts: ["4.1.1.1 Стандарт"] };
    const switched = selectLessonProgramme(draft, "reduced");
    expect(switched).toMatchObject({ program_id: "reduced", selected_objectives: [], selected_objective_ids: [], selected_objective_texts: [], learning_objectives: ["Моя ручная цель"] });
    expect(selectLessonObjectives(switched, [first, second]).selected_objective_ids).toEqual(["b"]);
    expect(switched.selection_backup_texts).toEqual(["4.1.1.1 Стандарт"]);
    expect(cleanLessonRequest(switched)).not.toHaveProperty("selection_backup_texts");
    expect(draft.selected_objective_ids).toEqual(["a"]);
  });
  it("renders only allowlisted public document validation messages, including field issues", () => {
    expect(lessonApiErrorMessage({ status: 422, details: { detail: { code: "invalid_open_lesson_document", message: "Исправьте документ", issues: [{ path: "flow.1", message: "Укажите время" }] } } })).toBe("Исправьте документ\nУкажите время");
    expect(lessonApiErrorMessage({ status: 502, details: { detail: { code: "provider_error", message: "PRIVATE_PROVIDER_FAILURE" } } })).toBeUndefined();
  });
  it("blocks erased metadata and teacher/student actions only for the strict new profile", () => {
    const edited = editableLessonPlan(structuredClone(response));
    edited.meta.subject = " "; edited.meta.grade = ""; edited.meta.topic = ""; edited.meta.lesson_objectives = [" "];
    edited.flow[0].sub_blocks[0].teacher_activity = " "; edited.flow[0].sub_blocks[0].student_activity = "";
    expect(lessonValidationIssues(edited, false).map((issue) => issue.path)).toEqual(expect.arrayContaining(["meta-subject", "meta-grade", "meta-topic", "meta-lesson-objectives", "block-0-0-teacher", "block-0-0-student"]));
    edited.planner_version = "legacy_v2";
    expect(lessonValidationIssues(edited, false)).toEqual([]);
  });
  it("rejects incomplete quizzes without requiring a particular option-label format", () => {
    const edited = editableLessonPlan(structuredClone(response));
    const task = edited.flow[0].sub_blocks[0];
    for (const quiz of [
      [{ text: "", options: ["1", "2"], correct: "A" }],
      [{ text: "Вопрос", options: ["1", " "], correct: "A" }],
      [{ text: "Вопрос", options: ["A) 1", "A) 2"], correct: "A" }],
      [{ text: "Вопрос", options: ["1", "1"], correct: "A" }],
      [{ text: "Вопрос", options: ["1", "2"], correct: "Z" }],
      [{ text: "Вопрос", options: ["1"], correct: "A" }],
    ]) {
      task.quiz = quiz;
      expect(lessonValidationIssues(edited, false).some((issue) => issue.path.includes("-quiz-"))).toBe(true);
    }
    task.quiz = [{ text: "Сколько?", options: ["1", "2"], correct: "2" }];
    expect(lessonValidationIssues(edited, false)).toEqual([]);
  });
  it("blocks ragged task/answer tables but allows intentionally blank worksheet cells", () => {
    const edited = editableLessonPlan(structuredClone(response));
    edited.flow[0].sub_blocks[0].template_table = { caption: "Таблица", columns: ["Число", "Ответ"], rows: [["1"]] };
    edited.answer_keys![0].table = { caption: "Ответ", columns: [" "], rows: [["2"]] };
    expect(lessonValidationIssues(edited, false).map((issue) => issue.path)).toEqual(expect.arrayContaining(["block-0-0-table", "answer-0-table"]));
    edited.flow[0].sub_blocks[0].template_table!.rows = [["1", ""]];
    edited.answer_keys![0].table!.columns = ["Ответ"];
    expect(lessonValidationIssues(edited, false)).toEqual([]);
  });
  it("requires actual answer content or a populated answer table", () => {
    const edited = editableLessonPlan(structuredClone(response));
    edited.answer_keys![0] = { task_ref: "task1", content: " ", table: { caption: "Ключ", columns: ["Ответ"], rows: [[""]] } };
    expect(lessonValidationIssues(edited, false).some((issue) => issue.path === "answer-0-content")).toBe(true);
    edited.answer_keys![0].table!.rows[0][0] = "2";
    expect(lessonValidationIssues(edited, false)).toEqual([]);
  });
  it("requires main task material, criteria, support, exact answer mapping and final checks", () => {
    const edited = editableLessonPlan(structuredClone(response));
    const task = edited.flow[0].sub_blocks[0];
    task.quiz = null; task.expected_result = ""; task.assessment_criteria = ""; task.inclusive_support = "";
    edited.answer_keys![0].task_ref = "task10";
    edited.flow.push({ stage_id: "end", stage_name: "Конец", sub_blocks: [{ ...structuredClone(block), task_id: "reflection", minutes: 1 }] });
    expect(lessonValidationIssues(edited, false).map((issue) => issue.path)).toEqual(expect.arrayContaining(["block-0-0-material", "block-0-0-result", "block-0-0-criteria", "block-0-0-support", "answer-keys", "block-1-0-individual", "block-1-0-reflection"]));
  });
  it("cannot confirm an explicit stale assessment total without correcting it", () => {
    const edited = editableLessonPlan(structuredClone(response));
    edited.flow[0].sub_blocks[0].assessment_note = "Итого 3 балла";
    expect(lessonValidationIssues(confirmLessonAssessmentReview(edited, "task1"), false).some((issue) => issue.path === "block-0-0-assessment-note")).toBe(true);
    edited.flow[0].sub_blocks[0].assessment_note = "Обратная связь, шкала журнала 1–10 баллов";
    expect(lessonValidationIssues(edited, false)).toEqual([]);
  });
});
