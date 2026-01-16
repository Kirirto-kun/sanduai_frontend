const getApiBase = () => {
  let base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  return base;
};

const API_BASE = getApiBase();
const TOKEN_KEY = "sanduai_token";

export type AuthResponse = {
  token: string;
  user_id: string;
};

type RegisterPayload = {
  phone: string; // Обязательное поле - телефон должен быть верифицирован через Firebase
  email: string;
  password: string;
  full_name: string;
};

type LoginPayload = {
  phone?: string;
  email?: string;
  password: string;
};

export type KmzhLesson = {
  lesson_topic: string;
  learning_objective: string;
  hours: number;
  date: string;
  adal_azamat_value: string;
};

export type KmzhGeneratePayload = {
  subject: string;
  grade: string;
  period: string;
  hours_total: number;
  teacher_name: string;
  user_input: string;
};

export type KmzhDocxPayload = {
  subject: string;
  grade: string;
  period: string;
  teacher_name: string;
  lessons: KmzhLesson[];
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
  correct_answer: any;
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

// Scientific Project (Ғылыми жоба) types
export type ScientificProjectGeneratePayload = {
  subject: string;
  topic: string;
  grade: string;
  language: "ru" | "kz" | "en";
  user_comment?: string;
};

export type ScientificProjectResponse = {
  topic: string;
  abstract: string;
  introduction: string;
  main_part: string;
  conclusion: string;
  references: string;
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
  language: "ru" | "kz" | "en";
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

// Voiceover (Озвучка ИИ) types
export type VoiceoverGeneratePayload = {
  text: string;
  voice: string;
  speed?: number;
};

export type VoiceoverResponse = {
  success: boolean;
  audio_url: string;
  duration?: any;
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

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Handle 402 Payment Required (insufficient tokens)
    if (res.status === 402) {
      const detail = data?.detail || "";
      // Parse: "Insufficient tokens. Required: X, Available: Y"
      const requiredMatch = detail.match(/Required:\s*(\d+)/i);
      const availableMatch = detail.match(/Available:\s*(\d+)/i);
      const required = requiredMatch ? parseInt(requiredMatch[1], 10) : 0;
      const available = availableMatch ? parseInt(availableMatch[1], 10) : 0;
      throw new InsufficientTokensError(detail, required, available);
    }
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateKmzh(
  payload: KmzhGeneratePayload,
): Promise<{ lessons: KmzhLesson[] }> {
  return request<{ lessons: KmzhLesson[] }>("/api/generate/kmzh", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function downloadKmzhDocx(payload: KmzhDocxPayload): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/generate/kmzh/docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return res.blob();
}

export async function generateEssay(
  payload: EssayGeneratePayload,
): Promise<EssayGenerateResponse> {
  return request<EssayGenerateResponse>("/api/essay/generate", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function reviseEssay(
  payload: EssayRevisePayload,
): Promise<EssayGenerateResponse> {
  return request<EssayGenerateResponse>("/api/essay/revise", {
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

  const res = await fetch(`${API_BASE}/api/essay/export/docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return res.blob();
}

// Article API functions
export async function generateArticle(
  payload: ArticleGeneratePayload,
): Promise<ArticleResponse> {
  return request<ArticleResponse>("/api/article/generate", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function reviseArticle(
  payload: ArticleRevisePayload,
): Promise<ArticleResponse> {
  return request<ArticleResponse>("/api/article/revise", {
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

  const res = await fetch(`${API_BASE}/api/article/export/docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return res.blob();
}

// Exam (BJB/TJB) API functions
export async function generateExam(
  payload: ExamGeneratePayload,
): Promise<ExamGenerateResponse> {
  return request<ExamGenerateResponse>("/api/bjb/generate", {
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

  const res = await fetch(`${API_BASE}/api/bjb/export/docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return res.blob();
}

// Class Hour (Классный час / Сынып сағаты) API functions
export async function generateClassHour(
  payload: ClassHourGeneratePayload,
): Promise<ClassHourResponse> {
  return request<ClassHourResponse>("/api/class-hour/generate", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function regenerateClassHourBlock(
  payload: ClassHourRegeneratePayload,
): Promise<ClassHourBlock> {
  return request<ClassHourBlock>("/api/class-hour/regenerate-block", {
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

  const res = await fetch(`${API_BASE}/api/class-hour/export-docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return res.blob();
}

// Quiz (Тест генератор) API functions
export async function generateQuiz(
  payload: QuizGeneratePayload,
): Promise<QuizGenerateResponse> {
  return request<QuizGenerateResponse>("/api/quiz/generate", {
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

  const res = await fetch(`${API_BASE}/api/quiz/export`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return res.blob();
}

// Voiceover API functions
export async function generateVoiceover(
  payload: VoiceoverGeneratePayload,
): Promise<VoiceoverResponse> {
  const res = await request<VoiceoverResponse>("/api/v1/ai/text-to-speech", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });

  if (res.audio_url && !res.audio_url.startsWith("http")) {
    res.audio_url = `${API_BASE}${res.audio_url}`;
  }

  return res;
}

// Lesson Plan (Short-term КМЖ) API functions
export async function generateLessonPlan(
  payload: LessonPlanRequest,
): Promise<LessonPlanResponse> {
  return request<LessonPlanResponse>("/api/generate/kmzh", {
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

  const res = await fetch(`${API_BASE}/api/generate/kmzh/docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return res.blob();
}

// Scientific Project API functions
export async function generateScientificProject(
  payload: ScientificProjectGeneratePayload,
): Promise<ScientificProjectResponse> {
  return request<ScientificProjectResponse>("/api/v1/generate/science-project", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function exportScientificProjectDocx(
  payload: ScientificProjectExportPayload,
): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/v1/generate/science-project/export-docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return res.blob();
}

// Worksheet API functions
export async function generateWorksheet(
  payload: WorksheetGeneratePayload,
): Promise<WorksheetResponse> {
  return request<WorksheetResponse>("/api/v1/generate/worksheet", {
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

  const res = await fetch(`${API_BASE}/api/v1/generate/worksheet/export-docx`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return res.blob();
}

// Cookie helpers
function setCookie(name: string, value: string, days: number = 7) {
  if (typeof window === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null;
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return value;
  }
  return null;
}

function deleteCookie(name: string) {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Token management
export function saveToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  setCookie(TOKEN_KEY, token, 7);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (token) return token;
  return getCookie(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  deleteCookie(TOKEN_KEY);
}

// JWT token decoding
export function decodeJWT(token: string): { sub?: string; role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    // Decode base64url payload (second part)
    const payload = parts[1];
    // Replace base64url characters
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
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
  // Extract role from token if not provided
  if (!userData.role) {
    const token = getToken();
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded?.role) {
        userData.role = decoded.role;
      }
    }
  }
  window.localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

export function getUser(): UserData | null {
  if (typeof window === "undefined") return null;
  const data = window.localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as UserData;
  } catch {
    return null;
  }
}

export function clearUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
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

// Admin API functions
export async function getAdminUsers(
  limit: number = 50,
  offset: number = 0,
): Promise<AdminUsersResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  return request<AdminUsersResponse>(`/api/admin/users?${params}`, {
    method: "GET",
    auth: true,
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
  return request<AddSubscriptionResponse>(`/api/admin/users/${userId}/subscription`, {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

// Video types
export type UploadVideoTokenPayload = {
  title: string; // Max 255 characters
};

export type UploadVideoTokenResponse = {
  bunny_video_id: string;
  presigned_upload_url: string;
  authorization_header: string;
  video_db_id: string; // UUID
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

// Video API functions
export async function uploadVideoToken(
  payload: UploadVideoTokenPayload,
): Promise<UploadVideoTokenResponse> {
  return request<UploadVideoTokenResponse>("/api/admin/videos/upload-token", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function uploadVideoToBunny(
  url: string,
  file: File,
  authHeader: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log("Video uploaded successfully to Bunny CDN");
        resolve();
      } else {
        let errorText = `Upload failed with status ${xhr.status}`;
        let errorDetails: any = {};
        
        try {
          const responseText = xhr.responseText;
          if (responseText) {
            const parsed = JSON.parse(responseText);
            errorText = parsed.Message || parsed.message || parsed.error || responseText;
            errorDetails = parsed;
          }
        } catch {
          errorText = xhr.responseText || xhr.statusText || errorText;
        }
        
        console.error("Bunny CDN upload error:", {
          status: xhr.status,
          statusText: xhr.statusText,
          errorText,
          errorDetails,
          responseHeaders: xhr.getAllResponseHeaders(),
        });
        
        reject(new Error(errorText));
      }
    });

    xhr.addEventListener("error", (e) => {
      console.error("Network error during upload:", e);
      reject(new Error("Upload failed - network error"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted"));
    });

    // Use PUT method as required by Bunny CDN for direct uploads
    xhr.open("PUT", url);
    
    // Bunny CDN requires header name "AccessKey", not "Authorization"
    // Backend sends "AccessKey <key>", we need to extract just the key
    let accessKey: string;
    if (authHeader.startsWith("AccessKey ")) {
      // Extract the key after "AccessKey " prefix
      accessKey = authHeader.substring("AccessKey ".length).trim();
    } else {
      // If no prefix, use as-is (shouldn't happen, but just in case)
      accessKey = authHeader.trim();
    }
    
    // Set header with name "AccessKey" (not "Authorization")
    xhr.setRequestHeader("AccessKey", accessKey);
    
    // Set Content-Type to application/octet-stream to ensure Bunny recognizes the upload
    // Without this header, Bunny may accept the file but won't trigger encoding process
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    
    // Log upload details for debugging
    const urlObj = new URL(url);
    console.log("Uploading to Bunny CDN:", {
      method: "PUT",
      url: url.substring(0, 100) + "...",
      urlHost: urlObj.hostname,
      urlPath: urlObj.pathname,
      urlHasQuery: urlObj.search.length > 0,
      fileSize: file.size,
      fileName: file.name,
      fileType: file.type,
      originalAuthHeader: authHeader.substring(0, 25) + "...",
      extractedAccessKey: accessKey.substring(0, 10) + "...",
      contentType: "application/octet-stream",
    });
    
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
  const res = await fetch(`${getApiBase()}/api/admin/videos/${videoDbId}/thumbnail`, {
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

// At Zharys (Ат Жарыс) game API
export async function generateRace(
  payload: GenerateRacePayload,
): Promise<GenerateRaceResponse> {
  return request<GenerateRaceResponse>("/api/games/generate-race", {
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

export type VisualsListResponse = {
  items: VisualMaterial[];
  total: number;
  limit: number;
  offset: number;
};

// Client API - Get visual materials (requires subscription)
export async function getVisuals(params: {
  limit?: number;
  offset?: number;
  category_id?: string;
  search?: string;
}): Promise<VisualsListResponse> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.offset) queryParams.append("offset", params.offset.toString());
  if (params.category_id) queryParams.append("category_id", params.category_id);
  if (params.search) queryParams.append("search", params.search);

  return request<VisualsListResponse>(
    `/api/visuals?${queryParams.toString()}`,
    {
      method: "GET",
      auth: true,
    }
  );
}

// Client API - Get categories (public)
export async function getVisualCategories(): Promise<VisualMaterialCategory[]> {
  return request<VisualMaterialCategory[]>("/api/visuals/categories", {
    method: "GET",
    auth: false,
  });
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

  const res = await fetch(`${getApiBase()}/api/admin/visuals/upload`, {
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

// Admin API - Get all visual materials
export async function getAllVisuals(params: {
  limit?: number;
  offset?: number;
  category_id?: string;
  search?: string;
}): Promise<VisualsListResponse> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.offset) queryParams.append("offset", params.offset.toString());
  if (params.category_id) queryParams.append("category_id", params.category_id);
  if (params.search) queryParams.append("search", params.search);

  return request<VisualsListResponse>(
    `/api/admin/visuals/all?${queryParams.toString()}`,
    {
      method: "GET",
      auth: true,
    }
  );
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
  slug: string;
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
