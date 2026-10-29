"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { currentSessionUserId, useTokens } from "@/hooks/useTokens";
import { cancelGenerationJob, getGenerationJob } from "@/lib/api";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { zerdeApi } from "./api";
import { isAssessment } from "./model";
import { Icon } from "./ui";
import type { Assessment, Language, ZerdeRequest } from "./types";
import s from "./zerde.module.css";

const TERMINAL = new Set(["completed", "failed", "cancelled", "billing_error"]);
export default function ZerdeConsultation({ request, projectId, userId, cost, language, onResult }: { request: ZerdeRequest; projectId: string; userId: string; cost: number | null; language: Language; onResult: (result: Assessment) => void }) {
  const t = (kk: string, ru: string) => language === "kk" ? kk : ru;
  const { balance, refreshBalance } = useTokens();
  const [jobId, setJobId] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState<string | null>(null); const [cancelling, setCancelling] = useState(false);
  const [loaded, setLoaded] = useState(false); const lock = useRef(false); const handled = useRef<string | null>(null); const alive = useRef(true);
  const [anonymized, setAnonymized] = useState(false);
  const key = `sanduai:zerde:consult:v1:${userId}:${projectId}`; const fingerprint = JSON.stringify(request);
  const intentKey = useRef<string | null>(null);
  const query = useQuery({ queryKey: ["zerde-consult", userId, jobId], queryFn: () => getGenerationJob(jobId!), enabled: !!jobId, retry: 1, refetchInterval: q => q.state.status === "error" || (q.state.data && TERMINAL.has(q.state.data.status)) ? false : 1800 });
  const job = query.data?.kind === "zerde.consult" ? query.data : null;
  const active = Boolean(jobId && (!job || !TERMINAL.has(job.status)) && !query.isError);
  const enough = !!(request.title.trim() || request.authored_text.trim() || request.research_question.trim() || request.document_ids.length || request.data.length);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let stopped = false;
    queueMicrotask(() => {
      if (stopped) return;
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
        if (stored && typeof stored === "object") { const entry = stored as Record<string, unknown>; if (entry.fingerprint === fingerprint && typeof entry.intent === "string") { intentKey.current = entry.intent; if (typeof entry.jobId === "string") setJobId(entry.jobId); } }
      } catch { /* Optional recovery storage. */ }
      setLoaded(true);
    });
    return () => { stopped = true; };
  }, [key, fingerprint]);
  useEffect(() => {
    if (!job || !TERMINAL.has(job.status) || handled.current === job.id || currentSessionUserId() !== userId) return;
    handled.current = job.id; void refreshBalance();
    if (["completed", "billing_error"].includes(job.status) && isAssessment(job.result)) onResult(job.result);
  }, [job, onResult, refreshBalance, userId]);
  async function consult() {
    if (lock.current || active || !loaded || !anonymized) return;
    lock.current = true; setSubmitting(true); setError(null);
    const intent = job && TERMINAL.has(job.status) ? crypto.randomUUID() : intentKey.current ?? crypto.randomUUID(); intentKey.current = intent;
    try { localStorage.setItem(key, JSON.stringify({ fingerprint, intent, jobId: null })); } catch { /* Optional storage. */ }
    try {
      const accepted = await zerdeApi.consult(request, projectId, intent);
      if (!alive.current || currentSessionUserId() !== userId) return;
      if (accepted.kind !== "zerde.consult" || !accepted.id) throw new Error("Invalid consultation acknowledgement");
      setJobId(accepted.id);
      try { localStorage.setItem(key, JSON.stringify({ fingerprint, intent, jobId: accepted.id })); } catch { /* The job remains available in the account history. */ }
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
  return <section className={s.consultBox} aria-label={t("Жеке ЖИ кеңесі", "Персональная консультация ИИ")}><div className={s.consultHeading}><span className={s.modeIcon}><Icon name="spark"/></span><div><h3>{t("Зерттеуіңізге жеке бағыт-бағдар", "Персональные рекомендации по исследованию")}</h3><p>{t("ЖИ өз материалыңыз бойынша сұрақтар мен әдістемелік кеңестер ұсынады. Дайын конкурстық жұмысты жазбайды.", "ИИ предложит вопросы и методические рекомендации по вашим материалам. Автор исследования сохраняется.")}</p></div></div>
    {!active && !submitting && !completed && <label className={s.privacyCheck}><input type="checkbox" checked={anonymized} onChange={e => setAnonymized(e.target.checked)}/><span>{t("ЖИ-ге жіберілетін мәтін мен файлдарда аты-жөн, мектеп атауы, телефон, ЖСН және өзге дербес деректер жоқ екенін тексердім.", "Я проверил(а), что в тексте и файлах для ИИ нет имён, названия школы, телефонов, ИИН и других персональных данных.")}</span></label>}
    {active || submitting ? <div role="status" className={s.consultStatus}><span className={s.loader}/><p>{submitting ? t("Кеңеске сұраныс жіберілуде…", "Отправляем запрос на консультацию…") : t("ЖИ кеңес дайындауда. Бетті жауып, жобаға кейін оралуға болады.", "ИИ готовит рекомендации. Можно закрыть страницу и вернуться к проекту позже.")}</p>{job && ["queued", "running"].includes(job.status) && <button type="button" className={s.secondary} disabled={cancelling || job.cancel_requested} onClick={() => void cancel()}>{cancelling || job.cancel_requested ? t("Тоқтату сұралды…", "Отмена запрошена…") : t("Тоқтату", "Отменить")}</button>}</div> : completed ? <p className={s.consultDone}><Icon name="check"/>{t("ЖИ кеңесі төмендегі нәтижеге қосылды. Нақты пайдаланылған көмекті декларацияда көрсетіңіз.", "Рекомендации ИИ добавлены к результату ниже. Укажите фактически использованную помощь в декларации.")}</p> : <div className={s.consultActions}><button type="button" className={s.primary} disabled={!loaded || !anonymized || cost === null || !enough || (balance !== null && cost > balance)} onClick={() => void consult()}><Icon name="spark"/>{t("ЖИ кеңесін алу", "Получить консультацию ИИ")}{cost !== null && <span>· {cost} {t("монета", "монет")}</span>}</button><span className={s.hint}>{cost === null ? t("Құны жүктелуде…", "Загружаем стоимость…") : !enough ? t("Алдымен өз идеяңызды не материалыңызды қосыңыз.", "Сначала добавьте свою идею или материалы.") : balance !== null && cost > balance ? t("Монета жеткіліксіз. Теңгерімді толтырыңыз.", "Недостаточно монет. Пополните баланс.") : t("Ереже бойынша тексеріс пен бос үлгілер тегін.", "Проверка правил и пустые шаблоны бесплатны.")}</span></div>}
    {job && ["failed", "cancelled"].includes(job.status) && <p className={s.hint}>{job.status === "cancelled" ? t("ЖИ кеңесі тоқтатылды. Төмендегі тегін тексеріс сақталды.", "Консультация отменена. Бесплатная проверка ниже сохранена.") : t("ЖИ кеңесін дайындау аяқталмады. Монета күйін «Менің жұмыстарым» бөлімінен тексеріңіз.", "Рекомендации ИИ не подготовлены. Проверьте статус монет в разделе «Мои работы».")}</p>}
    {(error || query.isError) && <div role="alert" className={s.error}>{error || teacherFacingErrorMessage(query.error, language)}{query.isError && <button type="button" className={s.secondary} onClick={() => void query.refetch()}>{t("Күйін тексеру", "Проверить статус")}</button>}</div>}
  </section>;
}
