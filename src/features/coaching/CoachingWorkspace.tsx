"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTokens, currentSessionUserId } from "@/hooks/useTokens";
import { cancelGenerationJob, clearGenerationIntentForJob, enqueueGenerationJob, getGenerationJob, listGenerationJobs } from "@/lib/api";
import { generationJobIdFromSearchParam, isUnavailableGenerationJobError } from "@/lib/generation-history";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { blankCoaching, isCoachingDraft, coachingSubmission, isCoachingResult, COACHING_PATH } from "./model";
import CoachingForm from "./CoachingForm";
import CoachingResult from "./CoachingResult";
import { Icon, CoachingArtwork } from "./ui";
import s from "./coaching.module.css";

const TERMINAL = new Set(["completed", "failed", "cancelled", "billing_error"]);

export default function CoachingWorkspace() {
  const { user } = useAuth();
  return user ? <CoachingSession key={user.userId} userId={user.userId} /> : null;
}

function CoachingSession({ userId }: { userId: string }) {
  const { language } = useLanguage(); const router = useRouter(); const params = useSearchParams(); const cache = useQueryClient();
  const t = (ru: string, kk: string) => language === "kk" ? kk : ru;
  const { balance, costs, refreshBalance, costsError, costsLoading, refreshCosts } = useTokens({ requiredOperation: "coaching_generate" });
  const [input, setInput] = useState(blankCoaching); const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false); const [cancelling, setCancelling] = useState(false);
  const loaded = useRef(false); const submissionLock = useRef(false); const handled = useRef<string | null>(null);
  const draftKey = `sanduai:coaching-draft:v1:${userId}`;
  const rawJobId = params.get("job"); const jobId = generationJobIdFromSearchParam(rawJobId);
  const job = useQuery({ queryKey: ["coaching-job", userId, jobId], queryFn: () => getGenerationJob(jobId!), enabled: Boolean(jobId), retry: (count, reason) => !isUnavailableGenerationJobError(reason) && count < 2, refetchInterval: query => query.state.status === "error" || (query.state.data && TERMINAL.has(query.state.data.status)) ? false : 1800 });
  const history = useInfiniteQuery({ queryKey: ["coaching-history", userId], initialPageParam: 0, queryFn: ({ pageParam }) => listGenerationJobs({ kind: "coaching.generate", limit: 12, offset: pageParam }), enabled: historyOpen, getNextPageParam: (last, pages) => last.has_more ? last.next_offset ?? pages.reduce((sum, p) => sum + p.items.length, 0) : undefined, staleTime: 1000 });
  const current = job.data?.kind === "coaching.generate" ? job.data : null;
  const result = current && ["completed", "billing_error"].includes(current.status) && isCoachingResult(current.result) ? current.result : null;
  const active = Boolean(current && !TERMINAL.has(current.status));
  const busy = submitting || active || Boolean(jobId && job.isPending);
  const listedCost = costs.coaching_generate;
  const cost = Number.isFinite(listedCost) && listedCost >= 0 ? listedCost : null;

  useEffect(() => {
    let alive = true;
    queueMicrotask(() => {
      if (!alive) return;
      try { const draft: unknown = JSON.parse(localStorage.getItem(draftKey) ?? "null"); if (isCoachingDraft(draft)) { setInput(draft); setSaved(true); } } catch { /* Private browsing still permits creating a material. */ }
      loaded.current = true;
    });
    return () => { alive = false; };
  }, [draftKey]);
  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => { if (currentSessionUserId() !== userId || !isCoachingDraft(input)) return; try { localStorage.setItem(draftKey, JSON.stringify(input)); setSaved(true); } catch { setSaved(false); } }, 450);
    return () => clearTimeout(timer);
  }, [input, draftKey, userId]);
  useEffect(() => {
    if (!current || !TERMINAL.has(current.status) || handled.current === current.id) return;
    handled.current = current.id;
    clearGenerationIntentForJob(current.id); void refreshBalance();
    void cache.invalidateQueries({ queryKey: ["coaching-history", userId] });
  }, [current, refreshBalance, cache, userId]);

  async function generate() {
    if (submissionLock.current || busy || cost === null) return;
    if (!isCoachingDraft(input) || input.topic.trim().length < 2 || input.audience.trim().length < 2 || !input.defaults_accepted) {
      setError(t("Проверьте тему, аудиторию, длительность и количество групп. Подтвердите выбранные параметры.", "Тақырыпты, аудиторияны, ұзақтықты және топ санын тексеріп, параметрлерді растаңыз."));
      return;
    }
    submissionLock.current = true; setSubmitting(true); setError(null);
    try {
      const submission = coachingSubmission(input);
      const accepted = await enqueueGenerationJob("coaching.generate", submission.payload, { title: submission.title });
      if (currentSessionUserId() !== userId) return;
      cache.setQueryData(["coaching-job", userId, accepted.id], accepted);
      router.replace(`${COACHING_PATH}?job=${accepted.id}`, { scroll: false });
    } catch (reason) { if (currentSessionUserId() === userId) setError(teacherFacingErrorMessage(reason, language)); }
    finally { submissionLock.current = false; if (currentSessionUserId() === userId) setSubmitting(false); }
  }
  async function cancel() {
    if (!current) return; setCancelling(true); setError(null);
    try { const next = await cancelGenerationJob(current.id); if (currentSessionUserId() === userId) cache.setQueryData(["coaching-job", userId, current.id], next); }
    catch (reason) { if (currentSessionUserId() === userId) setError(teacherFacingErrorMessage(reason, language)); }
    finally { if (currentSessionUserId() === userId) setCancelling(false); }
  }
  const historyItems = [...new Map((history.data?.pages.flatMap(p => p.items) ?? []).map(x => [x.id, x])).values()];
  const statusLabel = (status: string) => status === "completed" ? t("Готово", "Дайын") : status === "failed" ? t("Не удалось создать", "Жасау мүмкін болмады") : status === "cancelled" ? t("Отменено", "Бас тартылды") : status === "billing_error" ? t("Материал сохранён", "Материал сақталды") : t("Готовится", "Дайындалуда");
  return <div className={s.workspace}>
    <header className={s.hero}><div><p className={s.eyebrow}>{t("SANDUAI COACHING PRO", "SANDUAI COACHING PRO")}</p><h1>{t("Конструктор коучинга", "Коучинг конструкторы")}</h1><p className={s.intro}>{t("Превратите важную тему в живую практику для педагогов. Полный сценарий, слова коуча и материалы, с которыми можно сразу провести встречу.", "Маңызды тақырыпты педагогтерге арналған тәжірибеге айналдырыңыз. Кездесуді бірден өткізуге арналған толық сценарий, коуч сөзі және дайын материалдар.")}</p><div className={s.heroMeta}><span><Icon name="check" />{t("Под вашу аудиторию", "Аудиторияңызға сай")}</span><span><Icon name="clock" />{t("С точным таймингом", "Нақты уақытпен")}</span><span><Icon name="shield" />{t("С готовым результатом", "Дайын нәтижемен")}</span></div></div><CoachingArtwork /></header>
    <div className={s.topActions}><button type="button" className={s.secondary} onClick={() => setHistoryOpen(!historyOpen)} aria-expanded={historyOpen} aria-controls="coaching-history"><Icon name="clock" />{t("Мои материалы", "Менің материалдарым")}</button>{rawJobId && <button type="button" disabled={busy} className={s.secondary} onClick={() => { setError(null); router.replace(COACHING_PATH, { scroll: false }); }}><Icon name="plus" />{t("Новый коучинг", "Жаңа коучинг")}</button>}<Link href="/dashboard/generations?kind=coaching.generate" className={s.secondary}>{t("Вся история", "Барлық тарих")}<Icon name="arrow" /></Link></div>
    {historyOpen && <section id="coaching-history" className={s.history}><h2>{t("Ваши коучинги", "Сіздің коучингтеріңіз")}</h2>{history.isPending ? <p role="status">{t("Загружаем материалы…", "Материалдар жүктелуде…")}</p> : <><div className={s.historyGrid}>{historyItems.map(x => <button type="button" key={x.id} disabled={busy} className={s.historyItem} onClick={() => { router.replace(`${COACHING_PATH}?job=${x.id}`, { scroll: false }); setHistoryOpen(false); setError(null); }}><Icon name="file" /><strong>{x.title}</strong><small>{new Date(x.created_at).toLocaleDateString(language === "kk" ? "kk-KZ" : "ru-RU")} · {statusLabel(x.status)}</small></button>)}</div>{!historyItems.length && !history.isError && <p className={s.hint}>{t("Создайте первый коучинг — он появится здесь автоматически.", "Алғашқы коучингті жасаңыз — ол осында автоматты түрде сақталады.")}</p>}{history.hasNextPage && <button type="button" className={`${s.secondary} mt-4`} disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>{t("Показать ещё", "Тағы көрсету")}</button>}</>}{history.isError && <div className={s.error} role="alert">{teacherFacingErrorMessage(history.error, language)}<button type="button" className={`${s.secondary} ml-3`} onClick={() => void history.refetch()}>{t("Повторить", "Қайталау")}</button></div>}</section>}
    {rawJobId && !jobId && <div className={s.error} role="alert">{t("Ссылка на материал некорректна. Откройте встречу из истории.", "Материал сілтемесі қате. Кездесуді тарихтан ашыңыз.")}</div>}
    {job.isError && <div className={s.error} role="alert"><p>{teacherFacingErrorMessage(job.error, language)}</p><button type="button" className={`${s.secondary} mt-3`} onClick={() => void job.refetch()}>{t("Проверить снова", "Қайта тексеру")}</button></div>}
    {job.data && !current && <div className={s.error} role="alert">{t("Это материал другого раздела. Откройте его в общей истории.", "Бұл басқа бөлімнің материалы. Оны жалпы тарихтан ашыңыз.")}</div>}
    {current?.status === "billing_error" && result && <div role="status" className={s.notice}>{t("Материал сохранён. Проверка оплаты ещё не завершена; повторная генерация не требуется.", "Материал сақталды. Төлемді тексеру әлі аяқталған жоқ; қайта жасау қажет емес.")}</div>}
    {current && TERMINAL.has(current.status) && !result && <div role="alert" className={s.error}><strong>{statusLabel(current.status)}</strong><p>{current.status === "failed" ? t("Попробуйте ещё раз. Статус возврата токенов доступен в общей истории.", "Қайталап көріңіз. Токендердің қайтарылу күйі жалпы тарихта көрсетіледі.") : current.status === "cancelled" ? t("Можно изменить параметры и создать новую встречу.", "Параметрлерді өзгертіп, жаңа кездесу жасауға болады.") : t("Результат пока недоступен. Откройте общую историю.", "Нәтиже әзірге қолжетімсіз. Жалпы тарихты ашыңыз.")}</p></div>}
    {busy ? <section className={s.loading} role="status" aria-live="polite"><div className={s.loader} aria-hidden="true" /><h2>{submitting ? t("Передаём вашу идею…", "Идеяңызды жіберудеміз…") : t("Создаём вашу следующую встречу", "Келесі кездесуіңізді жасаудамыз")}</h2><p>{submitting ? t("Дождитесь подтверждения приёма задания.", "Тапсырманың қабылдануын күтіңіз.") : current ? t("Задание принято. Можно закрыть страницу: работа продолжится, а материал останется в истории.", "Тапсырма қабылданды. Бетті жабуға болады: жұмыс жалғасып, материал тарихта сақталады.") : t("Загружаем сохранённое задание…", "Сақталған тапсырма жүктелуде…")}</p><div className={s.loadingSteps}><span><Icon name="book" />{t("Концепция", "Концепция")}</span><span><Icon name="file" />{t("Сценарий и задания", "Сценарий мен тапсырмалар")}</span><span><Icon name="shield" />{t("Проверка качества", "Сапаны тексеру")}</span></div>{current && <p>{current.status === "queued" ? t("Коучинг в очереди на подготовку.", "Коучинг дайындау кезегінде.") : current.status === "refunding" ? t("Подготовка не завершена. Возвращаем токены.", "Дайындау аяқталмады. Токендер қайтарылуда.") : current.status === "settling" ? t("Сохраняем материал и завершаем расчёт.", "Материалды сақтап, есеп айырысуды аяқтаудамыз.") : t("Пишем задания и проверяем структуру. Подготовка может занять несколько минут.", "Тапсырмаларды жазып, құрылымды тексерудеміз. Дайындау бірнеше минут алуы мүмкін.")}</p>}{error && <p role="alert" className={s.error}>{error}</p>}{current && ["queued", "running"].includes(current.status) && <button type="button" className={`${s.secondary} mt-6`} disabled={cancelling || current.cancel_requested} onClick={() => void cancel()}>{cancelling || current.cancel_requested ? t("Отмена запрошена…", "Бас тарту сұралды…") : t("Отменить подготовку", "Дайындаудан бас тарту")}</button>}</section>
      : result && current ? <CoachingResult key={current.id} result={result} job={current} language={language} />
      : <CoachingForm input={input} onChange={next => { setInput(next); setSaved(false); setError(null); }} onSubmit={() => void generate()} language={language} cost={cost} balance={balance} busy={submitting} saved={saved} error={error} costsUnavailable={Boolean(costsError)} costsLoading={costsLoading} onRetryCosts={() => void refreshCosts()} />}
  </div>;
}
