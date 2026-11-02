import { describe, expect, it } from "vitest";
import { adminSettingsDraft, initialModelTariff } from "./admin-settings";
import { DEFAULT_VIDEO_SETTINGS } from "./model";
import type { VideoAdminConfig } from "./api";
import type { VideoModel } from "./types";

const model: VideoModel = {
  id: "grok-imagine-video-1.5-lite",
  label: "Grok Lite",
  available: true,
  provider: "xai",
  resolutions: ["480p", "720p"],
  durations: [5, 10],
  min_duration: 5,
  max_duration: 10,
  aspect_ratios: ["16:9"],
};
describe("video administrator settings contract", () => {
  it("uses the single-job and 20 GiB deployment defaults when optional settings are absent", () => {
    const draft = adminSettingsDraft({
      models: [model], disabled_models: [], user_concurrency: 1,
      upload_limit_mb: 20, tariffs: {},
    });
    expect(draft).toMatchObject({
      user_concurrency: 1,
      worker_concurrency: 1,
      xai_concurrency: 1,
      fal_concurrency: 1,
      export_concurrency: 1,
      storage_limit_mb: 20480,
      user_storage_limit_mb: 2048,
    });
  });

  it("preserves the server's explicitly configured smaller storage allowance", () => {
    const draft = adminSettingsDraft({
      models: [model],
      disabled_models: [], user_concurrency: 1, upload_limit_mb: 20, tariffs: {},
      storage_limit_mb: 10240,
      user_storage_limit_mb: 1024,
      deployment_limits: { storage_limit_mb: 20480, worker_concurrency: 1 },
    });
    expect(draft.storage_limit_mb).toBe(10240);
    expect(draft.user_storage_limit_mb).toBe(1024);
    expect(draft).not.toHaveProperty("deployment_limits");
  });

  it("sends revision and editable fields while keeping server/secret metadata out of a patch", () => {
    const config = {
      revision: 7,
      models: [model],
      disabled_models: [],
      user_concurrency: 1,
      upload_limit_mb: 8,
      tariffs: {},
      default_profiles: {
        fast: DEFAULT_VIDEO_SETTINGS,
        quality: DEFAULT_VIDEO_SETTINGS,
      },
      credential_references: [
        { ref: "XAI_API_KEY", provider: "xai", configured: true },
      ],
      deployment_limits: { worker_concurrency: 1 },
      exchange_rate: {
        available: true,
        rate_date: "2026-10-19",
        rate_kzt_per_usd: "452.12",
      },
    } as VideoAdminConfig;
    const patch = adminSettingsDraft(config);
    expect(patch).toMatchObject({
      expected_revision: 7,
      user_concurrency: 1,
      upload_limit_mb: 8,
      default_profiles: config.default_profiles,
    });
    expect(patch).not.toHaveProperty("models");
    expect(patch).not.toHaveProperty("credential_references");
    expect(patch).not.toHaveProperty("deployment_limits");
    expect(patch).not.toHaveProperty("exchange_rate");
    expect(patch).not.toHaveProperty("revision");
  });
  it("keeps all verified resolutions editable when an expired tariff disappears from public prices", () => {
    const value = initialModelTariff(model, "image");
    expect(value.rates).toEqual({ "480p": "", "720p": "" });
    expect(value.verified_at).toBe("");
    expect(value.source).toBe("");
  });
  it("uses exact endpoint tariff strings without changing precision", () => {
    const value = initialModelTariff(
      {
        ...model,
        prices: {
          image: {
            "480p": {
              per_second_usd: "0.0200",
              input_image_usd: "0.01",
              verified_at: "2026-10-19T00:00:00Z",
              valid_until: "2026-11-18T00:00:00Z",
              source: "https://docs.x.ai/developers/pricing",
            },
          },
        },
      },
      "image",
    );
    expect(value.rates["480p"]).toBe("0.0200");
    expect(value.image_fee_usd).toBe("0.01");
  });
});
