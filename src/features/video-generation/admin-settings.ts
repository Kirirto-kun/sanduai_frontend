import type {
  VideoAdminConfig,
  VideoAdminConfigPatch,
  VideoTariff,
} from "./api";
import { DEFAULT_VIDEO_SETTINGS, settingsForModel } from "./model";
import type { VideoModel } from "./types";

/** Explicit allowlist keeps read-only credential and FX metadata out of writes. */
export function adminSettingsDraft(
  config: VideoAdminConfig,
): VideoAdminConfigPatch {
  const first = config.models[0];
  const fallback = first
    ? settingsForModel(DEFAULT_VIDEO_SETTINGS, first)
    : DEFAULT_VIDEO_SETTINGS;
  return {
    expected_revision: config.revision ?? 0,
    disabled_models: config.disabled_models ?? [],
    providers: config.providers ?? {
      xai: { status: "enabled", credential_ref: "XAI_API_KEY" },
      fal: { status: "enabled", credential_ref: "FAL_KEY" },
    },
    model_registry:
      config.model_registry ??
      config.models.map((m) => ({
        id: m.id,
        adapter_model_id: m.adapter_model_id ?? m.id,
        name: m.label ?? m.name ?? m.id,
        status: "enabled",
      })),
    default_profiles: config.default_profiles ?? {
      fast: fallback,
      quality: fallback,
    },
    prompt_templates: config.prompt_templates ?? {
      script: "",
      enhancer: "",
      native_audio: "",
    },
    capability_overrides: config.capability_overrides ?? {},
    tariffs: config.tariffs ?? {},
    user_concurrency: config.user_concurrency ?? 1,
    upload_limit_mb: config.upload_limit_mb ?? 20,
    scene_limit: config.scene_limit ?? 20,
    project_duration_limit: config.project_duration_limit ?? 300,
    planning_requests_per_hour: config.planning_requests_per_hour ?? 30,
    worker_concurrency: config.worker_concurrency ?? 1,
    xai_concurrency: config.xai_concurrency ?? 1,
    fal_concurrency: config.fal_concurrency ?? 1,
    export_concurrency: config.export_concurrency ?? 1,
    queue_limit: config.queue_limit ?? 100,
    storage_limit_mb: config.storage_limit_mb ?? 20480,
    user_storage_limit_mb: config.user_storage_limit_mb ?? 2048,
    planning_max_input_characters:
      config.planning_max_input_characters ?? 20000,
    planning_max_output_tokens: config.planning_max_output_tokens ?? 7000,
  };
}

export function initialModelTariff(
  model: VideoModel,
  mode: string,
): VideoTariff {
  const prices = model.prices?.[mode] ?? {};
  const first = Object.values(prices)[0];
  return {
    rates: Object.fromEntries(
      model.resolutions.map((resolution) => [
        resolution,
        prices[resolution]?.per_second_usd ?? "",
      ]),
    ),
    image_fee_usd: first?.input_image_usd ?? "0",
    verified_at: first?.verified_at ?? "",
    valid_until: first?.valid_until ?? "",
    source: first?.source ?? "",
  };
}

export function adminStatusText(status: string, kk: boolean): string {
  if (status === "enabled") return kk ? "Қосылған" : "Включён";
  if (status === "paused") return kk ? "Кідіртілген" : "Приостановлен";
  return kk ? "Өшірілген" : "Отключён";
}
