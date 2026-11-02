"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cancelGenerationJob, getGenerationJob } from "@/lib/api";
import { currentSessionUserId, useTokens } from "@/hooks/useTokens";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { scienceApi } from "./api";
import { hasResearchContext, isAssessment, requestFingerprint } from "./model";
import { Icon } from "./ui";
import type { Assessment, ScienceRequest } from "./types";
import s from "./science-pro.module.css";

const TERMINAL = new Set(["completed", "failed", "cancelled", "billing_error"]);
export default function ScienceConsultation({ request, projectId, userId, cost, onResult }: { request: ScienceRequest; projectId: string; userId: string; cost: number | null; onResult: (result: Assessment) => void }) {
  const language = request.language; const t = (kk: string, ru: string) => language === "kk" ? kk : ru;
  const { balance, refreshBalance } = useTokens();
  const [jobId, setJobId] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState<string | null>(null); const [cancelling, setCancelling] = useState(false); const [loaded, setLoaded] = useState(false);
  const lock = useRef(false); const handled = useRef<string | null>(null); const alive = useRef(true); const intent = useRef<string | null>(null);
  const fingerprint = requestFingerprint(request); const key = `sanduai:science-pro:consult:v1:${userId}:${projectId}`;
  const query = useQuery({ queryKey: ["science-pro-consult", userId, jobId], queryFn: () => getGenerationJob(jobId!), enabled: !!jobId, retry: 1, refetchInterval: q => q.state.status === "error" || q.state.data && TERMINAL.has(q.state.data.status) ? false : 1800 });
  const job = query.data?.kind === "science_pro.consult" ? query.data : null;
  const active = !!jobId && (!job || !TERMINAL.has(job.status)) && !query.isError;
  const enough = hasResearchContext(request);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try { const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "null"); if (stored && typeof stored === "object") { const item = stored as Record<string, unknown>; if (item.fingerprint === fingerprint && typeof item.intent === "string") { intent.current = item.intent; if (typeof item.jobId === "string") setJobId(item.jobId); } } } catch { /* Recovery storage is optional. */ }
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [key, fingerprint]);
  useEffect(() => {
    if (!job || !TERMINAL.has(job.status) || handled.current === job.id || currentSessionUserId() !== userId) return;
    handled.current = job.id; void refreshBalance();
    if (["completed", "billing_error"].includes(job.status) && isAssessment(job.result)) onResult(job.result);
  }, [job, refreshBalance, userId, onResult]);
  async function consult() {
    if (lock.current || active || !loaded) return;
    lock.current = true; setSubmitting(true); setError(null);
    const idempotencyKey = job && TERMINAL.has(job.status) ? crypto.randomUUID() : intent.current ?? crypto.randomUUID(); intent.current = idempotencyKey;
    try { localStorage.setItem(key, JSON.stringify({ fingerprint, intent: idempotencyKey, jobId: null })); } catch { /* The server still preserves idempotency. */ }
    try {
      const accepted = await scienceApi.consult(request, projectId, idempotencyKey);
      if (!alive.current || currentSessionUserId() !== userId) return;
      setJobId(accepted.id);
      try { localStorage.setItem(key, JSON.stringify({ fingerprint, intent: idempotencyKey, jobId: accepted.id })); } catch { /* Account history remains available. */ }
      void refreshBalance();
    } catch (reason) { if (alive.current && currentSessionUserId() === userId) setError(teacherFacingErrorMessage(reason, language)); }
    finally { lock.current = false; if (alive.current) setSubmitting(false); }
  }
  async function cancel() {
    if (!job) return; setCancelling(true); setError(null);
    try { await cancelGenerationJob(job.id); if (alive.current && currentSessionUserId() === userId) void query.refetch(); }
    catch (reason) { if (alive.current && currentSessionUserId() === userId) setError(teacherFacingErrorMessage(reason, language)); }
    finally { if (alive.current) setCancelling(false); }
  }
  const completed = !!job && ["completed", "billing_error"].includes(job.status) && isAssessment(job.result);
  return <section className={s.consultBox} aria-label={t("Жеке ғылыми ЖИ кеңесі", "Персональная научная консультация ИИ")}><div className={s.consultHeading}><span className={s.modeIcon}><Icon name="spark"/></span><div><h3>{t("Зерттеуіңізге жеке ғылыми кеңес", "Персональная научная консультация")}</h3><p>{t("Өз материалыңыз бойынша әдіснамалық кеңес, мәтінді редакциялау немесе жауабыңызға кері байланыс алыңыз. Нақты қолданылған ЖИ көмегі жоба журналына тіркеледі.", "Получите методологический совет, редактуру текста или обратную связь по ответу на основе ваших материалов. Фактическая помощь ИИ записывается в журнал проекта.")}</p></div></div>
    {active || submitting ? <div className={s.consultStatus} role="status"><span className={s.loader}/><p>{submitting ? t("Сұраныс жіберілуде…", "Отправляем запрос…") : t("Ғылыми кеңес дайындалуда. Жобаға кейін оралуға болады.", "Готовим научную консультацию. К проекту можно вернуться позже.")}</p>{job && ["queued", "running"].includes(job.status) && <button type="button" className={s.secondary} disabled={cancelling || job.cancel_requested} onClick={() => void cancel()}>{cancelling || job.cancel_requested ? t("Тоқтату сұралды…", "Отмена запрошена…") : t("Тоқтату", "Отменить")}</button>}</div> : completed ? <p className={s.consultDone}><Icon name="check"/>{t("Жеке кеңес төмендегі нәтижеге қосылды. Журналда оны қалай тексеріп, қолданғаныңызды көрсетіңіз.", "Консультация добавлена к результату ниже. Укажите в журнале, как вы проверили и использовали её.")}</p> : <div className={s.consultActions}><button type="button" className={s.primary} disabled={!loaded || !enough || cost === null || balance === null || balance < cost} onClick={() => void consult()}><Icon name="spark"/>{cost === null ? t("Құны нақтылануда…", "Уточняем стоимость…") : t(`ЖИ кеңесін алу · ${cost} монета`, `Получить консультацию · ${cost} монет`)}</button><p className={s.hint}>{!enough ? t("Жеке кеңес үшін идеяңызды немесе материалыңызды қосыңыз.", "Для консультации добавьте идею или материалы.") : cost !== null && balance !== null && balance < cost ? t("Теңгерім жеткіліксіз. Тегін әдістемелік тексеріс қолжетімді.", "Недостаточно монет. Бесплатная методическая проверка доступна.") : t("Ғылыми деректерді өзіңіз тексеріңіз. Конкурстың ЖИ қолдану ережесін жетекшімен нақтылаңыз.", "Проверяйте научные сведения самостоятельно. Уточните с руководителем правила конкурса об ИИ.")}</p></div>}
    {query.isError && <div role="alert" className={s.error}>{teacherFacingErrorMessage(query.error, language)}<button className={s.textButton} type="button" onClick={() => void query.refetch()}>{t("Мәртебені қайта тексеру", "Проверить статус снова")}</button></div>}
    {job && ["failed", "cancelled", "billing_error"].includes(job.status) && !completed && <p role="status" className={s.hint}>{job.status === "cancelled" ? t("Кеңес тоқтатылды.", "Консультация отменена.") : t("Кеңесті аяқтау мүмкін болмады. Материалыңыз сақталған; қайта байқап көруге болады.", "Не удалось завершить консультацию. Материалы сохранены; можно повторить.")}</p>}
    {error && <p className={s.error} role="alert">{error}</p>}
  </section>;
}
