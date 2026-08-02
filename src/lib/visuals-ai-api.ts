/**
 * API генерации визуальных материалов и сценариев.
 *
 * Вынесено из `api.ts` (2345 строк) отдельным модулем — так же, как это уже
 * сделано для `presenton-api.ts`.
 */

import { getToken, InsufficientTokensError } from "./api";

const getApiBase = () => {
  let base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  return base;
};

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

/** Разбирает ответ, поднимая InsufficientTokensError на 402 — как в api.ts. */
async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 402) {
      const detail: string = data?.detail || "";
      const required = Number(detail.match(/Required:\s*(\d+)/i)?.[1] ?? 0);
      const available = Number(detail.match(/Available:\s*(\d+)/i)?.[1] ?? 0);
      throw new InsufficientTokensError(
        detail || "Insufficient tokens",
        required,
        available
      );
    }
    const raw = data?.detail ?? data?.error ?? data?.message;
    const message =
      typeof raw === "string"
        ? raw
        : raw
          ? JSON.stringify(raw)
          : `Запрос завершился с ошибкой ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Понятное сообщение вместо голого «Failed to fetch». */
function toReadableError(err: unknown): never {
  if (err instanceof TypeError) {
    throw new Error(
      "Не удалось связаться с сервером. Проверьте, что бэкенд запущен, и попробуйте ещё раз."
    );
  }
  throw err;
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  // Content-Type не задаём — браузер сам проставит boundary для multipart.
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
  } catch (err) {
    toReadableError(err);
  }
  return handleResponse<T>(res);
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    toReadableError(err);
  }
  return handleResponse<T>(res);
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
