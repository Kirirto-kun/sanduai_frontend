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
});
