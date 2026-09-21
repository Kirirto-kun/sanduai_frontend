import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import NotFound from "./not-found";

describe("NotFound", () => {
  it("renders safely without the root language provider", () => {
    const markup = renderToStaticMarkup(createElement(NotFound));

    expect(markup).toContain("Страница не найдена");
    expect(markup).toContain('href="/dashboard"');
  });
});
