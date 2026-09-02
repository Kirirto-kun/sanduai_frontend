/**
 * API генерации визуальных материалов и сценариев.
 *
 * Вынесено из `api.ts` в отдельный модуль, чтобы визуальные инструменты имели
 * собственный типизированный API-клиент.
 */

import {
  enqueueGenerationJob,
  waitForGenerationResult,
} from "./api";

export type Language = "kk" | "ru";
export type Orientation = "portrait" | "landscape" | "square";
export type ComicStyle = "cartoon" | "manga" | "watercolor" | "retro";

export type KornekilikResult = {
  image_url: string;
  title: string;
  cost_tokens: number;
};

export type InfographicResult = {
  image_url: string;
  title: string;
  cost_tokens: number;
};

export type ComicDialogueLine = { speaker: string; text: string };

export type ComicPanelResult = {
  index: number;
  dialogue: ComicDialogueLine[];
};

export type ComicResult = {
  title: string;
  image_url: string;
  panels: ComicPanelResult[];
  cost_tokens: number;
};

// --- Сценарий ----------------------------------------------------------------

export type ScenarioSegment = "kindergarten" | "library" | "school";

export type ScenarioBlockType =
  | "intro"
  | "poem"
  | "song"
  | "dance"
  | "game"
  | "contest"
  | "skit"
  | "speech"
  | "outro";

export type ScenarioBlock = {
  index: number;
  block_type: ScenarioBlockType;
  title: string;
  minutes: number;
  content: string;
  participants: string | null;
  props: string | null;
};

export type ScenarioResult = {
  title: string;
  goal: string;
  equipment: string;
  blocks: ScenarioBlock[];
  total_minutes: number;
  cost_tokens: number;
  disclaimer: string;
};

// --- Транспорт ---------------------------------------------------------------

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Reference image could not be read"));
    reader.readAsDataURL(file);
  });
}

async function runDurableJob<T>(
  kind: string,
  payload: Record<string, unknown>,
  title: string,
): Promise<T> {
  const job = await enqueueGenerationJob(kind, payload, { title });
  return waitForGenerationResult<T>(job.id);
}

// --- Көрнекілік --------------------------------------------------------------

export async function generateKornekilik(params: {
  topic: string;
  language: Language;
  orientation: Orientation;
  notes?: string;
  photos?: File[];
}): Promise<KornekilikResult> {
  const photosBase64 = await Promise.all((params.photos ?? []).map(fileToDataUrl));
  return runDurableJob<KornekilikResult>("visual.kornekilik", {
    topic: params.topic,
    language: params.language,
    orientation: params.orientation,
    notes: params.notes ?? "",
    photos_base64: photosBase64,
  }, params.topic);
}

// --- Инфографика -------------------------------------------------------------

export async function generateInfographic(params: {
  topic: string;
  language: Language;
  orientation: Orientation;
}): Promise<InfographicResult> {
  return runDurableJob<InfographicResult>("visual.infographic", params, params.topic);
}

// --- Комикс ------------------------------------------------------------------

export async function generateComic(params: {
  description: string;
  panelCount: number;
  language: Language;
  style: ComicStyle;
  photos?: File[];
}): Promise<ComicResult> {
  const photosBase64 = await Promise.all((params.photos ?? []).map(fileToDataUrl));
  return runDurableJob<ComicResult>("visual.comic", {
    description: params.description,
    panel_count: params.panelCount,
    language: params.language,
    style: params.style,
    photos_base64: photosBase64,
  }, params.description);
}

// --- Сценарий ----------------------------------------------------------------

export async function generateScenario(params: {
  topic: string;
  segment: ScenarioSegment;
  age: string;
  durationMinutes: number;
  language: Language;
  notes?: string;
}): Promise<ScenarioResult> {
  return runDurableJob<ScenarioResult>("scenario.generate", {
    topic: params.topic,
    segment: params.segment,
    age: params.age,
    duration_minutes: params.durationMinutes,
    language: params.language,
    notes: params.notes || null,
  }, params.topic);
}
