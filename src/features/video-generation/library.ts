import { earliestVideoExpiry, isVideoExpired, utcTimestamp } from "./model";
import type { VideoProjectSummary } from "./types";

export function videoLibraryPreview(
  item: VideoProjectSummary,
  now = Date.now(),
): { assetId: string; expiresAt: string; title: string } | null {
  if (isVideoExpired(item.expires_at, now)) return null;
  const latest = item.latest_export;
  const exportExpiry = earliestVideoExpiry(
    item.expires_at,
    latest?.asset?.expires_at,
  );
  if (
    item.kind === "project" &&
    latest?.status === "completed" &&
    latest.asset &&
    exportExpiry &&
    !isVideoExpired(exportExpiry, now)
  )
    return {
      assetId: latest.asset.id,
      expiresAt: exportExpiry,
      title: item.title,
    };
  const clip = item.clip;
  const clipExpiry = earliestVideoExpiry(item.expires_at, clip?.expires_at);
  if (
    clip?.status === "completed" &&
    clip.asset_id &&
    clipExpiry &&
    !isVideoExpired(clipExpiry, now)
  )
    return {
      assetId: clip.asset_id,
      expiresAt: clipExpiry,
      title: clip.title || item.title,
    };
  return null;
}

export function videoLibraryPoster(
  item: VideoProjectSummary,
  now = Date.now(),
): { assetId: string; expiresAt: string } | null {
  if (isVideoExpired(item.expires_at, now)) return null;
  const thumbnail = item.thumbnail;
  if (
    thumbnail &&
    (!thumbnail.content_type || thumbnail.content_type.startsWith("image/"))
  ) {
    const expiresAt = earliestVideoExpiry(
      item.expires_at,
      thumbnail.expires_at,
    );
    if (expiresAt && !isVideoExpired(expiresAt, now))
      return { assetId: thumbnail.id, expiresAt };
  }
  const clip = item.clip;
  const expiresAt = earliestVideoExpiry(item.expires_at, clip?.expires_at);
  return clip?.preview_asset_id && expiresAt && !isVideoExpired(expiresAt, now)
    ? { assetId: clip.preview_asset_id, expiresAt }
    : null;
}

export function videoLibraryDate(value?: string, kk = false): string {
  if (!value || !Number.isFinite(utcTimestamp(value))) return "—";
  return new Date(utcTimestamp(value)).toLocaleString(kk ? "kk-KZ" : "ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function videoStatusLabel(status = "draft", kk = false): string {
  const labels: Record<string, [string, string]> = {
    draft: ["Черновик", "Жоба нұсқасы"],
    completed: ["Готово", "Дайын"],
    ready: ["Готово", "Дайын"],
    partial: ["Частично готово", "Ішінара дайын"],
    queued: ["В очереди", "Кезекте"],
    submitting: ["Запрос отправлен", "Сұраныс жіберілді"],
    processing: ["Создаётся", "Жасалуда"],
    downloading: ["Обрабатывается", "Өңделуде"],
    saving: ["Обрабатывается", "Өңделуде"],
    assembling: ["Собирается MP4", "MP4 жиналуда"],
    exporting: ["Собирается MP4", "MP4 жиналуда"],
    running: ["Выполняется", "Орындалуда"],
    failed: ["Ошибка", "Қате"],
    cancelled: ["Отменено", "Бас тартылды"],
    uncertain: ["Уточняем статус", "Күйі нақтылануда"],
    submission_unknown: ["Уточняем статус", "Күйі нақтылануда"],
    expired: ["Срок истёк", "Мерзімі аяқталды"],
  };
  return labels[status]?.[kk ? 1 : 0] ?? status;
}
