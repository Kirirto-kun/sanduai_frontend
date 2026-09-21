import { describe, expect, it } from "vitest";

import { COMMON_GROUPS, SEGMENTS } from "./navigation";
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
});
