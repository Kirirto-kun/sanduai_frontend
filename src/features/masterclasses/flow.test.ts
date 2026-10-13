import { describe, expect, it } from "vitest";
import type { MasterclassConfigInput, MasterclassLabels } from "@/features/masterclass-admin/types";
import { alignMasterclassInput, blankMasterclassInput, isMasterclassDraft, masterclassInputIsValid, validateMasterclassStep } from "./flow";
import type { MasterclassInput } from "./types";

const label = (text: string): MasterclassLabels => ({ kk: text, ru: text, en: text, ky: text });
const option = (id: string) => ({ id, label: label(id) });
function config(): MasterclassConfigInput {
  return {
    institutions: ["school", "kindergarten", "library", "college", "mixed"].map(option),
    audiences: [
      { ...option("teachers"), institution_types: ["school", "college"] },
      { ...option("educators"), institution_types: ["kindergarten"] },
      { ...option("librarians"), institution_types: ["library", "mixed"] },
    ],
    formats: [option("offline"), option("hybrid")],
    styles: [option("practical"), option("creative")],
    directions: ["reading", "steam", "ai", "digital", "national", "books"].map(option),
    difficulties: [option("beginner"), option("experienced")],
    duration_options: [20, 30, 45, 60, 90, 120], min_duration_minutes: 15, max_duration_minutes: 240,
    languages: ["kk", "ru", "en", "ky"], token_cost: 25, topics_token_cost: 3, action_token_cost: 8,
    model: "deepseek-v4-pro", system_prompt: "Create a concrete practical workshop adapted to the selected institution and audience. Include a participant product and exact timing.",
    export_template: { accent_color: "#4F6B5B", font_family: "Arial", footer: label("Sandu AI") },
    file_formats: ["docx", "pdf", "pptx", "zip"], interactive_templates: [],
  };
}
function input(): MasterclassInput {
  return { ...blankMasterclassInput("ru"), audience_id: "teachers", topic: "Читательский клуб с цифровым квестом", direction_ids: ["reading"] };
}

describe("masterclass account draft guards", () => {
  it("accepts a complete draft in each of the four content languages", () => {
    for (const language of ["kk", "ru", "en", "ky"] as const) expect(isMasterclassDraft({ ...input(), language })).toBe(true);
    expect(isMasterclassDraft({ ...input(), include_case: false, include_host_speech: false })).toBe(true);
  });

  it("rejects corrupted storage without trusting partial or incorrectly typed fields", () => {
    const valid = input();
    for (const corrupt of [null, [], "draft", { ...valid, duration_minutes: Infinity }, { ...valid, duration_minutes: NaN }, { ...valid, participant_count: "20" }, { ...valid, direction_ids: [1] }, { ...valid, include_case: "false" }, { ...valid, context: null }, { ...valid, language: "uz" }, { ...valid, library_mode: "unknown" }]) {
      expect(isMasterclassDraft(corrupt)).toBe(false);
    }
    const partial = { ...valid } as Partial<MasterclassInput>;
    delete partial.available_resources;
    expect(isMasterclassDraft(partial)).toBe(false);
  });

  it("keeps an incomplete but well-typed draft for later editing and still blocks generation", () => {
    const draft = blankMasterclassInput("kk");
    expect(isMasterclassDraft(draft)).toBe(true);
    expect(masterclassInputIsValid(draft, config())).toBe(false);
  });
});

describe("masterclass dynamic configuration alignment", () => {
  it("preserves valid configured choices, draft content and content language", () => {
    const selected = { ...input(), format_id: "hybrid", style_id: "creative", difficulty_level: "experienced", language: "ky" as const, direction_ids: ["reading", "digital"], goal: "Практический продукт", context: "Профессиональная встреча", available_resources: "Проектор и карточки" };
    expect(alignMasterclassInput(selected, config())).toEqual(selected);
  });

  it("replaces deleted option IDs with live admin settings and drops retired directions", () => {
    const settings = config();
    settings.institutions = [option("community")];
    settings.audiences = [{ ...option("community_members"), institution_types: ["community"] }];
    settings.formats = [option("stations")]; settings.styles = [option("team")]; settings.difficulties = [option("intermediate")]; settings.languages = ["en"];
    const aligned = alignMasterclassInput({ ...input(), direction_ids: ["retired_direction", "reading"] }, settings);
    expect(aligned).toMatchObject({ institution_type: "community", audience_id: "community_members", format_id: "stations", style_id: "team", difficulty_level: "intermediate", language: "en", direction_ids: ["reading"] });
    expect(aligned.topic).toBe(input().topic);
    expect(masterclassInputIsValid(aligned, settings)).toBe(true);
  });

  it("maps an audience to its institution and resets library mode when leaving a library", () => {
    const settings = config();
    const library = alignMasterclassInput({ ...input(), institution_type: "library", library_mode: "qr_quest" }, settings);
    expect(library.audience_id).toBe("librarians");
    expect(library.library_mode).toBe("qr_quest");
    const school = alignMasterclassInput({ ...library, institution_type: "school" }, settings);
    expect(school.audience_id).toBe("teachers");
    expect(school.library_mode).toBe("standard");
  });

  it("aligns a restored duration to changed limits and keeps at most five available directions", () => {
    const settings = { ...config(), min_duration_minutes: 30, max_duration_minutes: 90 };
    expect(alignMasterclassInput({ ...input(), duration_minutes: 120 }, settings).duration_minutes).toBe(90);
    expect(alignMasterclassInput({ ...input(), duration_minutes: 20 }, settings).duration_minutes).toBe(30);
    const all = config().directions.map(item => item.id);
    expect(alignMasterclassInput({ ...input(), direction_ids: all }, config()).direction_ids).toHaveLength(5);
  });
});

describe("masterclass step validation", () => {
  it("accepts valid boundaries and all merged institution/audience pairs", () => {
    const settings = config();
    for (const [institution_type, audience_id] of [["school", "teachers"], ["college", "teachers"], ["kindergarten", "educators"], ["library", "librarians"], ["mixed", "librarians"]]) expect(validateMasterclassStep({ ...input(), institution_type, audience_id }, settings, 0)).toBeNull();
    for (const duration_minutes of [15, 240]) for (const participant_count of [1, 1000]) expect(masterclassInputIsValid({ ...input(), duration_minutes, participant_count }, settings)).toBe(true);
  });

  it("rejects an orphaned audience, an audience from another institution and an unknown institution", () => {
    for (const invalid of [{ audience_id: "deleted" }, { institution_type: "school", audience_id: "librarians" }, { institution_type: "deleted" }]) expect(validateMasterclassStep({ ...input(), ...invalid }, config(), 0)).toBe("audience");
  });

  it("rejects missing, short or oversized topics", () => {
    for (const topic of ["", "    ", "1234", "a".repeat(301)]) expect(validateMasterclassStep({ ...input(), topic }, config(), 1)).toBe("topic");
    expect(validateMasterclassStep({ ...input(), topic: "12345" }, config(), 1)).toBeNull();
  });

  it("rejects fractional, nonfinite and out-of-range durations and participant counts", () => {
    for (const duration_minutes of [14, 241, 60.5, NaN, Infinity]) expect(validateMasterclassStep({ ...input(), duration_minutes }, config(), 2)).toBe("duration");
    for (const participant_count of [0, 1001, 2.5, NaN, Infinity]) expect(validateMasterclassStep({ ...input(), participant_count }, config(), 2)).toBe("participants");
  });

  it("rejects missing, repeated, unknown or excessive directions", () => {
    for (const direction_ids of [[], ["reading", "reading"], ["unconfigured"], config().directions.map(item => item.id)]) expect(validateMasterclassStep({ ...input(), direction_ids }, config(), 2)).toBe("directions");
  });

  it("rejects retired formats, styles, difficulty levels and disabled content languages", () => {
    for (const invalid of [{ format_id: "deleted" }, { style_id: "deleted" }, { difficulty_level: "deleted" }]) expect(validateMasterclassStep({ ...input(), ...invalid }, config(), 2)).toBe("options");
    expect(validateMasterclassStep({ ...input(), language: "ky" }, { ...config(), languages: ["ru"] }, 2)).toBe("options");
  });
});
