import { describe, expect, it } from "vitest";
import { SEGMENTS, resolveNavAccess } from "../i18n/navigation";
import { generationMaterialFilterFromKind, generationSourceHref, isPrimaryGenerationMaterial } from "./generation-history";

describe("Preschool integration with the consolidated modules", () => {
  it("exposes the authenticated kindergarten tool while retaining both KMJ versions", () => {
    const segment = SEGMENTS.find(value => value.key === "kindergarten")!;
    const group = segment.groups.find(value => value.items.some(item => item.key === "preschool-projects"))!;
    const item = group.items.find(value => value.key === "preschool-projects")!;
    expect(item.href).toBe("/dashboard/ai/preschool-projects");
    expect(resolveNavAccess(item, group)).toBe("authenticated");
    const paths = SEGMENTS.flatMap(value => value.groups.flatMap(group => group.items.map(item => item.href)));
    expect(paths).toContain("/dashboard/ai/kmzh-classic");
    expect(paths).toContain("/dashboard/ai/kmzh");
    expect(paths).toContain("/dashboard/ai/trainings");
    expect(paths).toContain("/dashboard/ai/science-pro");
    expect(paths).toContain("/dashboard/ai/zerde");
  });
  it("restores only known filters and reopens the owned project", () => {
    expect(generationMaterialFilterFromKind("preschool_project.generate")).toBe("preschool-projects");
    expect(generationMaterialFilterFromKind("training.generate")).toBe("trainings");
    for (const kind of [null, "__proto__", "trainings.generate", "unknown.generate"]) expect(generationMaterialFilterFromKind(kind)).toBe("all");
    const id = "30bdc3b2-41e6-4399-877c-cbab8e93a5d9";
    expect(generationSourceHref({id, kind:"preschool_project.generate", source_path:"/dashboard/ai/preschool-projects"})).toBe(`/dashboard/ai/preschool-projects?job=${id}`);
    expect(isPrimaryGenerationMaterial({kind:"preschool_project.generate"})).toBe(true);
  });
});
