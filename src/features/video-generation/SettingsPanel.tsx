"use client";

import type { VideoDefaultProfiles, VideoModel, VideoSettings } from "./types";
import { modelDurations, settingsForModel } from "./model";
import { VIDEO_STYLE_PRESETS } from "./presets";
import { Field, fieldClass } from "./ui";

const compactFieldClass = `${fieldClass} min-h-11 px-3 py-2 text-xs`;

export function SettingsPanel({
  settings,
  models,
  onChange,
  kk = false,
  aspectLocked = false,
  inputMode = "text",
}: {
  settings: VideoSettings;
  models: VideoModel[];
  profiles?: VideoDefaultProfiles;
  onChange: (settings: VideoSettings) => void;
  kk?: boolean;
  aspectLocked?: boolean;
  inputMode?: "text" | "image";
}) {
  const model = models.find((candidate) => candidate.id === settings.model_id);
  const update = <K extends keyof VideoSettings>(
    key: K,
    value: VideoSettings[K],
  ) => onChange({ ...settings, [key]: value });
  const durationOptions = model ? modelDurations(model) : [5, 8, 10, 15];
  const pricedResolutions = Object.keys(model?.prices?.[inputMode] ?? {});
  const resolutions = pricedResolutions.length
    ? pricedResolutions
    : (model?.resolutions ?? ["720p"]);
  const unavailable = (candidate: VideoModel) =>
    !candidate.available ||
    Boolean(
      candidate.available_modes &&
        !candidate.available_modes.includes(inputMode),
    ) ||
    (aspectLocked && !candidate.aspect_ratios.includes(settings.aspect_ratio));
  const selectedStyle =
    settings.style_mode === "selected" ? settings.style : "";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,.8fr)_minmax(0,.8fr)_minmax(0,1fr)]">
        <div className="col-span-2 lg:col-span-1">
          <Field label={kk ? "Видео тілі" : "Язык видео"}>
            <select
              className={compactFieldClass}
              value={settings.speech_language}
              onChange={(e) => update("speech_language", e.target.value)}
            >
              <option value="ru">Русский</option>
              <option value="kk">Қазақша</option>
              <option value="en">English</option>
              <option value="">
                {kk ? "Сипаттамадан анықтау" : "Как в описании"}
              </option>
              {!["", "ru", "kk", "en"].includes(settings.speech_language) && (
                <option value={settings.speech_language}>
                  {settings.speech_language}
                </option>
              )}
            </select>
          </Field>
        </div>
        <Field label="Модель">
          <select
            className={compactFieldClass}
            value={settings.model_id}
            onChange={(e) => {
              const next = models.find(
                (candidate) => candidate.id === e.target.value,
              );
              if (next) onChange(settingsForModel(settings, next, inputMode));
            }}
          >
            {models.map((candidate) => (
              <option
                key={candidate.id}
                value={candidate.id}
                disabled={unavailable(candidate)}
              >
                {candidate.label}
                {unavailable(candidate)
                  ? kk
                    ? " · қолжетімсіз"
                    : " · недоступна"
                  : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label={kk ? "Ұзақтығы" : "Длительность"}>
          <select
            className={compactFieldClass}
            value={settings.duration}
            onChange={(e) => update("duration", Number(e.target.value))}
          >
            {durationOptions.map((duration) => (
              <option key={duration} value={duration}>
                {duration} сек
              </option>
            ))}
          </select>
        </Field>
        <Field label={kk ? "Сапа" : "Качество"}>
          <select
            className={compactFieldClass}
            value={settings.resolution}
            onChange={(e) => update("resolution", e.target.value)}
          >
            {resolutions.map((resolution) => (
              <option key={resolution} value={resolution}>
                {resolution}
                {resolution === "720p"
                  ? " · HD"
                  : resolution === "1080p"
                    ? " · Full HD"
                    : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label={kk ? "Пішім" : "Формат"}>
          <select
            className={compactFieldClass}
            value={settings.aspect_ratio}
            disabled={aspectLocked}
            onChange={(e) => update("aspect_ratio", e.target.value)}
          >
            {(model?.aspect_ratios ?? ["16:9", "9:16", "1:1"]).map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
                {ratio === "16:9"
                  ? kk
                    ? " · көлденең"
                    : " · горизонтальный"
                  : ratio === "9:16"
                    ? kk
                      ? " · тік"
                      : " · вертикальный"
                    : ratio === "1:1"
                      ? kk
                        ? " · шаршы"
                        : " · квадрат"
                      : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="max-w-xs">
        <Field label={kk ? "Видео стилі" : "Стиль видео"}>
          <select
            className={compactFieldClass}
            value={selectedStyle}
            onChange={(e) =>
              onChange({
                ...settings,
                style: e.target.value,
                style_mode: e.target.value ? "selected" : "auto",
              })
            }
          >
            <option value="">Авто</option>
            {VIDEO_STYLE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {kk ? preset.kk : preset.ru}
              </option>
            ))}
            {selectedStyle &&
              !VIDEO_STYLE_PRESETS.some(
                (preset) => preset.value === selectedStyle,
              ) && <option value={selectedStyle}>{selectedStyle}</option>}
          </select>
        </Field>
      </div>
      {aspectLocked && (
        <p className="text-[11px] leading-5 text-slate-500">
          {kk
            ? "Барлық көрініс бір пішімде жасалады. Оны дайын видеоны жүктегенде өзгерте аласыз."
            : "Все сцены создаются в одном формате. Его можно изменить при скачивании готового видео."}
        </p>
      )}
      {model?.upscaled_resolutions?.includes(settings.resolution) && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
          {settings.resolution} —{" "}
          {kk
            ? "модель нәтижесін үлкейту (upscale)."
            : "увеличение результата модели (upscale)."}
        </p>
      )}
    </div>
  );
}
