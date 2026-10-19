import { getToken } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { requestJson } from "@/lib/http-client";
import type { MasterclassConfig, MasterclassConfigUpdate } from "./types";

function request<T>(method: string, payload?: unknown, signal?: AbortSignal): Promise<T> {
  const token = getToken();
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return requestJson<T>(`${getApiBase()}/api/admin/masterclasses/config`, {
    method, headers, cache: "no-store", signal,
    body: payload === undefined ? undefined : JSON.stringify(payload),
  }, { timeoutMs: 30_000 });
}

export const masterclassAdminApi = {
  get: (signal?: AbortSignal) => request<MasterclassConfig>("GET", undefined, signal),
  update: (payload: MasterclassConfigUpdate) => request<MasterclassConfig>("PUT", payload),
};
