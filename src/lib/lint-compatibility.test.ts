import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

describe("bounded legacy compiler diagnostics", () => {
  const eslint = new ESLint();
  it("keeps legacy synchronization visible while retaining core Hooks and security rules", async () => {
    const config = await eslint.calculateConfigForFile("src/hooks/useTokens.ts");
    expect(config.rules["react-hooks/set-state-in-effect"][0]).toBe(1);
    expect(config.rules["react-hooks/rules-of-hooks"][0]).toBe(2);
    expect(config.rules["react-hooks/refs"][0]).toBe(2);
    expect(config.rules["react-hooks/purity"][0]).toBe(2);
    const route = await eslint.calculateConfigForFile("src/app/dashboard/ai/scientific-projects/[projectId]/edit/page.tsx");
    expect(route.rules["react-hooks/set-state-in-effect"][0]).toBe(1);
  }, 30_000);
  it("keeps new Science history and future files at error severity", async () => {
    for (const path of ["src/features/science-pro/ScienceWorkspace.tsx", "src/app/dashboard/admin/future-component.tsx"]) {
      const config = await eslint.calculateConfigForFile(path);
      for (const rule of ["set-state-in-effect", "preserve-manual-memoization", "refs", "purity"]) expect(config.rules[`react-hooks/${rule}`][0]).toBe(2);
    }
    const preview = await eslint.calculateConfigForFile("src/features/builder/PreviewFrame.tsx");
    expect(preview.rules["react-hooks/refs"][0]).toBe(2);
    expect(preview.rules["react-hooks/purity"][0]).toBe(2);
  });
});
