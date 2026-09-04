import { getApiBase } from "./api-base";
import {
  AuthSessionCoordinationError,
  clearAuthLogoutTombstone,
  hasAuthLogoutTombstone,
  markAuthLogoutTombstone,
  markAuthSessionActive,
  publishAuthSessionChange,
  runAuthCookieTransition,
} from "./auth-session";
import { decodeJwtPayload, isUsableJwt, resolveBootstrapUser } from "./auth-token";
import {
  apiErrorCodeForStatus,
  ApiRequestError,
  configureAuthRefresh,
  configureAuthTokenReader,
  fetchWithPolicy,
  refreshAccessToken,
  requestJson,
  API_ERROR_CODES,
  type ApiFailure,
} from "./http-client";
import { withIdempotencyKey } from "./idempotency";
import { clearCachedBalance, invalidateCachedBalance } from "./tokenCache";
import {
  TeacherFacingError,
  teacherFacingErrorMessage,
  toTeacherFacingError,
  type TeacherFacingLanguage,
} from "./teacher-facing-error";

export { ApiRequestError } from "./http-client";

const API_BASE = getApiBase();
const TOKEN_KEY = "sanduai_token";
export const AUTH_HTTP_TIMEOUT_MS = 10_000;

export type AuthResponse = {
  token: string;
  user_id: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  verification_code: string;
  full_name: string;
  phone?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegistrationCodeResponse = {
  expires_in_seconds: number;
  resend_after_seconds: number;
};

export type PasswordResetRequestResponse = {
  message: string;
};

export type EssayGeneratePayload = {
  topic: string;
  language: "kaz" | "rus";
  grade_level: string;
  word_count: number;
  essay_type: "argumentative" | "descriptive" | "narrative";
};

export type EssayContentBlock = {
  section_type: string;
  text: string;
};

export type EssayGenerateResponse = {
  title: string;
  essay_plan: string[];
  content_blocks: EssayContentBlock[];
};

export type EssayRevisePayload = {
  current_content_blocks: EssayContentBlock[];
  inline_comments?: { target_text: string; instruction: string }[];
  general_instruction?: string;
};

// Article types
export type ArticleGenreType = "scientific" | "publicistic" | "custom";

export type ArticleMeta = {
  title: string;
  author_block: string;
  abstract: string;
  keywords: string[];
};

export type ArticleSection = {
  heading: string;
  content: string;
};

export type ArticleGeneratePayload = {
  topic: string;
  language: "kaz" | "rus";
  author_name: string;
  author_role: string;
  genre: ArticleGenreType;
  custom_genre_description?: string;
  additional_context?: string;
};

export type ArticleResponse = {
  meta: ArticleMeta;
  sections: ArticleSection[];
  conclusion: string;
  references: string[];
};

export type ArticleRevisePayload = {
  current_meta: ArticleMeta;
  current_sections: ArticleSection[];
  current_conclusion: string;
  current_references: string[];
  inline_comments?: { target_text: string; instruction: string }[];
  general_instruction?: string;
};

// Lesson Plan (Short-term КМЖ) types
export type LessonPlanRequest = {
  subject: string;
  grade: string;
  topic: string;
  teacher_name: string;
  section_name: string;
  lesson_number: string;
  learning_objectives: string[];
  lesson_type: string; // Обязательное: "Жаңа сабақ", "Бекіту", "Қайталау" и т.д.
  date?: string | null; // Формат DD.MM.YYYY
  language?: "kazakh" | "russian"; // Опциональное, по умолчанию "kazakh"
  textbook_images?: string[]; // Опциональное, массив Base64 строк с префиксом data:image/...
  textbook_text?: string | null; // Опциональное, текст упражнений из учебника
  preferred_platform?: string | null; // Опциональное: "Kahoot", "BilimClass", "SanduAI.kz" и т.д.
};

export type LessonMeta = {
  section_name: string;
  subject: string;
  teacher_name: string;
  date: string;
  grade: string;
  students_present: string;
  students_absent: string;
  topic: string;
  learning_objectives: string[];
  lesson_objectives: string[];
};

export type LessonTask = {
  work_type: "ЖЖ" | "ТЖ";
  method_name: string;
  teacher_activity: string;
  student_activity: string;
  descriptors: string[];
  resources: string;
  time_marker: string | null;
};

export type NeuroExercise = string | { name: string; description?: string } | null;

export type LessonStage = {
  stage_name: string;
  time: string;
  neuro_exercise: NeuroExercise;
  tasks: LessonTask[];
};

export type LessonPlanResponse = {
  meta: LessonMeta;
  flow: LessonStage[];
};

export type LessonPlanDocxRequest = LessonPlanResponse;

// Exam (BJB/TJB) types
export type WidgetType = "multiple_choice" | "matching" | "true_false" | "text_open" | "fill_in_blank";

export type TaskGrading = {
  correct_answer: unknown;
  descriptor: string;
  score: number;
};

export type TaskContent = {
  question?: string;
  statement?: string;
  instruction?: string;
  options?: string[];
  pairs?: Array<{ left: string; right: string }>;
  image_placeholder_prompt?: string;
  text_with_gaps?: string;
  correct_answers?: string[];
};

export type ExamTask = {
  id: string;
  widget_type: WidgetType;
  content: TaskContent;
  grading: TaskGrading;
};

export type ExamMeta = {
  subject: string;
  grade: string;
  topic: string;
  learning_objectives: string[];
  total_score: number;
  exam_type: "bjb" | "tjb";
  lang: "kaz" | "rus";
  // New fields
  quarter?: number;
  ktp_topic?: string;
  task_count?: number;
  complexity?: "low" | "medium" | "high";
  allowed_task_types?: string[];
  special_instructions?: string;
};

export type ExamGeneratePayload = ExamMeta;

export type ExamGenerateResponse = {
  meta: ExamMeta;
  tasks: ExamTask[];
  calculated_total_score: number;
};

export type ExamExportPayload = {
  exam_project: ExamGenerateResponse;
  version: "student" | "teacher";
};

// Class Hour (Классный час / Сынып сағаты) types
export type ClassHourGeneratePayload = {
  language: "kz" | "ru";
  topic: string;
  grade: string;
  value: string;
  format: string;
  wishes?: string;
};

export type ClassHourBlock = {
  id: number;
  title: string;
  content: string;
};

export type ClassHourResponse = {
  lesson_id: string;
  topic: string;
  blocks: ClassHourBlock[];
};

export type ClassHourRegeneratePayload = {
  lesson_id: string;
  block_id: number;
  current_content: string;
  instruction?: string;
};

export type ClassHourExportPayload = {
  topic: string;
  blocks: ClassHourBlock[];
};

// Quiz (Тест генератор) types
export type QuizSourceType = "topic" | "text";
export type QuizLanguage = "kz" | "ru" | "en";
export type QuizDifficulty = "easy" | "medium" | "hard";
export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "open";

export type QuizTopicPayload = {
  source_type: "topic";
  subject: string;
  grade: string;
  topic: string;
  language: QuizLanguage;
  question_count: number;
  difficulty: QuizDifficulty;
  question_types: QuestionType[];
};

export type QuizTextPayload = {
  source_type: "text";
  context_text: string;
  language: QuizLanguage;
  question_count: number;
  difficulty: QuizDifficulty;
  question_types: QuestionType[];
};

export type QuizGeneratePayload = QuizTopicPayload | QuizTextPayload;

export type QuizTask = {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correct_answer: string | string[];
  explanation: string;
};

export type QuizGenerateResponse = {
  tasks: QuizTask[];
};

export type QuizExportPayload = {
  title: string;
  tasks: QuizTask[];
};

// At Zharys (Ат Жарыс) game types
export type GenerateRacePayload = {
  topic: string;
  grade: string;
  additional_info?: string;
  questions_count: number;
  language?: "kz" | "ru";
  teams_count: 2 | 3 | 4;
  victory_condition: number;
};

export type RaceQuestion = {
  id: string;
  text: string;
  options: string[]; // Правильный ответ всегда первый
  correct_answer: string;
};

export type GenerateRaceResponse = {
  game_id: string;
  questions: RaceQuestion[];
};

// Scientific Project (Ғылыми жоба) types - Wizard approach
export type CreatePlanPayload = {
  topic: string;
  direction: string;
  grade: string;
  research_type: "тәжірибелік" | "теориялық";
  subject: string;
  language: "ru" | "kz" | "en";
  school_name?: string;
  supervisor?: string;
  city?: string;
};

export type PlanStructure = {
  chapter_1_title: string;
  chapter_1_subsections: string[];
  chapter_2_title: string;
  chapter_2_subsections: string[];
};

export type DraftPlanResponse = {
  project_id: string;
  hypothesis: string;
  object: string;
  subject_field: string;
  methods: string[];
  structure: PlanStructure;
  scientific_novelty: string;
  practical_significance: string;
};

export type GenerateSectionPayload = {
  project_id: string;
  section_type: "introduction" | "chapter_1" | "chapter_2" | "conclusion";
  approved_plan?: DraftPlanResponse;
  user_comment?: string;
};

export type SectionResponse = {
  section_type: string;
  content: string;
  metadata: {
    word_count?: number;
    has_tables?: boolean;
  };
};

export type RegenerateSectionPayload = {
  project_id: string;
  section_type: string;
  instruction: string;
  current_content: string;
};

export type ProjectState = {
  project_id: string;
  user_id: string;
  topic?: string;
  language: string;
  step: number;
  plan: DraftPlanResponse;
  sections: Record<string, string>;
  tokens_spent: number;
  created_at: string;
  updated_at: string;
};

export type FinalizeProjectPayload = {
  project_id: string;
  student_name?: string;
  student_class?: string;
};

export type CompleteProjectResponse = {
  project_id: string;
  language: string;
  title_page: string;
  annotation: string;
  table_of_contents: string;
  introduction: string;
  chapter_1_theory: string;
  chapter_2_research: string;
  conclusion: string;
  references: string;
  appendix: string;
};

export type ScienceProjectListItem = {
  project_id: string;
  title: string;
  step: number;
  language: string;
  sections_ready: number;
  is_complete: boolean;
  updated_at: string;
  expires_at: string | null;
  active_job_id?: string | null;
  active_job_kind?: string | null;
};

export type ScienceProjectListResponse = {
  items: ScienceProjectListItem[];
  has_more?: boolean;
  next_offset?: number | null;
};

// Legacy types (kept for export compatibility)
export type ScientificProjectResponse = {
  title_page: string;
  annotation: string;
  table_of_contents: string;
  introduction: string;
  chapter_1_theory: string;
  chapter_2_research: string;
  conclusion: string;
  references: string;
  appendix: string;
};

export type ScientificProjectExportPayload = {
  content: ScientificProjectResponse;
};

// Worksheet types
export type WorksheetTaskType = "multiple_choice" | "fill_in_blank" | "matching" | "open_question";

export type WorksheetGeneratePayload = {
  subject: string;
  topic: string;
  grade: string;
  language: "ru" | "kz" | "kk" | "en";
  task_types: WorksheetTaskType[];
  user_comment?: string;
};

export type WorksheetMultipleChoiceOption = {
  key: string;
  text: string;
  is_correct: boolean;
};

export type WorksheetMultipleChoiceTask = {
  question: string;
  options: WorksheetMultipleChoiceOption[];
};

export type WorksheetFillInBlankTask = {
  text_with_gaps: string;
  correct_answers: string[];
};

export type WorksheetMatchingPair = {
  left: string;
  right: string;
};

export type WorksheetMatchingTask = {
  pairs: WorksheetMatchingPair[];
};

export type WorksheetOpenQuestionTask = {
  question: string;
  model_answer: string;
};

export type WorksheetContent = {
  title: string;
  multiple_choice?: WorksheetMultipleChoiceTask[];
  fill_in_blank?: WorksheetFillInBlankTask[];
  matching?: WorksheetMatchingTask[];
  open_questions?: WorksheetOpenQuestionTask[];
};

export type WorksheetResponse = {
  content: WorksheetContent;
};

export type WorksheetExportPayload = {
  content: WorksheetContent;
};

export type WorksheetImageLanguage = "kk" | "ru" | "en";

export type WorksheetStylePreset = "bright" | "calm" | "print";

export type WorksheetImageGeneratePayload = {
  subject: string;
  grade: number;
  language: WorksheetImageLanguage;
  topic?: string;
  content?: string;
  task_types: WorksheetTaskType[];
  style_description?: string;
  source_pages_base64?: string[];
};

export type WorksheetImageResult = {
  title: string;
  image_url: string;
  answer_key: string[];
  cost_tokens: number;
};

// Voiceover (Озвучка ИИ) — ElevenLabs
export type VoiceoverGeneratePayload = {
  text: string;
  voice_id: string;
  speed?: number;
};

export type VoiceoverResponse = {
  success: boolean;
  audio_url: string;
  duration?: number | null;
  characters_used?: number | null;
};

export type VoiceoverVoice = {
  name: string;
  voice_id: string;
  gender: string;
};

export type VoiceoverVoicesResponse = {
  voices: VoiceoverVoice[];
};

// Ybyrai Digital Avatar types
export type YbyraiLanguage = "kk" | "ru" | "auto";

export type YbyraiChatResponse = {
  text: string;
  audio_url: string;
  duration: number | null;
  transcribed_text: string | null;
};

// Token types
export type TokenBalance = {
  balance: number;
  user_id: string;
  has_subscription: boolean;
  subscription_end: string | null; // ISO format: "2026-02-15T00:00:00"
  subscription_plan: "free" | "premium";
};

export type TokenCosts = {
  costs: Record<string, number>;
};

export type TokenTransaction = {
  id: string;
  user_id: string;
  amount: number;
  operation_type: string;
  description: string;
  created_at: string;
};

// Custom error for insufficient tokens
export class InsufficientTokensError extends Error {
  required: number;
  available: number;

  constructor(message: string, required: number, available: number) {
    super(message);
    this.name = "InsufficientTokensError";
    this.required = required;
    this.available = available;
  }
}

function requestError(failure: ApiFailure): Error {
  if (failure.status === 402) {
    const details = failure.details && typeof failure.details === "object"
      ? failure.details as Record<string, unknown>
      : null;
    const nested = details?.detail && typeof details.detail === "object"
      ? details.detail as Record<string, unknown>
      : null;
    const detail =
      (typeof nested?.message === "string" && nested.message) ||
      (typeof details?.detail === "string" && details.detail) ||
      (typeof details?.message === "string" && details.message) ||
      failure.message;
    const required = Number(
      nested?.required ?? details?.required ?? detail.match(/Required:\s*(\d+)/i)?.[1] ?? 0,
    );
    const available = Number(
      nested?.available ?? details?.available ?? detail.match(/Available:\s*(\d+)/i)?.[1] ?? 0,
    );
    return new InsufficientTokensError(detail, required, available);
  }

  return new ApiRequestError(
    failure.message,
    failure.status,
    failure.details,
    failure.code,
  );
}

async function request<T>(
  path: string,
  options: RequestInit & {
    auth?: boolean;
    skipAuthRefresh?: boolean;
    notifyOnUnauthorized?: boolean;
    timeoutMs?: number | null;
    expectedStatuses?: readonly number[];
  } = {},
): Promise<T> {
  const {
    auth,
    skipAuthRefresh,
    notifyOnUnauthorized,
    timeoutMs,
    expectedStatuses,
    ...requestInit
  } = options;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return requestJson<T>(`${API_BASE}${path}`, {
    ...requestInit,
    headers,
    cache: "no-store",
    credentials: "include",
  }, {
    attemptAuthRefresh: !skipAuthRefresh,
    notifyOnUnauthorized,
    timeoutMs,
    expectedStatuses,
    errorFactory: requestError,
  });
}

export type GenerationJobStatus =
  | "queued"
  | "running"
  | "settling"
  | "refunding"
  | "completed"
  | "failed"
  | "cancelled"
  | "billing_error";

export type GenerationJobSummary = {
  id: string;
  kind: string;
  title: string;
  source_path: string;
  status: GenerationJobStatus;
  progress: { current?: number; total?: number; message?: string };
  cost_tokens: number;
  captured_tokens: number;
  billing_status: "free" | "reserved" | "captured" | "refunded" | "error";
  attempt_count: number;
  cancel_requested: boolean;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
};

export type GenerationJob = GenerationJobSummary & {
  result: Record<string, unknown> | unknown[] | null;
  artifact_urls: string[];
};

const GENERATION_JOB_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GENERATION_JOB_STATUSES = new Set<GenerationJobStatus>([
  "queued",
  "running",
  "settling",
  "refunding",
  "completed",
  "failed",
  "cancelled",
  "billing_error",
]);

export function validateGenerationJobAcknowledgement(
  value: unknown,
  expectedKind: string,
): GenerationJob {
  const candidate = value && typeof value === "object"
    ? value as Partial<GenerationJob>
    : null;
  if (
    !candidate
    || typeof candidate.id !== "string"
    || !GENERATION_JOB_ID_PATTERN.test(candidate.id)
    || candidate.kind !== expectedKind
    || typeof candidate.status !== "string"
    || !GENERATION_JOB_STATUSES.has(candidate.status as GenerationJobStatus)
  ) {
    throw new ApiRequestError(
      "The server returned an invalid generation acknowledgement.",
      502,
      undefined,
      API_ERROR_CODES.INVALID_RESPONSE,
    );
  }
  return candidate as GenerationJob;
}

export type GenerationJobList = {
  items: GenerationJobSummary[];
  active_count: number;
  server_time: string;
  total?: number;
  limit?: number;
  offset?: number;
  has_more?: boolean;
  next_offset?: number | null;
};

export type ListGenerationJobsOptions = {
  limit?: number;
  offset?: number;
  kind?: string;
  status?: GenerationJobStatus;
};

export const GENERATION_JOBS_UPDATED_EVENT = "sanduai:generation-jobs-updated";
const GENERATION_INTENTS_KEY = "sanduai_generation_intents_v1";
const generationEnqueueInFlight = new Map<string, Promise<GenerationJob>>();

type GenerationIntent = {
  key: string;
  createdAt: number;
  jobId?: string;
};

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function generationFingerprint(kind: string, payload: Record<string, unknown>): string {
  const source = `${kind}:${canonicalJson(payload)}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${kind}:${(hash >>> 0).toString(16)}:${source.length}`;
}

function readGenerationIntents(): Record<string, GenerationIntent> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GENERATION_INTENTS_KEY) ?? "{}") as Record<string, GenerationIntent>;
    const cutoff = Date.now() - 24 * 60 * 60 * 1_000;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, intent]) =>
        intent && typeof intent.key === "string" && intent.createdAt >= cutoff),
    );
  } catch {
    return {};
  }
}

function writeGenerationIntents(intents: Record<string, GenerationIntent>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GENERATION_INTENTS_KEY, JSON.stringify(intents));
  } catch {
    // The server-side idempotency contract remains authoritative when browser
    // storage is unavailable; only cross-reload convenience is lost.
  }
}

function getOrCreateGenerationIntent(fingerprint: string): GenerationIntent {
  const intents = readGenerationIntents();
  const existing = intents[fingerprint];
  if (existing) return existing;
  const created = { key: globalThis.crypto.randomUUID(), createdAt: Date.now() };
  intents[fingerprint] = created;
  writeGenerationIntents(intents);
  return created;
}

function attachJobToGenerationIntent(fingerprint: string, jobId: string): void {
  const intents = readGenerationIntents();
  const intent = intents[fingerprint];
  if (!intent) return;
  intents[fingerprint] = { ...intent, jobId };
  writeGenerationIntents(intents);
}

export function clearGenerationIntentForJob(jobId: string): void {
  const intents = readGenerationIntents();
  const next = Object.fromEntries(
    Object.entries(intents).filter(([, intent]) => intent.jobId !== jobId),
  );
  if (Object.keys(next).length !== Object.keys(intents).length) {
    writeGenerationIntents(next);
  }
}

function announceGenerationUpdate(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(GENERATION_JOBS_UPDATED_EVENT));
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryableQueueTransport(error: unknown): boolean {
  return error instanceof ApiRequestError && (
    error.status === 0 ||
    error.status === 408 ||
    error.status === 425 ||
    error.status === 429 ||
    error.status >= 500
  );
}

export async function enqueueGenerationJob(
  kind: string,
  payload: Record<string, unknown>,
  options: { title?: string; idempotencyKey?: string } = {},
): Promise<GenerationJob> {
  const fingerprint = generationFingerprint(kind, payload);
  const existingRequest = generationEnqueueInFlight.get(fingerprint);
  if (existingRequest) return existingRequest;

  const requestPromise = (async () => {
    const intent = options.idempotencyKey
      ? { key: options.idempotencyKey, createdAt: Date.now() }
      : getOrCreateGenerationIntent(fingerprint);
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await request<GenerationJob>("/api/v1/generations", {
          method: "POST",
          auth: true,
          timeoutMs: 20_000,
          expectedStatuses: [202],
          headers: { "Idempotency-Key": intent.key },
          body: JSON.stringify({ kind, payload, title: options.title }),
        });
        const job = validateGenerationJobAcknowledgement(response, kind);
        attachJobToGenerationIntent(fingerprint, job.id);
        invalidateCachedBalance();
        announceGenerationUpdate();
        return job;
      } catch (error) {
        lastError = error;
        if (!retryableQueueTransport(error) || attempt === 2) throw error;
        await sleep(400 * (2 ** attempt));
      }
    }
    throw lastError;
  })();
  generationEnqueueInFlight.set(fingerprint, requestPromise);
  try {
    return await requestPromise;
  } finally {
    generationEnqueueInFlight.delete(fingerprint);
  }
}

export async function getGenerationJob(jobId: string): Promise<GenerationJob> {
  return request<GenerationJob>(`/api/v1/generations/${jobId}`, {
    method: "GET",
    auth: true,
    timeoutMs: 15_000,
  });
}

export async function listGenerationJobs(
  options: number | ListGenerationJobsOptions = {},
): Promise<GenerationJobList> {
  const { limit = 30, offset = 0, kind, status } = typeof options === "number"
    ? { limit: options, offset: 0 }
    : options;
  const params = new URLSearchParams({
    limit: String(Math.max(1, Math.trunc(limit))),
    offset: String(Math.max(0, Math.trunc(offset))),
  });
  if (kind) params.set("kind", kind);
  if (status) params.set("status", status);
  return request<GenerationJobList>(`/api/v1/generations?${params.toString()}`, {
    method: "GET",
    auth: true,
    timeoutMs: 15_000,
  });
}

export async function cancelGenerationJob(jobId: string): Promise<GenerationJob> {
  const job = await request<GenerationJob>(`/api/v1/generations/${jobId}/cancel`, {
    method: "POST",
    auth: true,
    timeoutMs: 15_000,
  });
  announceGenerationUpdate();
  return job;
}

export async function waitForGenerationResult<T>(jobId: string): Promise<T> {
  let consecutiveTransportErrors = 0;
  for (;;) {
    let job: GenerationJob;
    try {
      job = await getGenerationJob(jobId);
      consecutiveTransportErrors = 0;
    } catch (error) {
      if (!retryableQueueTransport(error)) throw error;
      // The browser may be offline while the server keeps working. Keep this
      // local waiter quiet and let the global history recover on reconnect.
      consecutiveTransportErrors += 1;
      await sleep(Math.min(10_000, 1_200 * (2 ** Math.min(consecutiveTransportErrors, 3))));
      continue;
    }

    announceGenerationUpdate();
    if (
      (job.status === "completed" || job.status === "billing_error") &&
      job.result !== null
    ) {
      clearGenerationIntentForJob(job.id);
      invalidateCachedBalance();
      return job.result as T;
    }
    if (
      job.status === "failed" ||
      job.status === "cancelled" ||
      job.status === "billing_error"
    ) {
      clearGenerationIntentForJob(job.id);
      invalidateCachedBalance();
      throw new ApiRequestError(
        "Generation did not complete",
        502,
        { detail: { code: job.error_code || "GENERATION_FAILED" } },
      );
    }
    await sleep(1_200);
  }
}

const DURABLE_GENERATION_PATHS: Record<string, string> = {
  "/api/essay/generate": "essay.generate",
  "/api/essay/revise": "essay.revise",
  "/api/article/generate": "article.generate",
  "/api/article/revise": "article.revise",
  "/api/bjb/generate": "bjb.generate",
  "/api/class-hour/generate": "class_hour.generate",
  "/api/class-hour/regenerate-block": "class_hour.regenerate",
  "/api/quiz/generate": "quiz.generate",
  "/api/v1/ai/text-to-speech": "audio.tts",
  "/api/generate/kmzh": "kmzh.generate",
  "/api/v1/science-project/plan": "science.plan",
  "/api/v1/science-project/generate-section": "science.section",
  "/api/v1/science-project/regenerate-section": "science.regenerate",
  "/api/v1/generate/worksheet": "worksheet.generate",
  "/api/games/generate-race": "race.generate",
  "/api/media/generate-image": "image.generate",
};

function generationKindForPath(path: string): string | null {
  if (/^\/api\/v1\/science-project\/[^/]+\/finalize$/.test(path)) {
    return "science.finalize";
  }
  return DURABLE_GENERATION_PATHS[path] ?? null;
}

function generationTitle(payload: Record<string, unknown>): string | undefined {
  for (const field of ["topic", "title", "description", "section_type"]) {
    const value = payload[field];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 240);
  }
  return undefined;
}

async function paidRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const kind = generationKindForPath(path);
  if (kind && typeof options.body === "string") {
    const parsed = JSON.parse(options.body) as Record<string, unknown>;
    const job = await enqueueGenerationJob(kind, parsed, {
      title: generationTitle(parsed),
    });
    return waitForGenerationResult<T>(job.id);
  }
  const headers = withIdempotencyKey(options.headers);
  return request<T>(path, { ...options, headers });
}

function assertAuthStorageAvailable(): void {
  if (typeof window === "undefined") return;
  const probeKey = "sanduai_auth_storage_probe";
  try {
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
  } catch {
    throw new AuthSessionCoordinationError();
  }
}

function validateAuthResponse(data: unknown): AuthResponse {
  if (!data || typeof data !== "object") {
    throw new ApiRequestError(
      "The server returned an invalid authentication response.",
      502,
      data,
      API_ERROR_CODES.INVALID_RESPONSE,
    );
  }
  const candidate = data as Partial<AuthResponse>;
  const claims = typeof candidate.token === "string"
    ? decodeJwtPayload(candidate.token)
    : null;
  if (
    typeof candidate.token !== "string" ||
    typeof candidate.user_id !== "string" ||
    candidate.user_id.length === 0 ||
    !isUsableJwt(candidate.token) ||
    claims?.sub !== candidate.user_id
  ) {
    throw new ApiRequestError(
      "The server returned an invalid authentication response.",
      502,
      data,
      API_ERROR_CODES.INVALID_RESPONSE,
    );
  }
  return { token: candidate.token, user_id: candidate.user_id };
}

function commitAuthenticatedSession(
  data: AuthResponse,
  extra: { phone?: string; email?: string; full_name?: string } = {},
  clearLogoutIntent: boolean,
): AuthResponse {
  const valid = validateAuthResponse(data);
  const claims = decodeJwtPayload(valid.token);
  clearCachedBalance();
  saveToken(valid.token);
  saveUser({
    userId: valid.user_id,
    phone: extra.phone,
    email: extra.email,
    fullName: extra.full_name,
    role: typeof claims?.role === "string" ? claims.role : undefined,
  });
  if (clearLogoutIntent) clearAuthLogoutTombstone();
  markAuthSessionActive();
  publishAuthSessionChange();
  return valid;
}

function commitLoggedOutSession(reason: string): void {
  let firstError: unknown;
  for (const operation of [
    () => markAuthLogoutTombstone(reason),
    clearToken,
    clearUser,
    clearCachedBalance,
    publishAuthSessionChange,
  ]) {
    try {
      operation();
    } catch (error) {
      firstError ??= error;
    }
  }
  if (firstError) throw firstError;
}

/**
 * Local fail-closed fallback for an old/unsupported browser. It deliberately
 * performs no HTTP cookie mutation; the tombstone blocks future bootstrap
 * refreshes until a successful, coordinated login or registration.
 */
export function forceLocalLogout(reason: string = "logout_uncoordinated"): void {
  if (typeof window === "undefined") return;
  try {
    commitLoggedOutSession(reason);
  } catch {
    // Best effort when browser storage itself is unavailable. Never attempt a
    // refresh from this page instance after clearing the in-memory UI state.
  }
}

async function invalidateMalformedAuthResponse(error: unknown): Promise<never> {
  try {
    commitLoggedOutSession("invalid_auth_response");
  } catch {
    // Preserve the original response-validation error.
  }
  try {
    await requestLogoutWithRetry();
  } catch {
    // The tombstone keeps bootstrap fail-closed if cookie revocation fails.
  }
  throw error;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return runAuthCookieTransition(async () => {
    assertAuthStorageAvailable();
    let data: AuthResponse;
    try {
      data = await request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
        skipAuthRefresh: true,
        notifyOnUnauthorized: false,
        timeoutMs: AUTH_HTTP_TIMEOUT_MS,
      });
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.code === API_ERROR_CODES.INVALID_RESPONSE &&
        error.status >= 200 &&
        error.status < 300
      ) {
        return invalidateMalformedAuthResponse(error);
      }
      throw error;
    }
    try {
      return commitAuthenticatedSession(data, {
        phone: payload.phone,
        email: payload.email,
        full_name: payload.full_name,
      }, true);
    } catch (error) {
      return invalidateMalformedAuthResponse(error);
    }
  });
}

function requestErrorFromResponse(status: number, data: unknown): Error {
  const record = data && typeof data === "object" ? data as Record<string, unknown> : null;
  const detail = record?.detail;
  const nestedDetail = detail && typeof detail === "object"
    ? detail as Record<string, unknown>
    : null;
  const rawMessage =
    (typeof nestedDetail?.message === "string" && nestedDetail.message) ||
    (typeof detail === "string" && detail) ||
    (typeof record?.message === "string" && record.message) ||
    (typeof record?.error === "string" && record.error) ||
    `Request failed with status ${status}`;

  return requestError({
    message: rawMessage,
    status,
    code: apiErrorCodeForStatus(status),
    details: data,
  });
}

export async function requestRegistrationCode(email: string): Promise<RegistrationCodeResponse> {
  return request<RegistrationCodeResponse>("/auth/registration-code/request", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuthRefresh: true,
    notifyOnUnauthorized: false,
    timeoutMs: AUTH_HTTP_TIMEOUT_MS,
  });
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return runAuthCookieTransition(async () => {
    assertAuthStorageAvailable();
    let data: AuthResponse;
    try {
      data = await request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
        skipAuthRefresh: true,
        notifyOnUnauthorized: false,
        timeoutMs: AUTH_HTTP_TIMEOUT_MS,
      });
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.code === API_ERROR_CODES.INVALID_RESPONSE &&
        error.status >= 200 &&
        error.status < 300
      ) {
        return invalidateMalformedAuthResponse(error);
      }
      throw error;
    }
    try {
      return commitAuthenticatedSession(data, { email: payload.email }, true);
    } catch (error) {
      return invalidateMalformedAuthResponse(error);
    }
  });
}

export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResponse> {
  return request<PasswordResetRequestResponse>("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuthRefresh: true,
    notifyOnUnauthorized: false,
    timeoutMs: AUTH_HTTP_TIMEOUT_MS,
  });
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  return runAuthCookieTransition(async () => {
    assertAuthStorageAvailable();
    await request<void>("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
      skipAuthRefresh: true,
      notifyOnUnauthorized: false,
      timeoutMs: AUTH_HTTP_TIMEOUT_MS,
    });
    commitLoggedOutSession("password_reset");
  });
}

export type UserProfile = {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  role: string;
  subscription_plan: string;
  subscription_end: string | null; // ISO datetime string
  created_at: string; // ISO datetime string
};

export async function getProfile(): Promise<UserProfile> {
  return request<UserProfile>("/auth/me", {
    method: "GET",
    auth: true,
    timeoutMs: AUTH_HTTP_TIMEOUT_MS,
  });
}

export async function generateEssay(
  payload: EssayGeneratePayload,
): Promise<EssayGenerateResponse> {
  return paidRequest<EssayGenerateResponse>("/api/essay/generate", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function reviseEssay(
  payload: EssayRevisePayload,
): Promise<EssayGenerateResponse> {
  return paidRequest<EssayGenerateResponse>("/api/essay/revise", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function exportEssayDocx(payload: {
  title: string;
  essay_plan: string[];
  content_blocks: EssayContentBlock[];
}): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithPolicy(`${API_BASE}/api/essay/export/docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw requestErrorFromResponse(res.status, data);
  }
  return res.blob();
}

// Article API functions
export async function generateArticle(
  payload: ArticleGeneratePayload,
): Promise<ArticleResponse> {
  return paidRequest<ArticleResponse>("/api/article/generate", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function reviseArticle(
  payload: ArticleRevisePayload,
): Promise<ArticleResponse> {
  return paidRequest<ArticleResponse>("/api/article/revise", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function exportArticleDocx(payload: ArticleResponse): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithPolicy(`${API_BASE}/api/article/export/docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw requestErrorFromResponse(res.status, data);
  }
  return res.blob();
}

// Exam (BJB/TJB) API functions
export async function generateExam(
  payload: ExamGeneratePayload,
): Promise<ExamGenerateResponse> {
  return paidRequest<ExamGenerateResponse>("/api/bjb/generate", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function exportExamDocx(payload: ExamExportPayload): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithPolicy(`${API_BASE}/api/bjb/export/docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw requestErrorFromResponse(res.status, data);
  }
  return res.blob();
}

// Class Hour (Классный час / Сынып сағаты) API functions
export async function generateClassHour(
  payload: ClassHourGeneratePayload,
): Promise<ClassHourResponse> {
  return paidRequest<ClassHourResponse>("/api/class-hour/generate", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function regenerateClassHourBlock(
  payload: ClassHourRegeneratePayload,
): Promise<ClassHourBlock> {
  return paidRequest<ClassHourBlock>("/api/class-hour/regenerate-block", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function exportClassHourDocx(
  payload: ClassHourExportPayload,
): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithPolicy(`${API_BASE}/api/class-hour/export-docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw requestErrorFromResponse(res.status, data);
  }
  return res.blob();
}

// Quiz (Тест генератор) API functions
export async function generateQuiz(
  payload: QuizGeneratePayload,
): Promise<QuizGenerateResponse> {
  return paidRequest<QuizGenerateResponse>("/api/quiz/generate", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function exportQuizDocx(
  payload: QuizExportPayload,
): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithPolicy(`${API_BASE}/api/quiz/export`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw requestErrorFromResponse(res.status, data);
  }
  return res.blob();
}

// Voiceover API functions
export async function generateVoiceover(
  payload: VoiceoverGeneratePayload,
): Promise<VoiceoverResponse> {
  const res = await paidRequest<VoiceoverResponse>("/api/v1/ai/text-to-speech", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });

  // Ensure audio_url is absolute and uses backend path /media/audio/ (not /audio/)
  if (res.audio_url && !res.audio_url.startsWith("http")) {
    const path = res.audio_url.startsWith("/audio/")
      ? `/media${res.audio_url}`
      : res.audio_url;
    res.audio_url = `${API_BASE}${path}`;
  }

  return res;
}

export async function getVoiceoverVoices(): Promise<VoiceoverVoicesResponse> {
  return request<VoiceoverVoicesResponse>("/api/v1/ai/voices", {
    method: "GET",
    auth: true,
  });
}

// Sandu Bot API
export type SandubotChatResponse = {
  text: string;
  links?: { label: string; href: string }[];
};

export type SandubotHistoryMessage = {
  role: "user" | "assistant";
  text: string;
  links?: { label: string; href: string }[];
};

export type SandubotHistoryResponse = {
  messages: SandubotHistoryMessage[];
};

export async function getSandubotHistory(): Promise<SandubotHistoryResponse> {
  return request<SandubotHistoryResponse>("/api/sandubot/history", {
    method: "GET",
    auth: true,
  });
}

export async function sendSandubotMessage(message: string): Promise<SandubotChatResponse> {
  return paidRequest<SandubotChatResponse>("/api/sandubot/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
    auth: true,
  });
}

export type SandubotStreamEvent =
  | { type: "thinking" }
  | { type: "chunk"; content: string }
  | { type: "done"; links?: { label: string; href: string }[] }
  | { type: "error"; message: string };

export async function* sendSandubotMessageStream(
  message: string,
  language: TeacherFacingLanguage = "ru",
): AsyncGenerator<SandubotStreamEvent, void, unknown> {
  try {
    const token = getToken();
    const headers = withIdempotencyKey({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
    const res = await fetchWithPolicy(`${getApiBase()}/api/sandubot/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const failure = requestErrorFromResponse(res.status, data);
      if (failure instanceof InsufficientTokensError) throw failure;
      throw toTeacherFacingError(failure, language);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new TeacherFacingError(
      teacherFacingErrorMessage(null, language),
    );

    const decoder = new TextDecoder();
    let buffer = "";

    const safeEvent = (event: SandubotStreamEvent): SandubotStreamEvent =>
      event.type === "error"
        ? {
            ...event,
            message: teacherFacingErrorMessage(new Error(event.message), language),
          }
        : event;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]" || data === "") continue;
          try {
            const event = JSON.parse(data) as SandubotStreamEvent;
            yield safeEvent(event);
          } catch {
            // Ignore malformed provider events without exposing their contents.
          }
        }
      }
    }

    if (buffer.trim()) {
      const line = buffer.trim();
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        try {
          const event = JSON.parse(data) as SandubotStreamEvent;
          yield safeEvent(event);
        } catch {
          // Ignore malformed provider events without exposing their contents.
        }
      }
    }
  } catch (error) {
    if (error instanceof InsufficientTokensError || error instanceof TeacherFacingError) {
      throw error;
    }
    throw toTeacherFacingError(error, language);
  }
}

// Ybyrai Digital Avatar API functions
export async function chatWithYbyrai(
  audioFile: File,
  language: YbyraiLanguage = "auto",
): Promise<YbyraiChatResponse> {
  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("language", language);

  const token = getToken();
  const headers = withIdempotencyKey();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetchWithPolicy(`${getApiBase()}/api/chat/audio`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw requestErrorFromResponse(res.status, data);
  }

  const data = await res.json();

  // Ensure audio_url is absolute
  if (data.audio_url && !data.audio_url.startsWith("http")) {
    data.audio_url = `${getApiBase()}${data.audio_url}`;
  }

  return data;
}

// Ybyrai Streaming API (SSE)
export function chatWithYbyraiStream(
  audioFile: File,
  language: YbyraiLanguage,
  callbacks: {
    onTranscription: (text: string) => void;
    onTextChunk: (text: string) => void;
    onAudioChunk: (url: string, text: string) => void;
    onDone: (fullText: string) => void;
    onError: (error: TeacherFacingError) => void;
  },
  uiLanguage: TeacherFacingLanguage = language === "ru" ? "ru" : "kk",
): () => void {
  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("language", language);

  const token = getToken();
  const headers = withIdempotencyKey();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Use EventSource-like approach with fetch + ReadableStream
  let aborted = false;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  const unavailableCopy = uiLanguage === "kk"
    ? "Дыбыстық көмекші уақытша қолжетімсіз. Қайталап көріңіз."
    : "Голосовой помощник временно недоступен. Попробуйте ещё раз.";
  const insufficientCopy = uiLanguage === "kk"
    ? "Монета жеткіліксіз. Балансты толтырып, қайталап көріңіз."
    : "Недостаточно монет. Пополните баланс и попробуйте снова.";
  const safeStreamError = (error: unknown, fallback = unavailableCopy) =>
    teacherFacingErrorMessage(error, uiLanguage, {
      fallback,
      insufficientCoins: insufficientCopy,
    });

  (async () => {
    try {
      const res = await fetchWithPolicy(`${getApiBase()}/api/chat/audio/stream`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        callbacks.onError(
          new TeacherFacingError(safeStreamError(requestErrorFromResponse(res.status, data))),
        );
        return;
      }

      if (!res.body) {
        callbacks.onError(new TeacherFacingError(unavailableCopy));
        return;
      }

      reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        if (aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by double newline)
        const messages = buffer.split("\n\n");
        buffer = messages.pop() || ""; // Keep incomplete message in buffer

        for (const message of messages) {
          if (!message.trim()) continue;

          let eventType = "";
          let dataStr = "";

          // Parse SSE message format
          for (const line of message.split("\n")) {
            if (line.startsWith("event: ")) {
              eventType = line.substring(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.substring(6).trim();
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            if (eventType === "error" || data.error) {
              callbacks.onError(
                new TeacherFacingError(
                  safeStreamError(new Error("Provider stream event failed")),
                ),
              );
              return;
            }

            switch (eventType) {
              case "transcription":
                if (data.text) callbacks.onTranscription(data.text);
                break;
              case "text_chunk":
                if (data.text) callbacks.onTextChunk(data.text);
                break;
              case "audio_chunk":
                if (data.url && data.text) {
                  const fullUrl = data.url.startsWith("http")
                    ? data.url
                    : `${getApiBase()}${data.url}`;
                  callbacks.onAudioChunk(fullUrl, data.text);
                }
                break;
              case "done":
                if (data.full_text) callbacks.onDone(data.full_text);
                break;
            }
          } catch {
            // Ignore malformed provider events without exposing their contents.
          }
        }
      }
    } catch (err: unknown) {
      if (!aborted) {
        callbacks.onError(new TeacherFacingError(safeStreamError(err)));
      }
    }
  })();

  // Return abort function
  return () => {
    aborted = true;
    if (reader) {
      reader.cancel();
    }
  };
}

// Lesson Plan (Short-term КМЖ) API functions
export async function generateLessonPlan(
  payload: LessonPlanRequest,
): Promise<LessonPlanResponse> {
  return paidRequest<LessonPlanResponse>("/api/generate/kmzh", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function exportLessonPlanDocx(
  payload: LessonPlanDocxRequest,
): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithPolicy(`${API_BASE}/api/generate/kmzh/docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw requestErrorFromResponse(res.status, data);
  }
  return res.blob();
}

// Scientific Project API functions (legacy - removed, use wizard instead)

// Wizard API functions
export async function createProjectPlan(
  payload: CreatePlanPayload,
): Promise<DraftPlanResponse> {
  return paidRequest<DraftPlanResponse>("/api/v1/science-project/plan", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function generateSection(
  payload: GenerateSectionPayload,
): Promise<SectionResponse> {
  return paidRequest<SectionResponse>("/api/v1/science-project/generate-section", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function regenerateSection(
  payload: RegenerateSectionPayload,
): Promise<SectionResponse> {
  return paidRequest<SectionResponse>("/api/v1/science-project/regenerate-section", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function getProjectStatus(
  projectId: string,
): Promise<ProjectState> {
  return request<ProjectState>(`/api/v1/science-project/${projectId}/status`, {
    method: "GET",
    auth: true,
  });
}

export async function updateScienceProjectPlan(
  projectId: string,
  plan: DraftPlanResponse,
): Promise<ProjectState> {
  return request<ProjectState>(`/api/v1/science-project/${projectId}/plan`, {
    method: "PUT",
    body: JSON.stringify({ plan }),
    auth: true,
  });
}

export async function finalizeProject(
  payload: FinalizeProjectPayload,
): Promise<CompleteProjectResponse> {
  return paidRequest<CompleteProjectResponse>(
    `/api/v1/science-project/${payload.project_id}/finalize`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      auth: true,
    },
  );
}

export async function exportScientificProjectDocx(
  payload: ScientificProjectExportPayload,
): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithPolicy(`${API_BASE}/api/v1/science-project/export-docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw requestErrorFromResponse(res.status, data);
  }
  return res.blob();
}

// Worksheet API functions
export async function generateWorksheet(
  payload: WorksheetGeneratePayload,
): Promise<WorksheetResponse> {
  return paidRequest<WorksheetResponse>("/api/v1/generate/worksheet", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function exportWorksheetDocx(
  payload: WorksheetExportPayload,
): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithPolicy(`${API_BASE}/api/v1/generate/worksheet/export-docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw requestErrorFromResponse(res.status, data);
  }
  return res.blob();
}

// Token management
export function saveToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // hasAuthLogoutTombstone fails closed when storage itself is unavailable.
  }
}

async function requestNewAccessToken(failedAccessToken?: string): Promise<string | null> {
  return runAuthCookieTransition(async () => {
    assertAuthStorageAvailable();
    if (hasAuthLogoutTombstone()) return null;

    const currentToken = getToken();
    if (
      failedAccessToken &&
      currentToken &&
      currentToken !== failedAccessToken &&
      isUsableJwt(currentToken)
    ) {
      const failedSubject = decodeJwtPayload(failedAccessToken)?.sub;
      const currentSubject = decodeJwtPayload(currentToken)?.sub;
      return (
        typeof failedSubject === "string" &&
        failedSubject.length > 0 &&
        failedSubject === currentSubject
      )
        ? currentToken
        : null;
    }

    try {
      const data = await requestJson<AuthResponse>(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      }, {
        attemptAuthRefresh: false,
        notifyOnUnauthorized: false,
        timeoutMs: AUTH_HTTP_TIMEOUT_MS,
        errorFactory: requestError,
      });
      const validated = validateAuthResponse(data);
      const cachedUser = getUser();
      const valid = commitAuthenticatedSession(validated, {
        ...(cachedUser?.userId === validated.user_id ? {
          phone: cachedUser.phone,
          email: cachedUser.email,
          full_name: cachedUser.fullName,
        } : {}),
      }, false);
      return valid.token;
    } catch (error) {
      if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
        commitLoggedOutSession("refresh_rejected");
      } else if (
        !(error instanceof ApiRequestError) ||
        error.code === API_ERROR_CODES.INVALID_RESPONSE
      ) {
        try {
          await invalidateMalformedAuthResponse(error);
        } catch {
          // The refresh contract exposes failure as null to its callers.
        }
      }
      return null;
    }
  });
}

export async function listScienceProjects(
  limit = 12,
  offset = 0,
): Promise<ScienceProjectListResponse> {
  const params = new URLSearchParams({
    limit: String(Math.max(1, Math.min(50, Math.trunc(limit)))),
    offset: String(Math.max(0, Math.trunc(offset))),
  });
  return request<ScienceProjectListResponse>(`/api/v1/science-project?${params.toString()}`, {
    method: "GET",
    auth: true,
  });
}

export async function enqueueSectionRegeneration(
  payload: RegenerateSectionPayload,
): Promise<GenerationJob> {
  return enqueueGenerationJob(
    "science.regenerate",
    payload as unknown as Record<string, unknown>,
    { title: payload.section_type },
  );
}

export async function enqueueProjectFinalization(
  payload: FinalizeProjectPayload,
): Promise<GenerationJob> {
  return enqueueGenerationJob(
    "science.finalize",
    payload as unknown as Record<string, unknown>,
    { title: "Ғылыми жобаны аяқтау" },
  );
}

export async function enqueueProjectPlan(
  payload: CreatePlanPayload,
): Promise<GenerationJob> {
  return enqueueGenerationJob(
    "science.plan",
    payload as unknown as Record<string, unknown>,
    { title: payload.topic },
  );
}

export type GenerateAllProjectSectionsResponse = {
  project_id: string;
  sections: Record<string, string>;
};

export async function generateAllProjectSections(payload: {
  project_id: string;
  approved_plan: DraftPlanResponse;
  user_comment?: string | null;
}): Promise<GenerateAllProjectSectionsResponse> {
  const job = await enqueueGenerationJob("science.generate_all", payload, {
    title: "Ғылыми жоба бөлімдері",
  });
  return waitForGenerationResult<GenerateAllProjectSectionsResponse>(job.id);
}

export async function enqueueAllProjectSections(payload: {
  project_id: string;
  approved_plan: DraftPlanResponse;
  user_comment?: string | null;
}, options: { idempotencyKey?: string } = {}): Promise<GenerationJob> {
  return enqueueGenerationJob("science.generate_all", payload, {
    title: "Ғылыми жоба бөлімдері",
    idempotencyKey: options.idempotencyKey,
  });
}

configureAuthRefresh(requestNewAccessToken);
configureAuthTokenReader(getToken);

export async function refreshSession(): Promise<AuthResponse | null> {
  if (hasAuthLogoutTombstone()) return null;
  const token = await refreshAccessToken();
  const userId = token ? decodeJwtPayload(token)?.sub : undefined;
  return token && typeof userId === "string" ? { token, user_id: userId } : null;
}

async function requestLogoutWithRetry(): Promise<void> {
  const deadline = Date.now() + AUTH_HTTP_TIMEOUT_MS;
  let finalError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;
    try {
      await requestJson<void>(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        keepalive: true,
        headers: { Accept: "application/json" },
      }, {
        attemptAuthRefresh: false,
        notifyOnUnauthorized: false,
        timeoutMs: Math.min(5_000, remainingMs),
        errorFactory: requestError,
      });
      return;
    } catch (error) {
      finalError = error;
    }
  }
  throw finalError ?? new ApiRequestError(
    "Logout timed out.",
    0,
    undefined,
    API_ERROR_CODES.TIMEOUT,
  );
}

export async function logoutSession(): Promise<void> {
  return runAuthCookieTransition(async () => {
    assertAuthStorageAvailable();
    // Commit and broadcast the explicit logout before the network attempt. If
    // revocation fails, the tombstone still prevents a reload from refreshing.
    commitLoggedOutSession("explicit_logout");
    await requestLogoutWithRetry();
  });
}

// JWT token decoding
export function decodeJWT(token: string): { sub?: string; role?: string; exp?: number } | null {
  return decodeJwtPayload(token);
}

// User data management
const USER_KEY = "sanduai_user";

export type UserData = {
  userId: string;
  phone?: string;
  email?: string;
  fullName?: string;
  role?: string;
};

export function saveUser(userData: UserData) {
  if (typeof window === "undefined") return;
  let role = userData.role;
  // Extract role from token if not provided
  if (!role) {
    const token = getToken();
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded?.role) {
        role = decoded.role;
      }
    }
  }
  window.localStorage.setItem(USER_KEY, JSON.stringify({ ...userData, role }));
}

export function getUser(): UserData | null {
  if (typeof window === "undefined") return null;
  let data: string | null;
  try {
    data = window.localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
  if (!data) return null;
  try {
    return JSON.parse(data) as UserData;
  } catch {
    return null;
  }
}

/** A logout intent always wins over credentials that survived an interrupted clear. */
export function getRestoredSessionUser(): UserData | null {
  if (hasAuthLogoutTombstone()) return null;
  return resolveBootstrapUser(getToken(), getUser());
}

export function clearUser() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // See clearToken: storage read failures keep refresh bootstrap disabled.
  }
}

// Token API functions
export async function getTokenBalance(): Promise<TokenBalance> {
  return request<TokenBalance>("/api/tokens/balance", {
    method: "GET",
    auth: true,
  });
}

export async function getTokenCosts(): Promise<TokenCosts> {
  return request<TokenCosts>("/api/tokens/costs", {
    method: "GET",
    auth: false,
  });
}

export async function getTokenTransactions(
  limit: number = 50,
  offset: number = 0,
): Promise<TokenTransaction[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  return request<TokenTransaction[]>(`/api/tokens/transactions?${params}`, {
    method: "GET",
    auth: true,
  });
}

// Admin types
export type AdminUser = {
  user_id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: string;
  balance: number;
  created_at: string;
  has_subscription: boolean;
  subscription_end: string | null; // ISO format: "2026-02-15T00:00:00"
  subscription_plan: "free" | "premium";
};

export type AdminUsersResponse = {
  users: AdminUser[];
  total: number;
};

export type AddTokensPayload = {
  amount: number;
  description: string;
};

export type AddTokensResponse = {
  user_id: string;
  balance: number;
  message: string;
};

export type AddSubscriptionPayload = {
  days: number; // Must be > 0
};

export type AddSubscriptionResponse = {
  user_id: string;
  subscription_plan: "premium";
  subscription_end: string; // ISO format: "2026-02-15T00:00:00"
  has_subscription: boolean;
  message: string;
};

export type AdminUserAccessResponse = {
  user_id: string;
  balance: number;
  subscription_plan: "free" | "premium";
  subscription_end: string | null;
  has_subscription: boolean;
  message: string;
};

export type RevokeSubscriptionResponse = AdminUserAccessResponse;

export type ResetUserTokensResponse = AdminUserAccessResponse;

export type DeleteAdminUserResponse = AdminUserAccessResponse & {
  deleted: true;
};

// Admin API functions
export async function getAdminUsers(
  limit: number = 50,
  offset: number = 0,
  search?: string,
  signal?: AbortSignal,
): Promise<AdminUsersResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  if (search && search.trim()) {
    params.append("search", search.trim());
  }
  return request<AdminUsersResponse>(`/api/admin/users?${params}`, {
    method: "GET",
    auth: true,
    signal,
  });
}

export async function addTokensToUser(
  userId: string,
  payload: AddTokensPayload,
): Promise<AddTokensResponse> {
  return request<AddTokensResponse>(`/api/admin/users/${userId}/tokens`, {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function getAdminUserTransactions(
  userId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<TokenTransaction[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  return request<TokenTransaction[]>(
    `/api/admin/users/${userId}/transactions?${params}`,
    {
      method: "GET",
      auth: true,
    },
  );
}

export async function addSubscriptionToUser(
  userId: string,
  payload: AddSubscriptionPayload,
): Promise<AddSubscriptionResponse> {
  return request<AddSubscriptionResponse>(`/api/admin/users/${encodeURIComponent(userId)}/subscription`, {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function revokeSubscriptionFromUser(
  userId: string,
): Promise<RevokeSubscriptionResponse> {
  return request<RevokeSubscriptionResponse>(
    `/api/admin/users/${encodeURIComponent(userId)}/subscription`,
    {
      method: "DELETE",
      auth: true,
      timeoutMs: 15_000,
    },
  );
}

export async function resetUserTokens(
  userId: string,
): Promise<ResetUserTokensResponse> {
  return request<ResetUserTokensResponse>(
    `/api/admin/users/${encodeURIComponent(userId)}/tokens/reset`,
    {
      method: "POST",
      auth: true,
      timeoutMs: 15_000,
    },
  );
}

export async function deleteAdminUser(
  userId: string,
): Promise<DeleteAdminUserResponse> {
  return request<DeleteAdminUserResponse>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    auth: true,
  });
}

// Video types
export type AdminVideoUploadResponse = {
  video_db_id: string;
  bunny_video_id: string;
  title: string;
  status: "uploading" | "processing" | "ready" | "error";
  size_bytes: number;
};

export type Video = {
  id: string; // UUID
  title: string;
  duration: number | null; // seconds
  thumbnail_url: string | null;
  status: "uploading" | "processing" | "ready" | "error";
  created_at: string; // ISO format
};

export type VideosResponse = {
  videos: Video[];
  total: number;
  limit: number;
  offset: number;
};

export type VideoWatchTokenResponse = {
  bunny_video_id: string;
  watch_token: string; // SHA256 hash
  expiration_time: number; // Unix timestamp in seconds
  embed_url: string; // Full URL for iframe embed (ready to use in iframe element)
};

export type UploadThumbnailResponse = {
  status: string;
  thumbnail_url: string;
  video_id: string;
};

// Video bytes are sent only to our authenticated backend. Bunny credentials never
// cross the server boundary.
export async function uploadAdminVideo(
  title: string,
  file: File,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<AdminVideoUploadResponse> {
  return new Promise((resolve, reject) => {
    const token = getToken();
    if (!token) {
      reject(new Error("Authentication required"));
      return;
    }

    const xhr = new XMLHttpRequest();
    const abortUpload = () => xhr.abort();
    const cleanup = () => signal?.removeEventListener("abort", abortUpload);
    if (signal?.aborted) {
      reject(new Error("Upload aborted"));
      return;
    }
    signal?.addEventListener("abort", abortUpload, { once: true });

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as AdminVideoUploadResponse);
        } catch {
          reject(new Error("Upload completed, but the server returned an invalid response"));
        }
      } else {
        let errorText = `Upload failed with status ${xhr.status}`;
        try {
          const parsed = JSON.parse(xhr.responseText) as {
            detail?: string | Array<{ msg?: string }>;
            message?: string;
            error?: string;
          };
          if (Array.isArray(parsed.detail)) {
            errorText = parsed.detail.map((entry) => entry.msg ?? "Validation error").join("; ");
          } else {
            errorText = parsed.detail || parsed.message || parsed.error || errorText;
          }
        } catch {
          errorText = xhr.responseText || xhr.statusText || errorText;
        }
        reject(new Error(errorText));
      }
    });

    xhr.addEventListener("error", () => {
      cleanup();
      reject(new Error("Upload failed due to a network error"));
    });

    xhr.addEventListener("abort", () => {
      cleanup();
      reject(new Error("Upload aborted"));
    });

    const params = new URLSearchParams({ title: title.trim() });
    xhr.open("POST", `${getApiBase()}/api/admin/videos/upload?${params.toString()}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.send(file);
  });
}

export async function getVideos(
  limit: number = 50,
  offset: number = 0,
): Promise<VideosResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  return request<VideosResponse>(`/api/courses/videos?${params}`, {
    method: "GET",
    auth: true,
  });
}

// Admin function to get all videos regardless of status
export async function getAllVideos(): Promise<VideosResponse> {
  return request<VideosResponse>("/api/admin/videos/all", {
    method: "GET",
    auth: true,
  });
}

// Admin function to sync all video statuses
export async function syncAllVideoStatuses(): Promise<{
  message: string;
  updated: number;
  deleted: number;
  errors: string[];
  total_processed: number;
}> {
  return request<{
    message: string;
    updated: number;
    deleted: number;
    errors: string[];
    total_processed: number;
  }>("/api/admin/videos/sync-all-statuses", {
    method: "POST",
    auth: true,
  });
}

export async function getVideoWatchToken(
  videoId: string,
): Promise<VideoWatchTokenResponse> {
  return request<VideoWatchTokenResponse>(`/api/courses/video/${videoId}`, {
    method: "GET",
    auth: true,
  });
}

// Admin function to upload custom thumbnail for a video
export async function uploadVideoThumbnail(
  videoDbId: string,
  file: File
): Promise<UploadThumbnailResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // НЕ ставим Content-Type, браузер сам поставит multipart/form-data с boundary
  const res = await fetchWithPolicy(`${getApiBase()}/api/admin/videos/${videoDbId}/thumbnail`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Thumbnail upload failed: ${errorText}`);
  }

  return res.json();
}

// Import YouTube video
export type ImportYouTubeVideoResponse = {
  video_db_id: string;
  bunny_video_id: string;
  title: string;
  status: string;
  source_url: string | null;
  thumbnail_url: string | null;
  message: string;
};

export async function importYouTubeVideo(
  youtubeUrl: string,
  title: string,
  thumbnailFile?: File,
): Promise<ImportYouTubeVideoResponse> {
  const formData = new FormData();
  formData.append("youtube_url", youtubeUrl);
  formData.append("title", title);
  if (thumbnailFile) {
    formData.append("thumbnail", thumbnailFile);
  }

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetchWithPolicy(`${getApiBase()}/api/admin/videos/import-youtube`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (data && (data.error || data.detail || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

// Delete video
export async function deleteVideo(videoDbId: string): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetchWithPolicy(`${getApiBase()}/api/admin/videos/${videoDbId}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (data && (data.error || data.detail || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
}

// At Zharys (Ат Жарыс) game API
export async function generateRace(
  payload: GenerateRacePayload,
): Promise<GenerateRaceResponse> {
  return paidRequest<GenerateRaceResponse>("/api/games/generate-race", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

// ============================================================================
// Visual Materials API
// ============================================================================

export type VisualMaterialCategory = {
  id: string;
  name: string;
  name_kk?: string;
  slug: string;
  created_at: string;
};

export type VisualMaterial = {
  id: string;
  title: string;
  url: string;
  file_size: number;
  mime_type: string;
  categories: VisualMaterialCategory[];
  is_active: boolean;
  created_at: string;
};

export type MaterialGroup = {
  id: string;
  title: string;
  slug: string;
  materials: VisualMaterial[];
  categories: VisualMaterialCategory[];
  is_active: boolean;
  created_at: string;
  material_count: number;
};

export type VisualItem = {
  type: "material" | "group";
  id: string;
  title: string;
  slug?: string;
  url?: string;
  file_size?: number;
  mime_type?: string;
  categories: VisualMaterialCategory[];
  is_active: boolean;
  created_at: string;
  material_count: number;
  materials?: VisualMaterial[];
};

export type VisualsListResponse = {
  items: VisualMaterial[];
  total: number;
  limit: number;
  offset: number;
};

export type VisualUnifiedListResponse = {
  items: VisualItem[];
  total: number;
  limit: number;
  offset: number;
};

// Client API - Get visual materials and groups (requires subscription)
export async function getVisuals(params: {
  limit?: number;
  offset?: number;
  category_id?: string;
  search?: string;
}): Promise<VisualUnifiedListResponse> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.offset) queryParams.append("offset", params.offset.toString());
  if (params.category_id) queryParams.append("category_id", params.category_id);
  if (params.search) queryParams.append("search", params.search);

  return request<VisualUnifiedListResponse>(
    `/api/visuals?${queryParams.toString()}`,
    {
      method: "GET",
      auth: true,
    }
  );
}

// Client API - Get group by slug
export async function getVisualGroup(slug: string): Promise<MaterialGroup> {
  return request<MaterialGroup>(`/api/visuals/groups/${slug}`, {
    method: "GET",
    auth: true,
  });
}

// Client API - Download group as ZIP (fetches with auth, triggers download)
export async function downloadVisualGroupZip(slug: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetchWithPolicy(`${getApiBase()}/api/visuals/groups/${slug}/download`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

// Client API - Get categories (public)
export async function getVisualCategories(): Promise<VisualMaterialCategory[]> {
  return request<VisualMaterialCategory[]>("/api/visuals/categories", {
    method: "GET",
    auth: false,
  });
}

// ============================================================================
// Materials Library API
// ============================================================================

export type MaterialListItem = {
  id: string;
  title: string;
  category: string;
  preview_image: string | null;
  metadata: { subject?: string; class?: string } | null;
  mime_type: string;
  is_active: boolean;
  created_at: string;
};

export type MaterialDetail = MaterialListItem & {
  file_url: string;
  updated_at: string;
};

export type MaterialsListResponse = {
  items: MaterialListItem[];
  total: number;
  limit: number;
  offset: number;
};

// Client API - Get materials list (interactive presentations, requires subscription)
export async function getMaterials(params: {
  limit?: number;
  offset?: number;
  subject?: string;
  class?: string;
  search?: string;
}): Promise<MaterialsListResponse> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.offset) queryParams.append("offset", params.offset.toString());
  if (params.subject) queryParams.append("subject", params.subject);
  if (params.class) queryParams.append("class", params.class);
  if (params.search) queryParams.append("search", params.search);

  return request<MaterialsListResponse>(`/api/materials?${queryParams.toString()}`, {
    method: "GET",
    auth: true,
  });
}

// Client API - Get material by ID (requires subscription; presentations require premium)
export async function getMaterialById(id: string): Promise<MaterialDetail> {
  return request<MaterialDetail>(`/api/materials/${id}`, {
    method: "GET",
    auth: true,
  });
}

// Admin API - Get all materials (admin only)
export async function getAllMaterialsAdmin(params?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<MaterialsListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.offset) queryParams.append("offset", params.offset.toString());
  if (params?.search) queryParams.append("search", params.search);

  return request<MaterialsListResponse>(
    `/api/admin/materials?${queryParams.toString()}`,
    { method: "GET", auth: true }
  );
}

// Admin API - Delete material
export async function deleteMaterial(id: string): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithPolicy(`${getApiBase()}/api/admin/materials/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Delete failed: ${res.status}`);
  }
}

// Admin API - Upload material (interactive presentation)
export async function uploadMaterial(data: {
  file: File;
  title: string;
  subject?: string;
  class?: string;
  preview_image?: File;
}): Promise<MaterialDetail> {
  const formData = new FormData();
  formData.append("file", data.file);
  formData.append("title", data.title);
  if (data.subject) formData.append("subject", data.subject);
  if (data.class) formData.append("class", data.class);
  if (data.preview_image) formData.append("preview_image", data.preview_image);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithPolicy(`${getApiBase()}/api/admin/materials/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Upload failed: ${errorText}`);
  }

  return res.json();
}

// Admin API - Upload visual material
export async function uploadVisualMaterial(
  file: File,
  title: string,
  category_ids: string[]
): Promise<VisualMaterial> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("category_ids", category_ids.join(","));

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetchWithPolicy(`${getApiBase()}/api/admin/visuals/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Upload failed: ${errorText}`);
  }

  return res.json();
}

// Admin API - Get all visual materials and groups
export async function getAllVisuals(params: {
  limit?: number;
  offset?: number;
  category_id?: string;
  search?: string;
}): Promise<VisualUnifiedListResponse> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.offset) queryParams.append("offset", params.offset.toString());
  if (params.category_id) queryParams.append("category_id", params.category_id);
  if (params.search) queryParams.append("search", params.search);

  return request<VisualUnifiedListResponse>(
    `/api/admin/visuals/all?${queryParams.toString()}`,
    {
      method: "GET",
      auth: true,
    }
  );
}

// Admin API - Create material group
export async function createMaterialGroup(data: {
  title: string;
  category_ids: string[];
}): Promise<MaterialGroup> {
  return request<MaterialGroup>("/api/admin/visuals/groups", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      category_ids: data.category_ids,
    }),
    auth: true,
  });
}

// Admin API - Upload batch to group
export async function uploadBatchToGroup(
  groupId: string,
  files: File[]
): Promise<{ uploaded: number; materials: VisualMaterial[] }> {
  const formData = new FormData();
  formData.append("group_id", groupId);
  for (const file of files) {
    formData.append("files", file);
  }

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithPolicy(`${getApiBase()}/api/admin/visuals/upload-batch`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Upload failed: ${errorText}`);
  }
  return res.json();
}

// Admin API - Delete material group
export async function deleteMaterialGroup(id: string): Promise<void> {
  return request<void>(`/api/admin/visuals/groups/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

// Admin API - Update visual material
export async function updateVisualMaterial(
  id: string,
  data: {
    title?: string;
    category_ids?: string[];
    is_active?: boolean;
  }
): Promise<VisualMaterial> {
  return request<VisualMaterial>(`/api/admin/visuals/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    auth: true,
  });
}

// Admin API - Delete visual material
export async function deleteVisualMaterial(id: string): Promise<void> {
  return request<void>(`/api/admin/visuals/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

// Admin API - Create category
export async function createCategory(data: {
  name: string;
  name_kk?: string;
  slug?: string;
}): Promise<VisualMaterialCategory> {
  return request<VisualMaterialCategory>("/api/admin/visuals/categories", {
    method: "POST",
    body: JSON.stringify(data),
    auth: true,
  });
}

// Admin API - Get all categories
export async function getAllCategories(): Promise<VisualMaterialCategory[]> {
  return request<VisualMaterialCategory[]>("/api/admin/visuals/categories", {
    method: "GET",
    auth: true,
  });
}

// Admin API - Update category
export async function updateCategory(
  id: string,
  data: {
    name?: string;
    name_kk?: string;
  }
): Promise<VisualMaterialCategory> {
  return request<VisualMaterialCategory>(`/api/admin/visuals/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    auth: true,
  });
}

// Admin API - Delete category
export async function deleteCategory(id: string): Promise<void> {
  return request<void>(`/api/admin/visuals/categories/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

// Image Generation API
export type GenerateImagePayload = {
  prompt: string;
};

export type GenerateImageResponse = {
  status: string;
  temp_url: string | null;
  warning: string | null;
  error_message: string | null;
};

export async function generateImage(
  payload: GenerateImagePayload
): Promise<GenerateImageResponse> {
  return paidRequest<GenerateImageResponse>("/api/media/generate-image", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

/**
 * Скачать изображение через прокси бэкенда
 * @param imageUrl URL изображения для скачивания
 */
export async function downloadImage(imageUrl: string): Promise<Blob> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetchWithPolicy(`${API_BASE}/api/media/proxy-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: imageUrl }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to download image: ${errorText}`);
  }

  return response.blob();
}
