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
  type LessonPlanResponse,
  type QuizGenerateResponse,
  type WorksheetResponse,
} from "./api";
import { getApiBase } from "./api-base";
import {
  isPedagogicalIdeasResult,
  pedagogicalIdeasHtml,
} from "./pedagogical-ideas";
import type { ScenarioResult } from "./visuals-ai-api";
import { buildScenarioDocumentHtml } from "./scenario-document";
import { raceGameDocumentHtml, restoreRaceGame } from "./race-generation";


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
  language: "ru" | "kk",
): Promise<{ blob: Blob; extension: string } | null> {
  if (job.kind === "race.generate" && (!job.result || Array.isArray(job.result))) {
    throw new Error("MATERIAL_DOWNLOAD_FAILED");
  }
  if (!job.result || Array.isArray(job.result)) return null;

  switch (job.kind) {
    case "kmzh.generate":
      return { blob: await exportLessonPlanDocx(job.result as LessonPlanResponse), extension: "docx" };
    case "essay.generate":
    case "essay.revise":
      return { blob: await exportEssayDocx(job.result as EssayGenerateResponse), extension: "docx" };
    case "article.generate":
    case "article.revise":
      return { blob: await exportArticleDocx(job.result as ArticleResponse), extension: "docx" };
    case "bjb.generate":
      return {
        blob: await exportExamDocx({
          exam_project: job.result as ExamGenerateResponse,
          version: "teacher",
        }),
        extension: "docx",
      };
    case "class_hour.generate": {
      const result = job.result as ClassHourResponse;
      return {
        blob: await exportClassHourDocx({ topic: result.topic, blocks: result.blocks }),
        extension: "docx",
      };
    }
    case "quiz.generate":
      return {
        blob: await exportQuizDocx({
          title: job.title,
          tasks: (job.result as QuizGenerateResponse).tasks,
        }),
        extension: "zip",
      };
    case "worksheet.generate":
      return {
        blob: await exportWorksheetDocx(job.result as WorksheetResponse),
        extension: "docx",
      };
    case "pedagogical_idea.generate":
      if (!isPedagogicalIdeasResult(job.result)) return null;
      return {
        blob: new Blob(["\ufeff", pedagogicalIdeasHtml(job.result, language)], {
          type: "application/msword;charset=utf-8",
        }),
        extension: "doc",
      };
    case "scenario.generate": {
      const labels = language === "kk"
        ? {
            goal: "Мақсаты",
            equipment: "Қажетті жабдық",
            participants: "Қатысушылар",
            props: "Реквизит",
            minutes: "минут",
          }
        : {
            goal: "Цель",
            equipment: "Необходимое оборудование",
            participants: "Участники",
            props: "Реквизит",
            minutes: "минут",
          };
      return {
        blob: new Blob(
          ["\ufeff", buildScenarioDocumentHtml(job.result as ScenarioResult, labels)],
          { type: "application/msword;charset=utf-8" },
        ),
        extension: "doc",
      };
    }
    case "race.generate": {
      const game = restoreRaceGame(job);
      if (!game) throw new Error("MATERIAL_DOWNLOAD_FAILED");
      return {
        blob: new Blob(["\ufeff", raceGameDocumentHtml(game, language)], {
          type: "application/msword;charset=utf-8",
        }),
        extension: "doc",
      };
    }
    default:
      return null;
  }
}


/** Download a retained job without exposing its raw JSON in the UI. */
export async function downloadGenerationMaterial(
  summary: Pick<GenerationJobSummary, "id" | "title">,
  language: "ru" | "kk" = "kk",
): Promise<void> {
  const job = await getGenerationJob(summary.id);
  const artifact = job.artifact_urls[0];
  if (artifact) {
    await downloadArtifact(job, artifact);
    return;
  }

  const document = await exportedDocument(job, language);
  if (document) {
    saveBlob(document.blob, `${safeFileName(job.title)}.${document.extension}`);
    return;
  }

  // A teacher should never receive an internal JSON payload as a "document".
  // Every visible primary material has a real document or artifact exporter;
  // unknown future kinds fail safely until a proper exporter is added.
  throw new Error("MATERIAL_NOT_READY");
}
