import { describe, expect, it } from "vitest";
import { videoInputLifetime } from "./input-availability";

describe("video admission when the prepared input expires", () => {
  const projectExpiresAt = "2026-10-19T12:00:00Z";
  const savedAsset = { id: "old-image", expires_at: "2026-10-19T10:00:00Z" };
  it("closes admission at the image deadline even when the project and old price are still live", () => {
    const state = {
      inputId: savedAsset.id,
      savedInputId: savedAsset.id,
      savedAsset,
      projectExpiresAt,
    };
    expect(
      videoInputLifetime(state, Date.parse("2026-10-19T09:59:59.999Z")),
    ).toEqual({ expiresAt: savedAsset.expires_at, unavailable: false });
    expect(
      videoInputLifetime(state, Date.parse(savedAsset.expires_at)),
    ).toEqual({ expiresAt: savedAsset.expires_at, unavailable: true });
  });
  it("treats null API metadata as unavailable only for that saved image, preserving a fresh unsaved replacement", () => {
    const now = Date.parse("2026-10-19T10:01:00Z");
    const state = {
      inputId: savedAsset.id,
      savedInputId: savedAsset.id,
      savedAsset: null,
      projectExpiresAt,
    };
    expect(videoInputLifetime(state, now).unavailable).toBe(true);
    const uploadedAsset = {
      id: "new-image",
      expires_at: "2026-10-20T10:01:00Z",
    };
    expect(
      videoInputLifetime(
        { ...state, inputId: uploadedAsset.id, uploadedAsset },
        now,
      ),
    ).toEqual({ expiresAt: projectExpiresAt, unavailable: false });
    expect(
      videoInputLifetime({ ...state, inputId: uploadedAsset.id }, now)
        .unavailable,
    ).toBe(false);
  });
});
