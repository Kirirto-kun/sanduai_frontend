"use client";

import { useEffect, useState } from "react";

interface VideoPlayerProps {
  embedUrl: string;
  expirationTime: number; // Unix timestamp in seconds
  onTokenExpired?: () => void;
  className?: string;
}

export function VideoPlayer({
  embedUrl,
  expirationTime,
  onTokenExpired,
  className = "",
}: VideoPlayerProps) {
  const [isExpired, setIsExpired] = useState(false);
  const [failedEmbedUrl, setFailedEmbedUrl] = useState<string | null>(null);
  const error = failedEmbedUrl === embedUrl ? "Ошибка загрузки видео плеера" : null;

  // Check if token is expired
  useEffect(() => {
    const checkExpiration = () => {
      const now = Math.floor(Date.now() / 1000); // Convert to seconds
      if (now >= expirationTime) {
        setIsExpired(true);
        if (onTokenExpired) {
          onTokenExpired();
        }
      }
    };

    // Check immediately
    checkExpiration();

    // Set up expiration check interval (check every minute)
    const interval = setInterval(checkExpiration, 60000);

    // Also set up a timeout for when the token will expire
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = expirationTime - now;
    if (timeUntilExpiration > 0) {
      const expirationTimer = setTimeout(() => {
        setIsExpired(true);
        if (onTokenExpired) {
          onTokenExpired();
        }
      }, timeUntilExpiration * 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(expirationTimer);
      };
    }

    return () => clearInterval(interval);
  }, [expirationTime, onTokenExpired]);

  if (isExpired) {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-slate-100 p-8 ${className}`}>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Срок просмотра истёк</p>
          <p className="mt-1 text-xs text-slate-500">Обновляем видео…</p>
        </div>
      </div>
    );
  }

  if (!embedUrl || embedUrl.trim() === "") {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-red-50 p-8 ${className}`}>
        <div className="text-center">
          <p className="text-sm font-semibold text-red-700">
            Не удалось открыть видео. Попробуйте ещё раз позже.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-red-50 p-8 ${className}`}>
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-2xl bg-black overflow-hidden ${className}`} style={{ aspectRatio: "16/9" }}>
      <iframe
        src={embedUrl}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        className="w-full h-full border-0"
        title="Video player"
        onError={() => {
          setFailedEmbedUrl(embedUrl);
        }}
      />
    </div>
  );
}
