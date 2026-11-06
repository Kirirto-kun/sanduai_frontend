import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MeetingForm from "./MeetingForm";
import { blankMeeting } from "./model";

describe("parent meeting form access and audience adaptation", () => {
  it.each(["ru", "kk"] as const)("requires consent and supports an existing balance recovery route in %s", language => {
    const html = renderToStaticMarkup(createElement(MeetingForm, { input: blankMeeting(), onChange: () => {}, onSubmit: () => {}, language, busy: false, saved: false, error: null, cost: 30, balance: 0 }));
    expect(html).toContain('href="/dashboard/profile"');
    expect(html).toMatch(/<button(?=[^>]*type="submit")(?=[^>]*disabled="")[^>]*>/);
    expect(html).toContain(language === "ru" ? "Недостаточно токенов" : "Токендер жеткіліксіз");
    expect(html).not.toContain('checked=""');
    for (const field of ["topic", "class", "duration", "language", "participants", "format", "goal", "period", "issues", "specialists", "resources", "requests", "institution", "date", "time", "venue"]) expect(html).toContain(`id="meeting-${field}"`);
  });
  it("adapts labels and example topics for preschool parents", () => {
    const html = renderToStaticMarkup(createElement(MeetingForm, { input: { ...blankMeeting(), organization: "kindergarten", defaults_accepted: true }, onChange: () => {}, onSubmit: () => {}, language: "ru", busy: false, saved: true, error: null, cost: 30, balance: 100 }));
    expect(html).toContain("Группа и возраст детей");
    expect(html).toContain("Адаптация к детскому саду с поддержкой");
    expect(html).not.toMatch(/<button(?=[^>]*type="submit")(?=[^>]*disabled="")[^>]*>/);
  });
  it.each(["ru", "kk"] as const)("associates list errors with their field and gives a summary recovery link in %s", language => {
    const html = renderToStaticMarkup(createElement(MeetingForm, { input: { ...blankMeeting(), resources: ["a"] }, onChange: () => {}, onSubmit: () => {}, language, busy: false, saved: false, error: "Fix the marked field", cost: 30, balance: 100 }));
    expect(html).toContain('id="meeting-form-error"');
    expect(html).toContain('href="#meeting-resources"');
    expect(html).toContain('id="meeting-resources-error"');
    expect(html).toContain('aria-invalid="true" aria-describedby="meeting-resources-hint meeting-resources-error"');
    expect(html).toContain(language === "ru" ? "Доступные материалы: пункт 1" : "Қолжетімді материалдар: 1-тармақ");
  });
});
