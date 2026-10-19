import { describe, expect, it } from "vitest";
import { mergeVideoDraft } from "./draft-merge";
describe("concurrent video draft edits", () => {
  const original = {
    title: "Scene",
    prompt: "A field",
    settings: { duration: 5, speech_text: "Сәлем!" },
  };
  it("preserves both an autosaved prompt and a concurrent rename or speech edit", () => {
    const merged = mergeVideoDraft(
      original,
      { ...original, prompt: "A field at dawn" },
      {
        ...original,
        title: "Opening",
        settings: { ...original.settings, speech_text: "Сәлем, Әлия!" },
      },
    );
    expect(merged.conflicts).toEqual([]);
    expect(merged.draft).toEqual({
      title: "Opening",
      prompt: "A field at dawn",
      settings: { duration: 5, speech_text: "Сәлем, Әлия!" },
    });
  });
  it("keeps local work and requires a decision when the same prompt changed elsewhere", () => {
    const merged = mergeVideoDraft(
      original,
      { ...original, prompt: "My scene" },
      { ...original, prompt: "Another scene" },
    );
    expect(merged.conflicts).toEqual(["prompt"]);
    expect(merged.draft.prompt).toBe("My scene");
  });
  it("merges independent settings but flags conflicting spoken text without changing Kazakh letters", () => {
    const merged = mergeVideoDraft(
      original,
      { ...original, settings: { duration: 10, speech_text: "Үш көрініс." } },
      { ...original, settings: { duration: 5, speech_text: "Төрт көрініс." } },
    );
    expect(merged.conflicts).toEqual(["settings.speech_text"]);
    expect(merged.draft.settings.duration).toBe(10);
    expect(merged.draft.settings.speech_text).toBe("Үш көрініс.");
  });
});
