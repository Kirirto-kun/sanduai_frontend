import { describe, expect, it } from "vitest";

import type { GenerationJob } from "@/lib/api";

import {
  BUILDER_GENERATION_KIND,
  attachJobToPendingBuilderBuild,
  builderJobBelongsToProject,
  builderProjectIdFromJob,
  builderProjectIdFromSourcePath,
  builderWorkspaceHref,
  clearPendingBuilderBuild,
  isActiveBuilderJob,
  isTerminalBuilderJob,
  listPendingBuilderBuilds,
  pendingBuildRecoveryAction,
  readBuilderComposerDraft,
  readBuilderHomeDraft,
  readPendingBuilderBuild,
  writeBuilderComposerDraft,
  writeBuilderHomeDraft,
  writePendingBuilderBuild,
} from "./persistence";

const PROJECT_ID = "5cb79bda-6e62-4f7f-a4b7-46cbc7a70001";
const OTHER_PROJECT_ID = "5cb79bda-6e62-4f7f-a4b7-46cbc7a70002";
const JOB_ID = "8870e28b-77b2-4381-ae91-84c2247a0001";
const USER_SCOPE = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_SCOPE = "22222222-2222-4222-8222-222222222222";

function memoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() { return entries.size; },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => { entries.delete(key); },
    setItem: (key, value) => { entries.set(key, value); },
  };
}

function pending(projectId = PROJECT_ID, createdAt = Date.now()) {
  return {
    version: 1 as const,
    projectId,
    idempotencyKey: "builder-test-idempotency-key",
    payload: {
      prompt: "Создай интерактивную карту",
      expected_version: 0,
      expected_revision: 1,
      asset_ids: [],
      mode: "generate" as const,
      max_cost: 50,
    },
    createdAt,
  };
}

describe("Builder durable refresh persistence", () => {
  it("retains exact request identity before acknowledgement and attaches the server job", () => {
    const storage = memoryStorage();
    const record = pending();
    writePendingBuilderBuild(record, USER_SCOPE, storage);

    expect(readPendingBuilderBuild(PROJECT_ID, USER_SCOPE, storage, record.createdAt + 100)).toEqual(record);
    expect(attachJobToPendingBuilderBuild(PROJECT_ID, JOB_ID, USER_SCOPE, storage)?.jobId).toBe(JOB_ID);
    expect(readPendingBuilderBuild(PROJECT_ID, USER_SCOPE, storage, record.createdAt + 100)?.idempotencyKey)
      .toBe("builder-test-idempotency-key");
  });

  it("keeps concurrent projects separate and clears only the expected job", () => {
    const storage = memoryStorage();
    const now = Date.now();
    writePendingBuilderBuild(pending(PROJECT_ID, now - 1_000), USER_SCOPE, storage);
    writePendingBuilderBuild(pending(OTHER_PROJECT_ID, now), USER_SCOPE, storage);
    attachJobToPendingBuilderBuild(PROJECT_ID, JOB_ID, USER_SCOPE, storage);

    clearPendingBuilderBuild(PROJECT_ID, "8870e28b-77b2-4381-ae91-84c2247a9999", USER_SCOPE, storage);
    expect(listPendingBuilderBuilds(USER_SCOPE, storage, now + 100)).toHaveLength(2);

    clearPendingBuilderBuild(PROJECT_ID, JOB_ID, USER_SCOPE, storage);
    expect(listPendingBuilderBuilds(USER_SCOPE, storage, now + 100).map((item) => item.projectId))
      .toEqual([OTHER_PROJECT_ID]);
  });

  it("does not clear an unacknowledged request for an unrelated job", () => {
    const storage = memoryStorage();
    const record = pending();
    writePendingBuilderBuild(record, USER_SCOPE, storage);

    clearPendingBuilderBuild(PROJECT_ID, JOB_ID, USER_SCOPE, storage);

    expect(readPendingBuilderBuild(PROJECT_ID, USER_SCOPE, storage, record.createdAt + 100)).toEqual(record);
  });

  it("can follow another tab's active job without losing this tab's composer", () => {
    const storage = memoryStorage();
    const record = pending();
    writePendingBuilderBuild(record, USER_SCOPE, storage);
    writeBuilderComposerDraft(PROJECT_ID, {
      version: 1,
      message: record.payload.prompt,
      assetIds: ["asset-new-tab"],
      updatedAt: record.createdAt,
    }, USER_SCOPE, storage);

    // A GENERATION_ALREADY_ACTIVE conflict discards only the unsafe replay
    // record. The user's different prompt remains available after the other
    // tab's job reaches a terminal state.
    clearPendingBuilderBuild(PROJECT_ID, undefined, USER_SCOPE, storage);

    expect(readPendingBuilderBuild(PROJECT_ID, USER_SCOPE, storage, record.createdAt + 100)).toBeNull();
    expect(readBuilderComposerDraft(PROJECT_ID, USER_SCOPE, storage, record.createdAt + 100)).toMatchObject({
      message: record.payload.prompt,
      assetIds: ["asset-new-tab"],
    });
  });

  it("drops malformed and expired pending requests instead of replaying them", () => {
    const storage = memoryStorage();
    const now = Date.now();
    writePendingBuilderBuild(pending(PROJECT_ID, now), USER_SCOPE, storage);
    expect(readPendingBuilderBuild(PROJECT_ID, USER_SCOPE, storage, now + 49 * 60 * 60 * 1_000)).toBeNull();

    storage.setItem(`sandu-builder-pending-builds:v1:${USER_SCOPE}`, JSON.stringify({
      [PROJECT_ID]: { ...pending(), idempotencyKey: "bad" },
    }));
    expect(readPendingBuilderBuild(PROJECT_ID, USER_SCOPE, storage, now + 100)).toBeNull();
  });

  it("restores safe home and project composer drafts", () => {
    const storage = memoryStorage();
    writeBuilderHomeDraft({
      version: 1,
      prompt: "Сайт для викторины",
      projectType: "game",
      contentLanguage: "ru",
      attachmentNames: ["questions.pdf"],
      updatedAt: 1_000,
    }, USER_SCOPE, storage);
    writeBuilderComposerDraft(PROJECT_ID, {
      version: 1,
      message: "Добавь второй раунд",
      assetIds: ["asset-1"],
      unuploadedAttachmentNames: ["video.mp4"],
      updatedAt: 1_000,
    }, USER_SCOPE, storage);

    expect(readBuilderHomeDraft(USER_SCOPE, storage, 1_100)?.prompt).toBe("Сайт для викторины");
    expect(readBuilderComposerDraft(PROJECT_ID, USER_SCOPE, storage, 1_100)).toMatchObject({
      message: "Добавь второй раунд",
      assetIds: ["asset-1"],
      unuploadedAttachmentNames: ["video.mp4"],
    });
  });

  it("maps only Builder jobs to their project and distinguishes terminal states", () => {
    const running = {
      id: JOB_ID,
      kind: BUILDER_GENERATION_KIND,
      status: "running",
      source_path: `/dashboard/ai/builder?project=${PROJECT_ID}`,
      result: null,
    } as GenerationJob;
    const completed = {
      ...running,
      status: "completed",
      resource_id: OTHER_PROJECT_ID,
      result: { project_id: OTHER_PROJECT_ID },
    } as GenerationJob;

    expect(builderProjectIdFromSourcePath(running.source_path)).toBe(PROJECT_ID);
    expect(builderProjectIdFromSourcePath("https://evil.example/builder?project=" + PROJECT_ID)).toBeNull();
    expect(builderProjectIdFromJob(running)).toBe(PROJECT_ID);
    expect(builderProjectIdFromJob(completed)).toBe(OTHER_PROJECT_ID);
    expect(builderJobBelongsToProject(completed, PROJECT_ID)).toBe(false);
    expect(builderJobBelongsToProject(completed, OTHER_PROJECT_ID)).toBe(true);
    expect(isActiveBuilderJob(running)).toBe(true);
    expect(isTerminalBuilderJob(completed)).toBe(true);
    expect(builderWorkspaceHref(PROJECT_ID, JOB_ID))
      .toBe(`/dashboard/ai/builder?project=${PROJECT_ID}&job=${JOB_ID}`);

    expect(builderProjectIdFromJob({
      ...running,
      source_path: "/dashboard/ai/builder",
      resource_id: PROJECT_ID,
    })).toBe(PROJECT_ID);
  });

  it("isolates prompts and pending jobs between authenticated users", () => {
    const storage = memoryStorage();
    const record = pending();
    writePendingBuilderBuild(record, USER_SCOPE, storage);
    writeBuilderHomeDraft({
      version: 1,
      prompt: "Приватный запрос первого учителя",
      projectType: "custom",
      contentLanguage: "ru",
      attachmentNames: ["private.pdf"],
      updatedAt: record.createdAt,
    }, USER_SCOPE, storage);

    expect(readPendingBuilderBuild(PROJECT_ID, OTHER_USER_SCOPE, storage, record.createdAt + 1)).toBeNull();
    expect(readBuilderHomeDraft(OTHER_USER_SCOPE, storage, record.createdAt + 1)).toBeNull();
    expect(readPendingBuilderBuild(PROJECT_ID, USER_SCOPE, storage, record.createdAt + 1)).toEqual(record);
  });

  it("reconciles a lost acknowledgement before deciding whether replay is safe", () => {
    expect(pendingBuildRecoveryAction("succeeded")).toBe("apply");
    expect(pendingBuildRecoveryAction("pending")).toBe("wait");
    expect(pendingBuildRecoveryAction("failed")).toBe("restore");
    expect(pendingBuildRecoveryAction("billing_error")).toBe("block");
    expect(pendingBuildRecoveryAction("unknown")).toBe("replay");
  });
});
