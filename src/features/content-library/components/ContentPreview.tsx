"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchAdminLibraryPreviewBlob, resolveLibraryUrl } from "../api";
import { MATERIAL_TYPE_CONFIG, localize, type UiLanguage } from "../config";
import type { MaterialType, PreviewStatus } from "../types";

type ContentPreviewProps = {
  src?: string | null;
  alt: string;
  materialType: MaterialType;
  previewStatus?: PreviewStatus;
  language: UiLanguage;
  sizes?: string;
  priority?: boolean;
  className?: string;
  authenticated?: boolean;
  fit?: "cover" | "contain";
};

export function ContentPreview({
  src,
  alt,
  materialType,
  previewStatus,
  language,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  className = "aspect-video",
  authenticated = false,
  fit = "cover",
}: ContentPreviewProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [privatePreview, setPrivatePreview] = useState<{
    path: string;
    objectUrl: string | null;
    failed: boolean;
  } | null>(null);

  useEffect(() => {
    if (!authenticated || !src) return;
    const controller = new AbortController();
    let live = true;
    let objectUrl: string | null = null;

    void fetchAdminLibraryPreviewBlob(src, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (!live) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
          return;
        }
        setPrivatePreview({ path: src, objectUrl, failed: false });
      })
      .catch((error) => {
        if (live && !(error instanceof DOMException && error.name === "AbortError")) {
          setPrivatePreview({ path: src, objectUrl: null, failed: true });
        }
      });

    return () => {
      live = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [authenticated, src]);

  const config = MATERIAL_TYPE_CONFIG[materialType];
  const currentPrivatePreview = privatePreview?.path === src ? privatePreview : null;
  const resolvedSource = authenticated
    ? currentPrivatePreview?.objectUrl ?? null
    : src
      ? resolveLibraryUrl(src)
      : null;
  const failed = authenticated ? currentPrivatePreview?.failed === true : failedUrl === src;
  const canShowImage = Boolean(src && resolvedSource && !failed);
  const isLoadingPrivatePreview = Boolean(
    authenticated && src && !currentPrivatePreview?.objectUrl && !currentPrivatePreview?.failed,
  );
  const isProcessing = previewStatus === "pending" || previewStatus === "processing";

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {isLoadingPrivatePreview ? (
        <div className="absolute inset-0 animate-pulse bg-slate-200" role="status" aria-label={language === "kk" ? "Превью жүктелуде" : "Загрузка превью"} />
      ) : canShowImage && src && resolvedSource ? (
        <Image
          src={resolvedSource}
          alt={alt}
          fill
          priority={priority}
          unoptimized
          sizes={sizes}
          className={fit === "contain" ? "object-contain" : "object-cover"}
          onError={() => {
            if (authenticated) {
              setPrivatePreview({ path: src, objectUrl: null, failed: true });
            } else {
              setFailedUrl(src);
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-emerald-50 px-4 text-center">
          <span aria-hidden="true" className="text-4xl">
            {config.icon}
          </span>
          <span className="mt-2 text-xs font-semibold text-slate-600">
            {isProcessing
              ? language === "kk"
                ? "Превью дайындалуда"
                : "Превью создаётся"
              : localize(config.label, language)}
          </span>
        </div>
      )}
    </div>
  );
}
