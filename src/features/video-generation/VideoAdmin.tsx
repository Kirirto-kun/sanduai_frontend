"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { AdminSettings } from "./AdminSettings";
import { AdminAudit, AdminReconcile } from "./AdminOperations";
import { createIdempotencyKey } from "@/lib/idempotency";
import { videoApi, type VideoAdminJob } from "./api";
import { money, videoError } from "./model";
import { Button, Field, Icon, Modal, Spinner, fieldClass } from "./ui";

function RefundDialog({
  job,
  onClose,
  onSaved,
  kk,
}: {
  job: VideoAdminJob;
  onClose: () => void;
  onSaved: () => void;
  kk: boolean;
}) {
  const t = (ru: string, kz: string) => (kk ? kz : ru);
  const remaining =
    Number(job.captured_tokens) - Number(job.manual_refunded_tokens ?? 0);
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [reason, setReason] = useState("");
  const [key] = useState(createIdempotencyKey);
  const [busy, setBusy] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal
      title={t("Ручной возврат токенов", "Токендерді қолмен қайтару")}
      onClose={onClose}
    >
      <p className="mb-5 text-xs leading-6 text-slate-500">
        {t(
          "Возврат за готовую генерацию будет записан в финансовый журнал с вашим ID и причиной. Доступно к возврату:",
          "Дайын генерация қайтарымы қаржы журналына сіздің ID және себебімен жазылады. Қайтаруға болады:",
        )}{" "}
        <strong>{money(remaining)}</strong> {t("токенов", "токен")}.
      </p>
      <Field label={t("Сумма, токены", "Сома, токендер")}>
        <input
          className={fieldClass}
          type="number"
          step="0.01"
          min="0.01"
          max={remaining}
          disabled={frozen}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <div className="mt-4">
        <Field label={t("Причина возврата", "Қайтару себебі")}>
          <textarea
            rows={3}
            className={fieldClass}
            minLength={3}
            maxLength={500}
            disabled={frozen}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </div>
      <Button
        variant="primary"
        className="mt-5 w-full"
        disabled={
          busy ||
          Number(amount) <= 0 ||
          Number(amount) > remaining ||
          reason.trim().length < 3
        }
        onClick={() => {
          setBusy(true);
          setFrozen(true);
          setError("");
          void videoApi
            .adminRefund(
              job.id,
              { amount: Number(amount).toFixed(2), reason: reason.trim() },
              key,
            )
            .then(() => {
              onSaved();
              onClose();
            })
            .catch((err) => setError(videoError(err, kk)))
            .finally(() => setBusy(false));
        }}
      >
        {busy ? <Spinner /> : <Icon name="refresh" />}
        {frozen
          ? t("Проверить тот же возврат", "Сол қайтарымды тексеру")
          : t("Подтвердить возврат", "Қайтаруды растау")}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-xs leading-5 text-rose-600">
          {error}{" "}
          {t(
            "Повтор использует тот же ключ операции.",
            "Қайталау сол операция кілтін қолданады.",
          )}
        </p>
      )}
    </Modal>
  );
}

export function VideoAdmin() {
  const { language } = useLanguage();
  const kk = language === "kk";
  const t = (ru: string, kz: string) => (kk ? kz : ru);
  const { user } = useAuth();
  const allowed = user?.role === "admin" || user?.role === "super_admin";
  const config = useQuery({
    queryKey: ["video-admin-config", user?.userId],
    queryFn: videoApi.adminConfig,
    enabled: allowed,
    retry: false,
    refetchOnWindowFocus: (query) => query.state.status === "error",
    refetchOnReconnect: true,
  });
  const jobs = useQuery({
    queryKey: ["video-admin-jobs", user?.userId],
    queryFn: videoApi.adminJobs,
    enabled: allowed,
    retry: false,
    refetchInterval: 15_000,
  });
  const [refund, setRefund] = useState<VideoAdminJob | null>(null);
  if (!allowed)
    return (
      <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">
        {t(
          "Нет доступа к настройкам видеогенерации.",
          "Видеогенерация баптауларына рұқсат жоқ.",
        )}
      </p>
    );
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Sandu AI · Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {t("Видеогенерация", "Видеогенерация")}
          </h1>
        </div>
        <Link
          href="/dashboard/media/video"
          className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600"
        >
          {t("Открыть студию", "Студияны ашу")}
          <Icon name="arrow" />
        </Link>
      </header>
      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
        {t(
          "Видео хранятся 24 часа с момента создания. Проекты удаляются вместе с материалами через 24 часа без изменений. Просмотр не продлевает срок. Финансовые записи сохраняются отдельно.",
          "Видео жасалған сәттен бастап 24 сағат сақталады. Жобалар өзгеріссіз 24 сағаттан кейін материалдарымен бірге жойылады. Қарау мерзімді ұзартпайды. Қаржы жазбалары бөлек сақталады.",
        )}
      </aside>
      {config.isLoading ? (
        <Spinner />
      ) : config.error ? (
        <div className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <p role="alert" className="text-xs text-rose-600">
            {videoError(config.error, kk)}
          </p>
          <Button
            disabled={config.isFetching}
            onClick={() => void config.refetch()}
          >
            <Icon name="refresh" />
            {t("Повторить загрузку настроек", "Баптауларды қайта жүктеу")}
          </Button>
        </div>
      ) : config.data ? (
        <AdminSettings config={config.data} kk={kk} />
      ) : null}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-sm font-bold text-slate-800">
            {t("Операции и расходы", "Операциялар мен шығындар")}
          </h2>
          <Button
            variant="ghost"
            onClick={() => void jobs.refetch()}
            aria-label={t("Обновить операции", "Операцияларды жаңарту")}
          >
            <Icon name="refresh" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-xs">
            <thead className="border-y border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                {[
                  t("Операция", "Операция"),
                  t("Статус", "Күйі"),
                  t("Предел, токены", "Шегі, токен"),
                  t("Списано", "Есептен алынды"),
                  "API, USD",
                  t("Расход платформы", "Платформа шығыны"),
                ].map((s) => (
                  <th key={s} className="px-5 py-3 font-semibold">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.data?.items.map((job) => (
                <tr key={job.id}>
                  <td className="px-5 py-4">
                    <p className="font-mono text-[10px] text-slate-600">
                      {job.id.slice(0, 12)}
                    </p>
                    <p className="mt-1 max-w-44 truncate text-[10px] text-slate-400">
                      {job.provider_endpoint ?? t("Очередь", "Кезек")}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] ${job.status === "completed" ? "bg-teal-50 text-teal-700" : job.status === "failed" ? "bg-rose-50 text-rose-700" : "bg-indigo-50 text-indigo-600"}`}
                    >
                      {job.status}
                    </span>
                    {job.error_code && (
                      <p className="mt-2 text-[9px] text-slate-400">
                        {job.error_code}
                      </p>
                    )}
                    <AdminReconcile job={job} kk={kk} />
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {money(job.cost_tokens)}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700">
                    {money(job.captured_tokens)}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {job.actual_cost_usd ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {money(job.platform_loss_tokens)}
                    {job.status === "completed" &&
                      Number(job.captured_tokens) >
                        Number(job.manual_refunded_tokens ?? 0) && (
                        <Button
                          className="ml-3"
                          variant="ghost"
                          onClick={() => setRefund(job)}
                        >
                          {t("Вернуть токены", "Токендерді қайтару")}
                        </Button>
                      )}
                    {Number(job.manual_refunded_tokens ?? 0) > 0 && (
                      <p className="mt-1 text-[10px] text-teal-600">
                        {t("Возвращено", "Қайтарылды")}:{" "}
                        {money(job.manual_refunded_tokens)}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!jobs.data?.items.length && (
          <p className="p-8 text-center text-xs text-slate-400">
            {jobs.isLoading
              ? t("Загружаем операции…", "Операциялар жүктелуде…")
              : t("Операций пока нет", "Операциялар әлі жоқ")}
          </p>
        )}
        {jobs.error && (
          <p role="alert" className="p-5 text-xs text-rose-600">
            {videoError(jobs.error, kk)}
          </p>
        )}
      </section>
      <AdminAudit enabled={allowed} kk={kk} />
      {refund && (
        <RefundDialog
          job={refund}
          kk={kk}
          onClose={() => setRefund(null)}
          onSaved={() => void jobs.refetch()}
        />
      )}
    </div>
  );
}
