import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlannerEditor } from "./PlannerEditor";
import { AssessmentModeField } from "./AssessmentModeField";
import { type EditableLessonPlan, updateLessonBlock } from "./model";

function plan(): EditableLessonPlan {
  return {
    planner_version: "open_lesson_v1", language: "russian", quality_review: { status: "passed", corrections: 0 },
    meta: { subject: "Математика", grade: "4", duration: 45, section_name: "", teacher_name: "", date: "", students_present: "", students_absent: "", topic: "Числа", learning_objectives: [], lesson_objectives: "Сравнивает" },
    flow: [{ stage_name: "Середина", sub_blocks: [{ task_id: "task1", phase_name: "Сравнение", teacher_activity: "Сравните числа", student_activity: "Объясняет", minutes: 45, time: "45 мин", descriptors: [{ text: "Доказал", points: 1 }], resource_materials: [], resource_urls: [] }] }],
  };
}
function html(value: EditableLessonPlan): string {
  return renderToStaticMarkup(createElement(PlannerEditor, { plan: value, onChange() {}, kk: false, onExport() {}, exporting: false, onNew() {}, error: "" }));
}

describe("teacher editor export safeguards", () => {
  it("uses the fixed official journal scale and offers repair for an old arbitrary maximum", () => {
    const rendered = renderToStaticMarkup(createElement(AssessmentModeField, { grade: "4", mode: "recorded_formative", scoreMax: 7, onChange() {}, kk: false }));
    expect(rendered).toContain("Максимум — 10");
    expect(rendered).toContain("Использовать шкалу 1–10 баллов");
    expect(rendered).not.toContain('type="number"');
  });
  it("blocks export with a linked field error when an activity duration is cleared", () => {
    const value = plan(); value.flow[0].sub_blocks[0].minutes = null;
    const rendered = html(value);
    expect(rendered).toContain('href="#block-0-0-minutes"');
    expect(rendered).toMatch(/<input[^>]*id="block-0-0-minutes"[^>]*aria-invalid="true"/);
    expect(rendered).toMatch(/<button[^>]*disabled=""[^>]*>Скачать Word<\/button>/);
  });
  it("explains a stale review and keeps original assessment material after score edits", () => {
    const value = plan(); value.flow[0].sub_blocks[0].assessment_note = "Итого 1 балл";
    const edited = updateLessonBlock(value, 0, 0, { descriptors: [{ text: "Доказал", points: 2 }] });
    const rendered = html(edited);
    expect(rendered).toContain("План изменён");
    expect(rendered).toContain("Итого 1 балл");
    expect(rendered).toContain("Примечание и ответы согласованы");
    expect(rendered).toMatch(/<button[^>]*disabled=""[^>]*>Скачать Word<\/button>/);
  });
  it("keeps a usable legacy document without claiming its content was checked", () => {
    const value = plan(); value.planner_version = "legacy_v2"; value.quality_review = null; value.flow[0].sub_blocks[0].minutes = null;
    const rendered = html(value);
    expect(rendered).toContain("Автоматическая проверка содержания этой версии не подтверждена");
    expect(rendered).not.toMatch(/<button[^>]*disabled=""[^>]*>Скачать Word<\/button>/);
  });
  it("links erased actions, invalid quiz fields and empty answers to their editable controls", () => {
    const value = plan(); const task = value.flow[0].sub_blocks[0];
    task.teacher_activity = ""; task.student_activity = "";
    task.quiz = [{ text: "", options: ["один", "один"], correct: "Z" }];
    value.answer_keys = [{ task_ref: "task1", content: "", table: { caption: "Ключ", columns: [""], rows: [[""]] } }];
    const rendered = html(value);
    for (const id of ["block-0-0-teacher", "block-0-0-student", "block-0-0-quiz-0-text", "block-0-0-quiz-0-options", "block-0-0-quiz-0-correct", "answer-0-content", "answer-0-table"]) {
      expect(rendered).toContain(`href="#${id}"`);
      expect(rendered).toContain(`id="${id}"`);
    }
    expect(rendered).toMatch(/<textarea[^>]*id="block-0-0-teacher"[^>]*aria-invalid="true"/);
    expect(rendered).toMatch(/<button[^>]*disabled=""[^>]*>Скачать Word<\/button>/);
    expect(rendered).toContain("Добавить ответ");
  });
  it("keeps surplus table content visible for explicit repair when columns are removed", () => {
    const value = plan();
    value.flow[0].sub_blocks[0].template_table = { caption: "Данные", columns: ["Число"], rows: [["1", "Сохранённый ответ"]] };
    const rendered = html(value);
    expect(rendered).toContain('href="#block-0-0-table"');
    expect(rendered).toContain("Сохранённый ответ");
    expect(rendered).toContain("Удалить лишнюю ячейку");
  });
});
