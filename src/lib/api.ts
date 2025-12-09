const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
const TOKEN_KEY = "sanduai_token";

export type AuthResponse = {
  token: string;
  user_id: string;
};

type RegisterPayload = {
  phone: string;
  email: string;
  password: string;
  full_name: string;
};

type LoginPayload = {
  phone: string;
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

// User data management
const USER_KEY = "sanduai_user";

export type UserData = {
  userId: string;
  phone?: string;
  email?: string;
  fullName?: string;
};

export function saveUser(userData: UserData) {
  if (typeof window === "undefined") return;
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


