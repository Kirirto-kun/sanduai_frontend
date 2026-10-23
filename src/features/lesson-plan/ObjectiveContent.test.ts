import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CurriculumObjective } from "@/lib/api";
import { lessonCurriculumAssetUrl } from "@/lib/api";
import { ObjectiveContent, readableObjectiveText } from "./ObjectiveContent";
import { programmeLabel } from "./CurriculumPicker";
import { teachingLanguageOptions, documentLanguageOptions } from "./PlannerForm";

describe("official rich curriculum content", () => {
  it("keeps formulas in their original position as bundled images without exposing internal markers", () => {
    const objective = { text: "Решить [formula:abc123]", rich_fragments: [{ type: "text", text: "Решить " }, { type: "image", asset_id: "abc123", source_url: "https://official.example/formula.png", sha256: "abc123", mime_type: "image/png" }, { type: "text", text: " и проверить" }] } as CurriculumObjective;
    const html = renderToStaticMarkup(createElement(ObjectiveContent, { objective, kk: false }));
    expect(html).toContain("/api/kmzh/curriculum-assets/abc123");
    expect(html).toContain('alt="Формула из официальной программы"');
    expect(html).not.toContain("[formula:");
    expect(html).not.toContain('src="https://official.example');
    expect(html.indexOf("Решить")).toBeLessThan(html.indexOf("<img"));
    expect(html.indexOf("<img")).toBeLessThan(html.indexOf("и проверить"));
  });
  it("makes incomplete legacy formula text readable without inventing its mathematical content", () => {
    expect(readableObjectiveText("Решить [formula:old]", false)).toBe("Решить [формула из официальной программы]");
    expect(lessonCurriculumAssetUrl("../secret")).toBeUndefined();
    expect(lessonCurriculumAssetUrl("b6546ed1187b222d7c6b18f9.jpg")).toContain("/api/kmzh/curriculum-assets/b6546ed1187b222d7c6b18f9.jpg");
  });
  it("distinguishes school type, stream and reduced load in programme choices", () => {
    expect(programmeLabel({ program_id: "399:a105:rus:reduced", program_title: "Алгебра", school_type: "general", stream: "natural_science_math", workload: "reduced" }, false)).toContain("Естественно-математическое направление");
    expect(programmeLabel({ program_id: "399:a105:rus:reduced", workload: "reduced" }, false)).toContain("Сокращённая учебная нагрузка");
  });
  it("keeps catalogue teaching languages independent of document translation languages", () => {
    expect(teachingLanguageOptions.map(([id]) => id)).toEqual(["kazakh", "russian", "uzbek", "uyghur", "tajik"]);
    expect(documentLanguageOptions.map(([id]) => id)).toEqual(["kazakh", "russian", "english", "kyrgyz", "uzbek"]);
  });
});
