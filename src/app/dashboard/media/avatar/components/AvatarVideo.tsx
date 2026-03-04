"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { getAvatarVideoPaths } from "./avatarVideoConfig";

interface AvatarVideoProps {
  isSpeaking: boolean;
  /** После разговора — всегда listen_1. В простое — случайное из listen. */
  useFixedListenVideo?: boolean;
  avatarId?: string;
}

const videoClass =
  "absolute inset-0 h-full w-full object-contain";

/**
 * Показывает видео аватара: "слушает" или "говорит".
 * Два видео всегда в DOM и уже воспроизводятся — переключается только видимость,
 * чтобы не было белой вспышки при смене src.
 */
export function AvatarVideo({
  isSpeaking,
  useFixedListenVideo = false,
  avatarId = "ybyrai",
}: AvatarVideoProps) {
  const listenRef = useRef<HTMLVideoElement>(null);
  const speakRef = useRef<HTMLVideoElement>(null);

  const { listenSrc, speakSrc } = useMemo(() => {
    const listen = getAvatarVideoPaths(avatarId, "listen", {
      forceFirstListen: useFixedListenVideo,
    });
    const speak = getAvatarVideoPaths(avatarId, "speak");
    return {
      listenSrc: `${listen.baseUrl}/${listen.file}`,
      speakSrc: `${speak.baseUrl}/${speak.file}`,
    };
  }, [avatarId, useFixedListenVideo]);

  const setMuted = (el: HTMLVideoElement | null) => {
    if (el) {
      el.muted = true;
      el.volume = 0;
    }
  };

  useEffect(() => {
    const listen = listenRef.current;
    const speak = speakRef.current;
    if (listen) {
      setMuted(listen);
      listen.load();
      listen.play().catch(() => {});
    }
    if (speak) {
      setMuted(speak);
      speak.load();
      speak.play().catch(() => {});
    }
  }, [listenSrc, speakSrc]);

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <video
        ref={(el) => {
          listenRef.current = el;
          setMuted(el);
        }}
        src={listenSrc}
        className={videoClass}
        style={{ opacity: isSpeaking ? 0 : 1, zIndex: isSpeaking ? 0 : 1 }}
        loop
        muted
        playsInline
        autoPlay
        aria-hidden={isSpeaking}
      />
      <video
        ref={(el) => {
          speakRef.current = el;
          setMuted(el);
        }}
        src={speakSrc}
        className={videoClass}
        style={{ opacity: isSpeaking ? 1 : 0, zIndex: isSpeaking ? 1 : 0 }}
        loop
        muted
        playsInline
        autoPlay
        aria-hidden={!isSpeaking}
        aria-label={isSpeaking ? "Аватар говорит" : undefined}
      />
    </div>
  );
}
