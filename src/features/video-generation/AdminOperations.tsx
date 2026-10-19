"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { videoApi, type VideoAdminJob } from "./api";
import { DownloadVideo } from "./PrivateMedia";
import { videoError } from "./model";
import { Button, Icon, Spinner } from "./ui";

export function AdminReconcile({
  job,
  kk,
}: {
  job: VideoAdminJob;
  kk: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["video-admin-reconciliation", job.id],
    queryFn: () => videoApi.adminReconciliation(job.id),
    enabled: open,
    retry: false,
    refetchInterval: (q) =>
      ["queued", "running"].includes(q.state.data?.status ?? "") ? 4000 : false,
  });
  const t = (ru: string, kz: string) => (kk ? kz : ru);
  const value = query.data;
  const running = value?.status === "queued" || value?.status === "running";
  if (!["failed", "cancelled"].includes(job.status)) return null;
  return (
    <div className="mt-3 max-w-80 whitespace-normal">
      <Button variant="ghost" onClick={() => setOpen(!open)}>
        <Icon name="refresh" />
        {t("Сверить исходный запрос", "Бастапқы сұрауды тексеру")}
      </Button>
      {open && (
        <div className="mt-2 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <p>
            {t(
              "Проверка обращается только к исходному заданию провайдера. Новая генерация и списание токенов не выполняются. Возврат по исходной задаче сохраняется.",
              "Тексеру провайдердің бастапқы тапсырмасына ғана жүгінеді. Жаңа генерация және токен алу орындалмайды. Бастапқы тапсырма қайтарымы сақталады.",
            )}
          </p>
          {!job.provider_job_id && (
            <p className="text-amber-800">
              {t(
                "Провайдер не вернул ID запроса. Без него автоматическая сверка невозможна.",
                "Провайдер сұрау ID қайтармады. Онсыз автоматты тексеру мүмкін емес.",
              )}
            </p>
          )}
          {query.isLoading && <Spinner />}
          {value && (
            <p role="status" className="font-semibold">
              {
                {
                  queued: t("Ожидает сверки", "Тексеруді күтуде"),
                  running: t(
                    "Сверяем с провайдером",
                    "Провайдермен салыстырылуда",
                  ),
                  completed: t("Сверка завершена", "Тексеру аяқталды"),
                  failed: t("Сверка не завершилась", "Тексеру аяқталмады"),
                }[value.status]
              }
            </p>
          )}
          {value?.outcome && (
            <p>
              {
                {
                  provider_pending: t(
                    "Исходная задача ещё выполняется у провайдера.",
                    "Провайдерде бастапқы тапсырма әлі орындалуда.",
                  ),
                  late_success: t(
                    "Поздний результат сохранён. Исходный возврат не отменяется.",
                    "Кеш нәтиже сақталды. Бастапқы қайтарым жойылмайды.",
                  ),
                  provider_failed: t(
                    "Провайдер подтвердил ошибку исходной задачи.",
                    "Провайдер бастапқы тапсырма қатесін растады.",
                  ),
                }[value.outcome]
              }
            </p>
          )}
          {value?.actual_cost_usd && <p>API: ${value.actual_cost_usd}</p>}
          {value?.asset && (
            <DownloadVideo
              assetId={value.asset.id}
              expiresAt={value.asset.expires_at}
              reconciliationJobId={job.id}
              name={`reconciled-${job.id.slice(0, 12)}`}
              kk={kk}
            />
          )}
          {value?.error_message && (
            <p role="alert" className="text-amber-800">
              {value.error_message}
            </p>
          )}
          {(error || query.error) && (
            <p role="alert" className="text-rose-600">
              {error || videoError(query.error, kk)}
            </p>
          )}
          <Button
            disabled={
              busy || running || !job.provider_job_id || query.isLoading
            }
            onClick={() => {
              setBusy(true);
              setError("");
              void videoApi
                .adminReconcile(job.id)
                .then(() => query.refetch())
                .catch((err) => setError(videoError(err, kk)))
                .finally(() => setBusy(false));
            }}
          >
            {busy || running ? <Spinner /> : <Icon name="shield" />}
            {t("Проверить существующую задачу", "Бар тапсырманы тексеру")}
          </Button>
        </div>
      )}
    </div>
  );
}

export function AdminAudit({ enabled, kk }: { enabled: boolean; kk: boolean }) {
  const query = useQuery({
    queryKey: ["video-admin-audit"],
    queryFn: videoApi.adminAudit,
    enabled,
    retry: false,
    refetchOnWindowFocus: (query) => query.state.status === "error",
    refetchOnReconnect: true,
  });
  const t = (ru: string, kz: string) => (kk ? kz : ru);
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-800">
          {t(
            "Журнал административных изменений",
            "Әкімшілік өзгерістер журналы",
          )}
        </h2>
        <Button variant="ghost" onClick={() => void query.refetch()}>
          <Icon name="refresh" />
          {t("Обновить", "Жаңарту")}
        </Button>
      </div>
      <p className="mt-2 text-xs leading-6 text-slate-500">
        {t(
          "Последние 50 изменений конфигурации и проверок доступа. Финансовые возвраты записываются в отдельный журнал токенов.",
          "Конфигурация өзгерістері мен қолжетімділік тексерулерінің соңғы 50 жазбасы. Қаржылық қайтарымдар жеке токен журналына жазылады.",
        )}
      </p>
      <div className="mt-4 divide-y divide-slate-100">
        {query.data?.items.map((item) => (
          <details key={item.key} className="py-3">
            <summary className="cursor-pointer text-xs leading-6 text-slate-600">
              <span className="font-semibold">
                {item.value.action === "provider_access_check"
                  ? `${t("Проверка доступа", "Қолжетімділікті тексеру")} · ${item.value.provider}`
                  : `${t("Настройки", "Баптаулар")} · ${t("версия", "нұсқа")} ${item.value.revision ?? "—"}`}
              </span>{" "}
              ·{" "}
              {new Date(item.updated_at).toLocaleString(kk ? "kk-KZ" : "ru-RU")}
              <span className="ml-2 break-all font-mono text-[10px] text-slate-400">
                {item.updated_by}
              </span>
            </summary>
            <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">
              {item.value.action === "provider_access_check" ? (
                <p>
                  {item.value.accessible
                    ? t(
                        "Доступ к метаданным подтверждён, без генерации.",
                        "Метадеректерге қолжетімділік расталды, генерациясыз.",
                      )
                    : t(
                        "Доступ к метаданным не подтверждён.",
                        "Метадеректерге қолжетімділік расталмады.",
                      )}
                </p>
              ) : (
                <>
                  {item.value.default_profiles && (
                    <p>
                      {t("Быстрый / Качественный", "Жылдам / Сапалы")}:{" "}
                      {item.value.default_profiles.fast.model_id} /{" "}
                      {item.value.default_profiles.quality.model_id}
                    </p>
                  )}
                  {item.value.providers && (
                    <p>
                      {t("Провайдеры", "Провайдерлер")}:{" "}
                      {Object.entries(item.value.providers)
                        .map(
                          ([provider, value]) =>
                            `${provider}: ${value.status} (${value.credential_ref})`,
                        )
                        .join("; ")}
                    </p>
                  )}
                  <p>
                    {t("Лимиты", "Шектеулер")}:{" "}
                    {Object.entries(item.value)
                      .filter(
                        ([key, value]) =>
                          key !== "revision" && typeof value === "number",
                      )
                      .map(([key, value]) => `${key}=${value}`)
                      .join("; ")}
                  </p>
                </>
              )}
            </div>
          </details>
        ))}
      </div>
      {query.isLoading && (
        <div className="mt-4">
          <Spinner />
        </div>
      )}
      {query.error && (
        <p role="alert" className="mt-4 text-xs text-rose-600">
          {videoError(query.error, kk)}
        </p>
      )}
      {!query.isLoading && !query.error && !query.data?.items.length && (
        <p className="mt-4 text-xs text-slate-400">
          {t("Изменений пока нет", "Өзгерістер әлі жоқ")}
        </p>
      )}
    </section>
  );
}
