"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ModuleGenerationHistory } from "@/components/generations/ModuleGenerationHistory";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { enqueueGenerationJob, exportLessonPlanDocx, getGenerationJob, InsufficientTokensError, type LessonPlanResponse } from "@/lib/api";
import { generationJobIdFromSearchParam, generationServerStatusCopy, isAcknowledgedGenerationJob, isActiveGenerationJob, isUnavailableGenerationJobError } from "@/lib/generation-history";
import { useTokens } from "@/hooks/useTokens";
import { useTeacherErrorMessage } from "@/hooks/useTeacherErrorMessage";
import { PlannerForm } from "@/features/lesson-plan/PlannerForm";
import { PlannerEditor } from "@/features/lesson-plan/PlannerEditor";
import { buttonClass } from "@/features/lesson-plan/Fields";
import { cleanLessonRequest, createLessonDraft, editableLessonPlan, lessonExportPayload, validStudentCount, type EditableLessonPlan, type LessonPlanDraft } from "@/features/lesson-plan/model";
import { clearLessonSession, lessonSessionStore, readLessonDraft, readLessonEdits, saveLessonDraft, saveLessonEdits } from "@/features/lesson-plan/persistence";

function LessonPlanner({ userId }: { userId: string | null }) {
  const { language } = useLanguage();
  const kk = language === "kk";
  const teacherError = useTeacherErrorMessage();
  const { costs, balance, refreshBalance } = useTokens();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const requestedJobId = generationJobIdFromSearchParam(searchParams.get("job"));
  const [sessionJobId, setSessionJobId] = useState<string | null>(null);
  const currentJobId = requestedJobId ?? sessionJobId;
  const loadedJobId = useRef<string | null>(null);
  const [draft, setDraft] = useState<LessonPlanDraft>(createLessonDraft);
  const [plan, setPlan] = useState<EditableLessonPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const persistenceScope = `${userId ?? "anonymous"}:${currentJobId ?? "draft"}`;
  const [storageReady, setStorageReady] = useState<string | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState<"draft" | "edits" | "images" | null>(null);
  const draftHydrated = useRef(false);
  const restoredScope = useRef<string | null>(null);
  const job = useQuery({
    queryKey: ["generation-job", currentJobId],
    queryFn: () => getGenerationJob(currentJobId as string),
    enabled: Boolean(currentJobId),
    retry: (count, failure) => !isUnavailableGenerationJobError(failure) && count < 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => query.state.data && isActiveGenerationJob(query.state.data) ? 2_000 : false,
  });

  useEffect(() => {
    if (restoredScope.current === persistenceScope) return;
    restoredScope.current = persistenceScope;
    const store = lessonSessionStore();
    const savedDraft = store && !draftHydrated.current ? readLessonDraft(store, userId) : null;
    const savedPlan = store && currentJobId ? readLessonEdits(store, userId, currentJobId) : null;
    if (savedDraft) setDraft(savedDraft.draft);
    draftHydrated.current = true;
    setPlan(savedPlan);
    loadedJobId.current = savedPlan ? currentJobId : null;
    setError("");
    setRestoredNotice(savedDraft?.omittedImages ? "images" : savedPlan ? "edits" : savedDraft ? "draft" : null);
    setStorageReady(persistenceScope);
  }, [currentJobId, persistenceScope, userId]);

  useEffect(() => {
    if (!userId || storageReady !== persistenceScope) return;
    const store = lessonSessionStore();
    const draftSaved = store ? saveLessonDraft(store, userId, draft) : false;
    const editsSaved = plan && currentJobId && loadedJobId.current === currentJobId
      ? Boolean(store && saveLessonEdits(store, userId, currentJobId, plan)) : true;
    setStorageFailed(!draftSaved || !editsSaved);
  }, [currentJobId, draft, persistenceScope, plan, storageReady, userId]);

  useEffect(() => {
    if (storageReady !== persistenceScope) return;
    const value = job.data;
    if (!value || loadedJobId.current === value.id) return;
    if (value.kind !== "kmzh.generate") {
      loadedJobId.current = value.id; setPlan(null);
      setError(kk ? "Бұл сілтеме ҚМЖ материалына жатпайды." : "Эта ссылка ведёт не на материал КМЖ."); return;
    }
    if ((value.status === "completed" || value.status === "billing_error") && value.result) {
      try {
        const result = value.result as LessonPlanResponse;
        if (!result.meta || !Array.isArray(result.flow)) throw new Error("Invalid saved lesson plan");
        setPlan(editableLessonPlan(result)); loadedJobId.current = value.id; setError("");
      } catch (failure) {
        loadedJobId.current = value.id;
        setError(teacherError(failure, kk ? "Құжатты ашу мүмкін болмады. Қайта жүктеп көріңіз." : "Не удалось открыть документ. Попробуйте загрузить его снова."));
      }
      void refreshBalance(); return;
    }
    if (value.status === "failed" || value.status === "cancelled") {
      loadedJobId.current = value.id;
      setError(kk ? "ҚМЖ жасау аяқталмады. Монеталар қайтарылды — деректерді тексеріп, қайталап көріңіз." : "Создание КМЖ не завершилось. Монеты возвращены — проверьте данные и попробуйте снова.");
      void refreshBalance();
    }
  }, [job.data, kk, persistenceScope, refreshBalance, storageReady, teacherError]);

  useEffect(() => {
    if (!job.error) return;
    const acknowledged = isAcknowledgedGenerationJob(job.data, currentJobId, ["kmzh.generate"]);
    if (isUnavailableGenerationJobError(job.error) && !acknowledged) {
      if (currentJobId) loadedJobId.current = currentJobId;
      setSessionJobId(null);
      setError(kk ? "Бұл тапсырма енді қолжетімді емес. Жаңа ҚМЖ жасай аласыз." : "Эта задача больше недоступна. Можно создать новый КМЖ.");
      router.replace("/dashboard/ai/kmzh", { scroll: false }); return;
    }
    setError(teacherError(job.error));
  }, [currentJobId, job.data, job.error, kk, router, teacherError]);

  const generate = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    const payload = cleanLessonRequest(draft);
    if (!payload.subject || !payload.grade || !payload.topic) {
      setError(kk ? "Пәнді, сыныпты және сабақ тақырыбын толтырыңыз." : "Укажите предмет, класс и тему урока."); return;
    }
    if (payload.duration != null && (!Number.isInteger(payload.duration) || payload.duration < 10 || payload.duration > 180)) {
      setError(kk ? "Сабақ ұзақтығы 10–180 минут болуы керек." : "Продолжительность урока должна быть от 10 до 180 минут."); return;
    }
    if (!validStudentCount(payload.student_count)) {
      setError(kk ? "Оқушылар саны 1–1000 аралығындағы бүтін сан болуы керек немесе бос қалсын." : "Укажите целое количество учеников от 1 до 1000 или оставьте поле пустым."); return;
    }
    setSubmitting(true);
    try {
      const created = await enqueueGenerationJob("kmzh.generate", payload as unknown as Record<string, unknown>, { title: payload.topic });
      setSessionJobId(created.id); loadedJobId.current = null; setPlan(null);
      queryClient.setQueryData(["generation-job", created.id], created);
      router.replace(`/dashboard/ai/kmzh?job=${encodeURIComponent(created.id)}`, { scroll: false });
    } catch (failure) {
      setError(failure instanceof InsufficientTokensError
        ? (kk ? `Монета жеткіліксіз. Қажет: ${failure.required}, бар: ${failure.available}.` : `Недостаточно монет. Требуется: ${failure.required}, доступно: ${failure.available}.`)
        : teacherError(failure));
    } finally { setSubmitting(false); }
  };

  const exportDocument = async () => {
    if (!plan || exporting) return;
    setExporting(true); setError("");
    try {
      const blob = await exportLessonPlanDocx(lessonExportPayload(plan));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url;
      link.download = `kmzh_${plan.meta.subject}_${plan.meta.grade}.docx`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) { setError(teacherError(failure, kk ? "Word файлын жүктеу мүмкін болмады. Өзгерістер осы бетте қалды — қайталап көріңіз." : "Не удалось скачать Word. Изменения остались на этой странице — попробуйте снова.")); }
    finally { setExporting(false); }
  };

  const createNew = () => {
    const store = lessonSessionStore();
    if (store) clearLessonSession(store, userId, currentJobId ?? undefined);
    setSessionJobId(null); loadedJobId.current = null; setPlan(null); setError(""); setDraft(createLessonDraft());
    router.replace("/dashboard/ai/kmzh", { scroll: false });
  };
  const acknowledged = isAcknowledgedGenerationJob(job.data, currentJobId, ["kmzh.generate"]);
  const progress = Boolean(currentJobId && (job.isLoading || (acknowledged && job.data && isActiveGenerationJob(job.data))));

  if (storageReady !== persistenceScope) return <p role="status" className="p-8 text-slate-600">{kk ? "ҚМЖ ашылуда…" : "Открываем КМЖ…"}</p>;

  return <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
    <div className="mx-auto max-w-7xl space-y-6">
      <header><h1 className="text-3xl font-bold text-slate-900">{kk ? "Ашық сабаққа ҚМЖ" : "КМЖ открытого урока"}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{kk ? "Оқу мақсатына сәйкес нақты тапсырмалар, бағалау және қолдау. Дайын жоспарды өңдеп, Word форматында жүктеңіз." : "Конкретные задания, оценивание и поддержка по учебным целям. Готовый план можно отредактировать и скачать в Word."}</p></header>
      {storageFailed ? <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{kk ? "Браузер деректерді осы қойындыда сақтай алмады. Бетті жаппас бұрын дайын жоспарды жүктеп алыңыз." : "Браузер не смог сохранить данные в этой вкладке. Скачайте готовый план перед закрытием страницы."}</p> : restoredNotice ? <p role="status" className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-6 text-sky-900">{restoredNotice === "images" ? (kk ? "Мәтіндік деректер қалпына келтірілді. Оқулық суреттерін қайта тіркеңіз." : "Текстовые данные восстановлены. Прикрепите изображения учебника повторно.") : restoredNotice === "edits" ? (kk ? "Осы қойындыда сақталған жоспар түзетулері қалпына келтірілді." : "Восстановлены правки плана, сохранённые в этой вкладке.") : (kk ? "Осы қойындыдағы ҚМЖ жобасы қалпына келтірілді." : "Восстановлен черновик КМЖ из этой вкладки.")}</p> : null}
      {progress ? <section aria-live="polite" className="rounded-3xl border border-sky-200 bg-white p-8 text-center shadow-sm"><h2 className="text-xl font-bold">{kk ? "ҚМЖ жасалып жатыр" : "Создаём КМЖ"}</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">{generationServerStatusCopy(language, acknowledged)}</p><div className="mx-auto mt-6 h-2 max-w-xl overflow-hidden rounded-full bg-sky-100"><div className="h-full w-1/2 rounded-full bg-sky-500 motion-safe:animate-pulse" /></div>{error ? <div className="mt-4"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" onClick={() => void job.refetch()} className={`${buttonClass} mt-3`}>{kk ? "Күйін қайта тексеру" : "Проверить состояние снова"}</button></div> : null}</section>
        : plan ? <PlannerEditor plan={plan} onChange={setPlan} kk={kk} onExport={() => void exportDocument()} exporting={exporting} onNew={createNew} error={error} />
        : <PlannerForm draft={draft} onChange={setDraft} onSubmit={(event) => void generate(event)} busy={submitting} kk={kk} cost={costs.kmzh_generate} balance={balance} error={error} />}
      <ModuleGenerationHistory kinds={["kmzh.generate"]} title={{ ru: "Мои КМЖ", kk: "Менің ҚМЖ-ларым" }} />
    </div>
  </div>;
}

function LessonPlanContent() {
  const { user, loading } = useAuth();
  if (loading) return <p role="status" className="p-8 text-slate-600">ҚМЖ · Загрузка…</p>;
  return <LessonPlanner key={user?.userId ?? "anonymous"} userId={user?.userId ?? null} />;
}

export default function LessonPlanPage() {
  return <Suspense fallback={<div role="status" className="p-8 text-slate-600">ҚМЖ · Загрузка…</div>}><LessonPlanContent /></Suspense>;
}
