"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { currentSessionUserId, useTokens } from "@/hooks/useTokens";
import { cancelGenerationJob, clearGenerationIntentForJob, enqueueGenerationJob, getGenerationJob, listGenerationJobs } from "@/lib/api";
import { generationJobIdFromSearchParam, isUnavailableGenerationJobError } from "@/lib/generation-history";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { blankMeeting, isMeetingDraft, isMeetingResult, meetingSubmission, MEETING_KIND, MEETING_PATH } from "./model";
import MeetingForm from "./MeetingForm";
import MeetingResult from "./MeetingResult";
import { Icon, MeetingArtwork } from "./ui";
import { focusMeetingProblem, meetingListProblems } from "./validation";
import s from "./parent-meetings.module.css";

const TERMINAL = new Set(["completed", "failed", "cancelled", "billing_error"]);

export default function MeetingWorkspace() {
  const { user } = useAuth();
  return user ? <MeetingSession key={user.userId} userId={user.userId} /> : null;
}

function MeetingSession({ userId }: { userId: string }) {
  const { language } = useLanguage();
  const router = useRouter(); const params = useSearchParams(); const cache = useQueryClient();
  const { balance, costs, refreshBalance } = useTokens();
  const t = (ru: string, kk: string) => language === "kk" ? kk : ru;
  const [input, setInput] = useState(blankMeeting); const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false); const [cancelling, setCancelling] = useState(false);
  const loaded = useRef(false); const submissionLock = useRef(false); const handled = useRef<string | null>(null);
  const draftKey = `sanduai:parent-meeting-draft:v1:${userId}`;
  const rawJobId = params.get("job"); const jobId = generationJobIdFromSearchParam(rawJobId);
  const queryKey = ["parent-meeting-job", userId, jobId];
  const job = useQuery({ queryKey, queryFn: () => getGenerationJob(jobId!), enabled: Boolean(jobId),
    retry: (count, reason) => !isUnavailableGenerationJobError(reason) && count < 2,
    refetchInterval: query => query.state.status === "error" || (query.state.data && TERMINAL.has(query.state.data.status)) ? false : 1800 });
  const history = useInfiniteQuery({ queryKey: ["parent-meeting-history", userId], initialPageParam: 0,
    queryFn: ({ pageParam }) => listGenerationJobs({ kind: MEETING_KIND, limit: 12, offset: pageParam }), enabled: historyOpen,
    getNextPageParam: (last, pages) => last.has_more ? last.next_offset ?? pages.reduce((sum, p) => sum + p.items.length, 0) : undefined, staleTime: 1000 });
  const current = job.data?.kind === MEETING_KIND ? job.data : null;
  const result = current && ["completed", "billing_error"].includes(current.status) && isMeetingResult(current.result) ? current.result : null;
  const active = Boolean(current && !TERMINAL.has(current.status));
  const busy = submitting || active || Boolean(jobId && job.isPending);
  const cost = costs.parent_meeting_generate ?? null;

  useEffect(() => {
    let alive = true;
    queueMicrotask(() => {
      if (!alive) return;
      try { const draft: unknown = JSON.parse(localStorage.getItem(draftKey) ?? "null"); if (isMeetingDraft(draft)) { setInput(draft); setSaved(true); } } catch { /* Storage is optional. */ }
      loaded.current = true;
    });
    return () => { alive = false; };
  }, [draftKey]);
  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => {
      if (currentSessionUserId() !== userId || !isMeetingDraft(input)) return;
      try { localStorage.setItem(draftKey, JSON.stringify(input)); setSaved(true); } catch { setSaved(false); }
    }, 450);
    return () => clearTimeout(timer);
  }, [input, draftKey, userId]);
  useEffect(() => {
    if (!current || !TERMINAL.has(current.status) || handled.current === current.id) return;
    handled.current = current.id;
    clearGenerationIntentForJob(current.id); void refreshBalance();
    void cache.invalidateQueries({ queryKey: ["parent-meeting-history", userId] });
  }, [current, refreshBalance, cache, userId]);

  async function generate() {
    if (submissionLock.current || busy) return;
    let submission: ReturnType<typeof meetingSubmission>;
    try { submission = meetingSubmission(input); }
    catch {
      const problems = meetingListProblems(input, language);
      setError(problems.length ? t("Исправьте отмеченные поля. Все введённые данные остаются в форме.", "Белгіленген өрістерді түзетіңіз. Енгізілген мәліметтер формада қалады.") : t("Проверьте тему, класс или группу, числовые параметры и согласие с условиями.", "Тақырыпты, сыныпты не топты, сандық параметрлерді және шарттарды қабылдауды тексеріңіз."));
      requestAnimationFrame(() => { if (currentSessionUserId() === userId) focusMeetingProblem(problems[0]?.targetId ?? "meeting-form-error"); });
      return;
    }
    submissionLock.current = true; setSubmitting(true); setError(null);
    try {
      const accepted = await enqueueGenerationJob(MEETING_KIND, submission.payload, { title: submission.title });
      if (currentSessionUserId() !== userId) return;
      cache.setQueryData(["parent-meeting-job", userId, accepted.id], accepted);
      router.replace(`${MEETING_PATH}?job=${accepted.id}`, { scroll: false });
    } catch (reason) { if (currentSessionUserId() === userId) setError(teacherFacingErrorMessage(reason, language)); }
    finally { submissionLock.current = false; if (currentSessionUserId() === userId) setSubmitting(false); }
  }
  async function cancel() {
    if (!current) return;
    setCancelling(true); setError(null);
    try { const next = await cancelGenerationJob(current.id); if (currentSessionUserId() === userId) cache.setQueryData(["parent-meeting-job", userId, current.id], next); }
    catch (reason) { if (currentSessionUserId() === userId) setError(teacherFacingErrorMessage(reason, language)); }
    finally { if (currentSessionUserId() === userId) setCancelling(false); }
  }
  const historyItems = [...new Map((history.data?.pages.flatMap(p => p.items) ?? []).map(x => [x.id, x])).values()];
  const statusLabel = (status: string) => status === "completed" ? t("Готово", "Дайын") : status === "failed" ? t("Не удалось подготовить", "Дайындау мүмкін болмады") : status === "cancelled" ? t("Отменено", "Бас тартылды") : status === "billing_error" ? t("Материал сохранён", "Материал сақталды") : t("Готовится", "Дайындалуда");
  return <div className={s.workspace}>
    <header className={s.hero}><div><p className={s.eyebrow}>SANDUAI PARENT MEETING PRO</p><h1>{t("Родительское собрание,\nк которому всё готово", "Бәрі дайын\nата-аналар жиналысы")}</h1><p className={s.intro}>{t("Создайте встречу, где родители слышат друг друга и находят решения вместе. Сценарий, слова ведущего и полный пакет материалов — под вашу тему и возраст детей.", "Ата-аналар бірін-бірі тыңдап, ортақ шешім табатын кездесу жасаңыз. Тақырыбыңыз бен балалардың жасына сай сценарий, жүргізуші сөзі және толық материалдар жинағы.")}</p><div className={s.heroMeta}><span><Icon name="team" />{t("Для школы и детского сада", "Мектеп пен балабақшаға")}</span><span><Icon name="clock" />{t("Точный тайминг", "Нақты уақыт")}</span><span><Icon name="cards" />{t("8 видов материалов", "Материалдың 8 түрі")}</span></div></div><MeetingArtwork /></header>
    <div className={s.topActions}><button type="button" className={s.secondary} onClick={() => setHistoryOpen(!historyOpen)} aria-expanded={historyOpen} aria-controls="meeting-history"><Icon name="clock" />{t("Мои собрания", "Менің жиналыстарым")}</button>{rawJobId && <button type="button" className={s.secondary} disabled={busy && current?.status !== "refunding"} onClick={() => { setError(null); router.replace(MEETING_PATH, { scroll: false }); }}><Icon name="plus" />{t("Новое собрание", "Жаңа жиналыс")}</button>}<Link className={s.secondary} href={`/dashboard/generations?kind=${MEETING_KIND}`}>{t("Вся история", "Барлық тарих")}<Icon name="arrow" /></Link></div>
    {historyOpen && <section className={s.history} id="meeting-history"><h2>{t("Ваши собрания", "Сіздің жиналыстарыңыз")}</h2>{history.isPending ? <p role="status">{t("Загружаем материалы…", "Материалдар жүктелуде…")}</p> : <><div className={s.historyGrid}>{historyItems.map(x => <button key={x.id} type="button" className={s.historyItem} disabled={busy} onClick={() => { setError(null); setHistoryOpen(false); router.replace(`${MEETING_PATH}?job=${x.id}`, { scroll: false }); }}><Icon name="file" /><strong>{x.title}</strong><small>{new Date(x.created_at).toLocaleDateString(language === "kk" ? "kk-KZ" : "ru-RU")} · {statusLabel(x.status)}</small></button>)}</div>{!historyItems.length && !history.isError && <p className={s.hint}>{t("Первое собрание появится здесь после запуска подготовки.", "Алғашқы жиналыс дайындау басталғаннан кейін осында пайда болады.")}</p>}{history.hasNextPage && <button type="button" className={`${s.secondary} mt-4`} disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>{t("Показать ещё", "Тағы көрсету")}</button>}</>}{history.isError && <div className={s.error} role="alert">{teacherFacingErrorMessage(history.error, language)}<button type="button" className={`${s.secondary} ml-3`} onClick={() => void history.refetch()}>{t("Повторить", "Қайталау")}</button></div>}</section>}
    {rawJobId && !jobId && <div role="alert" className={s.error}>{t("Ссылка на собрание некорректна. Откройте материал из истории или создайте новый.", "Жиналыс сілтемесі қате. Материалды тарихтан ашыңыз немесе жаңасын жасаңыз.")}</div>}
    {job.isError && <div role="alert" className={s.error}><p>{teacherFacingErrorMessage(job.error, language)}</p><button type="button" className={`${s.secondary} mt-3`} onClick={() => void job.refetch()}>{t("Проверить снова", "Қайта тексеру")}</button></div>}
    {job.data && !current && <div role="alert" className={s.error}>{t("Это материал другого раздела. Откройте его в общей истории.", "Бұл басқа бөлімнің материалы. Оны жалпы тарихтан ашыңыз.")}</div>}
    {current?.status === "billing_error" && result && <div role="status" className={s.notice}>{t("Пакет сохранён. Проверка оплаты ещё не завершена; повторная генерация не требуется.", "Жинақ сақталды. Төлемді тексеру әлі аяқталған жоқ; қайта жасау қажет емес.")}</div>}
    {current && TERMINAL.has(current.status) && !result && <div role="alert" className={s.error}><strong>{statusLabel(current.status)}</strong><p>{current.status === "failed" ? t("Попробуйте ещё раз. Статус возврата токенов доступен в общей истории.", "Қайталап көріңіз. Токендердің қайтарылу күйі жалпы тарихта көрсетіледі.") : current.status === "cancelled" ? t("Можно изменить параметры и создать новую встречу.", "Параметрлерді өзгертіп, жаңа кездесу жасауға болады.") : t("Сохранённый результат пока недоступен. Проверьте общую историю.", "Сақталған нәтиже әзірге қолжетімсіз. Жалпы тарихты тексеріңіз.")}</p></div>}
    {busy ? <section role="status" aria-live="polite" className={s.loading}><div className={s.loader} aria-hidden="true" /><h2>{submitting ? t("Передаём вашу идею…", "Идеяңызды жіберудеміз…") : current?.status === "refunding" ? t("Возвращаем токены", "Токендер қайтарылуда") : current?.status === "settling" ? t("Сохраняем готовый пакет", "Дайын жинақ сақталуда") : current ? t("Готовим встречу с родителями", "Ата-аналармен кездесуді дайындаудамыз") : t("Открываем ваше собрание…", "Жиналысыңызды ашудамыз…")}</h2><p>{submitting ? t("Дождитесь подтверждения приёма задания.", "Тапсырманың қабылдануын күтіңіз.") : current?.status === "refunding" ? t("Подготовка остановлена. Возврат выполняется автоматически; статус сохранится в истории. Можно создать новое собрание.", "Дайындау тоқтатылды. Токендер автоматты түрде қайтарылады; күйі тарихта сақталады. Жаңа жиналыс жасауға болады.") : current?.status === "settling" ? t("Сценарий и материалы готовы. Завершаем сохранение и расчёт.", "Сценарий мен материалдар дайын. Сақтау мен есеп айырысу аяқталуда.") : current ? t("Задание принято. Можно закрыть страницу: подготовка продолжится, а готовый пакет останется в истории.", "Тапсырма қабылданды. Бетті жабуға болады: дайындау жалғасады, дайын жинақ тарихта сақталады.") : t("Загружаем сохранённый материал.", "Сақталған материал жүктелуде.")}</p><div className={s.loadingSteps}><span><Icon name="book" />{t("Сценарий и задания", "Сценарий мен тапсырмалар")}</span><span><Icon name="cards" />{t("Все материалы", "Барлық материалдар")}</span><span><Icon name="shield" />{t("Проверка качества", "Сапаны тексеру")}</span></div>{current && <p>{current.status === "queued" ? t("Собрание в очереди на подготовку.", "Жиналыс дайындау кезегінде.") : current.status === "refunding" ? t("Подготовка не завершена. Возвращаем токены.", "Дайындау аяқталмады. Токендер қайтарылуда.") : current.status === "settling" ? t("Сохраняем пакет и завершаем расчёт.", "Жинақ сақталып, есеп айырысу аяқталуда.") : t("Пишем реплики, задания и материалы. Подготовка может занять несколько минут.", "Сөздерді, тапсырмалар мен материалдарды жазудамыз. Дайындау бірнеше минут алуы мүмкін.")}</p>}{error && <div className={s.error} role="alert">{error}</div>}{current?.status === "queued" && <button type="button" className={s.secondary} disabled={cancelling || current.cancel_requested} onClick={() => void cancel()}>{cancelling || current.cancel_requested ? t("Отмена запрошена…", "Бас тарту сұралды…") : t("Отменить подготовку", "Дайындаудан бас тарту")}</button>}</section>
      : result && current ? <MeetingResult key={current.id} result={result} job={current} language={language} />
      : <MeetingForm input={input} onChange={next => { setInput(next); setSaved(false); setError(null); }} onSubmit={() => void generate()} language={language} cost={cost} balance={balance} busy={submitting} saved={saved} error={error} />}
  </div>;
}
