import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GenerationJob } from "@/lib/api";
import MeetingResult from "./MeetingResult";
import { meetingMarkdown } from "./document";
import { meetingFixture } from "./fixtures.test-helper";

describe("complete parent meeting reader and portable text export", () => {
  it.each(["ru", "kk"] as const)("preserves every ready script and supporting material in %s", language => {
    const result = { ...meetingFixture(), language };
    const job = { id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9", kind: "parent_meeting.generate", status: "completed", result } as unknown as GenerationJob;
    const html = renderToStaticMarkup(createElement(MeetingResult, { result, job, language }));
    const markdown = meetingMarkdown(result);
    const skip = new Set(["schema_version", "organization", "delivery_format", "selected_format", "language", "kind", "quality_checks"]);
    function check(value: unknown, key = "") {
      if (skip.has(key)) return;
      if (typeof value === "string" && value) { expect(html, key).toContain(value.replaceAll("'", "&#x27;")); expect(markdown, key).toContain(value); }
      else if (Array.isArray(value)) value.forEach(x => check(x, key));
      else if (value && typeof value === "object") Object.entries(value).forEach(([k, x]) => check(x, k));
    }
    check(result);
    const ids = [...html.matchAll(/id="meeting-([^"]+)"/g)].map(x => x[1]);
    expect(ids).toEqual(["passport", "concept", "timeline", "scenario", "training", "tasks", "materials", "reflection", "closing", "protocol"]);
    expect(markdown.match(/^## \d+\. /gm)).toHaveLength(10);
    expect(html).toContain('href="/dashboard/ai/presentations/create"');
    expect(markdown).not.toMatch(/schema_version|tokens_used|quality_checks|family_values/);
  });
  it.each([["en", "Meeting overview", "Hybrid", "Warm welcome"], ["ky", "Жыйын паспорту", "Аралаш", "Жылуу тосуп алуу"], ["uz", "Yig‘ilish ma’lumotlari", "Aralash", "Samimiy kutib olish"]] as const)("follows the saved %s language for text export labels", (language, passport, delivery, stage) => {
    const text = meetingMarkdown({ ...meetingFixture(), language });
    for (const label of [passport, delivery, stage]) expect(text).toContain(label);
    expect(text).not.toMatch(/Паспорт собрания|Полный сценарий|Шаблон протокола/);
  });
});
