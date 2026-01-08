"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  playbackUrl: string;
  expirationTime: number;
  onTokenExpired?: () => void;
  className?: string;
}

export function VideoPlayer({
  playbackUrl,
  expirationTime,
  onTokenExpired,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Log playback URL for debugging (first 100 chars only)
  useEffect(() => {
    if (playbackUrl) {
      console.log("VideoPlayer: Initializing with playback URL:", {
        urlPreview: playbackUrl.substring(0, 100) + "...",
        urlLength: playbackUrl.length,
        expirationTime: new Date(expirationTime).toISOString(),
        timeUntilExpiration: expirationTime - Date.now(),
      });
    }
  }, [playbackUrl, expirationTime]);

  // Validate playbackUrl
  useEffect(() => {
    if (!playbackUrl || playbackUrl.trim() === "") {
      setError("URL для воспроизведения видео не предоставлен");
      console.error("VideoPlayer: playbackUrl is empty or missing");
    } else {
      // Clear error if URL is valid
      setError(null);
    }
  }, [playbackUrl]);

  useEffect(() => {
    // Check if token is expired
    const now = Date.now();
    if (now >= expirationTime) {
      setIsExpired(true);
      if (onTokenExpired) {
        onTokenExpired();
      }
      return;
    }

    // Set up expiration check interval
    const timeUntilExpiration = expirationTime - now;
    if (timeUntilExpiration > 0) {
      const expirationTimer = setTimeout(() => {
        setIsExpired(true);
        if (onTokenExpired) {
          onTokenExpired();
        }
      }, timeUntilExpiration);

      return () => clearTimeout(expirationTimer);
    }
  }, [expirationTime, onTokenExpired]);

  // Check URL accessibility before loading
  useEffect(() => {
    if (!playbackUrl || error) return;

    // Try to fetch the URL to check if it's accessible
    const checkUrl = async () => {
      try {
        const response = await fetch(playbackUrl, {
          method: "HEAD",
          mode: "no-cors", // Use no-cors to avoid CORS errors in check
        });
        console.log("VideoPlayer: URL accessibility check completed");
      } catch (err) {
        console.warn("VideoPlayer: URL check failed (this is expected for CORS-protected URLs):", err);
      }
    };

    checkUrl();
  }, [playbackUrl, error]);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    
    let errorMessage = "Ошибка воспроизведения видео";
    let isCorsError = false;
    
    if (error) {
      // Get detailed error information from video element
      let errorDetails = "";
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorDetails = "Воспроизведение было прервано";
          break;
        case error.MEDIA_ERR_NETWORK:
          errorDetails = "Ошибка сети при загрузке видео";
          isCorsError = true;
          break;
        case error.MEDIA_ERR_DECODE:
          errorDetails = "Ошибка декодирования видео";
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorDetails = "URL недоступен или заблокирован (возможно, CORS)";
          isCorsError = true;
          break;
        default:
          errorDetails = `Неизвестная ошибка (код: ${error.code})`;
      }
      
      errorMessage = errorDetails;
      
      console.error("Video playback error:", {
        code: error.code,
        message: error.message || errorDetails,
        playbackUrl: playbackUrl.substring(0, 100) + "...",
        fullUrl: playbackUrl,
        videoElement: video,
        networkState: video.networkState,
        readyState: video.readyState,
        isCorsError,
      });

      // Check network state for additional info
      if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        console.error("VideoPlayer: No source available - possible CORS or 403 error");
        isCorsError = true;
      }
    } else {
      console.error("Video playback error (no error object):", {
        event: e,
        playbackUrl: playbackUrl.substring(0, 100) + "...",
        fullUrl: playbackUrl,
        videoSrc: video.src,
        videoNetworkState: video.networkState,
        videoReadyState: video.readyState,
      });
    }
    
    if (isCorsError) {
      errorMessage = "Ошибка CORS: Bunny CDN не разрешает запросы с этого домена. Обратитесь к администратору для настройки CORS.";
    }
    
    setError(errorMessage);
  };

  if (isExpired) {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-slate-100 p-8 ${className}`}>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Токен просмотра истек</p>
          <p className="mt-1 text-xs text-slate-500">Пожалуйста, обновите страницу</p>
        </div>
      </div>
    );
  }

  if (!playbackUrl || playbackUrl.trim() === "") {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-red-50 p-8 ${className}`}>
        <div className="text-center">
          <p className="text-sm font-semibold text-red-700">
            URL для воспроизведения видео не предоставлен
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const isCorsError = error.includes("CORS") || error.includes("заблокирован");
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-red-50 p-8 ${className}`}>
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          {isCorsError && (
            <>
              <p className="mt-3 text-xs text-red-600">
                <strong>Решение:</strong> Необходимо настроить CORS в Bunny CDN для разрешения запросов с вашего домена.
              </p>
              <p className="mt-2 text-xs text-red-500">
                В панели Bunny CDN добавьте ваш домен (например, localhost:3000 для разработки) в список разрешенных источников.
              </p>
            </>
          )}
          <p className="mt-2 text-xs text-red-600">
            Проверьте консоль браузера (F12) для получения дополнительной информации
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-2xl bg-black overflow-hidden ${className}`} style={{ aspectRatio: "16/9" }}>
      <video
        ref={videoRef}
        src={playbackUrl}
        controls
        className="w-full h-full"
        onError={handleError}
        onLoadStart={() => console.log("VideoPlayer: Load started")}
        onLoadedData={() => console.log("VideoPlayer: Data loaded")}
        onLoadedMetadata={() => console.log("VideoPlayer: Metadata loaded")}
        onCanPlay={() => console.log("VideoPlayer: Can play")}
        onCanPlayThrough={() => console.log("VideoPlayer: Can play through")}
        playsInline
        preload="metadata"
      >
        Ваш браузер не поддерживает воспроизведение видео.
      </video>
    </div>
  );
}


