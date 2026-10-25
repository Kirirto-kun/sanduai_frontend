"use client";
import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  videoApi,
  type VideoAdminConfig,
  type VideoAdminConfigPatch,
  type VideoAvailability,
  type VideoProviderId,
  type VideoProviderProbe,
  type VideoTariff,
} from "./api";
import {
  adminSettingsDraft,
  adminStatusText,
  initialModelTariff,
} from "./admin-settings";
import { modelDurations, money, settingsForModel, videoError } from "./model";
import { Button, Field, Icon, Spinner, fieldClass } from "./ui";

const statuses: VideoAvailability[] = ["enabled", "paused", "disabled"];
const sectionClass = "rounded-3xl border border-slate-200 bg-white p-5 sm:p-6";
type NumericKey =
  | "user_concurrency"
  | "upload_limit_mb"
  | "scene_limit"
  | "project_duration_limit"
  | "planning_requests_per_hour"
  | "worker_concurrency"
  | "xai_concurrency"
  | "fal_concurrency"
  | "export_concurrency"
  | "queue_limit"
  | "storage_limit_mb"
  | "user_storage_limit_mb"
  | "planning_max_input_characters"
  | "planning_max_output_tokens";
const numericFields: Array<{
  key: NumericKey;
  ru: string;
  kk: string;
  min: number;
  max: number;
}> = [
  {
    key: "user_concurrency",
    ru: "Задач на пользователя",
    kk: "Бір пайдаланушының тапсырмалары",
    min: 1,
    max: 10,
  },
  {
    key: "worker_concurrency",
    ru: "Генераций одновременно",
    kk: "Бір мезгілдегі генерациялар",
    min: 1,
    max: 16,
  },
  {
    key: "xai_concurrency",
    ru: "Задач xAI одновременно",
    kk: "Бір мезгілдегі xAI тапсырмалары",
    min: 1,
    max: 16,
  },
  {
    key: "fal_concurrency",
    ru: "Задач fal одновременно",
    kk: "Бір мезгілдегі fal тапсырмалары",
    min: 1,
    max: 16,
  },
  {
    key: "export_concurrency",
    ru: "Сборок MP4 одновременно",
    kk: "Бір мезгілдегі MP4 жинақтары",
    min: 1,
    max: 4,
  },
  {
    key: "queue_limit",
    ru: "Задач в очереди",
    kk: "Кезектегі тапсырмалар",
    min: 1,
    max: 1000,
  },
  {
    key: "scene_limit",
    ru: "Сцен в проекте",
    kk: "Жобадағы сахналар",
    min: 1,
    max: 20,
  },
  {
    key: "project_duration_limit",
    ru: "Длина проекта, секунд",
    kk: "Жоба ұзақтығы, секунд",
    min: 15,
    max: 300,
  },
  {
    key: "upload_limit_mb",
    ru: "Входное изображение, МБ",
    kk: "Кіріс суреті, МБ",
    min: 1,
    max: 20,
  },
  {
    key: "storage_limit_mb",
    ru: "Общее хранилище, МБ",
    kk: "Жалпы сақтау орны, МБ",
    min: 256,
    max: 1048576,
  },
  {
    key: "user_storage_limit_mb",
    ru: "Хранилище пользователя, МБ",
    kk: "Пайдаланушы сақтау орны, МБ",
    min: 256,
    max: 102400,
  },
  {
    key: "planning_requests_per_hour",
    ru: "LLM-запросов в час на пользователя",
    kk: "Пайдаланушының сағатына LLM сұраулары",
    min: 1,
    max: 100,
  },
  {
    key: "planning_max_input_characters",
    ru: "Вход служебного LLM, символов",
    kk: "Қызметтік LLM кірісі, таңба",
    min: 100,
    max: 20000,
  },
  {
    key: "planning_max_output_tokens",
    ru: "Ответ служебного LLM, токенов модели",
    kk: "Қызметтік LLM жауабы, модель токендері",
    min: 256,
    max: 7000,
  },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={sectionClass}>
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      {description && (
        <p className="mt-2 text-xs leading-6 text-slate-500">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AdminSettings({
  config,
  kk,
}: {
  config: VideoAdminConfig;
  kk: boolean;
}) {
  const client = useQueryClient();
  const [draft, setDraft] = useState(() => adminSettingsDraft(config));
  const [savedDraft, setSavedDraft] = useState(() =>
    JSON.stringify(adminSettingsDraft(config)),
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [probes, setProbes] = useState<
    Partial<Record<VideoProviderId, VideoProviderProbe>>
  >({});
  const [probing, setProbing] = useState<VideoProviderId | null>(null);
  const [probeError, setProbeError] = useState<
    Partial<Record<VideoProviderId, string>>
  >({});
  const t = (ru: string, kz: string) => (kk ? kz : ru);
  const templates = (config.adapter_templates ?? config.models).map(
    (template) => ({
      ...config.models.find((model) => model.id === template.id),
      ...template,
      label: template.label ?? template.name ?? template.id,
    }),
  );
  const registry = draft.model_registry ?? [];
  const models = templates.filter((m) => registry.some((r) => r.id === m.id));
  const dirty = JSON.stringify(draft) !== savedDraft;
  const stale = (config.revision ?? 0) > (draft.expected_revision ?? 0);
  function update(patch: Partial<VideoAdminConfigPatch>) {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  }
  function maxFor(field: (typeof numericFields)[number]) {
    return Math.min(
      field.max,
      config.deployment_limits?.[field.key] ?? field.max,
    );
  }
  const invalidProfiles = Object.values(draft.default_profiles ?? {}).some(
    (profile) => {
      const caps = draft.capability_overrides?.[profile.model_id];
      return (
        (caps?.resolutions && !caps.resolutions.includes(profile.resolution)) ||
        (caps?.durations && !caps.durations.includes(profile.duration)) ||
        (caps?.aspect_ratios &&
          !caps.aspect_ratios.includes(profile.aspect_ratio))
      );
    },
  );
  const invalid =
    invalidProfiles ||
    numericFields.some((field) => {
      const value = draft[field.key];
      return (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < field.min ||
        value > maxFor(field)
      );
    }) ||
    Number(draft.user_storage_limit_mb) > Number(draft.storage_limit_mb);
  async function persist() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const result = await videoApi.updateAdminConfig(draft);
      const next = adminSettingsDraft(result);
      setDraft(next);
      setSavedDraft(JSON.stringify(next));
      setSaved(true);
      void client.invalidateQueries({ queryKey: ["video-catalog"] });
      void client.invalidateQueries({ queryKey: ["video-admin-config"] });
      void client.invalidateQueries({ queryKey: ["video-admin-audit"] });
    } catch (err) {
      const conflict =
        typeof err === "object" && err && "status" in err && err.status === 409;
      setError(
        conflict
          ? t(
              "Настройки изменил другой администратор. Загрузите сохранённую версию и повторите свои изменения.",
              "Баптауларды басқа әкімші өзгертті. Сақталған нұсқаны жүктеп, өзгерістеріңізді қайта енгізіңіз.",
            )
          : videoError(err, kk),
      );
    } finally {
      setBusy(false);
    }
  }
  async function probe(provider: VideoProviderId) {
    setProbing(provider);
    setProbeError((current) => ({ ...current, [provider]: undefined }));
    try {
      const result = await videoApi.adminCheckAccess(provider);
      setProbes((current) => ({ ...current, [provider]: result }));
      void client.invalidateQueries({ queryKey: ["video-admin-audit"] });
    } catch (err) {
      setProbeError((current) => ({
        ...current,
        [provider]: videoError(err, kk),
      }));
    } finally {
      setProbing(null);
    }
  }
  async function reloadSaved() {
    setBusy(true);
    setError("");
    try {
      const latest = await videoApi.adminConfig();
      const next = adminSettingsDraft(latest);
      setDraft(next);
      setSavedDraft(JSON.stringify(next));
      setSaved(false);
      void client.invalidateQueries({ queryKey: ["video-admin-config"] });
    } catch (err) {
      setError(videoError(err, kk));
    } finally {
      setBusy(false);
    }
  }
  function tariff(key: string, value: VideoTariff) {
    update({ tariffs: { ...draft.tariffs, [key]: value } });
  }
  const fx = config.exchange_rate;
  return (
    <fieldset
      disabled={busy}
      aria-label={t("Настройки видеогенерации", "Видеогенерация баптаулары")}
      className="min-w-0 space-y-5"
    >
      <Section
        title={t(
          "Себестоимость и официальный курс",
          "Өзіндік құн және ресми бағам",
        )}
        description={t(
          "1 токен = 1 ₸ API-себестоимости. USD × официальный курс НБК, точность 0,01. Наценки и коэффициента качества нет. Курс фиксируется в подтверждаемой котировке.",
          "1 токен = 1 ₸ API өзіндік құны. USD × ҚРҰБ ресми бағамы, дәлдігі 0,01. Үстеме және сапа коэффициенті жоқ. Бағам расталатын есепте бекітіледі.",
        )}
      >
        <div
          className={`rounded-xl p-4 text-xs leading-6 ${fx?.available ? "bg-teal-50 text-teal-900" : "bg-amber-50 text-amber-900"}`}
        >
          {fx?.available ? (
            <p>
              <strong>1 USD = {money(fx.rate_kzt_per_usd)} ₸</strong> ·{" "}
              {t("Дата курса", "Бағам күні")}: {fx.rate_date}
            </p>
          ) : (
            <p>
              {t(
                "Свежий официальный курс сейчас недоступен. Новые котировки требуют подтверждённого курса.",
                "Жаңа ресми бағам қазір қолжетімсіз. Жаңа баға есебі расталған бағамды қажет етеді.",
              )}
            </p>
          )}
          {fx?.source &&
            (/^https:\/\/(?:www\.)?nationalbank\.kz\//.test(fx.source) ? (
              <a
                className="break-all underline"
                href={fx.source}
                target="_blank"
                rel="noreferrer"
              >
                {t("Источник НБК", "ҚРҰБ дереккөзі")}
              </a>
            ) : (
              <p>{fx.source}</p>
            ))}
        </div>
      </Section>
      <Section
        title={t(
          "Провайдеры и защищённые ключи",
          "Провайдерлер және қорғалған кілттер",
        )}
        description={t(
          "Подключение выбирает ссылку на секрет backend-хранилища. Значения ключей браузеру не передаются. Проверка выполняет только запрос доступа, без платной генерации. Сначала сохраните изменённую ссылку.",
          "Қосылу backend құпия сақтау орнындағы сілтемені таңдайды. Кілт мәндері браузерге берілмейді. Тексеру ақылы генерациясыз тек қолжетімділікті сұрайды. Өзгертілген сілтемені алдымен сақтаңыз.",
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {(["xai", "fal"] as const).map((provider) => {
            const value = draft.providers?.[provider];
            const refs =
              config.credential_references?.filter(
                (item) => item.provider === provider,
              ) ?? [];
            const result = probes[provider];
            return (
              <div
                key={provider}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <h3 className="mb-4 text-sm font-semibold text-slate-700">
                  {provider === "xai" ? "xAI / Grok" : "fal / H3 Max"}
                </h3>
                <div className="space-y-3">
                  {!value && (
                    <Button
                      onClick={() =>
                        update({
                          providers: {
                            xai: draft.providers?.xai ?? {
                              status: "disabled",
                              credential_ref: "XAI_API_KEY",
                            },
                            fal: draft.providers?.fal ?? {
                              status: "disabled",
                              credential_ref: "FAL_KEY",
                            },
                            [provider]: {
                              status: "disabled",
                              credential_ref:
                                provider === "xai" ? "XAI_API_KEY" : "FAL_KEY",
                            },
                          },
                        })
                      }
                    >
                      <Icon name="plus" />
                      {t("Добавить подключение", "Қосылымды қосу")}
                    </Button>
                  )}
                  <Field label={t("Состояние", "Күйі")}>
                    <select
                      disabled={!value}
                      className={fieldClass}
                      value={value?.status ?? "disabled"}
                      onChange={(e) => {
                        if (value && draft.providers)
                          update({
                            providers: {
                              ...draft.providers,
                              [provider]: {
                                ...value,
                                status: e.target.value as VideoAvailability,
                              },
                            },
                          });
                      }}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {adminStatusText(status, kk)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("Ссылка на секрет", "Құпияға сілтеме")}>
                    <select
                      className={fieldClass}
                      value={value?.credential_ref}
                      onChange={(e) => {
                        if (value && draft.providers)
                          update({
                            providers: {
                              ...draft.providers,
                              [provider]: {
                                ...value,
                                credential_ref: e.target.value as
                                  "XAI_API_KEY" | "FAL_KEY",
                              },
                            },
                          });
                      }}
                    >
                      {refs.length ? (
                        refs.map((ref) => (
                          <option key={ref.ref} value={ref.ref}>
                            {ref.ref} ·{" "}
                            {ref.configured
                              ? t("настроен", "бапталған")
                              : t("не настроен", "бапталмаған")}
                          </option>
                        ))
                      ) : (
                        <option value={value?.credential_ref}>
                          {value?.credential_ref}
                        </option>
                      )}
                    </select>
                  </Field>
                  <Button
                    disabled={Boolean(probing) || dirty || busy}
                    onClick={() => void probe(provider)}
                  >
                    {probing === provider ? (
                      <Spinner />
                    ) : (
                      <Icon name="shield" />
                    )}
                    {t(
                      "Проверить доступ бесплатно",
                      "Қолжетімділікті тегін тексеру",
                    )}
                  </Button>
                  {result && (
                    <p
                      role="status"
                      className={`break-words text-xs leading-5 ${result.accessible ? "text-teal-700" : "text-amber-800"}`}
                    >
                      {result.accessible
                        ? t("Доступ подтверждён", "Қолжетімділік расталды")
                        : result.configured
                          ? t(
                              "Провайдер не подтвердил доступ",
                              "Провайдер қолжетімділікті растамады",
                            )
                          : t(
                              "Секрет не настроен на сервере",
                              "Серверде құпия бапталмаған",
                            )}{" "}
                      ·{" "}
                      {new Date(result.checked_at).toLocaleString(
                        kk ? "kk-KZ" : "ru-RU",
                      )}
                    </p>
                  )}
                  {probeError[provider] && (
                    <p role="alert" className="text-xs text-rose-600">
                      {probeError[provider]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
      <Section
        title={t("Реестр видеомоделей", "Видеомодельдер тізілімі")}
        description={t(
          "Добавляйте профили из проверенных адаптеров. Новая модель с другим API требует отдельной интеграции и проверки тарифов. Пауза и отключение запрещают новые запуски; уже оплаченные задачи сохраняют свой снимок параметров.",
          "Профильдерді тексерілген адаптерлерден қосыңыз. Басқа API моделі жеке интеграция мен тариф тексеруін қажет етеді. Кідірту және өшіру жаңа іске қосуды тоқтатады; төленген тапсырмалар параметрлер көшірмесін сақтайды.",
        )}
      >
        <div className="space-y-3">
          {registry.map((entry) => (
            <div
              key={entry.id}
              className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_180px]"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700">
                  {templates.find((m) => m.id === entry.id)?.label ??
                    entry.name}
                </p>
                <p className="mt-2 break-all font-mono text-[10px] text-slate-400">
                  {entry.adapter_model_id}
                </p>
                {entry.status === "disabled" && (
                  <Button
                    className="mt-2"
                    variant="ghost"
                    onClick={() =>
                      update({
                        model_registry: registry.filter(
                          (item) => item.id !== entry.id,
                        ),
                        disabled_models: [
                          ...new Set([...draft.disabled_models, entry.id]),
                        ],
                      })
                    }
                  >
                    {t("Убрать из каталога", "Каталогтан алып тастау")}
                  </Button>
                )}
              </div>
              <Field label={t("Название в студии", "Студиядағы атауы")}>
                <input
                  className={fieldClass}
                  value={entry.name}
                  maxLength={120}
                  onChange={(e) =>
                    update({
                      model_registry: registry.map((r) =>
                        r.id === entry.id ? { ...r, name: e.target.value } : r,
                      ),
                    })
                  }
                />
              </Field>
              <Field label={t("Состояние", "Күйі")}>
                <select
                  className={fieldClass}
                  value={entry.status}
                  onChange={(e) =>
                    update({
                      model_registry: registry.map((r) =>
                        r.id === entry.id
                          ? {
                              ...r,
                              status: e.target.value as VideoAvailability,
                            }
                          : r,
                      ),
                      disabled_models:
                        e.target.value === "enabled"
                          ? draft.disabled_models.filter(
                              (id) => id !== entry.id,
                            )
                          : [...new Set([...draft.disabled_models, entry.id])],
                    })
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {adminStatusText(status, kk)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {templates
            .filter((model) => !registry.some((entry) => entry.id === model.id))
            .map((model) => (
              <Button
                key={model.id}
                onClick={() =>
                  update({
                    model_registry: [
                      ...registry,
                      {
                        id: model.id,
                        adapter_model_id: model.adapter_model_id ?? model.id,
                        name: model.label ?? model.name ?? model.id,
                        status: "disabled",
                      },
                    ],
                  })
                }
              >
                <Icon name="plus" />
                {t("Добавить", "Қосу")} {model.label ?? model.name}
              </Button>
            ))}
        </div>
      </Section>
      <Section
        title={t(
          "Профили «Быстрый / Качественный»",
          "«Жылдам / Сапалы» профильдері",
        )}
        description={t(
          "Новые проекты получают профиль «Быстрый». Кнопки студии используют эти настройки модели, длительности, разрешения и звука. Текст речи и описание пользователя сохраняются при переключении.",
          "Жаңа жобалар «Жылдам» профилін алады. Студия батырмалары осы модель, ұзақтық, ажыратымдылық және дыбыс баптауларын қолданады. Ауысқанда пайдаланушы сөзі мен сипаттамасы сақталады.",
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {(["fast", "quality"] as const).map((key) => {
            const profile = draft.default_profiles?.[key];
            if (!profile) return null;
            const model = templates.find((m) => m.id === profile.model_id);
            const change = (patch: Partial<typeof profile>) =>
              update({
                default_profiles: {
                  ...draft.default_profiles!,
                  [key]: { ...profile, ...patch },
                },
              });
            return (
              <div
                key={key}
                className="space-y-3 rounded-2xl border border-slate-200 p-4"
              >
                <h3 className="text-xs font-semibold text-slate-700">
                  {key === "fast"
                    ? t("Быстрый", "Жылдам")
                    : t("Качественный", "Сапалы")}
                </h3>
                <Field label={t("Модель", "Модель")}>
                  <select
                    className={fieldClass}
                    value={profile.model_id}
                    onChange={(e) => {
                      const next = templates.find(
                        (m) => m.id === e.target.value,
                      );
                      if (next) change(settingsForModel(profile, next));
                    }}
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {registry.find((r) => r.id === m.id)?.name ?? m.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("Разрешение", "Ажыратымдылық")}>
                    <select
                      className={fieldClass}
                      value={profile.resolution}
                      onChange={(e) => change({ resolution: e.target.value })}
                    >
                      {model?.resolutions.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("Секунд", "Секунд")}>
                    <select
                      className={fieldClass}
                      value={profile.duration}
                      onChange={(e) =>
                        change({ duration: Number(e.target.value) })
                      }
                    >
                      {model &&
                        modelDurations(model).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                    </select>
                  </Field>
                </div>
                <Field label={t("Формат кадра", "Кадр пішімі")}>
                  <select
                    className={fieldClass}
                    value={profile.aspect_ratio}
                    onChange={(e) => change({ aspect_ratio: e.target.value })}
                  >
                    {model?.aspect_ratios.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </Field>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    className="accent-indigo-600"
                    checked={profile.generate_audio}
                    onChange={(e) =>
                      change({ generate_audio: e.target.checked })
                    }
                  />
                  {t("Нативный звук видеомодели", "Видеомодельдің өз дыбысы")}
                </label>
              </div>
            );
          })}
        </div>
      </Section>
      <Section
        title={t(
          "Очередь, хранилище и служебный LLM",
          "Кезек, сақтау орны және қызметтік LLM",
        )}
        description={t(
          "Сервер проверяет лимиты при приёме и выполнении. Максимальная параллельность ограничена ресурсами текущего развёртывания. Хранение каждого файла — 24 часа; проекта — 24 часа после изменения. Эти сроки не увеличиваются настройкой ёмкости.",
          "Сервер қабылдау және орындау кезінде шектеулерді тексереді. Ең жоғары параллельдік сервер ресурстарымен шектелген. Әр файл 24 сағат; жоба өзгерістен кейін 24 сағат сақталады. Орын көлемін өзгерту мерзімді ұзартпайды.",
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {numericFields.map((field) => (
            <Field
              key={field.key}
              label={kk ? field.kk : field.ru}
              hint={`${field.min}–${maxFor(field)}`}
            >
              <input
                type="number"
                step="1"
                min={field.min}
                max={maxFor(field)}
                className={fieldClass}
                value={
                  Number.isFinite(draft[field.key]) ? draft[field.key] : ""
                }
                onChange={(e) =>
                  update({
                    [field.key]:
                      e.target.value === ""
                        ? Number.NaN
                        : Number(e.target.value),
                  })
                }
              />
            </Field>
          ))}
        </div>
        {Number(draft.user_storage_limit_mb) >
          Number(draft.storage_limit_mb) && (
          <p role="alert" className="mt-4 text-xs text-rose-600">
            {t(
              "Хранилище пользователя не может превышать общее.",
              "Пайдаланушы сақтау орны жалпы көлемнен аспауы керек.",
            )}
          </p>
        )}
      </Section>
      <Section
        title={t(
          "Проверенные возможности моделей",
          "Модельдердің тексерілген мүмкіндіктері",
        )}
        description={t(
          "Ограничения могут только уменьшать проверенный набор. Чтобы восстановить весь набор адаптера, сбросьте ограничения. Не забудьте привести профили по умолчанию в соответствие.",
          "Шектеулер тек тексерілген жиынтықты азайтады. Адаптердің толық жиынтығын қайтару үшін шектеулерді қалпына келтіріңіз. Әдепкі профильдерді сәйкестендіріңіз.",
        )}
      >
        <div className="space-y-3">
          {models.map((model) => (
            <details
              key={model.id}
              className="rounded-2xl border border-slate-200"
            >
              <summary className="cursor-pointer p-4 text-xs font-semibold text-slate-700">
                {registry.find((r) => r.id === model.id)?.name ?? model.label}
              </summary>
              <div className="space-y-4 border-t border-slate-100 p-4">
                {(
                  [
                    "resolutions",
                    "durations",
                    "aspect_ratios",
                    "modes",
                  ] as const
                ).map((name) => {
                  const options = model[name] ?? [];
                  const chosen =
                    draft.capability_overrides?.[model.id]?.[name] ?? options;
                  const labels = {
                    resolutions: t("Разрешение", "Ажыратымдылық"),
                    durations: t("Длительность", "Ұзақтық"),
                    aspect_ratios: t("Формат", "Пішім"),
                    modes: t("Вход", "Кіріс"),
                  };
                  return (
                    <div key={name}>
                      <p className="mb-2 text-[11px] font-semibold text-slate-500">
                        {labels[name]}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {options.map((option) => (
                          <label
                            key={option}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
                          >
                            <input
                              type="checkbox"
                              className="accent-indigo-600"
                              checked={chosen.includes(option)}
                              disabled={
                                chosen.length === 1 && chosen.includes(option)
                              }
                              onChange={(e) =>
                                update({
                                  capability_overrides: {
                                    ...draft.capability_overrides,
                                    [model.id]: {
                                      ...draft.capability_overrides?.[model.id],
                                      [name]: e.target.checked
                                        ? [...chosen, option]
                                        : chosen.filter(
                                            (item) => item !== option,
                                          ),
                                    },
                                  },
                                })
                              }
                            />
                            {name === "modes"
                              ? option === "image"
                                ? t("Изображение", "Сурет")
                                : t("Текст", "Мәтін")
                              : option}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <Button
                  variant="ghost"
                  onClick={() => {
                    const next = { ...draft.capability_overrides };
                    delete next[model.id];
                    update({ capability_overrides: next });
                  }}
                >
                  {t("Сбросить ограничения", "Шектеулерді қалпына келтіру")}
                </Button>
              </div>
            </details>
          ))}
        </div>
      </Section>
      <Section
        title={t("Проверенные тарифы API", "Тексерілген API тарифтері")}
        description={t(
          "USD за секунду и за входное изображение, отдельно для каждого режима. Обновляйте по официальному источнику; устаревший или неполный тариф блокирует новые платные запросы.",
          "Әр режим үшін секундына және кіріс суретіне USD. Ресми дереккөз бойынша жаңартыңыз; ескірген немесе толық емес тариф жаңа ақылы сұрауларды бұғаттайды.",
        )}
      >
        <div className="space-y-3">
          {models.flatMap((model) =>
            (model.modes ?? ["text", "image"]).map((mode) => {
              const key = `${model.id}:${mode}`;
              const initial = initialModelTariff(model, mode);
              const value = draft.tariffs[key] ?? initial;
              const set = (patch: Partial<VideoTariff>) =>
                tariff(key, { ...value, ...patch });
              return (
                <details
                  key={key}
                  className="rounded-2xl border border-slate-200"
                >
                  <summary className="cursor-pointer p-4 text-xs font-semibold text-slate-700">
                    {registry.find((r) => r.id === model.id)?.name ??
                      model.label}{" "}
                    ·{" "}
                    {mode === "image"
                      ? t("из изображения", "суреттен")
                      : t("из текста", "мәтіннен")}{" "}
                    ·{" "}
                    <span className="font-normal text-slate-400">
                      {draft.tariffs[key]
                        ? t("настроенный тариф", "бапталған тариф")
                        : t("базовый тариф", "негізгі тариф")}
                    </span>
                  </summary>
                  <div className="space-y-4 border-t border-slate-100 p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {model.resolutions.map((resolution) => (
                        <Field
                          key={resolution}
                          label={`${resolution} · USD / ${t("сек", "сек")}`}
                        >
                          <input
                            type="number"
                            min="0.00000001"
                            max="10"
                            step="0.0001"
                            className={fieldClass}
                            value={value.rates[resolution] ?? ""}
                            onChange={(e) =>
                              set({
                                rates: {
                                  ...value.rates,
                                  [resolution]: e.target.value,
                                },
                              })
                            }
                          />
                        </Field>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label={t("USD за изображение", "Сурет үшін USD")}>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.0001"
                          className={fieldClass}
                          value={value.image_fee_usd}
                          onChange={(e) =>
                            set({ image_fee_usd: e.target.value })
                          }
                        />
                      </Field>
                      <Field label={t("Проверено, UTC", "Тексерілді, UTC")}>
                        <input
                          className={fieldClass}
                          value={value.verified_at}
                          placeholder="2026-10-19T00:00:00Z"
                          onChange={(e) => set({ verified_at: e.target.value })}
                        />
                      </Field>
                      <Field label={t("Действует до, UTC", "Жарамды, UTC")}>
                        <input
                          className={fieldClass}
                          value={value.valid_until}
                          placeholder="2026-11-18T00:00:00Z"
                          onChange={(e) => set({ valid_until: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field label={t("Официальный источник", "Ресми дереккөз")}>
                      <input
                        type="url"
                        className={fieldClass}
                        value={value.source}
                        onChange={(e) => set({ source: e.target.value })}
                      />
                    </Field>
                    <Field
                      label={t(
                        "Окончание акции, UTC (если есть)",
                        "Акция аяқталуы, UTC (бар болса)",
                      )}
                    >
                      <input
                        className={fieldClass}
                        value={value.promotion_ends_at ?? ""}
                        onChange={(e) =>
                          set({ promotion_ends_at: e.target.value || null })
                        }
                        placeholder="2026-11-01T00:00:00Z"
                      />
                    </Field>
                    {draft.tariffs[key] && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const next = { ...draft.tariffs };
                          delete next[key];
                          update({ tariffs: next });
                        }}
                      >
                        {t("Вернуть базовый тариф", "Негізгі тарифті қайтару")}
                      </Button>
                    )}
                  </div>
                </details>
              );
            }),
          )}
        </div>
      </Section>
      <Section
        title={t(
          "Шаблоны сценария, промпта и звука",
          "Сценарий, промпт және дыбыс үлгілері",
        )}
        description={t(
          "Инструкции добавляются на сервере. Неизменяемые ограничения формата и native audio сохраняются: речь, музыка и эффекты создаются только видеомоделью. Шаблоны не должны содержать секреты.",
          "Нұсқаулар серверде қосылады. Пішім және модельдің өз дыбысына қойылатын тұрақты талаптар сақталады: сөз, музыка және әсерлерді тек видеомодель жасайды. Үлгілерде құпия ақпарат болмауы тиіс.",
        )}
      >
        <div className="space-y-4">
          {(["script", "enhancer", "native_audio"] as const).map((key) => (
            <Field
              key={key}
              label={
                {
                  script: t(
                    "Сценарий и разбиение на сцены",
                    "Сценарий және сахналарға бөлу",
                  ),
                  enhancer: t("Улучшение промпта", "Промптты жақсарту"),
                  native_audio: t(
                    "Инструкции нативного звука",
                    "Модельдің өз дыбыс нұсқаулары",
                  ),
                }[key]
              }
            >
              <textarea
                rows={5}
                className={fieldClass}
                maxLength={key === "native_audio" ? 3000 : 6000}
                value={draft.prompt_templates?.[key] ?? ""}
                onChange={(e) =>
                  update({
                    prompt_templates: {
                      script: draft.prompt_templates?.script ?? "",
                      enhancer: draft.prompt_templates?.enhancer ?? "",
                      native_audio: draft.prompt_templates?.native_audio ?? "",
                      [key]: e.target.value,
                    },
                  })
                }
              />
            </Field>
          ))}
        </div>
      </Section>
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm">
        <Button
          variant="primary"
          disabled={busy || invalid || !dirty || stale}
          onClick={() => void persist()}
        >
          {busy ? <Spinner /> : <Icon name="check" />}
          {t("Сохранить настройки", "Баптауларды сақтау")}
        </Button>
        <Button
          disabled={busy}
          variant="ghost"
          onClick={() => void reloadSaved()}
        >
          {dirty
            ? t(
                "Отменить правки и загрузить сохранённое",
                "Өзгерістерден бас тартып, сақталғанды жүктеу",
              )
            : t(
                "Загрузить сохранённые настройки",
                "Сақталған баптауларды жүктеу",
              )}
        </Button>
        {saved && (
          <p role="status" className="text-xs text-teal-700">
            {t(
              "Сохранено в журнале администратора",
              "Әкімші журналына сақталды",
            )}
          </p>
        )}
        {stale && (
          <p role="alert" className="w-full text-xs text-amber-800">
            {t(
              "На сервере появилась новая версия настроек. Загрузите её перед сохранением.",
              "Серверде баптаулардың жаңа нұсқасы бар. Сақтау алдында жүктеңіз.",
            )}
          </p>
        )}
        {invalidProfiles && (
          <p role="alert" className="w-full text-xs text-amber-800">
            {t(
              "Параметры профилей должны входить в разрешённые возможности моделей. Обновите профиль или его ограничения.",
              "Профиль параметрлері модельдің рұқсат етілген мүмкіндіктеріне кіруі тиіс. Профильді не шектеулерін жаңартыңыз.",
            )}
          </p>
        )}
        {error && (
          <p role="alert" className="w-full text-xs text-rose-600">
            {error}
          </p>
        )}
      </div>
    </fieldset>
  );
}
