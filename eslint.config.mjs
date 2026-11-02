import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Existing effect synchronization predates the 7.1 compiler diagnostics.
  // Keep these 72 observations visible as warnings only in the reviewed files.
  // Core Hooks rules, purity/refs, and every new module retain their defaults.
  {
    name: "reviewed-legacy-effect-compatibility",
    files: [
      "src/app/dashboard/admin/page.tsx",
      "src/app/dashboard/ai-docs/page.tsx",
      "src/app/dashboard/ai/article/page.tsx",
      "src/app/dashboard/ai/bjb-tjb/page.tsx",
      "src/app/dashboard/ai/class-hours/page.tsx",
      "src/app/dashboard/ai/comics/page.tsx",
      "src/app/dashboard/ai/image-generation/page.tsx",
      "src/app/dashboard/ai/infographics/page.tsx",
      "src/app/dashboard/ai/kmzh-classic/page.tsx",
      "src/app/dashboard/ai/kornekilik/page.tsx",
      "src/app/dashboard/ai/lesson-plan/page.tsx",
      "src/app/dashboard/ai/scenario/page.tsx",
      "src/app/dashboard/ai/scientific-projects/\\[projectId\\]/edit/page.tsx",
      "src/app/dashboard/ai/scientific-projects/\\[projectId\\]/generate/page.tsx",
      "src/app/dashboard/ai/scientific-projects/page.tsx",
      "src/app/dashboard/ai/tests/page.tsx",
      "src/app/dashboard/ai/worksheets/page.tsx",
      "src/app/dashboard/library/games/at-zharys/page.tsx",
      "src/app/dashboard/library/visual-aids/page.tsx",
      "src/app/dashboard/media/voiceover/page.tsx",
      "src/app/profile/page.tsx",
      "src/components/VisualGroupModal.tsx",
      "src/components/presentations/editor/AiEditPanel.tsx",
      "src/features/builder/BuilderStudio.tsx",
      "src/features/builder/BuilderWorkspace.tsx",
      "src/features/builder/PreviewFrame.tsx",
      "src/features/cyclograms/CyclogramAdminWorkspace.tsx",
      "src/features/cyclograms/CyclogramWorkspace.tsx",
      "src/features/preschool-activities/PreschoolActivityAdminWorkspace.tsx",
      "src/features/preschool-activities/PreschoolActivityWorkspace.tsx",
      "src/features/video-generation/SceneEditor.tsx",
      "src/features/video-generation/VideoWorkspace.tsx",
      "src/hooks/useTokens.ts"
],
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
  {
    name: "reviewed-legacy-cyclogram-memoization",
    files: ["src/features/cyclograms/CyclogramWorkspace.tsx"],
    rules: { "react-hooks/preserve-manual-memoization": "warn" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated, pinned vendor bundle used inside the isolated Builder preview.
    "public/builder-runtime/**",
  ]),
]);

export default eslintConfig;
