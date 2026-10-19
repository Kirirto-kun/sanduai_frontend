"use client";
import { useEffect, useRef, useState } from "react";
import {
  earliestVideoExpiry,
  expiryLabel,
  isVideoExpired,
  money,
} from "./model";
import {
  videoLibraryDate,
  videoLibraryPoster,
  videoLibraryPreview,
  videoStatusLabel,
} from "./library";
import type { VideoCatalog, VideoProjectSummary } from "./types";
import { DownloadVideo, PrivateMedia, useMediaExpired } from "./PrivateMedia";
import { Button, Icon, Modal } from "./ui";

export function LibraryCard({
  item,
  catalog,
  kk,
  onOpen,
  onDelete,
}: {
  item: VideoProjectSummary;
  catalog?: VideoCatalog;
  kk: boolean;
  onOpen: (sceneId?: string) => void;
  onDelete: () => void;
}) {
  const element = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [openedPreview, setOpenedPreview] =
    useState<ReturnType<typeof videoLibraryPreview>>(null);
  const t = (ru: string, kz: string) => (kk ? kz : ru);
  const clip = item.clip;
  const poster = videoLibraryPoster(item);
  const preview = videoLibraryPreview(item);
  const posterExpired = useMediaExpired(poster?.expiresAt);
  const projectExpired = useMediaExpired(item.expires_at);
  const clipExpiry = earliestVideoExpiry(item.expires_at, clip?.expires_at);
  const clipExpired = useMediaExpired(clipExpiry);
  const isProject =
    (item.kind ?? ((item.scene_count ?? 0) > 1 ? "project" : "clip")) ===
    "project";
  const exported = item.latest_export;
  const exportExpiry = earliestVideoExpiry(
    item.expires_at,
    exported?.asset?.expires_at,
  );
  const exportExpired = useMediaExpired(exportExpiry);
  const modelLabel =
    catalog?.models.find((model) => model.id === clip?.model_id)?.label ??
    clip?.model_id;
  useEffect(() => {
    const target = element.current;
    if (!target) return;
    if (typeof IntersectionObserver === "undefined") {
      let active = true;
      queueMicrotask(() => {
        if (active) setVisible(true);
      });
      return () => {
        active = false;
      };
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return (
    <article
      ref={element}
      className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      <div className="relative flex min-h-40 items-center justify-center bg-slate-100">
        {visible && poster && !posterExpired && !projectExpired ? (
          <PrivateMedia
            projectExpiresAt={item.expires_at}
            key={poster.assetId}
            assetId={poster.assetId}
            expiresAt={poster.expiresAt}
            image
            compact
            kk={kk}
          />
        ) : (
          <Icon name="film" className="h-10 w-10 text-slate-300" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
          {isProject ? t("Проект", "Жоба") : t("Клип", "Клип")}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            className="min-w-0 text-left text-sm font-semibold text-slate-800 hover:text-indigo-600"
            onClick={() => onOpen(isProject ? undefined : clip?.scene_id)}
          >
            <span className="line-clamp-2">{item.title}</span>
          </button>
          <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-[9px] font-semibold text-indigo-600">
            {videoStatusLabel(
              projectExpired ? "expired" : (item.status ?? clip?.status),
              kk,
            )}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
          {clip?.prompt_preview ||
            t("Промпт ещё не задан", "Промпт әлі берілмеген")}
        </p>
        <p className="mt-3 text-[10px] text-slate-400">
          {videoLibraryDate(
            isProject ? item.created_at : (clip?.created_at ?? item.created_at),
            kk,
          )}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] leading-5">
          <div>
            <dt className="text-slate-400">{t("Длительность", "Ұзақтық")}</dt>
            <dd className="font-semibold text-slate-600">
              {clip?.duration != null
                ? Number(clip.duration).toLocaleString(kk ? "kk-KZ" : "ru-RU", {
                    maximumFractionDigits: 2,
                  })
                : "—"}{" "}
              {t("сек", "сек")}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">{t("Формат", "Пішім")}</dt>
            <dd className="font-semibold text-slate-600">
              {clip?.aspect_ratio ?? item.aspect_ratio ?? "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-slate-400">{t("Модель", "Модель")}</dt>
            <dd className="break-words font-semibold text-slate-600">
              {modelLabel ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">
              {t("Разрешение", "Ажыратымдылық")}
            </dt>
            <dd className="font-semibold text-slate-600">
              {clip?.resolution ?? "—"}
            </dd>
          </div>
        </dl>
        {isProject && (
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">
            {t("Готово сцен", "Дайын сахналар")}:{" "}
            <strong>
              {item.ready_scene_count ?? item.ready_count ?? 0} /{" "}
              {item.scene_count ?? 0}
            </strong>
            <br />
            {t("Общая длительность", "Жалпы ұзақтық")}:{" "}
            <strong>
              {Number(item.total_duration ?? 0).toLocaleString(
                kk ? "kk-KZ" : "ru-RU",
                { maximumFractionDigits: 2 },
              )}{" "}
              {t("сек", "сек")}
            </strong>
          </p>
        )}
        <p className="mt-4 text-xs text-slate-500">
          {t("Списано", "Есептен алынды")}:{" "}
          <strong className="text-slate-800">
            {money(
              isProject
                ? item.total_spent_tokens
                : (clip?.net_cost_tokens ??
                    clip?.captured_tokens ??
                    item.total_spent_tokens ??
                    0),
            )}
          </strong>{" "}
          {t("токенов", "токен")}
        </p>
        {isProject && (
          <div className="mt-4 rounded-xl border border-slate-100 p-3 text-[11px] leading-5 text-slate-500">
            <p className="font-semibold text-slate-600">
              {t("Последний экспорт", "Соңғы экспорт")}
            </p>
            {exported ? (
              <>
                <p className="mt-1">
                  {videoStatusLabel(
                    exported.asset_expired || exportExpired
                      ? "expired"
                      : exported.status,
                    kk,
                  )}{" "}
                  ·{" "}
                  {exported.resolution ?? exported.settings?.resolution ?? "—"}
                </p>
                <p>{videoLibraryDate(exported.created_at, kk)}</p>
                {exported.asset &&
                  !exportExpired &&
                  exported.status === "completed" && (
                    <div className="mt-2">
                      <DownloadVideo
                        projectExpiresAt={item.expires_at}
                        assetId={exported.asset.id}
                        expiresAt={exportExpiry}
                        name={`${item.title}-export`}
                        kk={kk}
                      />
                    </div>
                  )}
              </>
            ) : (
              <p className="mt-1">{t("Ещё не собирали", "Әлі жиналмады")}</p>
            )}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {preview && !projectExpired && (
            <Button variant="ghost" onClick={() => setOpenedPreview(preview)}>
              <Icon name="play" />
              {t("Предпросмотр", "Алдын ала қарау")}
            </Button>
          )}
          {!isProject &&
            clip?.asset_id &&
            !clipExpired &&
            !projectExpired &&
            clip.status === "completed" && (
              <DownloadVideo
                projectExpiresAt={item.expires_at}
                assetId={clip.asset_id}
                expiresAt={clipExpiry}
                name={item.title}
                kk={kk}
              />
            )}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-[10px] text-amber-700">
          <Icon name="clock" className="h-3 w-3" />
          {t("До удаления проекта", "Жоба жойылғанша")}:{" "}
          {expiryLabel(item.expires_at, kk)}
        </p>
        {clip?.expires_at && !isVideoExpired(clip.expires_at) && (
          <p className="mt-1 text-[10px] text-slate-400">
            {t("Клип доступен ещё", "Клип қолжетімді")}:{" "}
            {expiryLabel(clipExpiry!, kk)}
          </p>
        )}
      </div>
      <div className="flex justify-between border-t border-slate-100 px-4 py-2">
        <Button
          variant="ghost"
          disabled={projectExpired}
          onClick={() => onOpen(isProject ? undefined : clip?.scene_id)}
        >
          {t("Открыть", "Ашу")}
          <Icon name="arrow" />
        </Button>
        <Button
          variant="ghost"
          onClick={onDelete}
          aria-label={t("Удалить проект", "Жобаны жою")}
        >
          <Icon name="trash" />
        </Button>
      </div>
      {openedPreview && !projectExpired && (
        <Modal title={item.title} onClose={() => setOpenedPreview(null)}>
          <PrivateMedia
            projectExpiresAt={item.expires_at}
            key={openedPreview.assetId}
            assetId={openedPreview.assetId}
            expiresAt={openedPreview.expiresAt}
            kk={kk}
          />
          <div className="mt-4">
            <DownloadVideo
              projectExpiresAt={item.expires_at}
              assetId={openedPreview.assetId}
              expiresAt={openedPreview.expiresAt}
              name={item.title}
              kk={kk}
            />
          </div>
        </Modal>
      )}
    </article>
  );
}
