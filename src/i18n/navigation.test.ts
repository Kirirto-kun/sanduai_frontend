import { describe, expect, it } from "vitest";

import { COMMON_GROUPS, resolveNavAccess, SEGMENTS } from "./navigation";
import { translations } from "./translations";


describe("dashboard navigation language purity", () => {
  const groups = [...SEGMENTS.flatMap((segment) => segment.groups), ...COMMON_GROUPS];
  const items = groups.flatMap((group) => group.items);

  it("uses Russian product names in the Russian navigation", () => {
    expect(items.find((item) => item.key === "kmzh")?.label.ru).toBe("КСП (краткосрочный план)");
    expect(items.find((item) => item.key === "bjb")?.label.ru).toBe("СОР / СОЧ");
    expect(items.find((item) => item.key === "article")?.label.ru).toBe("Статья");
    expect(items.find((item) => item.key === "games")?.label.ru).toBe("Игра «Скачки»");
  });

  it("does not leak Kazakh-specific letters into Russian navigation labels", () => {
    const russianCopy = [
      ...SEGMENTS.flatMap((segment) => [segment.label.ru, segment.hint.ru]),
      ...groups.flatMap((group) => [group.label.ru, ...group.items.map((item) => item.label.ru)]),
    ].join("\n");

    expect(russianCopy).not.toMatch(/[әғқңөұүһі]/iu);
  });

  it("uses the same Russian product terminology in dashboard copy", () => {
    expect(translations.ru.dashboard.menu.aiGenerationItems.kmzh).toBe("КСП");
    expect(translations.ru.dashboard.menu.aiGenerationItems.article).toBe("Статья");
    expect(translations.ru.dashboard.menu.aiGenerationItems.bjbTjb).toBe("СОР/СОЧ");
    expect(translations.ru.atZharys.setup.title).toBe("Скачки");
    expect(translations.ru.article.form.title).toBe("Статья");
  });

  it("makes masterclasses available in school, kindergarten and library navigation", () => {
    for (const segment of SEGMENTS) {
      const group = segment.groups.find(item => item.items.some(entry => entry.key === "masterclasses"));
      expect(group, segment.key).toBeDefined();
      const item = group!.items.find(entry => entry.key === "masterclasses")!;
      expect(item.href).toBe("/dashboard/ai/masterclasses");
      expect(item.soon).not.toBe(true);
      expect(item.label).toEqual({ ru: "Мастер-классы", kk: "Шебер сынып ұйымдастыру" });
      expect(resolveNavAccess(item, group!)).toBe("authenticated");
    }
  });

  it("makes trainings available to every educational segment without a subscription", () => {
    for (const segment of SEGMENTS) {
      const group = segment.groups.find(entry => entry.items.some(item => item.key === "trainings"));
      expect(group, segment.key).toBeDefined();
      const item = group!.items.find(entry => entry.key === "trainings")!;
      expect(item.href).toBe("/dashboard/ai/trainings");
      expect(item.label).toEqual({ ru: "Тренинги и семинары", kk: "Тренингтер мен семинарлар" });
      expect(item.isNew).toBe(true);
      expect(item.soon).not.toBe(true);
      expect(resolveNavAccess(item, group!)).toBe("authenticated");
    }
  });

  it("offers preschool projects as an available, authenticated kindergarten tool", () => {
    const kindergarten = SEGMENTS.find(segment => segment.key === "kindergarten")!;
    const group = kindergarten.groups.find(group => group.items.some(item => item.key === "preschool-projects"))!;
    const item = group.items.find(item => item.key === "preschool-projects")!;
    expect(item.href).toBe("/dashboard/ai/preschool-projects");
    expect(item.label).toEqual({ ru: "Проекты для детского сада", kk: "Балабақша жоба PRO" });
    expect(item.soon).not.toBe(true);
    expect(resolveNavAccess(item, group)).toBe("authenticated");
  });
});
