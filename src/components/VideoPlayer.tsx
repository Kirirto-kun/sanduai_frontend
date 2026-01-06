"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  bunnyVideoId: string;
  watchToken: string;
  expirationTime: number;
  onTokenExpired?: () => void;
  className?: string;
}

export function VideoPlayer({
  bunnyVideoId,
  watchToken,
  expirationTime,
  onTokenExpired,
  className = "",
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

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

    // Load Bunny Video Player script
    const scriptId = "bunny-player-script";
    if (document.getElementById(scriptId)) {
      initializePlayer();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://iframe.mediadelivery.net/embed/player.js";
    script.async = true;
    script.onload = () => {
      initializePlayer();
    };
    script.onerror = () => {
      setError("Failed to load video player");
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying player:", e);
        }
      }
    };
  }, [bunnyVideoId, watchToken, expirationTime, onTokenExpired]);

  const initializePlayer = () => {
    if (!containerRef.current) return;

    try {
      // Clear container
      containerRef.current.innerHTML = "";

      // Create iframe for Bunny Video Player
      // Using the embed URL format: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}?token={token}
      // Note: We need libraryId from environment or API, but for now we'll use a placeholder
      // The actual implementation should get libraryId from the API response or config
      const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "";
      const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${bunnyVideoId}?token=${watchToken}`;

      const iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.allow = "accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;";
      iframe.allowFullscreen = true;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.style.borderRadius = "0.5rem";

      containerRef.current.appendChild(iframe);
    } catch (err) {
      console.error("Error initializing player:", err);
      setError("Failed to initialize video player");
    }
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

  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-red-50 p-8 ${className}`}>
        <div className="text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl bg-black ${className}`}
      style={{ aspectRatio: "16/9" }}
    />
  );
}

