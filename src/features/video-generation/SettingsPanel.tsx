"use client";

import { useState } from "react";
import type { VideoDefaultProfiles, VideoModel, VideoSettings } from "./types";
import { modelDurations, settingsForModel } from "./model";
import { Field, Icon, fieldClass } from "./ui";
import {
  VIDEO_CAMERA_PRESETS,
  VIDEO_STYLE_PRESETS,
  videoPresetLabel,
} from "./presets";

const compactFieldClass = `${fieldClass} min-h-10 px-3 py-2 text-xs`;
const disclosureClass =
  "group self-start rounded-xl border border-slate-200 bg-white";
const summaryClass =
  "flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-slate-600 outline-none focus-visible:ring-3 focus-visible:ring-indigo-100 [&::-webkit-details-marker]:hidden";

export function SettingsPanel({
  settings,
  models,
  profiles,
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
  const [customFields, setCustomFields] = useState({
    style: false,
    camera: false,
  });
  const model = models.find((m) => m.id === settings.model_id);
  const update = <K extends keyof VideoSettings>(
    key: K,
    value: VideoSettings[K],
  ) => onChange({ ...settings, [key]: value });
  const durationOptions = model ? modelDurations(model) : [5, 8, 10, 15];
  const resolutions = model?.prices?.[inputMode]
    ? Object.keys(model.prices[inputMode])
    : (model?.resolutions ?? ["720p"]);
  const unavailable = (candidate: VideoModel) =>
    !candidate.available ||
    Boolean(
      candidate.available_modes &&
        !candidate.available_modes.includes(inputMode),
    ) ||
    (aspectLocked && !candidate.aspect_ratios.includes(settings.aspect_ratio));
  const modelHint = (candidate: VideoModel) =>
    candidate.id === profiles?.fast.model_id
      ? kk
        ? "үнемді"
        : "экономный"
      : candidate.id === profiles?.quality.model_id
        ? kk
          ? "егжей-тегжейлі"
          : "детальный"
        : kk
          ? "әмбебап"
          : "универсальный";
  const creativeSummary = [
    settings.style && videoPresetLabel("style", settings.style, kk),
    settings.camera && videoPresetLabel("camera", settings.camera, kk),
    settings.negative_prompt.trim() && (kk ? "шектеулер" : "исключения"),
  ]
    .filter(Boolean)
    .join(" · ");
  const speechSummary = !settings.generate_audio
    ? kk
      ? "Дыбыссыз"
      : "Без звука"
    : settings.speech_text.trim()
      ? `«${settings.speech_text.trim()}»`
      : settings.music.trim() || settings.sound_effects.trim()
        ? kk
          ? "Музыка және әсерлер"
          : "Музыка и эффекты"
        : kk
          ? "Дыбыспен"
          : "Со звуком";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,.8fr)_minmax(0,.8fr)_minmax(0,1fr)]">
        <Field label={kk ? "Модель" : "Модель"}>
          <select
            className={compactFieldClass}
            value={settings.model_id}
            onChange={(e) => {
              const next = models.find((m) => m.id === e.target.value);
              if (next) onChange(settingsForModel(settings, next, inputMode));
            }}
          >
            {models.map((candidate) => (
              <option
                key={candidate.id}
                value={candidate.id}
                disabled={unavailable(candidate)}
              >
                {candidate.label} · {modelHint(candidate)}
                {!candidate.available
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
      {aspectLocked && (
        <p className="text-[11px] leading-5 text-slate-500">
          {kk
            ? "Барлық сахна бір пішімде жасалады. Оны дайын видеоны жүктегенде өзгерте аласыз."
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

      <div className="grid items-start gap-2 sm:grid-cols-2">
        <details className={disclosureClass}>
          <summary className={summaryClass}>
            <span className="min-w-0">
              <span className="block font-semibold">
                {kk ? "Стиль және камера" : "Стиль и камера"}
              </span>
              {creativeSummary && (
                <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                  {creativeSummary}
                </span>
              )}
            </span>
            <Icon
              name="chevron"
              className="h-4 w-4 shrink-0 transition group-open:rotate-180"
            />
          </summary>
          <div className="space-y-4 border-t border-slate-100 px-3 py-4">
            {(["style", "camera"] as const).map((key) => {
              const presets =
                key === "style" ? VIDEO_STYLE_PRESETS : VIDEO_CAMERA_PRESETS;
              const isCustom =
                customFields[key] ||
                Boolean(
                  settings[key] &&
                    !presets.some((item) => item.value === settings[key]),
                );
              return (
                <div key={key} className="space-y-3">
                  <Field label={key === "style" ? "Стиль" : "Камера"}>
                    <select
                      className={fieldClass}
                      value={isCustom ? "__custom" : settings[key]}
                      onChange={(e) => {
                        const custom = e.target.value === "__custom";
                        setCustomFields((current) => ({
                          ...current,
                          [key]: custom,
                        }));
                        if (!custom) update(key, e.target.value);
                      }}
                    >
                      <option value="">Авто</option>
                      {presets.map((item) => (
                        <option key={item.value} value={item.value}>
                          {kk ? item.kk : item.ru}
                        </option>
                      ))}
                      <option value="__custom">
                        {kk ? "Өз нұсқам…" : "Свой вариант…"}
                      </option>
                    </select>
                  </Field>
                  {isCustom && (
                    <Field
                      label={
                        key === "style"
                          ? kk
                            ? "Стильді сипаттаңыз"
                            : "Опишите свой стиль"
                          : kk
                            ? "Камера қозғалысын сипаттаңыз"
                            : "Опишите движение камеры"
                      }
                    >
                      <input
                        className={fieldClass}
                        value={settings[key]}
                        maxLength={120}
                        onChange={(e) => update(key, e.target.value)}
                        placeholder={
                          key === "style"
                            ? kk
                              ? "Мысалы, акварель"
                              : "Например, акварельная анимация"
                            : kk
                              ? "Баяу жақындап, оңға бұрылу"
                              : "Медленно приблизиться и повернуть направо"
                        }
                      />
                    </Field>
                  )}
                </div>
              );
            })}
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-600">
                {kk ? "Қозғалыс күші" : "Сила движения"} ·{" "}
                {settings.motion_strength ?? 4}/10
              </p>
              {inputMode === "image" && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {[
                    { value: 2, min: 1, max: 3, ru: "Слабая", kk: "Баяу" },
                    { value: 5, min: 4, max: 6, ru: "Средняя", kk: "Орташа" },
                    {
                      value: 8,
                      min: 7,
                      max: 10,
                      ru: "Активная",
                      kk: "Белсенді",
                    },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className="min-h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 aria-pressed:border-indigo-300 aria-pressed:bg-indigo-50 aria-pressed:text-indigo-700"
                      aria-pressed={
                        (settings.motion_strength ?? 4) >= preset.min &&
                        (settings.motion_strength ?? 4) <= preset.max
                      }
                      onClick={() => update("motion_strength", preset.value)}
                    >
                      {kk ? preset.kk : preset.ru}
                    </button>
                  ))}
                </div>
              )}
              <input
                type="range"
                aria-label={kk ? "Қозғалыс күші" : "Сила движения"}
                min="1"
                max="10"
                value={settings.motion_strength ?? 4}
                onChange={(e) =>
                  update("motion_strength", Number(e.target.value))
                }
                className="w-full accent-indigo-600"
              />
            </div>
            <Field label={kk ? "Видеода болмауы керек" : "Что исключить"}>
              <textarea
                rows={2}
                className={fieldClass}
                value={settings.negative_prompt}
                onChange={(e) => update("negative_prompt", e.target.value)}
                maxLength={2000}
                placeholder={
                  kk
                    ? "Бұрмалану, жыпылықтау…"
                    : "Искажения, мерцание, лишние предметы…"
                }
              />
            </Field>
          </div>
        </details>

        <details className={disclosureClass}>
          <summary className={summaryClass}>
            <span className="min-w-0">
              <span className="flex items-center gap-2 font-semibold">
                <Icon name="volume" className="h-3.5 w-3.5" />
                {kk ? "Сөйлеу және дыбыс" : "Речь и звук"}
              </span>
              <span
                className="mt-0.5 block truncate text-[11px] text-slate-400"
                title={speechSummary}
              >
                {speechSummary}
              </span>
            </span>
            <Icon
              name="chevron"
              className="h-4 w-4 shrink-0 transition group-open:rotate-180"
            />
          </summary>
          <div className="space-y-4 border-t border-slate-100 px-3 py-4">
            <label className="flex items-center gap-3 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-indigo-600"
                checked={settings.generate_audio}
                onChange={(e) => update("generate_audio", e.target.checked)}
              />
              {kk ? "Дыбыспен жасау" : "Создать со звуком"}
            </label>
            <p className="text-[11px] leading-5 text-slate-500">
              {kk
                ? "Сөйлеуді, музыканы және әсерлерді видеомодельдің өзі жасайды. Дыбыссыз режим бағаны төмендетпеуі мүмкін."
                : "Реплики, музыку и эффекты создаст видеомодель. Режим без звука может стоить столько же."}
            </p>
            {settings.generate_audio && (
              <>
                <Field label={kk ? "Сөйлеу тілі" : "Язык речи"}>
                  <select
                    className={fieldClass}
                    value={settings.speech_language}
                    onChange={(e) => update("speech_language", e.target.value)}
                  >
                    <option value="">Авто</option>
                    <option value="kk">Қазақша</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </Field>
                <Field
                  label={kk ? "Дәл айтылатын мәтін" : "Точный текст речи"}
                  hint={
                    kk
                      ? "Дайын видеодағы сөйлеуді, әсіресе есімдер мен сандарды тексеріңіз: модель сөздерді өзгертуі не қайталауы мүмкін."
                      : "Проверьте речь в готовом видео, особенно имена и числа: модель может изменить или повторить слова."
                  }
                >
                  <textarea
                    rows={3}
                    className={fieldClass}
                    value={settings.speech_text}
                    onChange={(e) => update("speech_text", e.target.value)}
                    maxLength={4000}
                    placeholder={kk ? "«Сәлем! Бүгін…»" : "«Привет! Сегодня…»"}
                  />
                </Field>
                {settings.speech_text.length > settings.duration * 15 && (
                  <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                    {kk
                      ? "Мәтін осы сахнаға ұзақ болуы мүмкін. Ұзақтығын арттырыңыз немесе репликаны бірнеше сахнаға бөліңіз."
                      : "Текст может не уместиться. Увеличьте длительность или разделите реплику на несколько сцен."}
                  </p>
                )}
                {(
                  [
                    {
                      key: "voice_description",
                      label: kk ? "Дауыс және мәнер" : "Голос и манера речи",
                      placeholder: kk
                        ? "Жылы әйел дауысы, асықпай"
                        : "Тёплый женский голос, спокойный темп",
                    },
                    {
                      key: "music",
                      label: "Музыка",
                      placeholder: kk
                        ? "Жеңіл домбыра әуені"
                        : "Лёгкая мелодия домбры на фоне",
                    },
                    {
                      key: "sound_effects",
                      label: kk
                        ? "Қоршаған дыбыстар мен әсерлер"
                        : "Окружение и звуковые эффекты",
                      placeholder: kk
                        ? "Жел, шөптің сыбдыры"
                        : "Ветер, шелест травы, шаги",
                    },
                  ] as const
                ).map((field) => (
                  <Field key={field.key} label={field.label}>
                    <input
                      className={fieldClass}
                      value={settings[field.key]}
                      onChange={(e) => update(field.key, e.target.value)}
                      maxLength={1000}
                      placeholder={field.placeholder}
                    />
                  </Field>
                ))}
              </>
            )}
          </div>
        </details>
      </div>

      {profiles && (
        <details className="group">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded text-[11px] text-slate-400 outline-none hover:text-indigo-600 focus-visible:ring-3 focus-visible:ring-indigo-100 [&::-webkit-details-marker]:hidden">
            {kk ? "Ұсынылған баптаулар" : "Рекомендуемые настройки"}
            <Icon
              name="chevron"
              className="h-3 w-3 transition group-open:rotate-180"
            />
          </summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["fast", "quality"] as const).map((key) => {
              const profile = profiles[key];
              const preset = models.find((m) => m.id === profile.model_id);
              const selected =
                settings.model_id === profile.model_id &&
                settings.resolution === profile.resolution &&
                settings.duration === profile.duration &&
                settings.generate_audio === profile.generate_audio;
              return (
                <button
                  type="button"
                  key={key}
                  disabled={!preset || unavailable(preset)}
                  aria-pressed={selected}
                  onClick={() => {
                    if (preset)
                      onChange(
                        settingsForModel(
                          {
                            ...settings,
                            model_id: profile.model_id,
                            resolution: profile.resolution,
                            duration: profile.duration,
                            generate_audio: profile.generate_audio,
                            aspect_ratio: aspectLocked
                              ? settings.aspect_ratio
                              : profile.aspect_ratio,
                          },
                          preset,
                          inputMode,
                        ),
                      );
                  }}
                  className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-indigo-200 aria-pressed:border-indigo-200 aria-pressed:bg-indigo-50 aria-pressed:text-indigo-700 disabled:opacity-35"
                >
                  <span className="font-semibold">
                    {key === "fast"
                      ? kk
                        ? "Жылдам"
                        : "Быстро"
                      : kk
                        ? "Сапалы"
                        : "Качественно"}
                  </span>
                  <span className="ml-2 text-[11px] opacity-70">
                    {preset?.label ?? profile.model_id} · {profile.duration} сек
                    · {profile.resolution}
                  </span>
                </button>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
