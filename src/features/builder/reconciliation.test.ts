import { describe, expect, it, vi } from "vitest";

import type { GenerationJob } from "@/lib/api";

import {
  BuilderCompletionContractError,
  BuilderCompletionPendingError,
  startBuilderCompletionReconciliation,
  versionsIncludeProjectSnapshot,
} from "./reconciliation";
import type { BuilderProject, BuilderVersion } from "./types";

const PROJECT_ID = "5cb79bda-6e62-4f7f-a4b7-46cbc7a70001";

function terminalJob(
  result: Record<string, unknown>,
  status: "completed" | "billing_error" = "completed",
): GenerationJob {
  return {
    id: "8870e28b-77b2-4381-ae91-84c2247a0001",
    kind: "builder.build",
    resource_id: PROJECT_ID,
    title: "Builder",
    source_path: `/dashboard/ai/builder?project=${PROJECT_ID}`,
    status,
    progress: { current: 3, total: 3 },
    cost_tokens: 20,
    captured_tokens: 20,
    billing_status: "captured",
    attempt_count: 1,
    cancel_requested: false,
    error_code: null,
    error_message: null,
    created_at: "2026-09-22T00:00:00Z",
    updated_at: "2026-09-22T00:01:00Z",
    started_at: "2026-09-22T00:00:01Z",
    completed_at: "2026-09-22T00:01:00Z",
    expires_at: null,
    result,
    artifact_urls: [],
  };
}

function project(overrides: Partial<BuilderProject> = {}): BuilderProject {
  return {
    id: PROJECT_ID,
    title: "Game",
    description: "Interactive game",
    project_type: "game",
    content_language: "kk",
    framework: "vanilla",
    files: { "index.html": "<button hidden>Replay</button>" },
    assets: [],
    chat_history: [],
    plan: [],
    current_version: 3,
    revision: 4,
    visibility: "private",
    deployment_url: null,
    published_version: null,
    token_usage: 20,
    created_at: "2026-09-22T00:00:00Z",
    updated_at: "2026-09-22T00:01:00Z",
    ...overrides,
  };
}

describe("Builder completion reconciliation", () => {
  it("makes the updated project available without waiting for version history", async () => {
    let resolveVersions!: (versions: BuilderVersion[]) => void;
    const versions = new Promise<BuilderVersion[]>((resolve) => {
      resolveVersions = resolve;
    });
    const loadProject = vi.fn().mockResolvedValue(project());
    const loadVersions = vi.fn().mockReturnValue(versions);

    const reconciliation = startBuilderCompletionReconciliation(
      PROJECT_ID,
      terminalJob({ project_id: PROJECT_ID, current_version: 3, revision: 4 }),
      { loadProject, loadVersions },
    );

    await expect(reconciliation.project).resolves.toMatchObject({ current_version: 3 });
    expect(loadVersions).toHaveBeenCalledWith(PROJECT_ID);
    resolveVersions([]);
    await expect(reconciliation.versions).resolves.toEqual([]);
  });

  it("treats a version-history failure as non-fatal after files load", async () => {
    const reconciliation = startBuilderCompletionReconciliation(
      PROJECT_ID,
      terminalJob({ project_id: PROJECT_ID, current_version: 3, revision: 4 }),
      {
        loadProject: vi.fn().mockResolvedValue(project()),
        loadVersions: vi.fn().mockRejectedValue(new Error("history unavailable")),
      },
    );

    await expect(reconciliation.project).resolves.toMatchObject({ files: project().files });
    await expect(reconciliation.versions).resolves.toBeNull();
  });

  it("keeps polling when the completed version is not visible yet", async () => {
    const reconciliation = startBuilderCompletionReconciliation(
      PROJECT_ID,
      terminalJob({ project_id: PROJECT_ID, current_version: 3, revision: 4 }),
      {
        loadProject: vi.fn().mockResolvedValue(project({ current_version: 2, revision: 3 })),
        loadVersions: vi.fn().mockResolvedValue([]),
      },
    );

    await expect(reconciliation.project).rejects.toBeInstanceOf(BuilderCompletionPendingError);
  });

  it("rejects a completed result that points at another project", async () => {
    const reconciliation = startBuilderCompletionReconciliation(
      PROJECT_ID,
      terminalJob({
        project_id: "5cb79bda-6e62-4f7f-a4b7-46cbc7a70002",
        current_version: 3,
        revision: 4,
      }),
      {
        loadProject: vi.fn().mockResolvedValue(project()),
        loadVersions: vi.fn().mockResolvedValue([]),
      },
    );

    await expect(reconciliation.project).rejects.toBeInstanceOf(BuilderCompletionContractError);
  });

  it("rejects a completed result without a durable version pointer", async () => {
    const reconciliation = startBuilderCompletionReconciliation(
      PROJECT_ID,
      terminalJob({}),
      {
        loadProject: vi.fn().mockResolvedValue(project()),
        loadVersions: vi.fn().mockResolvedValue([]),
      },
    );

    await expect(reconciliation.project).rejects.toBeInstanceOf(BuilderCompletionContractError);
  });

  it("requires a durable version pointer before treating a billing error as saved", async () => {
    const loadProject = vi.fn().mockResolvedValue(project());
    const reconciliation = startBuilderCompletionReconciliation(
      PROJECT_ID,
      terminalJob({ billing_status: "error" }, "billing_error"),
      {
        loadProject,
        loadVersions: vi.fn().mockResolvedValue([]),
      },
    );

    await expect(reconciliation.project).rejects.toBeInstanceOf(BuilderCompletionContractError);
    expect(loadProject).not.toHaveBeenCalled();
  });

  it("keeps a billing-error completion pending until its persisted snapshot is visible", async () => {
    const reconciliation = startBuilderCompletionReconciliation(
      PROJECT_ID,
      terminalJob(
        { project_id: PROJECT_ID, current_version: 4, revision: 5 },
        "billing_error",
      ),
      {
        loadProject: vi.fn().mockResolvedValue(project({ current_version: 3, revision: 4 })),
        loadVersions: vi.fn().mockResolvedValue([]),
      },
    );

    await expect(reconciliation.project).rejects.toBeInstanceOf(BuilderCompletionPendingError);
  });

  it("keeps a billing-error completion pending while the persisted revision is absent", async () => {
    const reconciliation = startBuilderCompletionReconciliation(
      PROJECT_ID,
      terminalJob(
        { project_id: PROJECT_ID, current_version: 3, revision: 4 },
        "billing_error",
      ),
      {
        loadProject: vi.fn().mockResolvedValue(project({ revision: undefined })),
        loadVersions: vi.fn().mockResolvedValue([]),
      },
    );

    await expect(reconciliation.project).rejects.toBeInstanceOf(BuilderCompletionPendingError);
  });

  it("accepts a billing-error completion only after the persisted pointer is visible", async () => {
    const reconciliation = startBuilderCompletionReconciliation(
      PROJECT_ID,
      terminalJob(
        { project_id: PROJECT_ID, current_version: 3, revision: 4 },
        "billing_error",
      ),
      {
        loadProject: vi.fn().mockResolvedValue(project()),
        loadVersions: vi.fn().mockResolvedValue([]),
      },
    );

    await expect(reconciliation.project).resolves.toMatchObject({
      id: PROJECT_ID,
      current_version: 3,
      revision: 4,
    });
  });

  it("rejects version history that does not include the reconciled snapshot", () => {
    const current = project({ current_version: 4 });
    const stale = [{
      version: 3,
      prompt: "Old",
      created_at: "2026-09-22T00:00:00Z",
      changed_files: ["script.js"],
    }];

    expect(versionsIncludeProjectSnapshot(current, stale)).toBe(false);
    expect(versionsIncludeProjectSnapshot(current, [
      ...stale,
      { ...stale[0], version: 4, prompt: "Current" },
    ])).toBe(true);
  });
});
