import { getToken } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import {
  API_ERROR_CODES,
  ApiRequestError,
  apiErrorCodeForStatus,
  fetchWithPolicy,
  readResponsePayload,
  requestJson,
  type ApiErrorCode,
  type ApiFailure,
} from "@/lib/http-client";
import type {
  ContentCategory,
  ContentItem,
  ContentListParams,
  ContentListResponse,
  ContentMutationInput,
  ContentSubject,
  LegacyBackfillResponse,
} from "./types";

export class ApiError extends ApiRequestError {
  constructor(
    message: string,
    status: number,
    details?: unknown,
    code: ApiErrorCode = apiErrorCodeForStatus(status),
  ) {
    super(message, status, details, code);
    this.name = "ApiError";
  }
}

type RequestOptions = RequestInit & { auth?: boolean };

export function resolveLibraryUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function fetchAdminLibraryPreviewBlob(
  path: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const url = new URL(resolveLibraryUrl(path));
  const apiUrl = new URL(getApiBase());
  if (url.origin !== apiUrl.origin || !url.pathname.startsWith("/api/admin/library/")) {
    throw new ApiError("Invalid admin preview URL", 400);
  }

  const token = getToken();
  if (!token) throw new ApiError("Authentication required", 401);
  const response = await fetchWithPolicy(url, {
    signal,
    cache: "no-store",
    headers: {
      Accept: "image/*",
      Authorization: `Bearer ${token}`,
    },
  }, {
    errorFactory: contentApiError,
  });
  if (!response.ok) {
    const { data } = await readResponsePayload(response);
    throw new ApiError(extractErrorMessage(data, response.status), response.status, data);
  }
  return response.blob();
}

type BackwardCompatibleContentItem = ContentItem & {
  is_published?: boolean;
  is_archived?: boolean;
};

function normalizeContentItem(raw: BackwardCompatibleContentItem): ContentItem {
  const assets = raw.assets ?? [];
  const assetCounts = raw.asset_counts ?? assets.reduce<ContentItem["asset_counts"]>((counts, asset) => {
    counts[asset.role] = (counts[asset.role] ?? 0) + 1;
    return counts;
  }, {});
  const formats = raw.formats ?? Array.from(
    new Set(
      assets.map((asset) => asset.original_filename.split(".").pop()?.toUpperCase()).filter((value): value is string => Boolean(value)),
    ),
  );
  return {
    ...raw,
    segments: raw.segments ?? [],
    grades: raw.grades ?? [],
    categories: raw.categories ?? [],
    assets,
    asset_counts: assetCounts,
    formats,
    preview_status: raw.preview_status ?? "pending",
    is_active: raw.is_active ?? Boolean(raw.is_published && !raw.is_archived),
  };
}

function extractErrorMessage(data: unknown, status: number): string {
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const detail = record.detail ?? record.error ?? record.message;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object") {
      const publicationErrors = (detail as Record<string, unknown>).publication_errors;
      if (Array.isArray(publicationErrors)) {
        const messages = publicationErrors
          .filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
        if (messages.length > 0) return messages.join("; ");
      }
    }
    if (Array.isArray(detail)) {
      return detail
        .map((entry) => {
          if (entry && typeof entry === "object" && "msg" in entry) {
            return String((entry as { msg: unknown }).msg);
          }
          return String(entry);
        })
        .join("; ");
    }
  }
  return `Request failed with status ${status}`;
}

function contentApiError(failure: ApiFailure): ApiError {
  const message =
    failure.status === 0 || failure.code === API_ERROR_CODES.INVALID_RESPONSE
      ? failure.message
      : extractErrorMessage(failure.details, failure.status);
  return new ApiError(
    message,
    failure.status,
    failure.details,
    failure.code,
  );
}

async function libraryRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth, ...requestInit } = options;
  const headers = new Headers(options.headers);
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return requestJson<T>(resolveLibraryUrl(path), {
    ...requestInit,
    headers,
    cache: "no-store",
  }, {
    errorFactory: contentApiError,
  });
}

function buildQuery(params: ContentListParams): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.toString();
}

export async function getLibraryContent(
  params: ContentListParams,
  signal?: AbortSignal,
): Promise<ContentListResponse> {
  const query = buildQuery(params);
  const response = await libraryRequest<ContentListResponse>(`/api/library/content${query ? `?${query}` : ""}`, {
    signal,
    auth: true,
  });
  return { ...response, items: response.items.map(normalizeContentItem) };
}

export async function getLibraryContentItem(id: string, signal?: AbortSignal): Promise<ContentItem> {
  const response = await libraryRequest<ContentItem>(`/api/library/content/${encodeURIComponent(id)}`, {
    signal,
    auth: true,
  });
  return normalizeContentItem(response);
}

export async function getLibraryCategories(signal?: AbortSignal): Promise<ContentCategory[]> {
  return libraryRequest<ContentCategory[]>("/api/library/categories", { signal, auth: true });
}

export async function getLibrarySubjects(signal?: AbortSignal): Promise<ContentSubject[]> {
  return libraryRequest<ContentSubject[]>("/api/library/subjects", { signal, auth: true });
}

export async function getAdminLibraryContent(
  params: ContentListParams,
  signal?: AbortSignal,
): Promise<ContentListResponse> {
  const query = buildQuery(params);
  const response = await libraryRequest<ContentListResponse>(
    `/api/admin/library/content${query ? `?${query}` : ""}`,
    { signal, auth: true },
  );
  return { ...response, items: response.items.map(normalizeContentItem) };
}

function toFormData(input: ContentMutationInput, includeAdminState = false): FormData {
  const formData = new FormData();
  formData.append("title", input.title.trim());
  formData.append("type", input.materialType);
  formData.append("language", input.language);
  formData.append("description", input.description.trim());
  if (input.subjectId) {
    formData.append("subject_id", input.subjectId);
  } else if (includeAdminState) {
    // Multipart parsers may collapse empty values, so clearing is explicit on PATCH.
    formData.append("clear_subject", "true");
  }
  formData.append("segments", JSON.stringify(input.segments));
  formData.append("grades", JSON.stringify(input.grades));
  formData.append("category_ids", JSON.stringify(input.categoryIds));
  formData.append("is_published", String(input.isPublished));
  if (includeAdminState && input.needsTaxonomy !== undefined) {
    formData.append("needs_taxonomy", String(input.needsTaxonomy));
  }
  if (includeAdminState && input.removeAssetIds !== undefined) {
    formData.append("remove_asset_ids", JSON.stringify(input.removeAssetIds));
  }
  if (includeAdminState && input.assetOrder !== undefined) {
    formData.append("asset_order", JSON.stringify(input.assetOrder));
  }
  input.files.forEach(({ file, role }) => {
    formData.append("files[]", file, file.name);
    formData.append("asset_roles[]", role);
  });
  return formData;
}

export async function createAdminLibraryContent(input: ContentMutationInput): Promise<ContentItem> {
  const response = await libraryRequest<ContentItem>("/api/admin/library/content", {
    method: "POST",
    body: toFormData(input),
    auth: true,
  });
  return normalizeContentItem(response);
}

export async function updateAdminLibraryContent(
  id: string,
  input: ContentMutationInput,
): Promise<ContentItem> {
  const response = await libraryRequest<ContentItem>(`/api/admin/library/content/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: toFormData(input, true),
    auth: true,
  });
  return normalizeContentItem(response);
}

export async function archiveAdminLibraryContent(id: string): Promise<void> {
  return libraryRequest<void>(`/api/admin/library/content/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function restoreAdminLibraryContent(id: string): Promise<ContentItem> {
  const response = await libraryRequest<ContentItem>(
    `/api/admin/library/content/${encodeURIComponent(id)}/restore`,
    { method: "POST", auth: true },
  );
  return normalizeContentItem(response);
}

export async function backfillLegacyLibrary(
  legacyType: "all" | "materials" | "visuals",
  limit = 50,
): Promise<LegacyBackfillResponse> {
  const query = new URLSearchParams({ legacy_type: legacyType, limit: String(limit) });
  return libraryRequest<LegacyBackfillResponse>(`/api/admin/library/legacy/backfill?${query}`, {
    method: "POST",
    auth: true,
  });
}

export async function retryLegacyLibraryContent(id: string): Promise<ContentItem> {
  const response = await libraryRequest<ContentItem>(
    `/api/admin/library/legacy/${encodeURIComponent(id)}/retry`,
    { method: "POST", auth: true },
  );
  return normalizeContentItem(response);
}

type TaxonomyMutationInput = {
  name: string;
  name_kk?: string | null;
};

export async function createAdminLibrarySubject(input: TaxonomyMutationInput): Promise<ContentSubject> {
  return libraryRequest<ContentSubject>("/api/admin/library/subjects", {
    method: "POST",
    body: JSON.stringify(input),
    auth: true,
  });
}

export async function updateAdminLibrarySubject(
  id: string,
  input: TaxonomyMutationInput,
): Promise<ContentSubject> {
  return libraryRequest<ContentSubject>(`/api/admin/library/subjects/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    auth: true,
  });
}

export async function deleteAdminLibrarySubject(id: string): Promise<void> {
  return libraryRequest<void>(`/api/admin/library/subjects/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}

function filenameFromDisposition(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) {
    try {
      return decodeURIComponent(utf8);
    } catch {
      return fallback;
    }
  }
  return disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback;
}

export async function downloadLibraryFile(downloadUrl: string, fallbackName: string): Promise<void> {
  type WritableFileStream = {
    write(data: unknown): Promise<void>;
    close(): Promise<void>;
    abort?(reason?: unknown): Promise<void>;
  };
  type SaveFileHandle = { createWritable(): Promise<WritableFileStream> };
  type SavePickerWindow = Window & {
    showSaveFilePicker?: (options: { suggestedName: string }) => Promise<SaveFileHandle>;
  };

  const safeFallbackName = fallbackName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").slice(0, 220) || "download";
  const picker = (window as SavePickerWindow).showSaveFilePicker;
  let fileHandle: SaveFileHandle | null = null;
  if (picker) {
    try {
      fileHandle = await picker.call(window, { suggestedName: safeFallbackName });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const resolvedDownload = new URL(resolveLibraryUrl(downloadUrl));
  const apiOrigin = new URL(getApiBase()).origin;
  const allowedPath =
    resolvedDownload.pathname.startsWith("/api/library/assets/") ||
    resolvedDownload.pathname.startsWith("/api/library/content/") ||
    resolvedDownload.pathname.startsWith("/api/admin/library/assets/") ||
    resolvedDownload.pathname.startsWith("/api/admin/library/content/");
  if (resolvedDownload.origin !== apiOrigin || !allowedPath) {
    throw new ApiError("Invalid library download URL", 400);
  }

  const response = await fetchWithPolicy(
    resolvedDownload,
    { headers, cache: "no-store" },
    { errorFactory: contentApiError },
  );
  if (!response.ok) {
    const { data } = await readResponsePayload(response);
    throw new ApiError(extractErrorMessage(data, response.status), response.status, data);
  }

  if (fileHandle && response.body) {
    const writable = await fileHandle.createWritable();
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writable.write(value);
      }
      await writable.close();
      return;
    } catch (error) {
      await reader.cancel(error).catch(() => undefined);
      await writable.abort?.(error).catch(() => undefined);
      throw error;
    }
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > 200 * 1024 * 1024) {
    await response.body?.cancel();
    throw new StreamingDownloadRequiredError();
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filenameFromDisposition(response.headers.get("content-disposition"), safeFallbackName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

export class StreamingDownloadRequiredError extends Error {
  constructor() {
    super("Streaming download support is required for this large file");
    this.name = "StreamingDownloadRequiredError";
  }
}
