import { describe, expect, it } from "vitest";
import {
  videoLibraryDate,
  videoLibraryPoster,
  videoLibraryPreview,
} from "./library";
import { earliestVideoExpiry } from "./model";
import type { VideoProjectSummary } from "./types";

const now = Date.parse("2026-10-19T10:00:00Z");
const project = {
  id: "project",
  title: "Проект",
  kind: "project",
  expires_at: "2026-10-19T12:00:00Z",
  clip: {
    id: "clip",
    title: "Сцена",
    status: "completed",
    asset_id: "video",
    preview_asset_id: "frame",
    expires_at: "2026-10-19T11:00:00Z",
  },
  latest_export: {
    status: "completed",
    asset: { id: "export", expires_at: "2026-10-19T13:00:00Z" },
  },
} as VideoProjectSummary;
describe("private video library presentation", () => {
  it("never extends a file's lifetime when its project is edited later", () => {
    expect(
      earliestVideoExpiry("2026-10-19T12:00:00", "2026-10-19T11:00:00Z"),
    ).toBe("2026-10-19T11:00:00Z");
    expect(videoLibraryPreview(project, now)).toEqual({
      assetId: "export",
      title: "Проект",
      expiresAt: project.expires_at,
    });
    expect(
      videoLibraryPreview({ ...project, latest_export: null }, now),
    ).toMatchObject({ assetId: "video", expiresAt: project.clip!.expires_at });
    expect(
      videoLibraryPreview(project, Date.parse(project.expires_at)),
    ).toBeNull();
  });
  it("falls back from an expired export to a live source clip and never uses an MP4 as a poster", () => {
    const item = {
      ...project,
      latest_export: {
        ...project.latest_export!,
        asset: { id: "old-export", expires_at: "2026-10-19T09:00:00Z" },
      },
      thumbnail: {
        id: "wrong-mp4",
        content_type: "video/mp4",
        expires_at: "2026-10-19T11:00:00Z",
      },
    };
    expect(videoLibraryPreview(item, now)?.assetId).toBe("video");
    expect(videoLibraryPoster(item, now)).toEqual({
      assetId: "frame",
      expiresAt: project.clip!.expires_at,
    });
    expect(videoLibraryPoster({ ...item, clip: null }, now)).toBeNull();
  });
  it("renders backend naive dates as UTC rather than the browser time zone", () => {
    expect(videoLibraryDate("2026-10-19T10:00:00", false)).toBe(
      videoLibraryDate("2026-10-19T10:00:00Z", false),
    );
  });
});
