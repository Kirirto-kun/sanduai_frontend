import { getToken } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { requestJson } from "@/lib/http-client";
import type { CompetitionAdminList, CompetitionPreset, CompetitionPresetInput } from "./types";

function request<T>(path: string, method = "GET", payload?: unknown, signal?: AbortSignal): Promise<T> {
  const token = getToken();
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return requestJson<T>(`${getApiBase()}${path}`, {
    method,
    headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
    cache: "no-store",
    signal,
  }, { timeoutMs: 30_000 });
}

export const competitionAdminApi = {
  list: (signal?: AbortSignal) => request<CompetitionAdminList>("/api/admin/competitions", "GET", undefined, signal),
  create: (preset: CompetitionPresetInput) => request<CompetitionPreset>("/api/admin/competitions", "POST", preset),
  update: (id: string, preset: CompetitionPresetInput) => request<CompetitionPreset>(
    `/api/admin/competitions/${encodeURIComponent(id)}`, "PUT", preset,
  ),
};
