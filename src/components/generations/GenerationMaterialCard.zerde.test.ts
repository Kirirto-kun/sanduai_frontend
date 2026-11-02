import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GenerationMaterialCard } from "./GenerationMaterialCard";
import type { GenerationJobSummary } from "@/lib/api";

const JOB = { id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9", title: "Методическая консультация", kind: "zerde.consult", source_path: "/dashboard/ai/zerde", status: "completed", progress: {}, expires_at: null } as GenerationJobSummary;
describe("Zerde history actions", () => {
  it("opens retained consultation and its real template exports instead of advertising an unsupported download", () => {
    const html = renderToStaticMarkup(createElement(GenerationMaterialCard, { job: JOB, language: "ru" }));
    expect(html).toContain(`/dashboard/ai/zerde?job=${JOB.id}`);
    expect(html).toContain("Консультация и шаблоны");
    expect(html).not.toContain("Скачать"); expect(html).not.toContain("<button");
  });
  it("preserves the existing downloadable Classic planner action", () => {
    const html = renderToStaticMarkup(createElement(GenerationMaterialCard, { job: { ...JOB, kind: "kmzh.classic.generate", source_path: "/dashboard/ai/kmzh-classic" }, language: "ru" }));
    expect(html).toContain("Скачать"); expect(html).toContain(`/dashboard/ai/kmzh-classic?job=${JOB.id}`);
  });
});
