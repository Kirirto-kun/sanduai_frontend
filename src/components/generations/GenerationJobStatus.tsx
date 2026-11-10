"use client";
import { useEffect, useState } from "react";
import type { GenerationJobSummary } from "@/lib/api";
import { generationConnection } from "@/lib/generation-polling";

export function GenerationJobStatus({ job, language, error, onRetry, now }: {
  job?: GenerationJobSummary | null; language: "ru" | "kk"; error?: unknown; onRetry?: () => void; now?: number;
}) {
  const [clock, setClock] = useState<number | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);
  if (!job && !error) return null;
  const t = (ru: string, kk: string) => language === "kk" ? kk : ru;
  const connection = generationConnection(error);
  const labels = {
    queued: t("В очереди", "Кезекте"), running: t("Создаём материал", "Материал жасалуда"),
    settling: t("Сохраняем результат", "Нәтиже сақталуда"), refunding: t("Возвращаем монеты", "Монеталар қайтарылуда"),
    completed: t("Готово", "Дайын"), failed: t("Не удалось создать материал", "Материалды жасау мүмкін болмады"),
    cancelled: t("Создание отменено", "Жасау тоқтатылды"), billing_error: t("Результат сохранён, проверяем оплату", "Нәтиже сақталды, төлем тексерілуде"),
  };
  const permanent = connection === "credentials" || connection === "unavailable";
  const queued = job?.status === "queued";
  const active = job && ["queued", "running", "settling", "refunding"].includes(job.status);
  const start = queued ? job.created_at : job?.started_at;
  const reference = now ?? clock ?? (job ? Date.parse(job.updated_at || job.created_at) : 0);
  const elapsed = start ? Math.max(0, Math.floor((reference - Date.parse(start)) / 60_000)) : null;
  const estimate = job?.estimated_wait_seconds;
  return <div className="my-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-800">
    <p role="status" aria-atomic="true" className="font-semibold">
      {connection === "credentials" ? t("Войдите снова или проверьте доступ к материалу.", "Қайта кіріңіз немесе материалға қолжетімділікті тексеріңіз.")
        : connection === "unavailable" ? t("Материал недоступен. Откройте историю или проверьте ссылку.", "Материал қолжетімсіз. Тарихты ашыңыз немесе сілтемені тексеріңіз.")
        : connection === "reconnecting" ? t("Связь прервалась. Автоматически проверяем статус; повторно отправлять задание не нужно.", "Байланыс үзілді. Күйі автоматты тексеріледі; тапсырманы қайта жіберудің қажеті жоқ.")
        : job ? labels[job.status] : ""}
    </p>
    {!permanent && job && <div aria-live="off" className="mt-1 space-y-1 text-xs leading-5 text-slate-600">
      {connection === "reconnecting" && <p>{t("Последний известный статус", "Соңғы белгілі күй")}: {labels[job.status]}</p>}
      {active && elapsed !== null && Number.isFinite(elapsed) && <p>{queued ? t("Ожидание", "Күту") : t("Выполняется", "Орындалуда")}: {elapsed < 1 ? t("меньше минуты", "бір минуттан аз") : `${elapsed} ${t("мин", "мин")}`}</p>}
      {queued && typeof estimate === "number" && Number.isFinite(estimate) && estimate >= 0 && <p>{t("Ориентировочное ожидание", "Шамамен күту уақыты")}: {Math.max(1, Math.ceil(estimate / 60))} {t("мин. Может измениться.", "мин. Өзгеруі мүмкін.")}</p>}
      {job.priority === "admin" && <p>{t("Приоритет администратора", "Әкімші басымдығы")}</p>}
    </div>}
    {Boolean(error) && onRetry && <button type="button" className="mt-2 min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600" onClick={onRetry}>{t("Проверить снова", "Қайта тексеру")}</button>}
  </div>;
}
