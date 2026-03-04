/**
 * Конфиг видео для аватаров.
 * Для каждого аватара — списки файлов в папках listen и speak;
 * при показе выбирается случайное видео из списка.
 * Добавьте сюда новые аватары и файлы по мере появления.
 */
export const AVATAR_VIDEOS: Record<
  string,
  { listen: string[]; speak: string[] }
> = {
  ybyrai: {
    listen: ["listen_1.mp4"],
    speak: ["speak_1.mp4"],
  },
};

const AVATAR_BASE = "/avatars";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type GetAvatarVideoOptions = {
  /** После разговора — всегда первый файл (listen_1). В простое — случайный. */
  forceFirstListen?: boolean;
};

export function getAvatarVideoPaths(
  avatarId: string,
  mode: "listen" | "speak",
  options?: GetAvatarVideoOptions
): { baseUrl: string; file: string } {
  const avatar = AVATAR_VIDEOS[avatarId] ?? AVATAR_VIDEOS.ybyrai;
  const effectiveId = AVATAR_VIDEOS[avatarId] ? avatarId : "ybyrai";
  const list = mode === "listen" ? avatar.listen : avatar.speak;
  const defaultFile = mode === "listen" ? "listen_1.mp4" : "speak_1.mp4";
  const file =
    list.length === 0
      ? defaultFile
      : mode === "listen" && options?.forceFirstListen
        ? list[0]
        : pickRandom(list);
  return { baseUrl: `${AVATAR_BASE}/${effectiveId}/${mode}`, file };
}
