"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getGenerationJob } from "@/lib/api";
import { useTokens } from "@/hooks/useTokens";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { generationJobIdFromSearchParam, isUnavailableGenerationJobError } from "@/lib/generation-history";
import { actOnCompetitionWork, generateCompetition, getCompetitionConfig, getCompetitionWork, listCompetitionWorks, type CompetitionInput, type CompetitionWork } from "./api";
import CompetitionWizard, { blankCompetitionInput } from "./CompetitionWizard";
import CompetitionResult from "./CompetitionResult";
import { Icon, primaryClass, secondaryClass } from "./ui";

const PATH = "/dashboard/ai/pedagogical-ideas";
const terminal = ["completed", "failed", "cancelled", "billing_error"];

export default function CompetitionWorkspace() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = (ru: string, kk: string) => language === "kk" ? kk : ru;
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { balance, refreshBalance } = useTokens();
  const [input, setInput] = useState<CompetitionInput>(() => blankCompetitionInput(language));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const draftLoaded = useRef(false);
  const handledJob = useRef<string | null>(null);
  const draftKey = `sanduai:competition-draft:v1:${user?.userId ?? "guest"}`;
  const jobId = generationJobIdFromSearchParam(params.get("competitionJob"));
  const workId = generationJobIdFromSearchParam(params.get("work"));
  const config = useQuery({ queryKey: ["competition-config", user?.userId], queryFn: getCompetitionConfig, staleTime: 30_000 });
  const history = useQuery({ queryKey: ["competition-works", user?.userId], queryFn: listCompetitionWorks, staleTime: 5_000 });
  const work = useQuery({ queryKey: ["competition-work", workId, user?.userId], queryFn: () => getCompetitionWork(workId!), enabled: Boolean(workId) });
  const job = useQuery({ queryKey: ["competition-job", jobId, user?.userId], queryFn: () => getGenerationJob(jobId!), enabled: Boolean(jobId), retry: (count, cause) => !isUnavailableGenerationJobError(cause) && count < 2, refetchInterval: query => query.state.status === "error" || (query.state.data && terminal.includes(query.state.data.status)) ? false : 1800 });

  useEffect(() => {
    draftLoaded.current = false;
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(draftKey);
        if (stored) {
          const value = JSON.parse(stored) as CompetitionInput;
          if (typeof value.title === "string" && typeof value.author_idea === "string" && value.experience && value.confirmations && Array.isArray(value.references)) { setInput(value); setSaved(true); }
          else setInput(blankCompetitionInput(language));
        } else setInput(blankCompetitionInput(language));
      } catch { setInput(blankCompetitionInput(language)); }
      draftLoaded.current = true;
    });
    // The draft belongs to the account; changing interface language should not reset it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  useEffect(() => {
    if (!draftLoaded.current) return;
    const timer = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(input)); setSaved(true); } catch { setSaved(false); }
    }, 450);
    return () => clearTimeout(timer);
  }, [input, draftKey]);

  useEffect(() => {
    const data = job.data;
    if (!data || !terminal.includes(data.status) || handledJob.current === data.id) return;
    handledJob.current = data.id;
    void refreshBalance();
    if (data.status === "completed" || data.status === "billing_error") {
      const result = data.result as CompetitionWork | null;
      if (result?.id && result.content?.sections) {
        queryClient.setQueryData(["competition-work", result.id, user?.userId], result);
        void queryClient.invalidateQueries({ queryKey: ["competition-works", user?.userId] });
        router.replace(`${PATH}?work=${encodeURIComponent(result.id)}`, { scroll: false });
      } else queueMicrotask(() => setError(language === "kk" ? "Нәтиже құрылымы жарамсыз. Қайта ашып көріңіз." : "Не удалось открыть материал. Обновите страницу."));
    } else queueMicrotask(() => setError(language === "kk" ? "Материалды дайындау аяқталмады. Тапсырманы қайта жіберуге болады." : "Подготовка не завершилась. Можно отправить задачу снова."));
  }, [job.data, language, queryClient, refreshBalance, router, user?.userId]);

  const busy = submitting || Boolean(jobId && !job.isError && (!job.data || !terminal.includes(job.data.status)));
  const preset = config.data?.items.find(item => item.competition_id === input.competition_id);
  const cost = preset?.token_cost ?? 10;

  const create = async () => {
    setError(null); setSubmitting(true); setActiveAction("generate");
    try {
      const accepted = await generateCompetition(input, crypto.randomUUID());
      queryClient.setQueryData(["competition-job", accepted.id, user?.userId], accepted);
      router.replace(`${PATH}?competitionJob=${encodeURIComponent(accepted.id)}`, { scroll: false });
      void refreshBalance();
    } catch (cause) { setError(teacherFacingErrorMessage(cause, language)); }
    finally { setSubmitting(false); }
  };

  const action = async (kind: "rewrite" | "defense" | "slides" | "video_plan") => {
    if (!work.data) return;
    setError(null); setSubmitting(true); setActiveAction(kind);
    try {
      const accepted = await actOnCompetitionWork(work.data.id, work.data.version, kind, crypto.randomUUID());
      queryClient.setQueryData(["competition-job", accepted.id, user?.userId], accepted);
      router.replace(`${PATH}?work=${work.data.id}&competitionJob=${accepted.id}`, { scroll: false });
      void refreshBalance();
    } catch (cause) { setError(teacherFacingErrorMessage(cause, language)); }
    finally { setSubmitting(false); }
  };

  const updateWork = (value: CompetitionWork) => {
    queryClient.setQueryData(["competition-work", value.id, user?.userId], value);
    void queryClient.invalidateQueries({ queryKey: ["competition-works", user?.userId] });
  };

  return <div className="space-y-6">
    <header className="relative overflow-hidden rounded-3xl border border-[#e8e3df] bg-[#fcfaf7] px-6 py-7 sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute -right-12 -top-28 size-80 rounded-full border-[45px] border-[#efebe7]/50" />
      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ba7c5e]"><span className="size-1.5 rounded-full bg-[#cf906c]" />{t("От практики — к признанию", "Тәжірибеден — табысқа")}</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#272744] sm:text-[38px]">{t("Педагогическая идея", "Педагогикалық идея")}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#85818b]">{t("Оформите свой опыт в сильную конкурсную работу. С авторским голосом, понятной структурой и реальными доказательствами.", "Тәжірибеңізді мазмұнды байқау жұмысына айналдырыңыз. Авторлық үніңіз, түсінікті құрылымы және нақты дәлелдерімен.")}</p><div className="mt-5 flex flex-wrap gap-4 text-[11px] text-[#7a7787]"><span className="flex items-center gap-1.5"><Icon name="shield" className="size-3.5 text-emerald-500" />{t("Ваш авторский опыт", "Авторлық тәжірибеңіз")}</span><span className="flex items-center gap-1.5"><Icon name="book" className="size-3.5 text-indigo-400" />{t("Правила по годам", "Жыл бойынша ережелер")}</span><span className="flex items-center gap-1.5"><Icon name="check" className="size-3.5 text-orange-400" />{t("Проверка перед экспортом", "Экспорт алдында тексеру")}</span></div></div>
        <div className="flex flex-wrap gap-2"><button type="button" className={secondaryClass} onClick={() => setShowHistory(!showHistory)} aria-expanded={showHistory}><Icon name="clock" className="size-4" />{t("Мои работы", "Менің жұмыстарым")}<span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px]">{history.data?.total ?? 0}</span></button>{(workId || jobId) && <button type="button" disabled={busy} className={secondaryClass} onClick={() => { router.replace(PATH); setError(null); }}><Icon name="plus" className="size-4" />{t("Новая идея", "Жаңа идея")}</button>}</div>
      </div>
    </header>

    {showHistory && <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-900">{t("Ваши конкурсные материалы", "Сіздің байқау материалдарыңыз")}</h2><button type="button" onClick={() => setShowHistory(false)} aria-label={t("Закрыть историю", "Тарихты жабу")} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><Icon name="close" className="size-4" /></button></div>{history.isLoading ? <p className="text-sm text-slate-400">{t("Загружаем…", "Жүктелуде…")}</p> : history.isError ? <p role="alert" className="text-sm text-rose-700">{teacherFacingErrorMessage(history.error, language)}</p> : !history.data?.items.length ? <p className="py-4 text-sm text-slate-400">{t("Здесь появится ваша первая работа. Начните с выбора конкурса.", "Алғашқы жұмысыңыз осы жерде пайда болады. Байқауды таңдаудан бастаңыз.")}</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{history.data.items.map(item => <button key={item.id} type="button" disabled={busy} onClick={() => { router.replace(`${PATH}?work=${encodeURIComponent(item.id)}`); setShowHistory(false); setError(null); }} className="rounded-xl border border-slate-100 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"><div className="flex items-start gap-3"><span className="mt-0.5 rounded-lg bg-indigo-50 p-2 text-indigo-400"><Icon name="file" className="size-4" /></span><div className="min-w-0"><h3 className="line-clamp-2 text-sm font-medium text-slate-800">{item.title}</h3><p className="mt-2 text-[11px] text-slate-400">{item.competition_id.includes("FESTIVAL") ? t("Фестиваль", "Фестиваль") : t("Панорама", "Панорама")} · {new Date(item.updated_at).toLocaleDateString(language === "kk" ? "kk-KZ" : "ru-RU")}</p></div></div></button>)}</div>}</section>}

    {busy && <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-[#fafaff] p-6" aria-live="polite"><div className="flex items-start gap-4"><span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-indigo-500"><Icon name="spark" /><span className="absolute inset-0 animate-ping rounded-2xl border border-indigo-200 motion-reduce:animate-none" /></span><div><h2 className="font-semibold text-[#35355c]">{activeAction === "generate" || !workId ? t("Структурируем ваш авторский опыт", "Авторлық тәжірибеңізді құрылымдаудамыз") : t("Подготавливаем материал для защиты", "Қорғау материалын дайындаудамыз")}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{t("Можно закрыть страницу: задача продолжится на сервере. Ссылка сохраняет доступ к этой подготовке.", "Бетті жабуға болады: тапсырма серверде жалғасады. Сілтеме осы дайындауға қолжетімділікті сақтайды.")}</p><p className="mt-3 text-[11px] font-medium text-indigo-500">{job.data?.progress?.message || t("Проверяем структуру и сохраняем результат…", "Құрылымды тексеріп, нәтижені сақтаудамыз…")}</p></div></div></section>}

    {job.isError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{teacherFacingErrorMessage(job.error, language)}<button type="button" className={secondaryClass} onClick={() => void job.refetch()}>{t("Проверить задачу", "Тапсырманы тексеру")}</button></div>}
    {workId ? work.isLoading ? <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white" /> : work.isError ? <div role="alert" className="rounded-xl bg-rose-50 p-5 text-rose-700">{teacherFacingErrorMessage(work.error, language)}<button className={`${secondaryClass} ml-3`} onClick={() => void work.refetch()}>{t("Повторить", "Қайталау")}</button></div> : work.data && <CompetitionResult key={work.data.id} work={work.data} language={language} onUpdate={updateWork} onAction={action} busy={busy} error={error} /> : config.isLoading ? <div className="grid gap-6 xl:grid-cols-[1fr_280px]"><div className="h-[560px] animate-pulse rounded-3xl bg-white" /><div className="h-80 animate-pulse rounded-3xl bg-white" /></div> : config.isError ? <section className="rounded-3xl border border-rose-100 bg-white p-8 text-center"><p role="alert" className="text-sm text-rose-700">{teacherFacingErrorMessage(config.error, language)}</p><button type="button" className={`${primaryClass} mt-5`} onClick={() => void config.refetch()}>{t("Загрузить правила снова", "Ережені қайта жүктеу")}</button></section> : <CompetitionWizard language={language} presets={[...(config.data?.items ?? [])].sort((a, b) => a.kind === b.kind ? b.year - a.year : a.kind === "panorama" ? -1 : 1)} input={input} onChange={value => { setInput(value); setSaved(false); setError(null); }} onGenerate={() => void create()} busy={busy} saved={saved} cost={cost} error={error} balance={balance} />}
  </div>;
}
