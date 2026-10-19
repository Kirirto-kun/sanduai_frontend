import type { VideoQuote } from "./types";

export function presetConflictKey(
  quote: Pick<VideoQuote, "id" | "fingerprint"> | null,
  draftFingerprint: string,
): string {
  return quote ? `${quote.id}:${quote.fingerprint}:${draftFingerprint}` : "";
}

export function hasUnresolvedPresetConflict(
  quote: VideoQuote | null,
  draftFingerprint: string,
  acknowledgement: string,
): boolean {
  return Boolean(
    quote?.preset_conflicts?.length &&
    acknowledgement !== presetConflictKey(quote, draftFingerprint),
  );
}
