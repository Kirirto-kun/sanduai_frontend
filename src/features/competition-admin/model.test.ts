import { describe, expect, it } from "vitest";
import { createAnnualDraft, dateTimeInput, dateTimeIso, needsVerification, presetInput, validatePreset } from "./model";
import type { CompetitionPreset } from "./types";

const labels = (text: string) => ({ kk: text, ru: text });
const preset: CompetitionPreset = {
  competition_id: "PPI_2026",
  competition_name: labels("Панорама"),
  kind: "panorama",
  year: 2026,
  rule_version: "2026.1",
  organizer: "Өрлеу",
  official_source_url: "https://ppi.orleu.edu.kz/rules.pdf",
  last_verified_at: "2026-10-07T00:00:00Z",
  verification_status: "verified",
  verification_notes: labels("Тексерілді"),
  is_active: true,
  directions: [{ id: "reading", label: labels("Оқу сауаттылығы"), roles: [] }],
  structure: [{ id: "results", label: labels("Нәтижелер") }],
  rubric: [{ id: "evidence", label: labels("Дәлел"), guidance: labels("Автор деректерін тексеру"), section_ids: ["results"] }],
  file_formats: ["docx", "pdf"],
  languages: ["kk", "ru"],
  time_limit_minutes: 10,
  word_limit: 2500,
  deadline: "2026-10-31T12:00:00Z",
  video_requirements: labels("2026 видео ережесі"),
  plagiarism_requirements: labels("2026 авторлық ережесі"),
  format_requirements: labels("2026 құжат ережесі"),
  token_cost: 25,
  action_token_cost: 8,
  model: "deepseek-v4-pro",
  updated_at: "2026-10-07T00:00:00Z",
};

describe("annual competition rule management", () => {
  it("opens next year with no previously verified requirements or automatic activation", () => {
    const draft = createAnnualDraft(preset, 2027);
    expect(draft.competition_id).toBe("PPI_2027");
    expect(draft.kind).toBe("panorama");
    expect(draft.year).toBe(2027);
    expect(draft).toMatchObject({
      verification_status: "unverified", is_active: false,
      last_verified_at: null, official_source_url: null, deadline: null,
      time_limit_minutes: null, word_limit: null,
      directions: [], structure: [], rubric: [],
      video_requirements: { kk: "", ru: "" },
      plagiarism_requirements: { kk: "", ru: "" },
      format_requirements: { kk: "", ru: "" },
    });
    expect(validatePreset(draft, false, false)).toBeNull();
    draft.competition_name.ru = "Название следующего года";
    expect(preset.competition_name.ru).toBe("Панорама");
  });

  it("keeps Festival identity separate when creating its annual draft", () => {
    const draft = createAnnualDraft({ ...preset, kind: "festival", competition_id: "PED_FESTIVAL_2026" }, 2027);
    expect(draft.competition_id).toBe("PED_FESTIVAL_2027");
    expect(draft.kind).toBe("festival");
    expect(draft.directions).toEqual([]);
  });

  it("blocks unverified rules from activation even if they have full structure", () => {
    const draft = { ...presetInput(preset), verification_status: "unverified" as const };
    expect(validatePreset(draft, false, true)).toMatchObject({ tab: "general" });
    expect(validatePreset({ ...presetInput(preset), official_source_url: null }, false, true)).toMatchObject({ tab: "general" });
  });

  it("requires transparent bilingual notes for partial verification", () => {
    const partial = { ...presetInput(preset), verification_status: "partial" as const, verification_notes: { kk: "", ru: "" } };
    expect(validatePreset(partial, false, true)).toMatchObject({ tab: "general" });
    expect(validatePreset({ ...partial, verification_notes: labels("Мерзім анықталмаған") }, false, true)).toBeNull();
  });

  it("catches rubric links to a removed section before saving", () => {
    const broken = { ...presetInput(preset), rubric: [{ ...preset.rubric[0], section_ids: ["removed_section"] }] };
    expect(validatePreset(broken, true, true)).toMatchObject({ tab: "criteria" });
  });

  it("rejects unsafe URLs and IDs inconsistent with server rules", () => {
    expect(validatePreset({ ...presetInput(preset), official_source_url: "javascript:alert(1)" }, false, true)).toMatchObject({ tab: "general" });
    expect(validatePreset({ ...presetInput(preset), directions: [{ ...preset.directions[0], id: "reading-literacy" }] }, false, true)).toMatchObject({ tab: "directions" });
  });

  it("sends editable server fields without the response-only timestamp", () => {
    const input = presetInput(preset);
    expect(input).not.toHaveProperty("updated_at");
    expect(input.word_limit).toBe(2500);
    expect(preset.updated_at).toBe("2026-10-07T00:00:00Z");
  });

  it("requires source re-verification for active rule changes, with no extra verification for pricing", () => {
    expect(needsVerification({ ...presetInput(preset), word_limit: 2400 }, preset)).toBe(true);
    expect(needsVerification({ ...presetInput(preset), official_source_url: "https://example.org/new-rules" }, preset)).toBe(true);
    expect(needsVerification({ ...presetInput(preset), token_cost: 26 }, preset)).toBe(false);
    expect(needsVerification({ ...presetInput(preset), is_active: false, word_limit: 2400 }, preset)).toBe(false);
    expect(needsVerification(presetInput(preset), { ...presetInput(preset), is_active: false })).toBe(true);
  });
});

describe("competition deadline in the user's timezone", () => {
  it("roundtrips midnight across the UTC date boundary in Asia/Shanghai", () => {
    expect(dateTimeInput("2026-10-06T16:00:00Z")).toBe("2026-10-07T00:00");
    expect(dateTimeIso("2026-10-07T00:00")).toBe("2026-10-06T16:00:00.000Z");
  });

  it("preserves an unspecified official deadline", () => {
    expect(dateTimeInput(null)).toBe("");
    expect(dateTimeIso("")).toBeNull();
  });
});
