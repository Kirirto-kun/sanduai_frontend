import type { PresentationProject } from "@/types/presentations";

export function isLegacyReadOnly(project: PresentationProject): boolean {
  return (
    project.read_only === true ||
    project.legacy_read_only === true ||
    project.status.toLowerCase() === "legacy_read_only" ||
    project.source_kind === "legacy_import"
  );
}

export function isLegacySourceMissing(project: PresentationProject): boolean {
  return (
    project.source_missing === true ||
    (isLegacyReadOnly(project) && project.options?.source_missing === true)
  );
}
