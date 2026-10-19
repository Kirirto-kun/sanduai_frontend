import { tryNormalizeContentLanguage, type ContentLanguage } from "../../lib/content-languages";

export type MasterclassHandoffTarget = "builder" | "visual" | "video" | "presentation" | "qr";
export type MasterclassHandoffVariant = "default" | "hand_tracking" | "three_d";
export type MasterclassHandoffPayload = {
  prompt: string; title: string; topic: string; notes: string; language: ContentLanguage;
  project_type?: string; source_text?: string; share_url?: string; cover_url?: string;
};
type Params = { get(name: string): string | null };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BLOCK = /^[a-z0-9_-]{1,128}$/i;

export function masterclassHandoffSource(params: Params) {
  const raw = params.get("masterclassWork");
  const stageId = params.get("stage_id") || undefined;
  const interactiveId = params.get("interactive_id") || undefined;
  const rawVariant = params.get("variant") || undefined;
  const variant = rawVariant as MasterclassHandoffVariant | undefined;
  return {
    requested: raw !== null,
    id: raw && UUID.test(raw) ? raw.toLowerCase() : null,
    stageId, interactiveId, variant,
    valid: Boolean(raw && UUID.test(raw) && (!stageId || BLOCK.test(stageId)) && (!interactiveId || BLOCK.test(interactiveId)) && !(stageId && interactiveId) && (!variant || ["default", "hand_tracking", "three_d"].includes(variant)) && (!variant || variant === "default" || interactiveId)),
  };
}

export function masterclassHandoffScope(userId: string | null | undefined, target: MasterclassHandoffTarget, source: ReturnType<typeof masterclassHandoffSource>) {
  return JSON.stringify([userId ?? null, target, source.id, source.stageId ?? null, source.interactiveId ?? null, source.variant ?? null]);
}

export function masterclassHandoffEnabled(source: ReturnType<typeof masterclassHandoffSource>, userId: string | null | undefined, destinationAvailable: boolean) {
  return Boolean(source.requested && source.valid && userId && destinationAvailable);
}

/** Only the authenticated source's own API route may receive the bearer token. */
export function masterclassCoverUrl(coverUrl: string, apiBase: string, workId: string | null): string {
  const base = new URL(apiBase);
  const target = new URL(coverUrl, `${apiBase}/`);
  const expected = new URL(`${apiBase}/masterclasses/works/${workId}/cover`);
  if (!workId || !UUID.test(workId) || target.origin !== base.origin || target.pathname !== expected.pathname || target.username || target.password || target.search || target.hash) {
    throw new Error("Invalid cover source");
  }
  return target.href;
}

/** Destination limits are checked explicitly; source text is never sliced. */
export function masterclassHandoffPayloadError(target: MasterclassHandoffTarget, payload: MasterclassHandoffPayload): string | null {
  if (!payload || typeof payload !== "object" || !tryNormalizeContentLanguage(payload.language)) return "invalid";
  const bounded = (value: unknown, maximum: number, required = true) => typeof value === "string" && (!required || Boolean(value.trim())) && value.length <= maximum;
  if (target === "builder" && !bounded(payload.prompt, 12_000)) return "builder";
  if (target === "visual" && (!bounded(payload.topic, 1_000) || !bounded(payload.notes, 2_000, false))) return "visual";
  if (target === "presentation" && (!bounded(payload.title, 240) || !bounded(payload.topic, 2_000) || !bounded(payload.source_text, 80_000))) return "presentation";
  if (target === "video" && !bounded(payload.prompt, 100_000)) return "video";
  if (target === "qr") {
    if (!bounded(payload.share_url, 2_048)) return "qr";
    try { const url = new URL(payload.share_url ?? ""); if (!/^https?:$/.test(url.protocol)) return "qr"; }
    catch { return "qr"; }
  }
  return null;
}
