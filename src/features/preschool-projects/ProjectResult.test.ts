import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GenerationJob } from "@/lib/api";
import { projectFixture } from "./fixtures.test-support";
import ProjectForm from "./ProjectForm";
import ResultView from "./ProjectResult";
import { blankProject } from "./model";

describe("preschool workspace read views", () => {
  it("renders complete nested research and facilitator materials with empty observation cells", () => {
    const r = projectFixture();
    const job = { id: "30bdc3b2-41e6-4399-877c-cbab8e93a5d9", kind: "preschool_project.generate", status: "completed", result: r } as unknown as GenerationJob;
    const html = renderToStaticMarkup(createElement(ResultView, { result: r, job, language: "ru" }));
    for (const value of [r.topic, r.ideas[0].question, r.calendar[0].teacher_action, r.experiments[0].adult_preparation, r.experiments[0].recording, r.experiments[0].conclusion_questions[0], r.diary[0].activity, r.artifacts[0].instructions, r.slides[0].photo_placeholder, r.slides[0].speaker_notes, r.defense_script, r.evaluation[0].evidence, r.inclusion[0], r.sources[0].url]) expect(html).toContain(value);
    expect(html).toContain("Нақты нәтижелер әлі берілмеген"); expect(html).toContain("Заполнить после наблюдения");
    expect(html).toContain('scope="col"'); expect(html).toContain('role="region"');
  });
  it("never executes HTML embedded in generated prose", () => {
    const r = projectFixture(); r.sections[0].content = '<script>alert("x")</script>\n\n[unsafe](javascript:alert(1))';
    const html = renderToStaticMarkup(createElement(ResultView, { result: r, job: {} as GenerationJob, language: "kk" }));
    expect(html).not.toContain("<script>"); expect(html).not.toContain('href="javascript:');
  });
  it("treats completed status as a user label when no real observations were supplied", () => {
    const r = { ...projectFixture(), project_status: "completed" as const, actual_results: [] };
    const html = renderToStaticMarkup(createElement(ResultView, { result: r, job: {} as GenerationJob, language: "ru" }));
    expect(html).toContain("Отмечен как завершённый");
    expect(html).not.toContain("Наблюдения завершены");
    expect(html).toContain("Нақты нәтижелер әлі берілмеген");
  });
  it("renders a real twelve-child observation card as an accessible table instead of raw pipes", () => {
    const r = projectFixture();
    r.artifacts[0].content = `Бақылау картасы — Жұмсақ матаның түстерін байқау\n\nБала № | Матаға жақындады | Матаны ұстады | Түсті көрсетті | Қызығушылық танытты\n${Array.from({ length: 12 }, (_, i) => `${i + 1} | ☐ | ☐ | ☐ | ☐`).join("\n")}\n\nЕскертпе: ☐ белгісін қойыңыз.`;
    const html = renderToStaticMarkup(createElement(ResultView, { result: r, job: {} as GenerationJob, language: "kk" }));
    const artifact = html.split('id="project-artifacts"')[1].split("</section>")[0];
    expect(artifact).toContain('role="region"'); expect(artifact).toContain('scope="col">Бала №</th>');
    expect(artifact.match(/<tr>/g)).toHaveLength(13); expect(artifact.match(/<td>/g)).toHaveLength(60);
    expect(artifact).not.toContain("Бала № | Матаға"); expect(artifact).toContain("Ескертпе");
  });
  it("keeps inline Markdown in table cells and ordinary prose around the table", () => {
    const r = projectFixture();
    r.sections[0].content = "**Кіріспе**\n\n| **Күн** | Жазба |\n| --- | --- |\n| 1 | *Алғашқы*<br>бақылау |\n\nСоңғы [ескертпе](https://example.com).";
    const html = renderToStaticMarkup(createElement(ResultView, { result: r, job: {} as GenerationJob, language: "kk" }));
    expect(html).toContain("<strong>Кіріспе</strong>"); expect(html).toContain('<th scope="col"><strong>Күн</strong></th>');
    expect(html).toContain("<em>Алғашқы</em><br/>"); expect(html).toContain('href="https://example.com"');
  });
  it("exposes every age, output and direction with associated form labels", () => {
    const html = renderToStaticMarkup(createElement(ProjectForm, { input: blankProject(), onChange: () => {}, onSubmit: () => {}, language: "ru", cost: 30, balance: 100, busy: false, saved: false, error: null }));
    expect(html.match(/aria-pressed=/g)).toHaveLength(17);
    expect(html).toContain('for="project-topic"'); expect(html).toContain('for="project-count"');
    expect(html).toContain('value="competition_project"'); expect(html).toContain('value="defense"');
    expect(html).toContain("Результаты без выдуманных данных"); expect(html).not.toContain('id="project-observations"');
  });
  it("shows true observation input only when the project is in progress or completed", () => {
    const html = renderToStaticMarkup(createElement(ProjectForm, { input: { ...blankProject(), project_status: "in_progress", is_competition: true }, onChange: () => {}, onSubmit: () => {}, language: "kk", cost: 30, balance: 0, busy: false, saved: true, error: null }));
    expect(html).toContain('id="project-observations"'); expect(html).toContain('id="project-rules"');
    expect(html).toContain("Токен жеткіліксіз"); expect(html).toContain('type="submit" disabled');
  });
});
