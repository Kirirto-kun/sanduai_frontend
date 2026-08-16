import { describe, expect, it } from "vitest";
import { MATERIAL_TYPE_CONFIG } from "./config";

describe("open lesson upload rules", () => {
  const rules = MATERIAL_TYPE_CONFIG.open_lesson.assets;

  it("keeps the presentation and cover upload options", () => {
    const presentation = rules.find((rule) => rule.role === "presentation");
    const cover = rules.find((rule) => rule.role === "preview");

    expect(presentation).toMatchObject({
      required: true,
      extensions: ["pptx"],
    });
    expect(cover?.extensions).toEqual(expect.arrayContaining(["jpg", "jpeg"]));
  });

  it("allows an optional Word lesson plan in the safe DOCX format", () => {
    const plan = rules.find((rule) => rule.role === "plan");

    expect(plan).toBeDefined();
    expect(plan?.required).not.toBe(true);
    expect(plan?.extensions).toEqual(["docx"]);
    expect(plan?.accept).toContain("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(plan?.accept).not.toContain("application/msword");
    expect(plan?.accept.split(",")).not.toContain(".doc");
    expect(plan?.label).toEqual({
      ru: "План урока (Word)",
      kk: "Сабақ жоспары (Word)",
    });
    expect(plan?.hint.ru).toContain("Старый DOC пересохраните");
    expect(plan?.hint.kk).toContain("Ескі DOC файлын");
  });

  it("does not change the separate open-lesson template type", () => {
    const templateRoles = MATERIAL_TYPE_CONFIG.open_lesson_subject_template.assets.map(
      (rule) => rule.role,
    );

    expect(templateRoles).toEqual(["presentation", "preview"]);
  });
});
