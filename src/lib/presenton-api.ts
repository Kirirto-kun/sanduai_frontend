/**
 * API client for the Presenton proxy layer.
 *
 * All requests go through the SanduAI backend at
 * /api/v1/presentations/presenton/* which proxies to the internal
 * Presenton service.
 */

import { getToken } from "./api";
import type {
  AsyncGeneratePayload,
  AsyncGenerateResponse,
  CreatePresentationPayload,
  CreateThemePayload,
  EditSlideHtmlPayload,
  EditSlidePayload,
  ExportPayload,
  ExportResult,
  FontInfo,
  GenerateThemePayload,
  IconResult,
  ImageAsset,
  LayoutInfo,
  Presentation,
  PresentationListItem,
  PresentationWithSlides,
  PreparePresentationPayload,
  Slide,
  TaskStatusResponse,
  TemplateGroup,
  ThemeData,
  UpdateThemePayload,
} from "@/types/presenton";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const PREFIX = "/api/v1/presentations/presenton";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function req<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_BASE}${PREFIX}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `Request failed: ${resp.status}`);
  }

  return resp.json() as Promise<T>;
}

async function reqBlob(path: string): Promise<Blob> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_BASE}${PREFIX}${path}`, {
    headers,
    cache: "no-store",
  });

  if (!resp.ok) {
    throw new Error(`Download failed: ${resp.status}`);
  }

  return resp.blob();
}

// ---------------------------------------------------------------------------
// Presentations
// ---------------------------------------------------------------------------

export async function createPresentation(
  payload: CreatePresentationPayload,
): Promise<Presentation> {
  return req("/presentations/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listPresentations(): Promise<PresentationListItem[]> {
  return req("/presentations/list");
}

export async function getPresentation(
  id: string,
): Promise<PresentationWithSlides> {
  return req(`/presentations/get/${id}`);
}

export async function deletePresentation(id: string): Promise<void> {
  await req(`/presentations/delete/${id}`, { method: "DELETE" });
}

export async function preparePresentation(
  payload: PreparePresentationPayload,
): Promise<Presentation> {
  return req("/presentations/prepare", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function editPresentation(
  presentationId: string,
  instructions?: string,
): Promise<Presentation> {
  return req("/presentations/edit", {
    method: "POST",
    body: JSON.stringify({ presentation_id: presentationId, instructions }),
  });
}

export async function derivePresentation(
  presentationId: string,
  overrides?: Partial<CreatePresentationPayload>,
): Promise<Presentation> {
  return req("/presentations/derive", {
    method: "POST",
    body: JSON.stringify({ presentation_id: presentationId, ...overrides }),
  });
}

// ---------------------------------------------------------------------------
// Async generation (full pipeline)
// ---------------------------------------------------------------------------

export async function startAsyncGeneration(
  payload: AsyncGeneratePayload,
): Promise<AsyncGenerateResponse> {
  return req("/generation/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getGenerationStatus(
  taskId: string,
): Promise<TaskStatusResponse> {
  return req(`/generation/status/${taskId}`);
}

export async function downloadGenerationResult(
  taskId: string,
): Promise<Blob> {
  return reqBlob(`/generation/result/${taskId}`);
}

// ---------------------------------------------------------------------------
// Slides
// ---------------------------------------------------------------------------

export async function editSlide(
  payload: EditSlidePayload,
): Promise<Slide> {
  return req("/slides/edit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function editSlideHtml(
  payload: EditSlideHtmlPayload,
): Promise<Slide> {
  return req("/slides/edit-html", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function exportPptx(
  presentationId: string,
): Promise<ExportResult> {
  return req("/export/pptx", {
    method: "POST",
    body: JSON.stringify({ presentation_id: presentationId, export_as: "pptx" }),
  });
}

export async function exportPresentation(
  payload: ExportPayload,
): Promise<ExportResult> {
  return req("/export/export", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function downloadExport(filename: string): Promise<Blob> {
  return reqBlob(`/export/download/${filename}`);
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export async function uploadFiles(files: File[]): Promise<string[]> {
  const token = getToken();
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}${PREFIX}/files/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
  return resp.json();
}

export async function decomposeFiles(
  filePaths: string[],
): Promise<unknown> {
  return req("/files/decompose", {
    method: "POST",
    body: JSON.stringify({ file_paths: filePaths }),
  });
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export async function generateImage(
  prompt: string,
  style?: string,
): Promise<ImageAsset> {
  const params = new URLSearchParams({ prompt });
  if (style) params.set("style", style);
  return req(`/images/generate?${params}`);
}

export async function listGeneratedImages(): Promise<ImageAsset[]> {
  return req("/images/generated");
}

export async function uploadImage(file: File): Promise<ImageAsset> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}${PREFIX}/images/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
  return resp.json();
}

export async function listUploadedImages(): Promise<ImageAsset[]> {
  return req("/images/uploaded");
}

export async function deleteImage(id: string): Promise<void> {
  await req(`/images/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

export async function createTheme(
  payload: CreateThemePayload,
): Promise<ThemeData> {
  return req("/themes/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listThemes(): Promise<ThemeData[]> {
  return req("/themes/list");
}

export async function updateTheme(
  id: string,
  payload: UpdateThemePayload,
): Promise<ThemeData> {
  return req(`/themes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTheme(id: string): Promise<void> {
  await req(`/themes/${id}`, { method: "DELETE" });
}

export async function generateThemeColors(
  payload: GenerateThemePayload,
): Promise<ThemeData> {
  return req("/themes/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

export async function uploadFont(file: File): Promise<FontInfo> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}${PREFIX}/fonts/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
  return resp.json();
}

export async function listFonts(): Promise<FontInfo[]> {
  return req("/fonts/list");
}

export async function deleteFont(id: string): Promise<void> {
  await req(`/fonts/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

export async function searchIcons(query: string): Promise<IconResult[]> {
  return req(`/icons/search?query=${encodeURIComponent(query)}`);
}

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------

export async function listLayouts(): Promise<LayoutInfo[]> {
  return req("/layouts/list");
}

export async function getLayout(name: string): Promise<LayoutInfo> {
  return req(`/layouts/${encodeURIComponent(name)}`);
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function listTemplates(): Promise<TemplateGroup[]> {
  return req("/templates/list");
}

export async function getTemplatesForPresentation(
  presentationId: string,
): Promise<unknown> {
  return req(`/templates/for-presentation/${presentationId}`);
}

// ---------------------------------------------------------------------------
// Assets (images/fonts/exports)
// ---------------------------------------------------------------------------

/**
 * Rewrite a Presenton internal asset path to the SanduAI proxy URL.
 *
 * Example:
 *   "/app_data/images/abc/img.png" → "http://localhost:8000/api/v1/presentations/presenton/assets/images/abc/img.png"
 *   "images/abc/img.png" → same as above
 */
export function assetUrl(path: string): string {
  // Strip /app_data/ prefix if present
  let clean = path;
  if (clean.startsWith("/app_data/")) {
    clean = clean.slice("/app_data/".length);
  } else if (clean.startsWith("app_data/")) {
    clean = clean.slice("app_data/".length);
  }
  return `${API_BASE}${PREFIX}/assets/${clean}`;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function checkHealth(): Promise<{
  api_ok: boolean;
  templates_ok: boolean;
}> {
  return req("/health");
}
