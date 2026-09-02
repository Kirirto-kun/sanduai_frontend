import type { GenerationJobSummary, GenerationJobStatus } from "./api";


const GENERATION_JOB_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIVE_STATUSES = new Set<GenerationJobStatus>([
  "queued",
  "running",
  "settling",
  "refunding",
]);
const SUPPORT_JOB_KINDS = new Set([
  "essay.revise",
  "article.revise",
  "class_hour.regenerate",
  "science.plan",
  "science.section",
  "science.generate_all",
  "science.regenerate",
  "science.finalize",
]);


export function generationJobIdFromSearchParam(value: string | null): string | null {
  const candidate = value?.trim() ?? "";
  return GENERATION_JOB_ID.test(candidate) ? candidate : null;
}


export function generationResultHref(jobId: string): string {
  return `/dashboard/generations?job=${encodeURIComponent(jobId)}`;
}


export function isActiveGenerationJob(
  job: Pick<GenerationJobSummary, "status">,
): boolean {
  return ACTIVE_STATUSES.has(job.status);
}


export function generationSourceHref(
  job: Pick<GenerationJobSummary, "id" | "source_path">,
): string {
  const fallback = "/dashboard/generations";
  const sourcePath = job.source_path.startsWith("/") ? job.source_path : fallback;
  const separator = sourcePath.includes("?") ? "&" : "?";
  return `${sourcePath}${separator}job=${encodeURIComponent(job.id)}`;
}


export function filterGenerationJobsByKind(
  jobs: GenerationJobSummary[],
  kinds: readonly string[],
): GenerationJobSummary[] {
  const acceptedKinds = new Set(kinds);
  return jobs.filter((job) => acceptedKinds.has(job.kind));
}


export function sortUniqueGenerationJobs(
  jobs: readonly GenerationJobSummary[],
): GenerationJobSummary[] {
  const uniqueJobs = new Map<string, GenerationJobSummary>();
  for (const job of jobs) {
    uniqueJobs.set(job.id, job);
  }
  return [...uniqueJobs.values()].sort(
    (left, right) => Date.parse(right.created_at) - Date.parse(left.created_at),
  );
}


export function selectGenerationHistoryPage(
  jobs: readonly GenerationJobSummary[],
  visibleLimit: number,
  sourceHasMore = false,
): { items: GenerationJobSummary[]; hasMore: boolean } {
  const sorted = sortUniqueGenerationJobs(jobs);
  const safeLimit = Math.max(1, Math.trunc(visibleLimit));
  return {
    items: sorted.slice(0, safeLimit),
    hasMore: sourceHasMore || sorted.length > safeLimit,
  };
}


export function isPrimaryGenerationMaterial(
  job: Pick<GenerationJobSummary, "kind">,
): boolean {
  return !SUPPORT_JOB_KINDS.has(job.kind);
}


export function generationExpiryCopy(
  job: Pick<GenerationJobSummary, "expires_at" | "status">,
  language: "ru" | "kk",
): string {
  if (!job.expires_at) {
    if (ACTIVE_STATUSES.has(job.status)) {
      return language === "kk"
        ? "Сақтау мерзімі жұмыс аяқталған соң көрсетіледі"
        : "Срок хранения появится после завершения";
    }
    return language === "kk" ? "Сақтау мерзімі нақтылануда" : "Срок хранения уточняется";
  }
  const expiresAt = new Date(job.expires_at);
  if (Number.isNaN(expiresAt.getTime())) {
    return language === "kk" ? "Сақтау мерзімі нақтылануда" : "Срок хранения уточняется";
  }
  const formatted = new Intl.DateTimeFormat(language === "kk" ? "kk-KZ" : "ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(expiresAt);
  return language === "kk" ? `${formatted} дейін қолжетімді` : `Доступно до ${formatted}`;
}
