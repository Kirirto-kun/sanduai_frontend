import type {
  VideoJob,
  VideoCatalog,
  VideoModel,
  VideoProject,
  VideoScene,
  VideoSettings,
  VideoVersion,
} from "./types";

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  model_id: "grok-imagine-video-1.5-lite",
  resolution: "720p",
  duration: 5,
  aspect_ratio: "16:9",
  generate_audio: true,
  speech_language: "ru",
  speech_text: "",
  voice_description: "",
  music: "",
  sound_effects: "",
  style: "",
  style_mode: "auto",
  camera: "",
  motion_strength: null,
  negative_prompt: "",
};

/** Only an explicit style selection survives; retired controls stay inactive. */
export function promptVideoSettings(settings: VideoSettings): VideoSettings {
  const style = settings.style_mode === "selected" ? settings.style.trim() : "";
  return {
    ...settings,
    generate_audio: true,
    style,
    style_mode: style ? "selected" : "auto",
    camera: "",
    motion_strength: null,
    negative_prompt: "",
    voice_description: "",
    music: "",
    sound_effects: "",
  };
}
export const ACTIVE_VIDEO_STATUSES = new Set([
  "queued",
  "pending",
  "reserved",
  "submitting",
  "submission_unknown",
  "uncertain",
  "refunding",
  "processing",
  "generating",
  "downloading",
  "saving",
  "running",
  "assembling",
  "cancelling",
]);
export function isActiveVideoJob(job: Pick<VideoJob, "status">) {
  return ACTIVE_VIDEO_STATUSES.has(job.status);
}
export function utcTimestamp(value: string): number {
  return Date.parse(
    /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`,
  );
}
export function isVideoExpired(
  value?: string | null,
  now = Date.now(),
): boolean {
  return Boolean(value && utcTimestamp(value) <= now);
}
export function earliestVideoExpiry(
  ...values: Array<string | null | undefined>
): string | undefined {
  return values
    .filter(
      (value): value is string =>
        Boolean(value) && Number.isFinite(utcTimestamp(value!)),
    )
    .sort((a, b) => utcTimestamp(a) - utcTimestamp(b))[0];
}
export function expiryLabel(
  value: string,
  kk = false,
  now = Date.now(),
): string {
  const remaining = utcTimestamp(value) - now;
  if (!Number.isFinite(remaining)) return "—";
  if (remaining <= 0) return kk ? "Мерзімі аяқталды" : "Срок истёк";
  const minutes = Math.ceil(remaining / 60_000);
  const h = Math.floor(minutes / 60),
    m = minutes % 60;
  return h > 0
    ? `${h} ${kk ? "сағ" : "ч"} ${m} ${kk ? "мин" : "мин"}`
    : `${m} мин`;
}
export function money(value: number | string | null | undefined): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "—";
}
export function selectedVersion(
  scene?: VideoScene | null,
): VideoVersion | undefined {
  return scene?.versions.find((v) => v.id === scene.selected_version_id);
}
export function versionAssetId(
  version?: VideoVersion | null,
): string | undefined {
  return version?.asset === null
    ? undefined
    : (version?.asset_id ?? version?.asset?.id ?? undefined);
}
export function sceneDuration(scene: VideoScene): number {
  const version = selectedVersion(scene);
  return version
    ? Math.max(
        0,
        Number(
          scene.trim_out ??
            version.asset?.duration ??
            version.duration ??
            version.settings.duration ??
            scene.settings.duration,
        ) - Number(scene.trim_in ?? 0),
      )
    : Number(scene.settings.duration);
}
export function projectDuration(project?: VideoProject | null): number {
  return (
    project?.scenes
      .filter((s) => s.included)
      .reduce((total, s) => total + sceneDuration(s), 0) ?? 0
  );
}
export function modelDurations(model: VideoModel): number[] {
  if (model.durations?.length) return model.durations;
  return Array.from(
    {
      length:
        Math.floor(
          (model.max_duration - model.min_duration) /
            (model.duration_step ?? 1),
        ) + 1,
    },
    (_, i) => model.min_duration + i * (model.duration_step ?? 1),
  );
}
export function settingsForModel(
  settings: VideoSettings,
  model: VideoModel,
  inputMode = "text",
): VideoSettings {
  const pricedResolutions = model.prices?.[inputMode]
    ? Object.keys(model.prices[inputMode])
    : [];
  const resolutions = pricedResolutions.length
    ? pricedResolutions
    : model.resolutions;
  const durations = modelDurations(model)
    .slice()
    .sort((a, b) => a - b);
  const duration = durations.includes(settings.duration)
    ? settings.duration
    : (durations.filter((d) => d <= settings.duration).pop() ?? durations[0]);
  return {
    ...settings,
    model_id: model.id,
    resolution: resolutions.includes(settings.resolution)
      ? settings.resolution
      : resolutions.includes("768p")
        ? "768p"
        : resolutions.includes("720p")
          ? "720p"
          : resolutions[0],
    duration,
    aspect_ratio: model.aspect_ratios.includes(settings.aspect_ratio)
      ? settings.aspect_ratio
      : model.aspect_ratios[0],
  };
}
/** Use server-owned defaults; a stale/disabled preset cannot select an unavailable model. */
export function catalogDefaultSettings(
  catalog: VideoCatalog,
  language = "ru",
): VideoSettings {
  const profile = catalog.default_profiles?.fast;
  const model = profile
    ? catalog.models.find((m) => m.id === profile.model_id)
    : catalog.models.find((m) => m.available);
  const settings = promptVideoSettings({
    ...DEFAULT_VIDEO_SETTINGS,
    ...profile,
    speech_language: language,
    speech_text: "",
    style: "",
    style_mode: "auto",
  });
  return model ? settingsForModel(settings, model) : settings;
}
export function draftChanged(scene: VideoScene): boolean {
  if (scene.draft_changed !== undefined) return scene.draft_changed;
  const version = selectedVersion(scene);
  if (!version) return false;
  if (version.prompt !== undefined && version.prompt !== scene.prompt)
    return true;
  return Object.entries(version.settings ?? {}).some(
    ([key, value]) => scene.settings[key as keyof VideoSettings] !== value,
  );
}
export function validateTrim(
  start: number,
  end: number,
  duration: number,
): boolean {
  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    start >= 0 &&
    end > start &&
    end <= duration
  );
}
export function videoError(error: unknown, kk = false): string {
  const status =
    typeof error === "object" && error && "status" in error
      ? Number(error.status)
      : 0;
  const details =
    typeof error === "object" && error && "details" in error
      ? error.details
      : null;
  const detail =
    details && typeof details === "object" && "detail" in details
      ? details.detail
      : null;
  const code =
    detail && typeof detail === "object" && "code" in detail
      ? detail.code
      : null;
  if (code === "VIDEO_CONCURRENCY_LIMIT")
    return kk
      ? "Сіздің бірнеше видеоңыз жасалып жатыр. Бірі аяқталғанша басқа сахналарды өңдеуге болады."
      : "Ваши видео уже создаются. Пока одна из задач не завершится, можно редактировать другие сцены.";
  if (code === "QUOTE_EXPIRED" || code === "QUOTE_CHANGED")
    return kk
      ? "Баға немесе параметрлер өзгерді. Жаңартылған бағаны тексеріп, қайта растаңыз."
      : "Цена или параметры изменились. Проверьте обновлённую стоимость и подтвердите запуск заново.";
  if (status === 402)
    return kk
      ? "Токен жеткіліксіз. Балансты толтырып, қайталаңыз."
      : "Недостаточно токенов. Пополните баланс и повторите.";
  if (status === 409)
    return kk
      ? "Деректер өзгерді. Жобаны жаңартыңыз; ақылы сұрау қайталанбайды."
      : "Данные изменились. Обновите проект; платный запрос не дублируется.";
  if (status === 410 || status === 404)
    return kk
      ? "Материалдың сақтау мерзімі аяқталды немесе ол жойылды."
      : "Материал удалён или срок его хранения истёк.";
  if (status === 429)
    return kk
      ? "Сұрау көп. Біраздан кейін қайталаңыз; жоба сақталды."
      : "Слишком много запросов. Повторите чуть позже; проект сохранён.";
  if (status === 422)
    return kk
      ? "Параметрлерді тексеріңіз. Формат өзгерсе, суретті қайта дайындаңыз; дыбыс пен ұзақтық модельге сәйкес болуы тиіс."
      : "Проверьте параметры. После смены формата заново подготовьте изображение; длительность и качество должны поддерживаться моделью.";
  if (status === 503)
    return kk
      ? "Генерация уақытша қолжетімсіз. Біраздан кейін қайталаңыз."
      : "Генерация временно недоступна. Повторите чуть позже.";
  return kk
    ? "Сервермен байланыс үзілді. Жоба экранда қалады. Байланысты тексеріп, қайталаңыз."
    : "Не удалось связаться с сервером. Черновик остаётся на экране. Проверьте соединение и повторите.";
}
