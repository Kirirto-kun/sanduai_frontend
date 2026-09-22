import type { GenerationJob } from "@/lib/api";

import type { BuilderProject, BuilderVersion } from "./types";

type BuilderCompletionLoaders = {
  loadProject: (projectId: string) => Promise<BuilderProject>;
  loadVersions: (projectId: string) => Promise<BuilderVersion[]>;
};

type BuilderCompletionTarget = {
  projectId: string | null;
  currentVersion: number | null;
  revision: number | null;
};

export class BuilderCompletionContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BuilderCompletionContractError";
  }
}

export class BuilderCompletionPendingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BuilderCompletionPendingError";
  }
}

export function versionsIncludeProjectSnapshot(
  project: BuilderProject,
  versions: BuilderVersion[],
): boolean {
  return versions.some((item) => (item.version ?? item.number) === project.current_version);
}

function nonNegativeInteger(value: unknown): number | null {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

function completionTarget(job: GenerationJob): BuilderCompletionTarget {
  const requiresPersistedPointer = job.status === "completed" || job.status === "billing_error";
  if (!job.result || Array.isArray(job.result) || typeof job.result !== "object") {
    if (requiresPersistedPointer) {
      throw new BuilderCompletionContractError(
        "The terminal Builder job is missing its persisted project pointer.",
      );
    }
    return { projectId: null, currentVersion: null, revision: null };
  }
  const result = job.result as Record<string, unknown>;
  const target = {
    projectId: typeof result.project_id === "string" ? result.project_id : null,
    currentVersion: nonNegativeInteger(result.current_version),
    revision: nonNegativeInteger(result.revision),
  };
  if (
    requiresPersistedPointer
    && (!target.projectId || target.currentVersion === null || target.revision === null)
  ) {
    throw new BuilderCompletionContractError(
      "The terminal Builder job has an invalid persisted project pointer.",
    );
  }
  return target;
}

function assertCompletedProject(
  projectId: string,
  target: BuilderCompletionTarget,
  project: BuilderProject,
): BuilderProject {
  if (project.id !== projectId || (target.projectId && target.projectId !== projectId)) {
    throw new BuilderCompletionContractError(
      "The completed Builder job returned a different project.",
    );
  }
  const projectVersion = nonNegativeInteger(project.current_version);
  if (
    target.currentVersion !== null
    && (projectVersion === null || projectVersion < target.currentVersion)
  ) {
    throw new BuilderCompletionPendingError(
      "The completed Builder project version is not visible yet.",
    );
  }
  const projectRevision = nonNegativeInteger(project.revision);
  if (
    target.revision !== null
    && (projectRevision === null || projectRevision < target.revision)
  ) {
    throw new BuilderCompletionPendingError(
      "The completed Builder project revision is not visible yet.",
    );
  }
  return project;
}

/**
 * Project files are the completion-critical resource. Version history is useful
 * UI metadata, so it is fetched concurrently but can never delay or discard a
 * successfully loaded project.
 */
export function startBuilderCompletionReconciliation(
  projectId: string,
  job: GenerationJob,
  loaders: BuilderCompletionLoaders,
): {
  project: Promise<BuilderProject>;
  versions: Promise<BuilderVersion[] | null>;
} {
  const project = Promise.resolve()
    .then(() => completionTarget(job))
    .then(async (target) => {
      const value = await loaders.loadProject(projectId);
      return assertCompletedProject(projectId, target, value);
    });
  const versions = Promise.resolve()
    .then(() => loaders.loadVersions(projectId))
    .catch(() => null);
  return { project, versions };
}
