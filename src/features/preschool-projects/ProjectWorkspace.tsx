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
import { blankProject, isProjectDraft, isProjectResult, projectSubmission, selectOutput, PROJECT_KIND, PROJECT_PATH } from "./model";
import ProjectForm from "./ProjectForm";
import ProjectResult from "./ProjectResult";
import { Icon, ProjectArtwork } from "./ui";
import s from "./projects.module.css";

const TERMINAL = new Set(["completed", "failed", "cancelled", "billing_error"]);
function focusField(id: string) {
  const field = document.getElementById(id);
  const details = field?.closest("details");
  if (details) details.open = true;
  field?.focus();
}
export default function ProjectWorkspace() {
  const { user } = useAuth();
  return user ? <ProjectSession key={user.userId} userId={user.userId} /> : null;
}
function ProjectSession({ userId }: { userId: string }) {
  const { language } = useLanguage(); const router = useRouter(); const params = useSearchParams(); const cache = useQueryClient();
  const t = (ru: string, kk: string) => language === "kk" ? kk : ru;
  const { balance, costs, refreshBalance } = useTokens();
  const [input, setInput] = useState(blankProject); const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(params.get("view") === "history"); const [cancelling, setCancelling] = useState(false);
  const loaded = useRef(false); const submissionLock = useRef(false); const handled = useRef<string | null>(null);
  const draftKey = `sanduai:preschool-project-draft:v1:${userId}`;
  const rawJobId = params.get("job"); const jobId = generationJobIdFromSearchParam(rawJobId);
  const job = useQuery({ queryKey: ["preschool-project-job", userId, jobId], queryFn: () => getGenerationJob(jobId!), enabled: Boolean(jobId), retry: (count, reason) => !isUnavailableGenerationJobError(reason) && count < 2, refetchInterval: query => query.state.status === "error" || (query.state.data && TERMINAL.has(query.state.data.status)) ? false : 1800 });
  const history = useInfiniteQuery({ queryKey: ["preschool-project-history", userId], initialPageParam: 0, queryFn: ({ pageParam }) => listGenerationJobs({ kind: PROJECT_KIND, limit: 12, offset: pageParam }), enabled: historyOpen, getNextPageParam: (last, pages) => last.has_more ? last.next_offset ?? pages.reduce((sum, p) => sum + p.items.length, 0) : undefined, staleTime: 1000 });
  const current = job.data?.kind === PROJECT_KIND ? job.data : null;
  const result = current && ["completed", "billing_error"].includes(current.status) && isProjectResult(current.result) ? current.result : null;
  const active = Boolean(current && !TERMINAL.has(current.status));
  const busy = submitting || active || Boolean(jobId && job.isPending);
  const cost = costs.preschool_project_generate ?? null;
  useEffect(() => {
    let alive = true;
    queueMicrotask(() => {
      if (!alive) return;
      try { const draft: unknown = JSON.parse(localStorage.getItem(draftKey) ?? "null"); if (isProjectDraft(draft)) { setInput(selectOutput(draft, draft.output_mode)); setSaved(true); } } catch { /* Draft storage is optional; creating a project remains available. */ }
      loaded.current = true;
    });
    return () => { alive = false; };
  }, [draftKey]);
  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => { if (currentSessionUserId() !== userId || !isProjectDraft(input)) return; try { localStorage.setItem(draftKey, JSON.stringify(input)); setSaved(true); } catch { setSaved(false); } }, 450);
    return () => clearTimeout(timer);
  }, [input, draftKey, userId]);
  useEffect(() => {
    if (!current || !TERMINAL.has(current.status) || handled.current === current.id) return;
    handled.current = current.id;
    clearGenerationIntentForJob(current.id); void refreshBalance();
    void cache.invalidateQueries({ queryKey: ["preschool-project-history", userId] });
  }, [current, refreshBalance, cache, userId]);
  async function generate() {
    if (submissionLock.current || busy) return;
    if (input.output_mode !== "ideas" && input.topic.trim().length < 2) {
      setError(t("Напишите тему проекта: минимум два символа.", "Жоба тақырыбын жазыңыз: кемінде екі таңба болсын."));
      focusField("project-topic"); return;
    }
    if (input.materials.filter(x => x.trim()).length > 25) { setError(t("Укажите не более 25 материалов.", "25 материалдан артық көрсетпеңіз.")); focusField("project-materials"); return; }
    submissionLock.current = true; setSubmitting(true); setError(null);
    try {
      const submission = projectSubmission(input);
      const accepted = await enqueueGenerationJob(PROJECT_KIND, submission.payload, { title: submission.title });
      if (currentSessionUserId() !== userId) return;
      cache.setQueryData(["preschool-project-job", userId, accepted.id], accepted);
      router.replace(`${PROJECT_PATH}?job=${accepted.id}`, { scroll: false });
    } catch (reason) { if (currentSessionUserId() === userId) setError(teacherFacingErrorMessage(reason, language)); }
    finally { submissionLock.current = false; if (currentSessionUserId() === userId) setSubmitting(false); }
  }
  async function cancel() {
    if (!current) return; setCancelling(true); setError(null);
    try { const next = await cancelGenerationJob(current.id); if (currentSessionUserId() === userId) cache.setQueryData(["preschool-project-job", userId, current.id], next); }
    catch (reason) { if (currentSessionUserId() === userId) setError(teacherFacingErrorMessage(reason, language)); }
    finally { if (currentSessionUserId() === userId) setCancelling(false); }
  }
  const historyItems = [...new Map((history.data?.pages.flatMap(p => p.items) ?? []).map(x => [x.id, x])).values()];
  const statusLabel = (status: string) => status === "completed" ? t("Готово", "Дайын") : status === "failed" ? t("Не удалось создать", "Жасау мүмкін болмады") : status === "cancelled" ? t("Отменено", "Бас тартылды") : status === "billing_error" ? t("Проект сохранён", "Жоба сақталды") : t("Готовится", "Дайындалуда");
  return <div className={s.workspace}>
    <header className={s.hero}><div className={s.heroCopy}><p className={s.eyebrow}>{t("Маленькие исследователи. Настоящие открытия.", "Кішкентай зерттеуші. Шынайы жаңалық.")}</p><h1>{t("Проекты для детского сада", "Балабақша жобалары")}<span>PRO</span></h1><p className={s.intro}>{t("Превратите детское «почему?» в увлекательное исследование. От первой идеи до опыта, дневника наблюдений и рассказа о своём открытии.", "Баланың «неге?» деген сұрағын қызықты зерттеуге айналдырыңыз. Алғашқы идеядан тәжірибеге, бақылау күнделігіне және жаңалығын таныстыруға дейін.")}</p><div className={s.heroMeta}><span><Icon name="leaf" />{t("Для детей 1–5 лет", "1–5 жастағы балаларға")}</span><span><Icon name="people" />{t("Ребёнок в центре проекта", "Жобаның өзегі — бала")}</span><span><Icon name="shield" />{t("Безопасные действия", "Қауіпсіз әрекеттер")}</span></div></div><ProjectArtwork /></header>
    <div className={s.topActions}><button type="button" className={s.secondary} onClick={() => setHistoryOpen(!historyOpen)} aria-expanded={historyOpen} aria-controls="preschool-project-history"><Icon name="clock" />{t("Мои проекты", "Менің жобаларым")}</button>{rawJobId && <button type="button" className={s.secondary} disabled={busy} onClick={() => { setError(null); router.replace(PROJECT_PATH, { scroll: false }); }}><Icon name="plus" />{t("Новый проект", "Жаңа жоба")}</button>}<Link href="/dashboard/generations?kind=preschool_project.generate" className={s.secondary}>{t("Вся история", "Барлық тарих")}<Icon name="arrow" /></Link></div>
    {historyOpen && <section id="preschool-project-history" className={s.history}><h2>{t("Ваши проекты и открытия", "Сіздің жобаларыңыз бен жаңалықтарыңыз")}</h2>{history.isPending ? <p role="status">{t("Загружаем проекты…", "Жобалар жүктелуде…")}</p> : <><div className={s.historyGrid}>{historyItems.map(x => <button type="button" key={x.id} disabled={busy} className={s.historyItem} onClick={() => { router.replace(`${PROJECT_PATH}?job=${x.id}`, { scroll: false }); setHistoryOpen(false); setError(null); }}><Icon name="file" /><strong>{x.title}</strong><small>{new Date(x.created_at).toLocaleDateString(language === "kk" ? "kk-KZ" : "ru-RU")} · {statusLabel(x.status)}</small></button>)}</div>{!historyItems.length && !history.isError && <p className={s.hint}>{t("Первый проект появится здесь автоматически после создания.", "Алғашқы жоба жасалғаннан кейін осында автоматты түрде сақталады.")}</p>}{history.hasNextPage && <button type="button" className={s.secondary} disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>{t("Показать ещё", "Тағы көрсету")}</button>}</>}{history.isError && <div role="alert" className={s.error}>{teacherFacingErrorMessage(history.error, language)} <button type="button" className={s.secondary} onClick={() => void history.refetch()}>{t("Повторить", "Қайталау")}</button></div>}</section>}
    {rawJobId && !jobId && <div role="alert" className={s.error}>{t("Ссылка на проект некорректна. Откройте материал из истории.", "Жоба сілтемесі қате. Материалды тарихтан ашыңыз.")}</div>}
    {job.isError && <div role="alert" className={s.error}><p>{teacherFacingErrorMessage(job.error, language)}</p><button type="button" className={s.secondary} onClick={() => void job.refetch()}>{t("Проверить снова", "Қайта тексеру")}</button></div>}
    {job.data && !current && <div role="alert" className={s.error}>{t("Это материал другого раздела. Откройте его в общей истории.", "Бұл басқа бөлімнің материалы. Оны жалпы тарихтан ашыңыз.")}</div>}
    {current?.status === "billing_error" && result && <div role="status" className={s.notice}>{t("Проект сохранён. Проверка оплаты ещё не завершена; повторно создавать материал не требуется.", "Жоба сақталды. Төлемді тексеру әлі аяқталған жоқ; материалды қайта жасау қажет емес.")}</div>}
    {current && TERMINAL.has(current.status) && !result && <div role="alert" className={s.error}><strong>{statusLabel(current.status)}</strong><p>{current.status === "failed" ? t("Попробуйте ещё раз. Статус возврата токенов доступен в общей истории.", "Қайталап көріңіз. Токендердің қайтарылу күйі жалпы тарихта көрсетіледі.") : current.status === "cancelled" ? t("Можно изменить параметры и создать новый проект.", "Параметрлерді өзгертіп, жаңа жоба жасауға болады.") : t("Результат пока недоступен. Откройте общую историю.", "Нәтиже әзірге қолжетімсіз. Жалпы тарихты ашыңыз.")}</p></div>}
    {busy ? <section className={s.loading} role="status" aria-live="polite"><div className={s.loader} aria-hidden="true" /><h2>{submitting ? t("Передаём вашу идею…", "Идеяңызды жіберудеміз…") : t("Готовим пространство для открытий", "Жаңалықтарға жол ашудамыз")}</h2><p>{submitting ? t("Дождитесь подтверждения приёма задания.", "Тапсырманың қабылдануын күтіңіз.") : current ? t("Проект принят в работу. Можно закрыть страницу: подготовка продолжится, а результат сохранится в истории.", "Жоба қабылданды. Бетті жабуға болады: дайындау жалғасып, нәтиже тарихта сақталады.") : t("Загружаем сохранённый проект…", "Сақталған жоба жүктелуде…")}</p><div className={s.loadingSteps}><span><Icon name="leaf" />{t("Идея и методика", "Идея мен әдістеме")}</span><span><Icon name="flask" />{t("Действия и наблюдения", "Әрекеттер мен бақылаулар")}</span><span><Icon name="shield" />{t("Проверка качества", "Сапаны тексеру")}</span></div>{current && <p>{current.status === "queued" ? t("Проект в очереди на подготовку.", "Жоба дайындау кезегінде.") : current.status === "refunding" ? t("Подготовка не завершена. Возвращаем токены.", "Дайындау аяқталмады. Токендер қайтарылуда.") : current.status === "settling" ? t("Сохраняем проект и завершаем расчёт.", "Жобаны сақтап, есеп айырысуды аяқтаудамыз.") : t("Пишем методику и проверяем структуру. Это может занять несколько минут.", "Әдістемені жазып, құрылымды тексерудеміз. Бұл бірнеше минут алуы мүмкін.")}</p>}{error && <p role="alert" className={s.error}>{error}</p>}{current && ["queued", "running"].includes(current.status) && <button type="button" className={s.secondary} disabled={cancelling || current.cancel_requested} onClick={() => void cancel()}>{cancelling || current.cancel_requested ? t("Отмена запрошена…", "Бас тарту сұралды…") : t("Отменить подготовку", "Дайындаудан бас тарту")}</button>}</section>
      : result && current ? <ProjectResult key={current.id} result={result} job={current} language={language} />
      : <ProjectForm input={input} onChange={next => { setInput(next); setSaved(false); setError(null); }} onSubmit={() => void generate()} language={language} cost={cost} balance={balance} busy={submitting} saved={saved} error={error} />}
  </div>;
}
