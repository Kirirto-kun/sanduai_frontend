"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { getGenerationJob } from "@/lib/api";
import { currentSessionUserId, useTokens } from "@/hooks/useTokens";
import { generationJobIdFromSearchParam, isUnavailableGenerationJobError } from "@/lib/generation-history";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import type { Action, MasterclassInput, MasterclassWork, Topic } from "./types";
import { actOnMasterclass, generateMasterclass, getMasterclassConfig, getMasterclassWork, listMasterclassWorks, suggestMasterclassTopics } from "./api";
import { alignMasterclassInput, blankMasterclassInput, isMasterclassDraft, masterclassInputIsValid } from "./flow";
import { MASTERCLASS_HISTORY_PAGE_SIZE, nextHistoryOffset, uniqueHistoryItems } from "./history-pagination";
import MasterclassWizard from "./MasterclassWizard";
import MasterclassResult from "./MasterclassResult";
import { Icon, MasterclassArtwork, primaryClass, secondaryClass } from "./ui";
const PATH = "/dashboard/ai/masterclasses";
const terminal = ["completed", "failed", "cancelled", "billing_error"];
export default function MasterclassWorkspace() {
  const { user } = useAuth(); const { language } = useLanguage();
  const t = (ru: string, kk: string) => language === "kk" ? kk : ru;
  const router = useRouter(); const params = useSearchParams(); const queryClient = useQueryClient();
  const { balance, refreshBalance } = useTokens();
  const [input, setInput] = useState<MasterclassInput>(() => blankMasterclassInput(language));
  const [topics, setTopics] = useState<Topic[]>([]); const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false);
  const [suggesting, setSuggesting] = useState(false); const [historyOpen, setHistoryOpen] = useState(false);
  const loaded = useRef(false); const handled = useRef<string | null>(null); const topicHandled = useRef<string | null>(null);
  const submission = useRef<{ scope: string; key: string } | null>(null);
  const draftKey = `sanduai:masterclass-draft:v1:${user?.userId ?? "guest"}`;
  const workId = generationJobIdFromSearchParam(params.get("work"));
  const jobId = generationJobIdFromSearchParam(params.get("masterclassJob"));
  const topicJobId = generationJobIdFromSearchParam(params.get("topicsJob"));
  const config = useQuery({ queryKey: ["masterclass-config", user?.userId], queryFn: getMasterclassConfig, enabled: Boolean(user), staleTime: 30_000 });
  const history = useInfiniteQuery({ queryKey: ["masterclass-works", user?.userId, "history"], initialPageParam: 0, queryFn: ({ pageParam }) => listMasterclassWorks(MASTERCLASS_HISTORY_PAGE_SIZE, pageParam), getNextPageParam: (lastPage, _pages, lastOffset) => nextHistoryOffset(lastPage, lastOffset), enabled: Boolean(user), staleTime: 5000 });
  const historyItems = useMemo(() => uniqueHistoryItems(history.data?.pages ?? []), [history.data]);
  const historyTotal = history.data?.pages[0]?.total ?? 0;
  const work = useQuery({ queryKey: ["masterclass-work", workId, user?.userId], queryFn: () => getMasterclassWork(workId!), enabled: Boolean(workId && user) });
  const job = useQuery({ queryKey: ["masterclass-job", jobId, user?.userId], queryFn: () => getGenerationJob(jobId!), enabled: Boolean(jobId && user), retry: (count, cause) => !isUnavailableGenerationJobError(cause) && count < 2, refetchInterval: query => query.state.status === "error" || (query.state.data && terminal.includes(query.state.data.status)) ? false : 1800 });
  const topicJob = useQuery({ queryKey: ["masterclass-topic-job", topicJobId, user?.userId], queryFn: () => getGenerationJob(topicJobId!), enabled: Boolean(topicJobId && user), retry: (count, cause) => !isUnavailableGenerationJobError(cause) && count < 2, refetchInterval: query => query.state.status === "error" || (query.state.data && terminal.includes(query.state.data.status)) ? false : 1800 });
  useEffect(() => {
    loaded.current = false; handled.current = null; topicHandled.current = null; submission.current = null;
    queueMicrotask(() => {
      try { const stored = JSON.parse(localStorage.getItem(draftKey) ?? "null") as unknown; setInput(isMasterclassDraft(stored) ? stored : blankMasterclassInput(language)); setSaved(Boolean(isMasterclassDraft(stored))); } catch { setInput(blankMasterclassInput(language)); setSaved(false); }
      setTopics([]); setError(null); loaded.current = true;
    });
    // An account draft keeps its chosen content language across interface-language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);
  useEffect(() => {
    if (!config.data) return;
    const currentConfig = config.data;
    queueMicrotask(() => { if (loaded.current) setInput(value => alignMasterclassInput(value, currentConfig)); });
  }, [config.data, draftKey]);
  useEffect(() => { if (!loaded.current || !user) return; const timer = setTimeout(() => { try { localStorage.setItem(draftKey, JSON.stringify(input)); setSaved(true); } catch { setSaved(false); } }, 450); return () => clearTimeout(timer); }, [input, draftKey, user]);
  useEffect(() => {
    const data = job.data; if (!data || !terminal.includes(data.status) || handled.current === data.id) return;
    handled.current = data.id; void refreshBalance();
    if (["completed", "billing_error"].includes(data.status)) {
      const result = data.result as MasterclassWork | null;
      if (result?.id && Array.isArray(result.content?.stages)) { queryClient.setQueryData(["masterclass-work", result.id, user?.userId], result); void queryClient.invalidateQueries({ queryKey: ["masterclass-works", user?.userId] }); router.replace(`${PATH}?work=${result.id}`, { scroll: false }); }
      else queueMicrotask(() => setError(t("Не удалось открыть результат. Обновите страницу.", "Нәтижені ашу мүмкін болмады. Бетті жаңартыңыз.")));
    } else queueMicrotask(() => setError(t("Подготовка не завершилась. Проверьте баланс и попробуйте отправить задачу снова.", "Дайындау аяқталмады. Балансты тексеріп, тапсырманы қайта жіберіңіз.")));
    // Result handling belongs to the accepted job, not the current interface wording.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.data, user?.userId, queryClient, refreshBalance, router]);
  useEffect(() => {
    const data = topicJob.data; if (!data || !terminal.includes(data.status) || topicHandled.current === data.id) return;
    topicHandled.current = data.id; void refreshBalance();
    const result = data.result as { topics?: Topic[] } | null;
    queueMicrotask(() => { if (["completed", "billing_error"].includes(data.status) && result?.topics?.length === 10) setTopics(result.topics); else setError(t("Не удалось подготовить темы. Вы можете написать свою тему или повторить запрос.", "Тақырыптарды дайындау мүмкін болмады. Өз тақырыбыңызды жазыңыз немесе қайта сұраңыз.")); });
    // Keep the URL while reviewing suggestions so a refresh can restore the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicJob.data, refreshBalance]);
  const busy = submitting || Boolean(jobId && !job.isError && (!job.data || !terminal.includes(job.data.status)));
  const topicsBusy = suggesting || Boolean(topicJobId && !topicJob.isError && (!topicJob.data || !terminal.includes(topicJob.data.status)));
  const idempotencyKey = (scope: string) => { if (submission.current?.scope !== scope) submission.current = { scope, key: crypto.randomUUID() }; return submission.current.key; };
  const create = async () => {
    if (!config.data || !masterclassInputIsValid(input, config.data)) return;
    const owner = user?.userId; setError(null); setSubmitting(true);
    try { const accepted = await generateMasterclass(input, idempotencyKey(JSON.stringify([owner, "generate", input]))); if (currentSessionUserId() !== owner) return; submission.current = null; queryClient.setQueryData(["masterclass-job", accepted.id, owner], accepted); router.replace(`${PATH}?masterclassJob=${accepted.id}`, { scroll: false }); void refreshBalance(); }
    catch (cause) { if (currentSessionUserId() === owner) setError(teacherFacingErrorMessage(cause, language)); } finally { setSubmitting(false); }
  };
  const suggest = async () => {
    if (!config.data) return; const owner = user?.userId; setError(null); setSuggesting(true);
    const payload = { ...input, direction_ids: input.direction_ids.length ? input.direction_ids : [config.data.directions[0].id] };
    try { const accepted = await suggestMasterclassTopics(payload, idempotencyKey(JSON.stringify([owner, "topics", payload]))); if (currentSessionUserId() !== owner) return; submission.current = null; queryClient.setQueryData(["masterclass-topic-job", accepted.id, owner], accepted); router.replace(`${PATH}?topicsJob=${accepted.id}`, { scroll: false }); void refreshBalance(); }
    catch (cause) { if (currentSessionUserId() === owner) setError(teacherFacingErrorMessage(cause, language)); } finally { setSuggesting(false); }
  };
  const action = async (value: Action) => {
    if (!work.data || !config.data) return; if (balance !== null && balance < (config.data?.action_token_cost ?? work.data.config_snapshot.action_token_cost)) { setError(t("Недостаточно монет для этого действия.", "Бұл әрекетке монета жеткіліксіз.")); return; }
    const owner = user?.userId; setError(null); setSubmitting(true);
    try { const accepted = await actOnMasterclass(work.data, value, idempotencyKey(JSON.stringify([owner, work.data.id, work.data.version, value]))); if (currentSessionUserId() !== owner) return; submission.current = null; queryClient.setQueryData(["masterclass-job", accepted.id, owner], accepted); router.replace(`${PATH}?work=${work.data.id}&masterclassJob=${accepted.id}`, { scroll: false }); void refreshBalance(); }
    catch (cause) { if (currentSessionUserId() === owner) setError(teacherFacingErrorMessage(cause, language)); } finally { setSubmitting(false); }
  };
  const update = (value: MasterclassWork) => { queryClient.setQueryData(["masterclass-work", value.id, user?.userId], value); void queryClient.invalidateQueries({ queryKey: ["masterclass-works", user?.userId] }); };
  return <div className="space-y-6">
    <header className="relative overflow-hidden rounded-3xl border border-[#e0e7d9] bg-[#f8faf3] p-6 sm:p-8"><div className="relative flex flex-wrap items-start justify-between gap-5"><div className="max-w-xl"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#a89171]"><span className="size-1.5 rounded-full bg-[#bca17e]" />{t("Создавайте опыт, который запомнят", "Есте қалатын тәжірибе жасаңыз")}</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] text-[#2b433a] sm:text-[38px]">{t("Мастер-класс", "Мастер-класс")}</h1><p className="mt-3 text-sm leading-6 text-[#879286]">{t("От идеи до встречи, на которой делают. Сценарий, практика и материалы — в одном пространстве.", "Идеядан әрекетке толы кездесуге дейін. Сценарий, практика мен материалдар — бір кеңістікте.")}</p><div className="mt-5 flex flex-wrap gap-4 text-[11px] text-[#859581]">{[t("Точное время", "Нақты уақыт"), t("70–80% практики", "70–80% практика"), t("Готовый продукт", "Дайын өнім")].map(item => <span key={item} className="flex items-center gap-1.5"><Icon name="check" className="size-3.5 text-teal-600" />{item}</span>)}</div></div><div className="hidden 2xl:block"><MasterclassArtwork /></div><div className="flex flex-wrap gap-2"><button type="button" className={secondaryClass} aria-expanded={historyOpen} onClick={() => setHistoryOpen(!historyOpen)}><Icon name="clock" className="size-4" />{t("Мои мастер-классы", "Менің мастер-класстарым")}<span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px]">{historyTotal}</span></button>{(workId || jobId) && <button type="button" disabled={busy} className={secondaryClass} onClick={() => { router.replace(PATH); setError(null); }}><Icon name="plus" className="size-4" />{t("Новый", "Жаңа")}</button>}</div></div></header>
    {historyOpen && <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-700">{t("Ваши сохранённые мастер-классы", "Сақталған мастер-класстарыңыз")}</h2><button type="button" className="rounded-lg p-2 text-slate-400" aria-label={t("Закрыть историю", "Тарихты жабу")} onClick={() => setHistoryOpen(false)}><Icon name="close" className="size-4" /></button></div>
      {history.isPending ? <p className="text-xs text-slate-400">{t("Загружаем…", "Жүктелуде…")}</p> : !historyItems.length && !history.isError ? <p className="py-4 text-xs text-slate-400">{t("Первый мастер-класс появится здесь после создания.", "Алғашқы мастер-класс дайын болған соң осында пайда болады.")}</p> : <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{historyItems.map(item => <button key={item.id} type="button" disabled={busy} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50/30" onClick={() => { router.replace(`${PATH}?work=${item.id}`); setHistoryOpen(false); setError(null); }}><Icon name="file" className="mb-3 size-5 text-teal-600" /><h3 className="line-clamp-2 text-xs font-semibold leading-6 text-slate-700">{item.title}</h3><p className="mt-2 text-[10px] text-slate-400">{item.duration_minutes} {t("мин", "мин")} · {new Date(item.updated_at).toLocaleDateString(language)}</p></button>)}</div>
        {historyItems.length > 0 && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-[11px] text-slate-400" aria-live="polite">{t(`Показано ${historyItems.length} из ${historyTotal}`, `${historyTotal} жұмыстың ${historyItems.length} көрсетілді`)}</p>{history.hasNextPage && <button type="button" className={secondaryClass} disabled={busy || history.isFetching} onClick={() => void history.fetchNextPage()}>{history.isFetchingNextPage ? t("Загружаем…", "Жүктелуде…") : t("Показать ещё", "Тағы көрсету")}<Icon name="arrow" className="size-3.5" /></button>}</div>}
      </>}
      {history.isError && <div role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-xs leading-6 text-rose-700"><p>{teacherFacingErrorMessage(history.error, language)}</p><button type="button" disabled={history.isFetching} className={`${secondaryClass} mt-3`} onClick={() => void (history.isFetchNextPageError ? history.fetchNextPage() : history.refetch())}>{t("Повторить загрузку", "Жүктеуді қайталау")}</button></div>}
    </section>}
    {(busy || topicsBusy) && <section aria-live="polite" className="rounded-2xl border border-teal-100 bg-[#f2f8f4] p-6"><div className="flex items-start gap-4"><div className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-700"><Icon name="spark" /><span className="absolute inset-0 animate-pulse rounded-xl border border-teal-300 motion-reduce:animate-none" /></div><div><h2 className="text-sm font-semibold text-teal-900">{topicsBusy ? t("Ищем десять сильных тем", "Он мазмұнды тақырып іздеудеміз") : t("Готовим вашу следующую встречу", "Келесі кездесуіңізді дайындаудамыз")}</h2><p className="mt-2 text-xs leading-6 text-teal-800/60">{t("Можно закрыть страницу: принятая задача продолжится на сервере. Эта ссылка вернёт вас к результату.", "Бетті жабуға болады: қабылданған тапсырма серверде жалғасады. Осы сілтеме нәтижеге қайтарады.")}</p><p className="mt-2 text-[11px] text-teal-600">{(topicsBusy ? topicJob.data : job.data)?.status === "queued" ? t("Задание в очереди. Скоро начнём подготовку.", "Тапсырма кезекте. Дайындау жақында басталады.") : t("Проверяем структуру, тайминг и сохраняем материал…", "Құрылым мен уақытты тексеріп, материалды сақтаудамыз…")}</p></div></div></section>}
    {(job.isError || topicJob.isError) && <div role="alert" className="rounded-xl bg-rose-50 p-4 text-xs text-rose-700">{teacherFacingErrorMessage(job.error ?? topicJob.error, language)}<button type="button" className={`${secondaryClass} ml-3`} onClick={() => void (job.isError ? job.refetch() : topicJob.refetch())}>{t("Повторить проверку", "Қайта тексеру")}</button></div>}
    {workId ? work.isPending ? <div className="h-96 animate-pulse rounded-3xl bg-white" /> : work.isError ? <section className="rounded-2xl bg-white p-8"><p role="alert" className="text-sm text-rose-700">{teacherFacingErrorMessage(work.error, language)}</p><button type="button" className={`${secondaryClass} mt-4`} onClick={() => void work.refetch()}>{t("Загрузить снова", "Қайта жүктеу")}</button></section> : <MasterclassResult key={work.data.id} work={work.data} language={language} config={config.data} onUpdate={update} onAction={value => void action(value)} busy={busy || !config.data} error={error} /> : config.isPending ? <div className="grid gap-6 xl:grid-cols-[1fr_280px]"><div className="h-[560px] animate-pulse rounded-3xl bg-white" /><div className="h-72 animate-pulse rounded-3xl bg-white" /></div> : config.isError ? <section className="rounded-3xl bg-white p-8 text-center"><p role="alert" className="text-sm text-rose-700">{teacherFacingErrorMessage(config.error, language)}</p><button type="button" className={`${primaryClass} mt-5`} onClick={() => void config.refetch()}>{t("Загрузить настройки снова", "Параметрлерді қайта жүктеу")}</button></section> : <MasterclassWizard language={language} config={config.data} input={input} onChange={value => { setInput(value); setSaved(false); setError(null); }} onGenerate={() => void create()} onSuggest={() => void suggest()} topics={topics} busy={busy} topicsBusy={topicsBusy} balance={balance} saved={saved} error={error} />}
  </div>;
}
