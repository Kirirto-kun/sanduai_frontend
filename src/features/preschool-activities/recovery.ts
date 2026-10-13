import type { GenerationJob, GenerationJobStatus } from "@/lib/api";
import { ApiRequestError } from "@/lib/http-client";
import { createIdempotencyKey } from "@/lib/idempotency";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { preschoolActivityCopy } from "./copy";
import { normalizePreschoolInput } from "./model";
import type { PreschoolActivityInput } from "./types";

const STORAGE_PREFIX = "sanduai_preschool_v1";
const RECOVERY_TTL_MS = 24 * 60 * 60 * 1_000;
const ACTIVE_STATUSES = new Set<GenerationJobStatus>(["queued", "running", "settling", "refunding"]);

export type PendingKind = "generate" | "topics" | "task" | "unknown";
export type PendingOperation = { id: string; kind: PendingKind; taskId?: string; documentId?: string };
type Intent = { fingerprint: string; key: string; createdAt: number; jobId?: string };
type Draft = { input: PreschoolActivityInput; season: string; savedAt: number };

// Browser storage can be unavailable in private mode or at its quota. Keep
// retries safe for the current tab even when cross-reload recovery is lost.
const memory = new Map<string, string>();

function storageKey(ownerId: string, name: string): string {
  return `${STORAGE_PREFIX}:${encodeURIComponent(ownerId)}:${name}`;
}

function read(ownerId: string | null, name: string): unknown {
  if (!ownerId || typeof window === "undefined") return null;
  const key = storageKey(ownerId, name);
  try {
    const value = window.localStorage.getItem(key) ?? memory.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    try { return JSON.parse(memory.get(key) ?? "null"); } catch { return null; }
  }
}

function write(ownerId: string | null, name: string, value: unknown): void {
  if (!ownerId || typeof window === "undefined") return;
  const key = storageKey(ownerId, name);
  const serialized = JSON.stringify(value);
  memory.set(key, serialized);
  try { window.localStorage.setItem(key, serialized); } catch { /* Tab-local recovery remains available. */ }
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value).filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function preschoolRequestFingerprint(path: string, payload: unknown): string {
  // Keep the canonical input itself to avoid collisions between different paid
  // actions. Only twenty recent intents are retained for one signed-in owner.
  return `${path}:${canonical(payload)}`;
}

function readIntents(ownerId: string | null): Intent[] {
  const value = read(ownerId, "intents");
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Intent => Boolean(entry)
    && typeof entry.fingerprint === "string"
    && typeof entry.key === "string"
    && typeof entry.createdAt === "number"
    && entry.createdAt > Date.now() - RECOVERY_TTL_MS);
}

export function preschoolIntent(ownerId: string | null, fingerprint: string): Intent {
  const intents = readIntents(ownerId);
  const existing = intents.find((intent) => intent.fingerprint === fingerprint);
  if (existing) return existing;
  const created = { fingerprint, key: createIdempotencyKey(), createdAt: Date.now() };
  write(ownerId, "intents", [...intents.slice(-19), created]);
  return created;
}

export function attachPreschoolIntent(ownerId: string | null, fingerprint: string, jobId: string): void {
  write(ownerId, "intents", readIntents(ownerId).map((intent) => intent.fingerprint === fingerprint ? { ...intent, jobId } : intent));
}

export function clearPreschoolIntent(ownerId: string | null, fingerprint: string): void {
  write(ownerId, "intents", readIntents(ownerId).filter((intent) => intent.fingerprint !== fingerprint));
}

export function clearPreschoolIntentForJob(ownerId: string | null, jobId: string): void {
  write(ownerId, "intents", readIntents(ownerId).filter((intent) => intent.jobId !== jobId));
}

export function isPreschoolJobActive(status: GenerationJobStatus): boolean {
  return ACTIVE_STATUSES.has(status);
}

export function retryablePreschoolRequest(error: unknown): boolean {
  return error instanceof ApiRequestError && (
    error.status === 0 || error.status === 408 || error.status === 425 || error.status === 429 || error.status >= 500
  );
}

export function preschoolJobFailureMessage(
  job: Pick<GenerationJob, "status" | "error_code" | "billing_status">,
  language: "ru" | "kk",
): string {
  const copy = preschoolActivityCopy[language];
  const preciseCodes = ["INVALID_PROVIDER_OUTPUT", "PROVIDER_RATE_LIMITED", "PROVIDER_OUTCOME_UNKNOWN"];
  const message = job.status === "cancelled" ? copy.cancelled
    : job.error_code && preciseCodes.includes(job.error_code)
      ? teacherFacingErrorMessage({ details: { detail: { code: job.error_code } } }, language, { fallback: copy.failed })
      : copy.failed;
  return job.billing_status === "refunded" ? `${message} ${copy.refundConfirmed}` : message;
}

export function savePreschoolPending(ownerId: string | null, operation: PendingOperation | null): void {
  write(ownerId, "pending", operation ? { ...operation, savedAt: Date.now() } : null);
}

export function restorePreschoolPending(ownerId: string | null): PendingOperation | null {
  const value = read(ownerId, "pending");
  if (!value || typeof value !== "object") return null;
  const pending = value as Record<string, unknown>;
  if (typeof pending.id !== "string" || !/^[0-9a-f-]{36}$/i.test(pending.id)
    || !["generate", "topics", "task", "unknown"].includes(String(pending.kind))
    || typeof pending.savedAt !== "number" || pending.savedAt <= Date.now() - RECOVERY_TTL_MS) return null;
  return {
    id: pending.id,
    kind: pending.kind as PendingKind,
    ...(typeof pending.taskId === "string" ? { taskId: pending.taskId } : {}),
    ...(typeof pending.documentId === "string" ? { documentId: pending.documentId } : {}),
  };
}

const DRAFT_STRING_FIELDS = ["organization", "teacher_name", "group_id", "group_name", "activity_type", "topic", "goal", "story_character", "custom_support_need", "notes"] as const;
const DRAFT_NUMBER_FIELDS = ["age", "duration_minutes", "children_count", "group_count"] as const;
const DRAFT_BOOLEAN_FIELDS = ["wow_enabled", "national_values", "inclusive_enabled", "teacher_script", "expected_answers"] as const;
const DRAFT_ARRAY_FIELDS = ["integrated_areas", "styles", "support_needs"] as const;

export function savePreschoolDraft(ownerId: string | null, input: PreschoolActivityInput, season: string): void {
  write(ownerId, "draft", { input, season, savedAt: Date.now() } satisfies Draft);
}

export function restorePreschoolDraft(ownerId: string | null): Draft | null {
  const value = read(ownerId, "draft");
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<Draft>;
  const input = draft.input;
  if (!input || typeof input !== "object" || typeof draft.season !== "string"
    || typeof draft.savedAt !== "number" || draft.savedAt <= Date.now() - RECOVERY_TTL_MS
    || !DRAFT_STRING_FIELDS.every((field) => typeof input[field] === "string")
    || !DRAFT_NUMBER_FIELDS.every((field) => Number.isFinite(input[field]))
    || !DRAFT_BOOLEAN_FIELDS.every((field) => typeof input[field] === "boolean")
    || !DRAFT_ARRAY_FIELDS.every((field) => Array.isArray(input[field]) && input[field].every((entry) => typeof entry === "string"))
    || !["ru", "kk", "en", "ky", "uz"].includes(input.language)
    || !["full", "short"].includes(input.output_format)) return null;
  return { input: normalizePreschoolInput(input), season: draft.season, savedAt: draft.savedAt };
}
