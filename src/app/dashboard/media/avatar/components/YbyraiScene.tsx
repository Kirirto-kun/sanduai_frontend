"use client";

import { AvatarScene } from "./AvatarScene";

interface YbyraiSceneProps {
  isSpeaking: boolean;
  responseText: string | null;
  audioUrl?: string | null;
}

export function YbyraiScene({ isSpeaking, responseText, audioUrl }: YbyraiSceneProps) {
  // Адаптируем интерфейс: isSpeaking -> isPlaying
  return <AvatarScene audioUrl={audioUrl} isPlaying={isSpeaking} />;
}
