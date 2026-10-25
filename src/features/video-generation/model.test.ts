import { describe, expect, it } from "vitest";
import {
  DEFAULT_VIDEO_SETTINGS,
  catalogDefaultSettings,
  draftChanged,
  expiryLabel,
  isActiveVideoJob,
  isVideoExpired,
  modelDurations,
  projectDuration,
  promptVideoSettings,
  settingsForModel,
  utcTimestamp,
  validateTrim,
  versionAssetId,
} from "./model";
import type {
  VideoCatalog,
  VideoModel,
  VideoProject,
  VideoScene,
} from "./types";

const h3: VideoModel = {
  id: "minimax/h3-max",
  label: "H3 Max",
  provider: "fal",
  available: true,
  min_duration: 5,
  max_duration: 15,
  resolutions: ["480p", "768p", "1080p"],
  aspect_ratios: ["16:9", "9:16"],
};
describe("video capabilities and timeline", () => {
  it("takes new-project model, price options and duration from the server profile", () => {
    const catalog = {
      models: [h3],
      default_profiles: {
        fast: {
          ...DEFAULT_VIDEO_SETTINGS,
          model_id: h3.id,
          resolution: "768p",
          duration: 12,
          generate_audio: false,
          speech_text: "Unrequested presenter script",
          voice_description: "presenter",
        },
      },
    } as VideoCatalog;
    expect(catalogDefaultSettings(catalog, "kk")).toMatchObject({
      model_id: h3.id,
      resolution: "768p",
      duration: 12,
      generate_audio: true,
      speech_language: "kk",
      speech_text: "",
      voice_description: "",
    });
  });
  it("keeps technical choices and optional exact speech while retiring saved creative controls", () => {
    const original = {
      ...DEFAULT_VIDEO_SETTINGS,
      model_id: h3.id,
      duration: 9,
      resolution: "768p",
      aspect_ratio: "9:16",
      speech_language: "kk",
      speech_text: "Әлия, бүгін 25 қазан.",
      generate_audio: false,
      style: "Realistic",
      camera: "Static",
      motion_strength: 10,
      negative_prompt: "animation",
      voice_description: "presenter",
      music: "violin",
      sound_effects: "applause",
    };
    expect(promptVideoSettings(original)).toEqual({
      ...original,
      generate_audio: true,
      style: "",
      camera: "",
      motion_strength: null,
      negative_prompt: "",
      voice_description: "",
      music: "",
      sound_effects: "",
    });
    expect(original.style).toBe("Realistic");
  });
  it("does not silently replace an explicitly unavailable default profile", () => {
    const catalog = {
      models: [
        { ...h3, available: false },
        { ...h3, id: "another-model", available: true },
      ],
      default_profiles: {
        fast: {
          ...DEFAULT_VIDEO_SETTINGS,
          model_id: h3.id,
          resolution: "768p",
          duration: 12,
        },
      },
    } as VideoCatalog;
    expect(catalogDefaultSettings(catalog).model_id).toBe(h3.id);
  });
  it("applies a style only after explicit selection and clears it again for Auto", () => {
    const selected = promptVideoSettings({
      ...DEFAULT_VIDEO_SETTINGS,
      style: "3d",
      style_mode: "selected",
    });
    expect(selected).toMatchObject({ style: "3d", style_mode: "selected" });
    expect(
      promptVideoSettings({ ...selected, style_mode: "auto" }),
    ).toMatchObject({ style: "", style_mode: "auto" });
    expect(
      promptVideoSettings({ ...selected, style_mode: undefined }),
    ).toMatchObject({ style: "", style_mode: "auto" });
  });
  it("starts new projects in Auto even when an admin profile contains a style selection", () => {
    const catalog = {
      models: [h3],
      default_profiles: {
        fast: {
          ...DEFAULT_VIDEO_SETTINGS,
          model_id: h3.id,
          style: "cartoon",
          style_mode: "selected",
        },
      },
    } as VideoCatalog;
    expect(catalogDefaultSettings(catalog)).toMatchObject({
      style: "",
      style_mode: "auto",
    });
  });
  it("keeps real 768p, clamps the duration, and never keeps an unsupported aspect", () => {
    const value = settingsForModel(
      { ...DEFAULT_VIDEO_SETTINGS, duration: 1, aspect_ratio: "5:2" },
      h3,
    );
    expect(value).toMatchObject({
      model_id: "minimax/h3-max",
      resolution: "768p",
      duration: 5,
      aspect_ratio: "16:9",
    });
    expect(modelDurations({ ...h3, durations: [5, 10, 15] })).toEqual([
      5, 10, 15,
    ]);
    expect(
      settingsForModel(
        { ...DEFAULT_VIDEO_SETTINGS, duration: 8 },
        { ...h3, durations: [5, 10, 15] },
      ).duration,
    ).toBe(5);
  });
  it("polls submission uncertainty and refunds, so a lost provider acknowledgement does not look complete", () => {
    expect(isActiveVideoJob({ status: "uncertain" })).toBe(true);
    expect(isActiveVideoJob({ status: "refunding" })).toBe(true);
    expect(isActiveVideoJob({ status: "completed" })).toBe(false);
    expect(isActiveVideoJob({ status: "failed" })).toBe(false);
  });
  it("uses actual trimmed duration and excludes explicitly disabled scenes", () => {
    const scene = {
      id: "a",
      included: true,
      selected_version_id: "v",
      trim_in: 1.5,
      trim_out: 4.2,
      settings: DEFAULT_VIDEO_SETTINGS,
      versions: [
        {
          id: "v",
          status: "completed",
          asset_id: "asset",
          asset: {
            id: "asset",
            duration: 5.12,
            expires_at: "2026-10-20T00:00:00Z",
          },
          settings: DEFAULT_VIDEO_SETTINGS,
        },
      ],
    } as VideoScene;
    expect(
      projectDuration({
        scenes: [scene, { ...scene, included: false }],
      } as VideoProject),
    ).toBeCloseTo(2.7);
    expect(validateTrim(0, 5.12, 5.12)).toBe(true);
    expect(validateTrim(1, 1, 5)).toBe(false);
    expect(validateTrim(0, 6, 5)).toBe(false);
    expect(validateTrim(-1, 5, 5)).toBe(false);
  });
  it("does not offer an expired server asset even when its historical asset ID remains", () => {
    expect(
      versionAssetId({
        id: "v",
        status: "completed",
        asset_id: "old",
        asset: null,
        settings: {},
        created_at: "",
      }),
    ).toBeUndefined();
    expect(draftChanged({ draft_changed: false } as VideoScene)).toBe(false);
  });
});
describe("video privacy retention", () => {
  it("interprets naive backend datetimes as UTC on all user time zones", () => {
    expect(utcTimestamp("2026-10-19T12:00:00")).toBe(
      Date.parse("2026-10-19T12:00:00Z"),
    );
    const now = Date.parse("2026-10-19T12:00:00Z");
    expect(isVideoExpired("2026-10-19T12:00:00", now)).toBe(true);
    expect(expiryLabel("2026-10-19T13:01:00Z", false, now)).toBe("1 ч 1 мин");
    expect(expiryLabel("2026-10-19T11:00:00Z", true, now)).toBe(
      "Мерзімі аяқталды",
    );
  });
});
