import { describe, expect, it } from "vitest";
import { audienceMatches, configInput, nextDuration, renameInstitution, replaceVisibleAudiences, validateConfig } from "./model";
import type { MasterclassConfig, MasterclassLabels } from "./types";

const labels = (name: string): MasterclassLabels => ({ kk: `${name} қазақша`, ru: `${name} русский`, en: `${name} English`, ky: `${name} кыргызча` });
const institutions = ["school", "kindergarten", "library", "college", "mixed"];
function fixture(): MasterclassConfig {
  return {
    version: 7,
    updated_at: "2026-10-07T00:00:00Z",
    institutions: institutions.map(id => ({ id, label: labels(id) })),
    audiences: institutions.map(id => ({ id: `${id}_audience`, label: labels(id), institution_types: [id] })),
    formats: [{ id: "offline", label: labels("offline") }],
    styles: [{ id: "practical", label: labels("practical") }],
    directions: [{ id: "reading", label: labels("reading") }],
    difficulties: [{ id: "beginner", label: labels("beginner") }],
    duration_options: [20, 30, 45, 60, 90, 120],
    min_duration_minutes: 15,
    max_duration_minutes: 240,
    languages: ["kk", "ru", "en", "ky"],
    token_cost: 30,
    topics_token_cost: 5,
    action_token_cost: 8,
    model: "deepseek-v4-pro",
    system_prompt: "Create an audience-specific practical workshop with exact timing, concrete materials and a participant product. Keep theory short and give complete activity steps.",
    export_template: { accent_color: "#4338CA", font_family: "Arial", footer: labels("Sandu AI") },
    file_formats: ["docx", "pdf", "pptx", "zip"],
    interactive_templates: [{ id: "quiz", label: labels("quiz"), kind: "quiz", prompt: "Create a quiz based on the workshop learning outcomes." }],
  };
}

describe("masterclass admin configuration guards", () => {
  it("supports all five merged institution types and four content languages", () => {
    const config = fixture();
    expect(validateConfig(configInput(config))).toBeNull();
    expect(config.institutions.map(item => item.id)).toEqual(institutions);
    expect(config.languages).toEqual(["kk", "ru", "en", "ky"]);
    expect(audienceMatches(config.audiences[2], "library")).toBe(true);
    expect(audienceMatches(config.audiences[2], "school")).toBe(false);
  });

  it("catches an institution removal that would orphan audiences", () => {
    const config = configInput(fixture());
    config.institutions = config.institutions.filter(item => item.id !== "library");
    expect(validateConfig(config)).toMatchObject({ tab: "audiences" });
  });

  it("renames a custom institution without losing audience mappings", () => {
    const config = configInput(fixture());
    const patch = renameInstitution(config, 2, "community_library");
    const next = { ...config, ...patch };
    expect(next.audiences[2].institution_types).toEqual(["community_library"]);
    expect(validateConfig(next)).toBeNull();
    expect(config.audiences[2].institution_types).toEqual(["library"]);
  });

  it("keeps unrelated audiences and their order when editing a filtered school list", () => {
    const all = fixture().audiences;
    const visible = all.filter(item => audienceMatches(item, "school"));
    const changed = [{ ...visible[0], label: { ...visible[0].label, en: "New school audience" } }];
    const result = replaceVisibleAudiences(all, visible, changed);
    expect(result[0].label.en).toBe("New school audience");
    expect(result.slice(1)).toEqual(all.slice(1));
    expect(all[0].label.en).toBe("school English");
  });

  it("reports a missing translation with the language to show in the editor", () => {
    const config = configInput(fixture());
    config.audiences[2].label.ky = "";
    expect(validateConfig(config)).toMatchObject({ tab: "audiences", label_language: "ky" });
  });

  it("rejects duplicate IDs and durations outside the administrator's range", () => {
    const config = configInput(fixture());
    expect(validateConfig({ ...config, formats: [config.formats[0], config.formats[0]] })).toMatchObject({ tab: "formats" });
    expect(validateConfig({ ...config, duration_options: [20, 20] })).toMatchObject({ tab: "generation" });
    expect(validateConfig({ ...config, max_duration_minutes: 60 })).toMatchObject({ tab: "generation" });
    expect(validateConfig({ ...config, min_duration_minutes: 5 })).toMatchObject({ tab: "generation" });
  });

  it("requires an available language, valid prices and a substantive prompt", () => {
    const config = configInput(fixture());
    expect(validateConfig({ ...config, languages: [] })).toMatchObject({ tab: "generation" });
    expect(validateConfig({ ...config, token_cost: -1 })).toMatchObject({ tab: "generation" });
    expect(validateConfig({ ...config, action_token_cost: 1.5 })).toMatchObject({ tab: "generation" });
    expect(validateConfig({ ...config, system_prompt: "Make a workshop" })).toMatchObject({ tab: "prompts" });
  });

  it("never creates a repeated time option when the configured range is nearly full", () => {
    expect(nextDuration({ min_duration_minutes: 15, max_duration_minutes: 16, duration_options: [15] })).toBe(16);
    expect(nextDuration({ min_duration_minutes: 15, max_duration_minutes: 16, duration_options: [15, 16] })).toBeNull();
  });

  it("validates export template translations and its accent color", () => {
    const config = configInput(fixture());
    expect(validateConfig({ ...config, export_template: { ...config.export_template, accent_color: "red" } })).toMatchObject({ tab: "materials" });
    expect(validateConfig({ ...config, export_template: { ...config.export_template, footer: { ...config.export_template.footer, en: "" } } })).toMatchObject({ tab: "materials", label_language: "en" });
    expect(validateConfig({ ...config, file_formats: [] })).toMatchObject({ tab: "materials" });
    expect(validateConfig({ ...config, interactive_templates: [] })).toBeNull();
  });

  it("omits server version and timestamp from the full editable payload", () => {
    const config = fixture();
    const input = configInput(config);
    expect(input).not.toHaveProperty("version");
    expect(input).not.toHaveProperty("updated_at");
    expect(config.version).toBe(7);
    expect(input.export_template).toEqual(config.export_template);
  });
});
