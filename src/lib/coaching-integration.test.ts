import { describe, expect, it } from "vitest";
import { SEGMENTS, resolveNavAccess } from "@/i18n/navigation";
import { classifyRouteAccess } from "./access-policy";
import { generationMaterialFilterFromKind, generationSourceHref } from "./generation-history";

describe("coaching navigation and retained history", () => {
  it("is available in every educational segment through authenticated access", () => {
    for (const segment of SEGMENTS) {
      const group = segment.groups.find(x => x.items.some(item => item.key === "coaching"));
      expect(group, segment.key).toBeDefined();
      const item = group!.items.find(x => x.key === "coaching")!;
      expect(item.href).toBe("/dashboard/ai/coaching");
      expect(item.soon).not.toBe(true);
      expect(resolveNavAccess(item, group!)).toBe("authenticated");
      expect(classifyRouteAccess(item.href)).toBe("authenticated");
    }
  });
  it("reopens the exact retained coaching job and initializes only the known filter", () => {
    const id = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";
    expect(generationMaterialFilterFromKind("coaching.generate")).toBe("coaching");
    expect(generationMaterialFilterFromKind("coaching.unknown")).toBe("all");
    expect(generationSourceHref({ id, kind: "coaching.generate", source_path: "/dashboard/ai/coaching" })).toBe(`/dashboard/ai/coaching?job=${id}`);
  });
});
