"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { videoApi } from "./api";
import {
  earliestVideoExpiry,
  isVideoExpired,
  utcTimestamp,
  videoError,
} from "./model";
import { Button, Icon, Spinner } from "./ui";
import { isVideoReadNetworkError } from "./read-recovery";

export function useMediaExpired(expiresAt?: string) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const delay = Math.max(0, utcTimestamp(expiresAt) - Date.now() + 20);
    if (!Number.isFinite(delay)) return;
    const timer = window.setTimeout(
      () => tick((n) => n + 1),
      Math.min(delay, 2_147_000_000),
    );
    return () => window.clearTimeout(timer);
  }, [expiresAt]);
  return isVideoExpired(expiresAt);
}
export function PrivateMedia({
  assetId,
  expiresAt,
  projectExpiresAt,
  kk = false,
  image = false,
  compact = false,
  trimIn = 0,
  trimOut,
  onEnded,
  autoPlay = false,
  fit,
  frameAspect,
  stillAt,
}: {
  assetId: string;
  expiresAt?: string;
  projectExpiresAt?: string;
  kk?: boolean;
  image?: boolean;
  compact?: boolean;
  trimIn?: number;
  trimOut?: number | null;
  onEnded?: () => void;
  autoPlay?: boolean;
  fit?: "contain" | "crop";
  frameAspect?: string;
  stillAt?: number;
}) {
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [networkFailed, setNetworkFailed] = useState(false);
  const [metadataExpiry, setMetadataExpiry] = useState<{
    assetId: string;
    expiresAt: string;
  } | null>(null);
  const effectiveExpiry = earliestVideoExpiry(
    expiresAt,
    projectExpiresAt,
    metadataExpiry?.assetId === assetId ? metadataExpiry.expiresAt : undefined,
  );
  const media = useRef<HTMLVideoElement>(null);
  const expired = useMediaExpired(effectiveExpiry);
  useEffect(() => {
    if (expired) return;
    const controller = new AbortController();
    let url = "";
    videoApi
      .asset(assetId, controller.signal, undefined, (value) => {
        if (!controller.signal.aborted)
          setMetadataExpiry({ assetId, expiresAt: value });
      })
      .then((blob) => {
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setSource(url);
        setError("");
        setNetworkFailed(false);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(videoError(err, kk));
          setNetworkFailed(isVideoReadNetworkError(err));
        }
      });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [assetId, expired, kk, retry]);
  useEffect(() => {
    if (!networkFailed || expired) return;
    const reconnect = () => {
      if (!navigator.onLine || isVideoExpired(effectiveExpiry)) return;
      setError("");
      setNetworkFailed(false);
      setRetry((n) => n + 1);
    };
    window.addEventListener("online", reconnect);
    window.addEventListener("focus", reconnect);
    return () => {
      window.removeEventListener("online", reconnect);
      window.removeEventListener("focus", reconnect);
    };
  }, [networkFailed, expired, effectiveExpiry]);
  if (expired)
    return (
      <div className="grid min-h-36 place-items-center rounded-2xl bg-slate-100 p-5 text-center text-xs text-slate-500">
        {kk ? "Файлдың сақтау мерзімі аяқталды" : "Срок хранения файла истёк"}
      </div>
    );
  if (error)
    return (
      <div className="grid min-h-36 place-items-center gap-3 rounded-2xl bg-slate-100 p-5 text-center text-xs text-slate-500">
        <p>{error}</p>
        <Button
          onClick={() => {
            setError("");
            setNetworkFailed(false);
            setRetry((n) => n + 1);
          }}
        >
          <Icon name="refresh" />
          {kk ? "Қайталау" : "Повторить"}
        </Button>
      </div>
    );
  if (!source)
    return (
      <div className="grid min-h-36 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    );
  if (image)
    return (
      <Image
        unoptimized
        src={source}
        width={1024}
        height={768}
        alt={kk ? "Бастапқы сурет" : "Исходное изображение"}
        className={`w-full rounded-2xl object-contain ${compact ? "max-h-32" : "max-h-72"}`}
      />
    );
  return (
    <video
      ref={media}
      src={source}
      controls={stillAt === undefined}
      playsInline
      preload="metadata"
      autoPlay={autoPlay}
      className={`w-full rounded-2xl bg-slate-950 ${compact ? "max-h-40" : "max-h-[440px]"}`}
      style={
        frameAspect
          ? {
              aspectRatio: frameAspect.replace(":", "/"),
              objectFit: fit === "crop" ? "cover" : "contain",
            }
          : undefined
      }
      onLoadedMetadata={(e) => {
        e.currentTarget.currentTime =
          stillAt === undefined
            ? trimIn
            : Math.max(0, Math.min(stillAt, e.currentTarget.duration - 0.04));
      }}
      onPlay={(e) => {
        if (isVideoExpired(effectiveExpiry)) {
          e.currentTarget.pause();
          return;
        }
        if (
          e.currentTarget.currentTime < trimIn ||
          (trimOut && e.currentTarget.currentTime >= trimOut)
        )
          e.currentTarget.currentTime = trimIn;
      }}
      onTimeUpdate={(e) => {
        if (stillAt !== undefined) {
          e.currentTarget.pause();
          return;
        }
        if (e.currentTarget.currentTime < trimIn)
          e.currentTarget.currentTime = trimIn;
        if (trimOut && e.currentTarget.currentTime >= trimOut) {
          e.currentTarget.pause();
          onEnded?.();
        }
      }}
      onEnded={onEnded}
    >
      <track kind="captions" />
    </video>
  );
}

export function DownloadVideo({
  assetId,
  name,
  kk = false,
  expiresAt,
  projectExpiresAt,
  reconciliationJobId,
}: {
  assetId: string;
  name: string;
  kk?: boolean;
  expiresAt?: string;
  projectExpiresAt?: string;
  reconciliationJobId?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [metadataExpiry, setMetadataExpiry] = useState<{
    assetId: string;
    expiresAt: string;
  } | null>(null);
  const effectiveExpiry = earliestVideoExpiry(
    expiresAt,
    projectExpiresAt,
    metadataExpiry?.assetId === assetId ? metadataExpiry.expiresAt : undefined,
  );
  const expired = useMediaExpired(effectiveExpiry);
  return (
    <div>
      <Button
        disabled={busy || expired}
        onClick={() => {
          if (isVideoExpired(effectiveExpiry)) return;
          setBusy(true);
          setError("");
          let downloadExpiry = effectiveExpiry;
          void videoApi
            .asset(assetId, undefined, reconciliationJobId, (value) => {
              downloadExpiry = earliestVideoExpiry(downloadExpiry, value);
              setMetadataExpiry({ assetId, expiresAt: value });
            })
            .then((blob) => {
              if (isVideoExpired(downloadExpiry)) return;
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${name.replace(/[^\p{L}\p{N}_ -]/gu, "").slice(0, 100) || "sandu-video"}.mp4`;
              a.click();
              window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
            })
            .catch((err) => setError(videoError(err, kk)))
            .finally(() => setBusy(false));
        }}
      >
        {busy ? <Spinner /> : <Icon name="download" />}
        {expired
          ? kk
            ? "Мерзімі аяқталды"
            : "Срок истёк"
          : kk
            ? "Жүктеу"
            : "Скачать MP4"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
