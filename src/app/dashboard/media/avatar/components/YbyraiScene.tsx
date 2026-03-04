"use client";

import { AvatarVideo } from "./AvatarVideo";

interface YbyraiSceneProps {
  isSpeaking: boolean;
  /** После разговора — всегда listen_1. В простое — случайный listen. */
  useFixedListenVideo?: boolean;
  responseText: string | null;
  audioUrl?: string | null;
}

export function YbyraiScene({ isSpeaking, useFixedListenVideo }: YbyraiSceneProps) {
  return (
    <AvatarVideo
      isSpeaking={isSpeaking}
      useFixedListenVideo={useFixedListenVideo}
      avatarId="ybyrai"
    />
  );
}
