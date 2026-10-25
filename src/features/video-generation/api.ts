import { getToken } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { ApiRequestError, requestBlob, requestJson } from "@/lib/http-client";
import { withIdempotencyKey } from "@/lib/idempotency";
import { invalidateCachedBalance } from "@/lib/tokenCache";
import { diagnoseVideoRead } from "./read-diagnostics";
import { recoverVideoRead } from "./read-recovery";
import { earliestVideoExpiry, isVideoExpired, utcTimestamp } from "./model";
import type {
  ScenePatch,
  VideoAsset,
  VideoCatalog,
  VideoDefaultProfiles,
  VideoExport,
  VideoJob,
  VideoPlan,
  VideoProject,
  VideoProjectSummary,
  VideoQuote,
  VideoScene,
  VideoVersionDependencies,
} from "./types";

const base = () => `${getApiBase()}/api/video-generation`;
function headers(json = true) {
  const value = new Headers(
    json ? { "Content-Type": "application/json" } : undefined,
  );
  const token = getToken();
  if (token) value.set("Authorization", `Bearer ${token}`);
  return value;
}
function readOperation(path: string): string {
  if (path === "/admin/config") return "admin-config";
  if (path.startsWith("/admin/audit")) return "admin-audit";
  if (path.startsWith("/admin/jobs")) return "admin-jobs";
  if (path.startsWith("/assets/")) return "asset-metadata";
  if (path === "/catalog") return "catalog";
  if (path === "/projects" || path.startsWith("/projects?")) return "projects";
  if (path.startsWith("/projects/")) return "project";
  if (path === "/quote") return "quote";
  return "video-data";
}
async function request<T>(
  path: string,
  method = "GET",
  payload?: unknown,
  key?: string,
  signal?: AbortSignal,
  recoverRead = true,
): Promise<T> {
  const operation = readOperation(path);
  const read = () =>
    requestJson<T>(
      `${base()}${path}`,
      {
        method,
        headers: key ? withIdempotencyKey(headers(), key) : headers(),
        body: payload === undefined ? undefined : JSON.stringify(payload),
        cache: "no-store",
        signal,
      },
      { timeoutMs: 35_000 },
    );
  try {
    return method === "GET" && recoverRead
      ? await recoverVideoRead(operation, read, signal)
      : await read();
  } catch (error) {
    if ((method === "GET" || path === "/quote") && !signal?.aborted)
      diagnoseVideoRead(operation, error);
    throw error;
  }
}
export const videoApi = {
  catalog: async (signal?: AbortSignal): Promise<VideoCatalog> => {
    const raw = await request<
      VideoCatalog & {
        limits?: {
          user_concurrency: number;
          upload_limit_mb: number;
          scene_limit?: number;
          project_duration_limit?: number;
        };
        models: Array<
          VideoCatalog["models"][number] & {
            name?: string;
            durations?: number[];
          }
        >;
      }
    >("/catalog", "GET", undefined, undefined, signal);
    return {
      ...raw,
      max_scenes: raw.max_scenes ?? raw.limits?.scene_limit ?? 20,
      max_project_duration:
        raw.max_project_duration ?? raw.limits?.project_duration_limit ?? 300,
      max_concurrent_jobs:
        raw.max_concurrent_jobs ?? raw.limits?.user_concurrency ?? 1,
      max_image_mb: raw.max_image_mb ?? raw.limits?.upload_limit_mb ?? 20,
      models: raw.models.map((m) => ({
        ...m,
        label: m.label ?? m.name ?? m.id,
        min_duration: m.min_duration ?? Math.min(...(m.durations ?? [1])),
        max_duration: m.max_duration ?? Math.max(...(m.durations ?? [15])),
      })),
    };
  },
  projects: async (): Promise<VideoProjectSummary[]> => {
    const raw = await request<
      | VideoProjectSummary[]
      | { items?: VideoProjectSummary[]; projects?: VideoProjectSummary[] }
    >("/projects");
    return Array.isArray(raw) ? raw : (raw.items ?? raw.projects ?? []);
  },
  projectPage: (offset = 0) =>
    request<{ items: VideoProjectSummary[]; total: number }>(
      `/projects?limit=30&offset=${offset}`,
    ),
  project: async (id: string): Promise<VideoProject> => {
    const p = await request<
      VideoProject & {
        exports: Array<VideoExport & { settings?: { resolution?: string } }>;
      }
    >(`/projects/${encodeURIComponent(id)}`);
    return {
      ...p,
      scenes: p.scenes.map((s) => ({
        ...s,
        trim_in: Number(s.trim_in ?? 0),
        trim_out: s.trim_out == null ? null : Number(s.trim_out),
        versions: s.versions.map((v) => ({
          ...v,
          duration:
            v.asset?.duration !== undefined
              ? Number(v.asset.duration)
              : v.duration,
          expires_at: v.expires_at ?? v.asset?.expires_at,
        })),
      })),
      jobs: p.jobs.map((j) => ({
        ...j,
        reserved_tokens: j.cost_tokens,
        charged_tokens: j.captured_tokens,
      })),
      exports: p.exports.map((e) => ({
        ...e,
        resolution: e.resolution ?? e.settings?.resolution ?? "720p",
        expires_at: e.expires_at ?? e.asset?.expires_at,
      })),
    };
  },
  createProject: (payload: Partial<VideoProject>) =>
    request<VideoProject>("/projects", "POST", payload),
  updateProject: (
    id: string,
    payload: Partial<VideoProject> & { expected_revision?: number },
  ) =>
    request<VideoProject>(
      `/projects/${encodeURIComponent(id)}`,
      "PATCH",
      payload,
    ),
  deleteProject: (id: string) =>
    request<void>(`/projects/${encodeURIComponent(id)}`, "DELETE"),
  createScene: (
    projectId: string,
    payload: ScenePatch & { after_scene_id?: string },
  ) =>
    request<VideoScene>(
      `/projects/${encodeURIComponent(projectId)}/scenes`,
      "POST",
      payload,
    ),
  updateScene: (id: string, payload: ScenePatch) =>
    request<VideoScene>(`/scenes/${encodeURIComponent(id)}`, "PATCH", payload),
  deleteScene: (id: string) =>
    request<void>(`/scenes/${encodeURIComponent(id)}`, "DELETE"),
  duplicateScene: (id: string) =>
    request<VideoScene>(
      `/scenes/${encodeURIComponent(id)}/duplicate`,
      "POST",
      {},
    ),
  reorder: (projectId: string, sceneIds: string[]) =>
    request<VideoProject>(
      `/projects/${encodeURIComponent(projectId)}/reorder`,
      "POST",
      { scene_ids: sceneIds },
    ),
  select: (id: string, versionId: string, trimIn?: number, trimOut?: number) =>
    request<VideoScene>(`/scenes/${encodeURIComponent(id)}/select`, "POST", {
      version_id: versionId,
      ...(trimIn !== undefined ? { trim_in: trimIn, trim_out: trimOut } : {}),
    }),
  versionDependencies: (id: string) =>
    request<VideoVersionDependencies>(
      `/versions/${encodeURIComponent(id)}/dependencies`,
    ),
  deleteVersion: (id: string) =>
    request<VideoProject>(`/versions/${encodeURIComponent(id)}`, "DELETE"),
  rebase: (id: string, sourceVersionId: string, sourceSceneId?: string) =>
    request<VideoScene>(`/scenes/${encodeURIComponent(id)}/rebase`, "POST", {
      source_version_id: sourceVersionId,
      ...(sourceSceneId ? { source_scene_id: sourceSceneId } : {}),
    }),
  unlink: (id: string) =>
    request<VideoScene>(`/scenes/${encodeURIComponent(id)}/unlink`, "POST", {}),
  split: (id: string, splitAt?: number) =>
    request<VideoProject>(
      `/scenes/${encodeURIComponent(id)}/split`,
      "POST",
      splitAt === undefined ? {} : { split_at: splitAt },
    ),
  merge: (id: string, nextSceneId: string) =>
    request<VideoProject>(`/scenes/${encodeURIComponent(id)}/merge`, "POST", {
      next_scene_id: nextSceneId,
    }),
  importVersion: (projectId: string, versionId: string, key: string) =>
    request<VideoProject>(
      `/projects/${encodeURIComponent(projectId)}/import-version`,
      "POST",
      { version_id: versionId },
      key,
    ),
  quote: (sceneId: string) =>
    request<VideoQuote>("/quote", "POST", { scene_id: sceneId }),
  generate: async (quoteId: string, key: string) => {
    const job = await request<VideoJob>(
      "/generate",
      "POST",
      { quote_id: quoteId },
      key,
    );
    invalidateCachedBalance();
    return job;
  },
  job: (id: string) => request<VideoJob>(`/jobs/${encodeURIComponent(id)}`),
  cancel: async (id: string) => {
    const job = await request<VideoJob>(
      `/jobs/${encodeURIComponent(id)}/cancel`,
      "POST",
      {},
    );
    invalidateCachedBalance();
    return job;
  },
  enhance: (
    prompt: string,
    language: string,
    speechLanguage = "",
    duration?: number,
  ) =>
    request<{ prompt: string; enhanced_prompt?: string }>("/enhance", "POST", {
      prompt,
      language,
      speech_language: speechLanguage,
      ...(duration !== undefined ? { duration } : {}),
    }),
  plan: (payload: {
    idea: string;
    language: string;
    speech_language?: string;
    scene_count: number;
    total_duration: number;
    model_id: string;
  }) => request<VideoPlan>("/plan", "POST", payload),
  export: (
    projectId: string,
    payload: {
      resolution: string;
      aspect_ratio?: string;
      crop_mode?: string;
      transition?: "cut" | "fade";
    },
    key: string,
  ) =>
    request<VideoExport>(
      `/projects/${encodeURIComponent(projectId)}/exports`,
      "POST",
      payload,
      key,
    ),
  upload: async (
    projectId: string,
    file: File,
    fit: "contain" | "crop",
    aspectRatio: string,
  ) => {
    const form = new FormData();
    form.append("project_id", projectId);
    form.append("file", file);
    form.append("fit", fit);
    form.append("aspect_ratio", aspectRatio);
    return requestJson<VideoAsset>(
      `${base()}/assets`,
      { method: "POST", headers: headers(false), body: form },
      { timeoutMs: 60_000 },
    );
  },
  asset: async (
    id: string,
    signal?: AbortSignal,
    reconciliationJobId?: string,
    onExpiry?: (expiresAt: string) => void,
  ): Promise<Blob> => {
    const controller = new AbortController();
    const abort = () => controller.abort(signal?.reason);
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
    const timer = globalThis.setTimeout(() => controller.abort(), 120_000);
    let stage = "asset-metadata";
    try {
      return await recoverVideoRead(
        "asset-download",
        async () => {
          stage = "asset-metadata";
          const asset = await request<VideoAsset & { url: string }>(
            reconciliationJobId
              ? `/admin/jobs/${encodeURIComponent(reconciliationJobId)}/reconciliation/asset-url`
              : `/assets/${encodeURIComponent(id)}/url`,
            "GET",
            undefined,
            undefined,
            controller.signal,
            false,
          );
          if (
            !asset.expires_at ||
            !Number.isFinite(utcTimestamp(asset.expires_at)) ||
            (asset.project_expires_at !== undefined &&
              !Number.isFinite(utcTimestamp(asset.project_expires_at)))
          )
            throw new ApiRequestError("Invalid private media expiry", 502);
          const assetDeadline = earliestVideoExpiry(
            asset.expires_at,
            asset.project_expires_at,
          )!;
          if (isVideoExpired(assetDeadline))
            throw new ApiRequestError("Video asset expired", 410);
          onExpiry?.(assetDeadline);
          const apiURL = new URL(
            base(),
            typeof location !== "undefined"
              ? location.origin
              : "http://localhost",
          );
          const signedURL = new URL(asset.url, apiURL.origin);
          const expectedPath = `${apiURL.pathname}/assets/${encodeURIComponent(id)}/content`;
          if (
            signedURL.origin !== apiURL.origin ||
            signedURL.pathname !== expectedPath ||
            !signedURL.searchParams.has("access")
          )
            throw new ApiRequestError("Invalid private video URL", 502);
          stage = "asset-content";
          const blob = await requestBlob(
            signedURL.href,
            {
              signal: controller.signal,
              cache: "no-store",
              credentials: "omit",
              referrerPolicy: "no-referrer",
            },
            { timeoutMs: 120_000, attemptAuthRefresh: false },
          );
          stage = "asset-body";
          if (isVideoExpired(assetDeadline))
            throw new ApiRequestError("Video asset expired", 410);
          return blob;
        },
        controller.signal,
      );
    } catch (error) {
      if (!signal?.aborted) diagnoseVideoRead(stage, error);
      throw error;
    } finally {
      globalThis.clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  },
  adminConfig: () => request<VideoAdminConfig>("/admin/config"),
  updateAdminConfig: (payload: VideoAdminConfigPatch) =>
    request<VideoAdminConfig>("/admin/config", "PATCH", payload),
  adminCheckAccess: (provider: VideoProviderId) =>
    request<VideoProviderProbe>(
      `/admin/providers/${provider}/check-access`,
      "POST",
      {},
    ),
  adminJobs: () => request<{ items: VideoAdminJob[] }>("/admin/jobs?limit=100"),
  adminAudit: () =>
    request<{ items: VideoAdminAudit[] }>("/admin/audit?limit=50"),
  adminReconciliation: (id: string) =>
    request<VideoAdminReconciliation | null>(
      `/admin/jobs/${encodeURIComponent(id)}/reconciliation`,
    ),
  adminReconcile: (id: string) =>
    request<VideoAdminReconciliation>(
      `/admin/jobs/${encodeURIComponent(id)}/reconcile`,
      "POST",
      {},
    ),
  adminRefund: (
    id: string,
    payload: { amount: string; reason: string },
    key: string,
  ) =>
    request<{ amount: string; remaining_refundable: string }>(
      `/admin/jobs/${encodeURIComponent(id)}/refund`,
      "POST",
      payload,
      key,
    ),
};

export type VideoTariff = {
  rates: Record<string, string>;
  image_fee_usd: string;
  verified_at: string;
  valid_until: string;
  source: string;
  promotion_ends_at?: string | null;
};
export type VideoCapabilityOverride = Partial<
  Record<
    "resolutions" | "aspect_ratios" | "durations" | "modes",
    Array<string | number>
  >
>;
export type VideoAdminConfig = {
  revision?: number;
  disabled_models: string[];
  user_concurrency: number;
  upload_limit_mb: number;
  scene_limit?: number;
  project_duration_limit?: number;
  planning_requests_per_hour?: number;
  tariffs: Record<string, VideoTariff>;
  capability_overrides?: Record<string, VideoCapabilityOverride>;
  default_profiles?: VideoDefaultProfiles;
  providers?: Record<VideoProviderId, VideoProviderConfig>;
  model_registry?: VideoModelRegistration[];
  prompt_templates?: VideoPromptTemplates;
  worker_concurrency?: number;
  xai_concurrency?: number;
  fal_concurrency?: number;
  export_concurrency?: number;
  queue_limit?: number;
  storage_limit_mb?: number;
  user_storage_limit_mb?: number;
  planning_max_input_characters?: number;
  planning_max_output_tokens?: number;
  adapter_templates?: VideoCatalog["models"];
  credential_references?: Array<{
    ref: string;
    provider: VideoProviderId;
    configured: boolean;
  }>;
  deployment_limits?: Record<string, number>;
  exchange_rate?: {
    available: boolean;
    rate_kzt_per_usd?: string;
    rate_date?: string;
    source?: string;
    error?: string;
  };
  models: VideoCatalog["models"];
  retention?: { asset_hours: number; project_idle_hours: number };
};
export type VideoProviderId = "xai" | "fal";
export type VideoAvailability = "enabled" | "paused" | "disabled";
export type VideoProviderConfig = {
  status: VideoAvailability;
  credential_ref: "XAI_API_KEY" | "FAL_KEY";
};
export type VideoModelRegistration = {
  id: string;
  adapter_model_id: string;
  name: string;
  status: VideoAvailability;
};
export type VideoPromptTemplates = {
  script: string;
  enhancer: string;
  native_audio: string;
};
export type VideoProviderProbe = {
  provider: VideoProviderId;
  configured: boolean;
  accessible: boolean;
  checked_at: string;
  message: string;
  paid_generation: false;
};
export type VideoAdminConfigPatch = Pick<
  VideoAdminConfig,
  | "disabled_models"
  | "user_concurrency"
  | "upload_limit_mb"
  | "scene_limit"
  | "project_duration_limit"
  | "planning_requests_per_hour"
  | "tariffs"
  | "capability_overrides"
  | "default_profiles"
  | "providers"
  | "model_registry"
  | "prompt_templates"
  | "worker_concurrency"
  | "xai_concurrency"
  | "fal_concurrency"
  | "export_concurrency"
  | "queue_limit"
  | "storage_limit_mb"
  | "user_storage_limit_mb"
  | "planning_max_input_characters"
  | "planning_max_output_tokens"
> & { expected_revision?: number };
export type VideoAdminJob = {
  id: string;
  user_id: string;
  status: string;
  cost_tokens: string;
  captured_tokens: string;
  manual_refunded_tokens?: string;
  actual_cost_usd: string | null;
  platform_loss_tokens: string;
  error_code?: string;
  created_at: string;
  provider_endpoint?: string;
  provider_job_id?: string | null;
};
export type VideoAdminAudit = {
  key: string;
  updated_at: string;
  updated_by: string;
  value: Partial<VideoAdminConfigPatch> & {
    revision?: number;
    action?: string;
    provider?: VideoProviderId;
    accessible?: boolean;
  };
};
export type VideoAdminReconciliation = {
  id: string;
  job_id: string;
  project_id: string;
  status: "queued" | "running" | "completed" | "failed";
  outcome: "provider_pending" | "late_success" | "provider_failed" | null;
  error_message: string | null;
  asset: VideoAsset | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
  actual_cost_usd: string | null;
  notification: string | null;
};
