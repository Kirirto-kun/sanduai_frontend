import { describe, expect, it } from "vitest";

import { COMMON_GROUPS, filterNavGroupsForRole, resolveNavAccess, SEGMENTS } from "../i18n/navigation";
import { canAccessVideoGeneration, classifyRouteAccess, decideRouteAccess } from "./access-policy";

describe("dashboard access classification", () => {
  it.each([
    "/dashboard/library",
    "/dashboard/library/catalog",
    "/dashboard/library/courses",
    "/dashboard/library/presentations",
    "/dashboard/library/visual-aids",
    "/dashboard/library/simulations",
    "/dashboard/library/simulations/energy-skate-park",
    "/dashboard/library/interactive-games",
    "/dashboard/library/interactive-games/wordwall-1",
    "/dashboard/library/materials",
    "/dashboard/library/sketch-hub",
    "/dashboard/library/games/other-game",
  ])("requires subscription for ready/static route %s", (pathname) => {
    expect(classifyRouteAccess(pathname)).toBe("subscription");
  });

  it.each([
    "/dashboard",
    "/dashboard/generations",
    "/dashboard/ai/kmzh",
    "/dashboard/ai/trainings",
    "/dashboard/ai/presentations/editor/project-1",
    "/dashboard/media/photo",
    "/dashboard/media/qr-generator",
    "/dashboard/sandubot",
    "/dashboard/library/games",
    "/dashboard/library/games/",
    "/dashboard/library/games/at-zharys",
    "/dashboard/library/games/at-zharys/game-1",
  ])("keeps generated/authenticated route %s available without subscription", (pathname) => {
    expect(classifyRouteAccess(pathname)).toBe("authenticated");
  });

  it("handles admin and path-segment boundaries", () => {
    expect(classifyRouteAccess("/dashboard/admin/library")).toBe("admin");
    expect(classifyRouteAccess("/dashboard/libraryish")).toBe("authenticated");
    expect(classifyRouteAccess("/login")).toBe("public");
  });

  it("never uses coin balance as a substitute for subscription", () => {
    const freeTeacher = {
      isAuthenticated: true,
      isAdmin: false,
      hasSubscription: false,
    } as const;
    expect(decideRouteAccess({ policy: "authenticated", ...freeTeacher })).toBe("allow");
    expect(decideRouteAccess({ policy: "subscription", ...freeTeacher })).toBe("subscribe");
    expect(decideRouteAccess({ policy: "subscription", ...freeTeacher, hasSubscription: null })).toBe("pending");
    expect(decideRouteAccess({ policy: "subscription", ...freeTeacher, hasSubscription: true })).toBe("allow");
    expect(
      decideRouteAccess({ policy: "subscription", isAuthenticated: true, isAdmin: true, hasSubscription: false }),
    ).toBe("subscribe");
  });

  it("classifies every navigation group and preserves the At Zharys exception", () => {
    const groups = [...SEGMENTS.flatMap((segment) => segment.groups), ...COMMON_GROUPS];
    for (const group of groups) {
      expect(group.access).toMatch(/^(authenticated|subscription)$/);
      for (const item of group.items) {
        expect(resolveNavAccess(item, group)).toMatch(/^(authenticated|subscription|admin)$/);
      }
    }

    const schoolOffline = SEGMENTS.find((segment) => segment.key === "school")?.groups
      .find((group) => group.key === "school-offline");
    expect(schoolOffline?.access).toBe("subscription");
    const atZharys = schoolOffline?.items.find((item) => item.key === "games");
    expect(atZharys && schoolOffline ? resolveNavAccess(atZharys, schoolOffline) : null)
      .toBe("authenticated");
  });

  it("keeps every live navigation target aligned with its declared access", () => {
    const groups = [...SEGMENTS.flatMap((segment) => segment.groups), ...COMMON_GROUPS];
    for (const group of groups) {
      for (const item of group.items) {
        if (item.soon) continue;
        const pathname = item.href.split("?")[0];
        expect(classifyRouteAccess(pathname), `${item.key}: ${item.href}`)
          .toBe(resolveNavAccess(item, group));
      }
    }
  });

  it("limits the video rollout to admin while retaining course videos and other media", () => {
    for (const pathname of ["/dashboard/media/video", "/dashboard/media/video/", "/dashboard/media/video/project-id"]) {
      expect(classifyRouteAccess(pathname)).toBe("admin");
      expect(decideRouteAccess({ policy: classifyRouteAccess(pathname), isAuthenticated: true, isAdmin: false, hasSubscription: true })).toBe("forbidden");
      expect(decideRouteAccess({ policy: classifyRouteAccess(pathname), isAuthenticated: true, isAdmin: true, hasSubscription: false })).toBe("allow");
    }
    expect(classifyRouteAccess("/dashboard/media/voiceover")).toBe("authenticated");
    expect(classifyRouteAccess("/dashboard/library/videos")).toBe("subscription");
    expect(classifyRouteAccess("/dashboard/media/video-help")).toBe("authenticated");
    expect(canAccessVideoGeneration("admin")).toBe(true);
    for (const role of [undefined, null, "teacher", "user", "super_admin", "ADMIN"]) {
      expect(canAccessVideoGeneration(role)).toBe(false);
    }
  });

  it("hides restricted navigation for every non-admin segment without mutating shared groups", () => {
    for (const segment of SEGMENTS) {
      const groups = [...segment.groups, ...COMMON_GROUPS];
      const before = JSON.stringify(groups);
      for (const role of [undefined, "teacher", "user"]) {
        const visible = filterNavGroupsForRole(groups, role).flatMap((group) => group.items);
        expect(visible.some((item) => item.key === "video")).toBe(false);
        expect(visible.some((item) => item.key === "photo")).toBe(true);
        expect(visible.some((item) => item.key === "voiceover")).toBe(true);
      }
      expect(filterNavGroupsForRole(groups, "admin").flatMap((group) => group.items).some((item) => item.key === "video")).toBe(true);
      expect(JSON.stringify(groups)).toBe(before);
    }
  });
});
