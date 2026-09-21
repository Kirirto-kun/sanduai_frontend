import type { GenerationJob, GenerationJobStatus, GenerationJobSummary } from "@/lib/api";

import type {
  BuilderBuildRequest,
  BuilderBuildStatus,
  BuilderContentLanguage,
  BuilderProjectType,
} from "./types";

export const BUILDER_GENERATION_KIND = "builder.build";

const PENDING_BUILDS_STORAGE_KEY = "sandu-builder-pending-builds:v1";
const HOME_DRAFT_STORAGE_KEY = "sandu-builder-home-draft:v1";
const COMPOSER_DRAFT_PREFIX = "sandu-builder-composer:v1:";
const MAX_PENDING_AGE_MS = 48 * 60 * 60 * 1_000;
const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1_000;
const PROJECT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const JOB_ID_PATTERN = PROJECT_ID_PATTERN;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/;
const TERMINAL_STATUSES = new Set<GenerationJobStatus>([
  "completed",
  "failed",
  "cancelled",
  "billing_error",
]);
const PROJECT_TYPES = new Set<BuilderProjectType>([
  "website",
  "game",
  "3d",
  "hand_tracking",
  "camera",
  "education",
  "webapp",
  "platform",
  "dashboard",
  "custom",
]);
const CONTENT_LANGUAGES = new Set<BuilderContentLanguage>([
  "auto",
  "kk",
  "ru",
  "en",
  "ky",
  "uz",
]);

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type BuilderPersistenceScope = string | null;

export type PendingBuilderBuild = {
  version: 1;
  projectId: string;
  idempotencyKey: string;
  payload: BuilderBuildRequest;
  jobId?: string;
  createdAt: number;
};

export type BuilderHomeDraft = {
  version: 1;
  prompt: string;
  projectType: BuilderProjectType;
  contentLanguage: BuilderContentLanguage;
  attachmentNames: string[];
  updatedAt: number;
};

export type BuilderComposerDraft = {
  version: 1;
  message: string;
  assetIds: string[];
  unuploadedAttachmentNames?: string[];
  updatedAt: number;
};

function defaultStorage(): StorageLike | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function scopedStorageKey(base: string, scope: BuilderPersistenceScope): string | null {
  const normalized = scope?.trim();
  if (!normalized || normalized.length > 256) return null;
  return `${base}:${encodeURIComponent(normalized)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readJson(storage: StorageLike | null, key: string): unknown {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(storage: StorageLike | null, key: string, value: unknown): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // The durable server job and URL remain the source of truth when browser
    // storage is unavailable or full.
  }
}

function isBuildRequest(value: unknown): value is BuilderBuildRequest {
  if (!isRecord(value)) return false;
  return typeof value.prompt === "string"
    && value.prompt.trim().length >= 3
    && value.prompt.length <= 12_000
    && Number.isInteger(value.expected_version)
    && Number(value.expected_version) >= 0
    && (value.expected_revision === undefined
      || (Number.isInteger(value.expected_revision) && Number(value.expected_revision) >= 0))
    && Array.isArray(value.asset_ids)
    && value.asset_ids.length <= 12
    && value.asset_ids.every((id) => typeof id === "string" && PROJECT_ID_PATTERN.test(id))
    && (value.mode === "generate" || value.mode === "edit" || value.mode === "fix")
    && (value.errors === undefined
      || (Array.isArray(value.errors)
        && value.errors.length <= 30
        && value.errors.every((item) => typeof item === "string" && item.length <= 3_000)))
    && (value.max_cost === undefined
      || (Number.isInteger(value.max_cost)
        && Number(value.max_cost) > 0
        && Number(value.max_cost) <= 10_000));
}

function normalizePendingBuild(value: unknown, now: number): PendingBuilderBuild | null {
  if (!isRecord(value)
    || value.version !== 1
    || typeof value.projectId !== "string"
    || !PROJECT_ID_PATTERN.test(value.projectId)
    || typeof value.idempotencyKey !== "string"
    || !IDEMPOTENCY_KEY_PATTERN.test(value.idempotencyKey)
    || typeof value.createdAt !== "number"
    || !Number.isFinite(value.createdAt)
    || value.createdAt > now + 60_000
    || now - value.createdAt > MAX_PENDING_AGE_MS
    || !isBuildRequest(value.payload)
    || (value.jobId !== undefined
      && (typeof value.jobId !== "string" || !JOB_ID_PATTERN.test(value.jobId)))) {
    return null;
  }
  return value as PendingBuilderBuild;
}

function pendingBuildMap(
  scope: BuilderPersistenceScope,
  storage: StorageLike | null,
  now: number,
): Record<string, PendingBuilderBuild> {
  const key = scopedStorageKey(PENDING_BUILDS_STORAGE_KEY, scope);
  if (!key) return {};
  storage?.removeItem(PENDING_BUILDS_STORAGE_KEY);
  const value = readJson(storage, key);
  if (!isRecord(value)) return {};
  const result: Record<string, PendingBuilderBuild> = {};
  for (const entry of Object.values(value)) {
    const normalized = normalizePendingBuild(entry, now);
    if (normalized) result[normalized.projectId] = normalized;
  }
  return result;
}

export function listPendingBuilderBuilds(
  scope: BuilderPersistenceScope,
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
): PendingBuilderBuild[] {
  return Object.values(pendingBuildMap(scope, storage, now)).sort((left, right) => right.createdAt - left.createdAt);
}

export function readPendingBuilderBuild(
  projectId: string,
  scope: BuilderPersistenceScope,
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
): PendingBuilderBuild | null {
  return pendingBuildMap(scope, storage, now)[projectId] ?? null;
}

export function writePendingBuilderBuild(
  build: PendingBuilderBuild,
  scope: BuilderPersistenceScope,
  storage: StorageLike | null = defaultStorage(),
): void {
  const key = scopedStorageKey(PENDING_BUILDS_STORAGE_KEY, scope);
  if (!key) return;
  const builds = pendingBuildMap(scope, storage, Date.now());
  builds[build.projectId] = build;
  writeJson(storage, key, builds);
}

export function attachJobToPendingBuilderBuild(
  projectId: string,
  jobId: string,
  scope: BuilderPersistenceScope,
  storage: StorageLike | null = defaultStorage(),
): PendingBuilderBuild | null {
  const build = readPendingBuilderBuild(projectId, scope, storage);
  if (!build || !JOB_ID_PATTERN.test(jobId)) return null;
  const next = { ...build, jobId };
  writePendingBuilderBuild(next, scope, storage);
  return next;
}

export function clearPendingBuilderBuild(
  projectId: string,
  expectedJobId?: string,
  scope: BuilderPersistenceScope = null,
  storage: StorageLike | null = defaultStorage(),
): void {
  const key = scopedStorageKey(PENDING_BUILDS_STORAGE_KEY, scope);
  if (!storage || !key) return;
  const builds = pendingBuildMap(scope, storage, Date.now());
  const current = builds[projectId];
  if (!current || (expectedJobId && current.jobId !== expectedJobId)) return;
  delete builds[projectId];
  if (Object.keys(builds).length === 0) storage.removeItem(key);
  else writeJson(storage, key, builds);
}

export function readBuilderHomeDraft(
  scope: BuilderPersistenceScope,
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
): BuilderHomeDraft | null {
  const key = scopedStorageKey(HOME_DRAFT_STORAGE_KEY, scope);
  if (!key) return null;
  storage?.removeItem(HOME_DRAFT_STORAGE_KEY);
  const value = readJson(storage, key);
  if (!isRecord(value)
    || value.version !== 1
    || typeof value.prompt !== "string"
    || value.prompt.length > 12_000
    || typeof value.projectType !== "string"
    || !PROJECT_TYPES.has(value.projectType as BuilderProjectType)
    || typeof value.contentLanguage !== "string"
    || !CONTENT_LANGUAGES.has(value.contentLanguage as BuilderContentLanguage)
    || !Array.isArray(value.attachmentNames)
    || value.attachmentNames.length > 12
    || value.attachmentNames.some((name) => typeof name !== "string" || name.length > 260)
    || typeof value.updatedAt !== "number"
    || now - value.updatedAt > MAX_DRAFT_AGE_MS) {
    return null;
  }
  return value as BuilderHomeDraft;
}

export function writeBuilderHomeDraft(
  draft: BuilderHomeDraft,
  scope: BuilderPersistenceScope,
  storage: StorageLike | null = defaultStorage(),
): void {
  const key = scopedStorageKey(HOME_DRAFT_STORAGE_KEY, scope);
  if (!key) return;
  if (!draft.prompt.trim() && draft.attachmentNames.length === 0) {
    storage?.removeItem(key);
    return;
  }
  writeJson(storage, key, draft);
}

export function clearBuilderHomeDraft(
  scope: BuilderPersistenceScope,
  storage: StorageLike | null = defaultStorage(),
): void {
  const key = scopedStorageKey(HOME_DRAFT_STORAGE_KEY, scope);
  if (key) storage?.removeItem(key);
}

function composerStorageKey(projectId: string, scope: BuilderPersistenceScope): string | null {
  const scopeKey = scopedStorageKey(COMPOSER_DRAFT_PREFIX.slice(0, -1), scope);
  return scopeKey ? `${scopeKey}:${projectId}` : null;
}

export function readBuilderComposerDraft(
  projectId: string,
  scope: BuilderPersistenceScope,
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
): BuilderComposerDraft | null {
  const key = composerStorageKey(projectId, scope);
  if (!key) return null;
  storage?.removeItem(`${COMPOSER_DRAFT_PREFIX}${projectId}`);
  const value = readJson(storage, key);
  if (!isRecord(value)
    || value.version !== 1
    || typeof value.message !== "string"
    || value.message.length > 12_000
    || !Array.isArray(value.assetIds)
    || value.assetIds.length > 12
    || value.assetIds.some((id) => typeof id !== "string")
    || (value.unuploadedAttachmentNames !== undefined
      && (!Array.isArray(value.unuploadedAttachmentNames)
        || value.unuploadedAttachmentNames.length > 12
        || value.unuploadedAttachmentNames.some((name) =>
          typeof name !== "string" || name.length > 260)))
    || typeof value.updatedAt !== "number"
    || now - value.updatedAt > MAX_DRAFT_AGE_MS) {
    return null;
  }
  return value as BuilderComposerDraft;
}

export function writeBuilderComposerDraft(
  projectId: string,
  draft: BuilderComposerDraft,
  scope: BuilderPersistenceScope,
  storage: StorageLike | null = defaultStorage(),
): void {
  const key = composerStorageKey(projectId, scope);
  if (!key) return;
  if (!draft.message.trim() && draft.assetIds.length === 0) {
    storage?.removeItem(key);
    return;
  }
  writeJson(storage, key, draft);
}

export function clearBuilderComposerDraft(
  projectId: string,
  scope: BuilderPersistenceScope,
  storage: StorageLike | null = defaultStorage(),
): void {
  const key = composerStorageKey(projectId, scope);
  if (key) storage?.removeItem(key);
}

export function pendingBuildRecoveryAction(
  status: BuilderBuildStatus["status"],
): "replay" | "wait" | "apply" | "restore" | "block" {
  if (status === "unknown") return "replay";
  if (status === "pending") return "wait";
  if (status === "succeeded") return "apply";
  if (status === "billing_error") return "block";
  return "restore";
}

export function isActiveBuilderJob(job: Pick<GenerationJobSummary, "kind" | "status"> | null | undefined): boolean {
  return Boolean(job && job.kind === BUILDER_GENERATION_KIND && !TERMINAL_STATUSES.has(job.status));
}

export function isTerminalBuilderJob(job: Pick<GenerationJobSummary, "kind" | "status"> | null | undefined): boolean {
  return Boolean(job && job.kind === BUILDER_GENERATION_KIND && TERMINAL_STATUSES.has(job.status));
}

export function builderProjectIdFromSourcePath(sourcePath: string): string | null {
  if (!sourcePath.startsWith("/")) return null;
  try {
    const url = new URL(sourcePath, "https://sanduai.local");
    if (url.pathname !== "/dashboard/ai/builder") return null;
    const projectId = url.searchParams.get("project");
    return projectId && PROJECT_ID_PATTERN.test(projectId) ? projectId : null;
  } catch {
    return null;
  }
}

export function builderProjectIdFromJob(job: GenerationJob | GenerationJobSummary): string | null {
  if (job.kind !== BUILDER_GENERATION_KIND) return null;
  if (typeof job.resource_id === "string" && PROJECT_ID_PATTERN.test(job.resource_id)) {
    return job.resource_id;
  }
  if ("result" in job && isRecord(job.result)) {
    const projectId = job.result.project_id;
    if (typeof projectId === "string" && PROJECT_ID_PATTERN.test(projectId)) return projectId;
  }
  return builderProjectIdFromSourcePath(job.source_path);
}

export function builderJobBelongsToProject(
  job: GenerationJob | GenerationJobSummary,
  projectId: string,
): boolean {
  return builderProjectIdFromJob(job) === projectId;
}

export function builderWorkspaceHref(projectId: string, jobId?: string | null): string {
  const params = new URLSearchParams({ project: projectId });
  if (jobId) params.set("job", jobId);
  return `/dashboard/ai/builder?${params.toString()}`;
}
