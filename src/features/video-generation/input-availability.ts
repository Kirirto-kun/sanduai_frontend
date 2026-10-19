import { earliestVideoExpiry, isVideoExpired } from "./model";
import type { VideoAsset } from "./types";

/** Saved null metadata proves unavailability only for that same saved input. */
export function videoInputLifetime(
  {
    inputId,
    savedInputId,
    savedAsset,
    uploadedAsset,
    projectExpiresAt,
  }: {
    inputId?: string | null;
    savedInputId?: string | null;
    savedAsset?: VideoAsset | null;
    uploadedAsset?: VideoAsset | null;
    projectExpiresAt: string;
  },
  now = Date.now(),
): { expiresAt: string | undefined; unavailable: boolean } {
  const asset =
    inputId && savedAsset?.id === inputId
      ? savedAsset
      : inputId && uploadedAsset?.id === inputId
        ? uploadedAsset
        : undefined;
  const expiresAt = earliestVideoExpiry(projectExpiresAt, asset?.expires_at);
  return {
    expiresAt,
    unavailable:
      isVideoExpired(expiresAt, now) ||
      Boolean(inputId && inputId === savedInputId && savedAsset === null),
  };
}
