import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CoachingForm from "./CoachingForm";
import { blankCoaching } from "./model";

describe("coaching balance recovery", () => {
  it.each(["ru", "kk"] as const)("keeps creation disabled and links to the existing profile for %s", language => {
    const html = renderToStaticMarkup(createElement(CoachingForm, {
      input: { ...blankCoaching(), topic: "Feedback", defaults_accepted: true },
      onChange: () => {}, onSubmit: () => {}, language, cost: 30, balance: 0,
      busy: false, saved: false, error: null,
    }));
    expect(html).toContain('href="/dashboard/profile"');
    expect(html).not.toContain("/dashboard/tokens");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
    expect(html).toContain(language === "ru" ? "Недостаточно токенов" : "Токендер жеткіліксіз");
  });

  it.each(["ru", "kk"] as const)("shows an actionable pricing error and keeps creation disabled for %s", language => {
    const html = renderToStaticMarkup(createElement(CoachingForm, {
      input: { ...blankCoaching(), topic: "Feedback", defaults_accepted: true },
      onChange: () => {}, onSubmit: () => {}, language, cost: null, balance: 100,
      busy: false, saved: false, error: null, costsUnavailable: true,
      costsLoading: false, onRetryCosts: () => {},
    }));
    expect(html).toContain('role="alert"');
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
    expect(html).toContain(language === "ru" ? "Повторить загрузку стоимости" : "Құнын қайта жүктеу");
    expect(html).not.toContain(language === "ru" ? "Уточняем стоимость…" : "Құны анықталуда…");
  });
});
