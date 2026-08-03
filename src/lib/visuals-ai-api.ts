/**
 * API генерации визуальных материалов и сценариев.
 *
 * Вынесено из `api.ts` в отдельный модуль, чтобы визуальные инструменты имели
 * собственный типизированный API-клиент.
 */

import { getToken, InsufficientTokensError } from "./api";
import { getApiBase } from "./api-base";
import {
  API_ERROR_CODES,
  ApiRequestError,
  requestJson,
  type ApiFailure,
} from "./http-client";
import { withIdempotencyKey } from "./idempotency";

const API_BASE = getApiBase();

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

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function visualApiError(failure: ApiFailure): Error {
  if (failure.status === 402) {
    const detail =
      failure.details && typeof failure.details === "object"
        ? String((failure.details as Record<string, unknown>).detail ?? failure.message)
        : failure.message;
    const required = Number(detail.match(/Required:\s*(\d+)/i)?.[1] ?? 0);
    const available = Number(detail.match(/Available:\s*(\d+)/i)?.[1] ?? 0);
    return new InsufficientTokensError(
      detail || "Insufficient tokens",
      required,
      available,
    );
  }

  const message = failure.code === API_ERROR_CODES.NETWORK_ERROR
    ? "Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз."
    : failure.message;
  return new ApiRequestError(message, failure.status, failure.details, failure.code);
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  // Content-Type не задаём — браузер сам проставит boundary для multipart.
  return requestJson<T>(
    `${API_BASE}${path}`,
    {
      method: "POST",
      headers: withIdempotencyKey({ Accept: "application/json", ...authHeaders() }),
      body: form,
    },
    { errorFactory: visualApiError },
  );
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  return requestJson<T>(
    `${API_BASE}${path}`,
    {
      method: "POST",
      headers: withIdempotencyKey({
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders(),
      }),
      body: JSON.stringify(payload),
    },
    { errorFactory: visualApiError },
  );
}

// --- Көрнекілік --------------------------------------------------------------

export async function generateKornekilik(params: {
  topic: string;
  language: Language;
  orientation: Orientation;
  notes?: string;
  photos?: File[];
}): Promise<KornekilikResult> {
  const form = new FormData();
  form.append("topic", params.topic);
  form.append("language", params.language);
  form.append("orientation", params.orientation);
  form.append("notes", params.notes ?? "");
  (params.photos ?? []).forEach((file) => form.append("photos", file));

  return postForm<KornekilikResult>("/api/v1/visuals-ai/kornekilik", form);
}

// --- Инфографика -------------------------------------------------------------

export async function generateInfographic(params: {
  topic: string;
  language: Language;
  orientation: Orientation;
}): Promise<InfographicResult> {
  return postJson<InfographicResult>("/api/v1/visuals-ai/infographic", params);
}

// --- Комикс ------------------------------------------------------------------

export async function generateComic(params: {
  description: string;
  panelCount: number;
  language: Language;
  style: ComicStyle;
  photos?: File[];
}): Promise<ComicResult> {
  const form = new FormData();
  form.append("description", params.description);
  form.append("panel_count", String(params.panelCount));
  form.append("language", params.language);
  form.append("style", params.style);
  (params.photos ?? []).forEach((file) => form.append("photos", file));

  return postForm<ComicResult>("/api/v1/visuals-ai/comic", form);
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
  return postJson<ScenarioResult>("/api/v1/scenario/generate", {
    topic: params.topic,
    segment: params.segment,
    age: params.age,
    duration_minutes: params.durationMinutes,
    language: params.language,
    notes: params.notes || null,
  });
}
