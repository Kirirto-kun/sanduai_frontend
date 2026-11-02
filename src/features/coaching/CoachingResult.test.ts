import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GenerationJob } from "@/lib/api";
import CoachingResultView from "./CoachingResult";
import { coachingFixture } from "./fixtures.test-helper";
import { coachingMarkdown } from "./document";

describe("complete coaching result and text export", () => {
  it.each([
    ["en", "Coaching overview", "Hybrid", "Organization"],
    ["ky", "Коучинг паспорту", "Аралаш", "Уюштуруу"],
    ["uz", "Kouching ma’lumotlari", "Aralash", "Tashkil etish"],
  ] as const)("preserves API-created material headings in saved %s", (language, passport, format, stage) => {
    const markdown = coachingMarkdown({ ...coachingFixture(), language });
    for (const text of [passport, format, stage]) expect(markdown).toContain(text);
    expect(markdown).not.toMatch(/Паспорт коучинга|Полный сценарий|Критерии оценки/);
  });
  it.each(["kk", "ru"] as const)("retains all facilitator, task, handout, slide and adaptation text in %s", language => {
    const result = { ...coachingFixture(), language };
    const job = { id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9", kind: "coaching.generate", status: "completed", result } as unknown as GenerationJob;
    const html = renderToStaticMarkup(createElement(CoachingResultView, { result, job, language }));
    const markdown = coachingMarkdown(result);
    const skip = new Set(["kind", "format", "language", "code"]);
    function check(value: unknown, key = "") {
      if (skip.has(key)) return;
      if (typeof value === "string") { expect(html, key).toContain(value); expect(markdown, key).toContain(value); }
      else if (Array.isArray(value)) value.forEach(x => check(x, key));
      else if (value && typeof value === "object") Object.entries(value).forEach(([k, x]) => check(x, k));
    }
    check(result);
    const ids = [...html.matchAll(/<section id="coaching-([^"]+)"/g)].map(x => x[1]);
    expect(ids).toEqual(["passport", "concept", "timeline", "scenario", "practice", "materials", "reflection", "evaluation", "closing"]);
    expect(markdown.match(/^## \d\. /gm)).toHaveLength(9);
    expect(html).toContain("42–45");
    expect(html).toContain(language === "kk" ? "Жеке презентация файлы жасалмайды" : "Отдельный файл презентации не создаётся");
    expect(markdown).not.toMatch(/cost_tokens|quality_checks|participant_minutes/);
  });
});
