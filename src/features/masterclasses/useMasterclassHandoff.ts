"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { getMasterclassHandoff } from "./api";
import { getToken } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { fetchWithPolicy } from "@/lib/http-client";
import { masterclassCoverUrl, masterclassHandoffEnabled, masterclassHandoffPayloadError, masterclassHandoffScope, masterclassHandoffSource, type MasterclassHandoffPayload, type MasterclassHandoffTarget } from "./handoff-policy";

export function useMasterclassHandoff(target: MasterclassHandoffTarget, enabled = true) {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const source = masterclassHandoffSource(params);
  const identity = masterclassHandoffScope(user?.userId, target, source);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const requested = source.requested && dismissed !== identity;
  const active = requested && enabled;
  const query = useQuery({
    queryKey: ["masterclass-handoff", identity],
    queryFn: () => getMasterclassHandoff(source.id!, target, source.stageId, source.interactiveId, source.variant),
    enabled: masterclassHandoffEnabled(source, user?.userId, active),
    retry: false, staleTime: 0, refetchOnWindowFocus: false,
  });
  const candidate = active && user?.userId && source.valid && !query.isFetching ? query.data?.payload : undefined;
  const payloadError = candidate ? masterclassHandoffPayloadError(target, candidate) : null;
  const isKk = language === "kk";
  const error = !active ? null : !source.valid
    ? (isKk ? "Шебер сыныпқа сілтеме жарамсыз." : "Ссылка на мастер-класс некорректна.")
    : !authLoading && !user?.userId
      ? (isKk ? "Материалды ашу үшін аккаунтқа кіріңіз." : "Войдите в аккаунт, чтобы открыть материал.")
      : query.error ? teacherFacingErrorMessage(query.error, language)
        : payloadError ? (isKk ? "Материал осы редактордың көлем шегіне сәйкес емес. Бастапқы материалды бейімдеңіз немесе жаңа сұраудан бастаңыз." : "Материал превышает лимит этого редактора или содержит неподходящие данные. Адаптируйте исходник или начните с нового запроса.") : null;
  return {
    requested, blocked: requested && !enabled, identity,
    sourceId: source.id,
    sourceRevision: query.dataUpdatedAt,
    payload: candidate && !payloadError ? candidate as MasterclassHandoffPayload : undefined,
    loading: Boolean(active && source.valid && (authLoading || (user?.userId && (query.isPending || query.isFetching)))),
    error,
    clear: () => {
      setDismissed(identity);
      const next = new URLSearchParams(params.toString());
      for (const key of ["masterclassWork", "stage_id", "interactive_id", "variant"]) next.delete(key);
      router.replace(`${window.location.pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    },
  };
}

export type MasterclassHandoffState = ReturnType<typeof useMasterclassHandoff>;

export function useMasterclassCoverFile(handoff: MasterclassHandoffState) {
  const coverUrl = handoff.payload?.cover_url;
  const query = useQuery({
    queryKey: ["masterclass-handoff-cover", handoff.identity, coverUrl, handoff.sourceRevision],
    enabled: Boolean(handoff.payload && coverUrl), retry: false,
    staleTime: Infinity, refetchOnWindowFocus: false,
    queryFn: async () => {
      const target = masterclassCoverUrl(coverUrl!, getApiBase(), handoff.sourceId);
      const token = getToken();
      const response = await fetchWithPolicy(target, { headers: token ? { Authorization: `Bearer ${token}` } : {} }, { timeoutMs: 30_000 });
      if (!response.ok) throw new Error("Cover unavailable");
      const blob = await response.blob();
      if (blob.size > 12 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(blob.type)) throw new Error("Invalid cover file");
      const extension = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" }[blob.type] ?? "png";
      return new File([blob], `book-cover.${extension}`, { type: blob.type });
    },
  });
  return { file: handoff.payload && coverUrl ? query.data : undefined, loading: Boolean(handoff.payload && coverUrl && query.isPending), error: Boolean(handoff.payload && coverUrl && query.error) };
}

/** Apply once per authenticated source; later refetches never overwrite edits. */
export function useMasterclassHandoffPrefill(handoff: MasterclassHandoffState, apply: (payload: MasterclassHandoffPayload) => void, reset: () => void) {
  const applied = useRef<string | null>(null);
  const callbacks = useRef({ apply, reset });
  useEffect(() => { callbacks.current = { apply, reset }; });
  useEffect(() => {
    if (applied.current && applied.current !== handoff.identity) {
      callbacks.current.reset(); applied.current = null;
    }
    if (handoff.payload && applied.current !== handoff.identity) {
      callbacks.current.apply(handoff.payload); applied.current = handoff.identity;
    }
  }, [handoff.identity, handoff.payload]);
}
