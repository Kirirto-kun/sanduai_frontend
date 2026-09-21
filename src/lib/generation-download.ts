import {
  exportArticleDocx,
  exportClassHourDocx,
  exportEssayDocx,
  exportExamDocx,
  exportLessonPlanDocx,
  exportQuizDocx,
  exportWorksheetDocx,
  getGenerationJob,
  getToken,
  type ArticleResponse,
  type ClassHourResponse,
  type EssayGenerateResponse,
  type ExamGenerateResponse,
  type GenerationJob,
  type GenerationJobSummary,
  type LessonPlanLanguage,
  type LessonPlanResponse,
  type QuizGenerateResponse,
  type WorksheetImageResult,
  type WorksheetResponse,
} from "./api";
import { getApiBase } from "./api-base";
import {
  contentLanguageFromResult,
  tryNormalizeContentLanguage,
  type ContentLanguage,
} from "./content-languages";
import {
  isPedagogicalIdeasResult,
  pedagogicalIdeasHtml,
} from "./pedagogical-ideas";
import type { ScenarioResult } from "./visuals-ai-api";
import {
  buildScenarioDocumentHtml,
  scenarioDocumentLabels,
} from "./scenario-document";
import { raceGameDocumentHtml, restoreRaceGame } from "./race-generation";


const LESSON_PLAN_LANGUAGE = {
  kk: "kazakh",
  ru: "russian",
  en: "english",
  ky: "kyrgyz",
  uz: "uzbek",
} as const satisfies Record<ContentLanguage, LessonPlanLanguage>;


function safeFileName(value: string): string {
  const normalized = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return normalized || "material";
}


export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Firefox and automated Chromium can still be consuming the Blob when the
  // click handler returns.  Revoking synchronously intermittently cancels a
  // perfectly valid teacher download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}


async function downloadArtifact(job: GenerationJob, artifact: string): Promise<void> {
  const apiBase = getApiBase();
  const url = /^https?:\/\//i.test(artifact)
    ? artifact
    : `${apiBase}${artifact.startsWith("/") ? artifact : `/${artifact}`}`;
  const token = getToken();
  const artifactOrigin = new URL(url, window.location.origin).origin;
  const apiOrigin = new URL(apiBase, window.location.origin).origin;
  const response = await fetch(url, {
    cache: "no-store",
    // Public CDN files must not receive our API bearer token. Besides leaking
    // credentials to another origin, that header can trigger a failing CORS
    // preflight and make the teacher-facing Download button appear broken.
    headers: token && artifactOrigin === apiOrigin
      ? { Authorization: `Bearer ${token}` }
      : undefined,
  });
  if (!response.ok) throw new Error("MATERIAL_DOWNLOAD_FAILED");
  const extension = new URL(url, window.location.origin).pathname.split(".").pop() || "bin";
  saveBlob(await response.blob(), `${safeFileName(job.title)}.${extension}`);
}


async function exportedDocument(
  job: GenerationJob,
): Promise<{ blob: Blob; extension: string } | null> {
  if (job.kind === "race.generate" && (!job.result || Array.isArray(job.result))) {
    throw new Error("MATERIAL_DOWNLOAD_FAILED");
  }
  if (!job.result || Array.isArray(job.result)) return null;
  const contentLanguage = contentLanguageForGenerationJob(job);
  if (!contentLanguage) {
    // Rebuilding an old document with the current interface language silently
    // changes its headings. Preserve the stored material instead of guessing.
    throw new Error("MATERIAL_LANGUAGE_UNKNOWN");
  }

  switch (job.kind) {
    case "kmzh.generate":
      return {
        blob: await exportLessonPlanDocx({
          ...(job.result as LessonPlanResponse),
          language: LESSON_PLAN_LANGUAGE[contentLanguage],
        }),
        extension: "docx",
      };
    case "essay.generate":
    case "essay.revise":
      return {
        blob: await exportEssayDocx({
          ...(job.result as EssayGenerateResponse),
          language: contentLanguage,
        }),
        extension: "docx",
      };
    case "article.generate":
    case "article.revise":
      return {
        blob: await exportArticleDocx({
          ...(job.result as ArticleResponse),
          language: contentLanguage,
        }),
        extension: "docx",
      };
    case "bjb.generate": {
      const exam = job.result as ExamGenerateResponse;
      return {
        blob: await exportExamDocx({
          exam_project: {
            ...exam,
            meta: { ...exam.meta, lang: contentLanguage },
          },
          version: "teacher",
        }),
        extension: "docx",
      };
    }
    case "class_hour.generate": {
      const result = job.result as ClassHourResponse;
      return {
        blob: await exportClassHourDocx({
          topic: result.topic,
          blocks: result.blocks,
          language: contentLanguage,
        }),
        extension: "docx",
      };
    }
    case "quiz.generate":
      return {
        blob: await exportQuizDocx({
          title: job.title,
          tasks: (job.result as QuizGenerateResponse).tasks,
          language: contentLanguage,
        }),
        extension: "zip",
      };
    case "worksheet.generate":
      return {
        blob: await exportWorksheetDocx({
          ...(job.result as WorksheetResponse),
          language: contentLanguage,
        }),
        extension: "docx",
      };
    case "pedagogical_idea.generate":
      if (!isPedagogicalIdeasResult(job.result)) return null;
      return {
        blob: new Blob(["\ufeff", pedagogicalIdeasHtml(job.result, contentLanguage)], {
          type: "application/msword;charset=utf-8",
        }),
        extension: "doc",
      };
    case "scenario.generate": {
      return {
        blob: new Blob(
          [
            "\ufeff",
            buildScenarioDocumentHtml(
              job.result as ScenarioResult,
              scenarioDocumentLabels(contentLanguage),
            ),
          ],
          { type: "application/msword;charset=utf-8" },
        ),
        extension: "doc",
      };
    }
    case "race.generate": {
      const game = restoreRaceGame(job);
      if (!game) throw new Error("MATERIAL_DOWNLOAD_FAILED");
      return {
        blob: new Blob(["\ufeff", raceGameDocumentHtml(game)], {
          type: "application/msword;charset=utf-8",
        }),
        extension: "doc",
      };
    }
    default:
      return null;
  }
}


function cyclogramDocumentId(job: GenerationJob): string | null {
  if (job.kind !== "cyclogram.generate" || !job.result || Array.isArray(job.result)) return null;
  const result = job.result as Record<string, unknown>;
  if (typeof result.id === "string") return result.id;
  if (typeof result.document_id === "string") return result.document_id;
  const document = result.document;
  return document && typeof document === "object" && typeof (document as { id?: unknown }).id === "string"
    ? (document as { id: string }).id
    : null;
}


async function downloadCyclogram(job: GenerationJob): Promise<boolean> {
  const documentId = cyclogramDocumentId(job);
  if (!documentId) return false;
  const token = getToken();
  const response = await fetch(`${getApiBase()}/api/cyclograms/${encodeURIComponent(documentId)}/export?format=docx`, {
    cache: "no-store",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error("MATERIAL_DOWNLOAD_FAILED");
  saveBlob(await response.blob(), `${safeFileName(job.title)}.docx`);
  return true;
}


/** Download a retained job without exposing its raw JSON in the UI. */
export async function downloadGenerationMaterial(
  summary: Pick<GenerationJobSummary, "id" | "title">,
): Promise<void> {
  const job = await getGenerationJob(summary.id);
  if (await downloadCyclogram(job)) return;
  const artifact = job.artifact_urls[0];
  if (artifact) {
    await downloadArtifact(job, artifact);
    return;
  }

  if (
    job.kind === "worksheet.image" &&
    job.result &&
    !Array.isArray(job.result) &&
    typeof (job.result as Partial<WorksheetImageResult>).image_url === "string"
  ) {
    await downloadArtifact(
      job,
      (job.result as WorksheetImageResult).image_url,
    );
    return;
  }

  const document = await exportedDocument(job);
  if (document) {
    saveBlob(document.blob, `${safeFileName(job.title)}.${document.extension}`);
    return;
  }

  // A teacher should never receive an internal JSON payload as a "document".
  // Every visible primary material has a real document or artifact exporter;
  // unknown future kinds fail safely until a proper exporter is added.
  throw new Error("MATERIAL_NOT_READY");
}


/** Resolve only durable language metadata; never use the current UI language. */
export function contentLanguageForGenerationJob(
  job: Pick<GenerationJob, "content_language" | "result">,
): ContentLanguage | null {
  return tryNormalizeContentLanguage(job.content_language)
    ?? contentLanguageFromResult(job.result);
}
