"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { currentSessionUserId } from "@/hooks/useTokens";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { zerdeApi } from "./api";
import { MODES } from "./model";
import { Field, Icon } from "./ui";
import type { AiUsage, Language } from "./types";
import s from "./zerde.module.css";

export default function ZerdeUsage({ projectId, userId, language, refreshKey }: { projectId: string; userId: string; language: Language; refreshKey: boolean }) {
  const query = useQuery({ queryKey: ["zerde-usage", userId, projectId, refreshKey], queryFn: () => zerdeApi.usage(projectId), staleTime: 0 });
  const t = (kk: string, ru: string) => language === "kk" ? kk : ru;
  return <details className={s.usageBox}><summary><Icon name="shield"/>{t("ЖИ көмегінің нақты журналы", "Журнал фактической помощи ИИ")}{query.data && <span>{query.data.items.length}</span>}</summary><p className={s.hint}>{t("Аяқталған ЖИ кеңестері автоматты түрде тіркеледі. Қалай тексергеніңізді және қайда қолданғаныңызды өзіңіз толтырыңыз. Декларацияға осы журнал енгізіледі.", "Завершённые консультации ИИ регистрируются автоматически. Укажите, как вы проверили результат и где использовали его. Журнал включается в декларацию.")}</p>{query.isPending ? <p role="status" className={s.hint}>{t("Жүктелуде…", "Загрузка…")}</p> : query.data?.items.length ? query.data.items.map(entry => <UsageEntry key={entry.id} entry={entry} projectId={projectId} userId={userId} language={language}/>) : !query.isError && <p className={s.hint}>{t("Аяқталған ЖИ кеңестері әзірге жоқ. Тегін ереже тексерісі ЖИ қолданылды деп белгіленбейді.", "Завершённых консультаций ИИ пока нет. Бесплатная проверка правил не отмечается как использование ИИ.")}</p>}{query.isError && <div role="alert" className={s.error}>{teacherFacingErrorMessage(query.error, language)}<button className={s.secondary} type="button" onClick={() => void query.refetch()}>{t("Қайталау", "Повторить")}</button></div>}</details>;
}
function UsageEntry({ entry, projectId, userId, language }: { entry: AiUsage; projectId: string; userId: string; language: Language }) {
  const t = (kk: string, ru: string) => language === "kk" ? kk : ru; const cache = useQueryClient();
  const [fields, setFields] = useState({ output_use_location: entry.output_use_location, author_verification: entry.author_verification, author_changes: entry.author_changes });
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false); const [error, setError] = useState<string | null>(null);
  async function save() {
    if (saving) return; setSaving(true); setError(null);
    try { await zerdeApi.updateUsage(projectId, entry.id, fields); if (currentSessionUserId() !== userId) return; setSaved(true); void cache.invalidateQueries({ queryKey: ["zerde-usage", userId, projectId] }); }
    catch (reason) { if (currentSessionUserId() === userId) setError(teacherFacingErrorMessage(reason, language)); }
    finally { if (currentSessionUserId() === userId) setSaving(false); }
  }
  const mode = MODES.find(m => m.id === entry.purpose);
  return <section className={s.usageEntry}><h3>{entry.tool} · {mode ? t(mode.kk, mode.ru) : entry.purpose}</h3><small>{new Date(entry.used_at).toLocaleString(language === "kk" ? "kk-KZ" : "ru-RU")}</small>{entry.prompt_summary && <p className={s.hint}>{entry.prompt_summary}</p>}{([['output_use_location', t("Нәтижені қайда қолдандым?", "Где я использовал(а) результат?")], ['author_verification', t("Дұрыстығын қалай тексердім?", "Как я проверил(а) правильность?")], ['author_changes', t("Өзім не өзгерттім?", "Что я изменил(а) самостоятельно?")]] as const).map(([key, label]) => <Field key={key} id={`usage-${entry.id}-${key}`} label={label}><textarea id={`usage-${entry.id}-${key}`} value={fields[key]} maxLength={2000} rows={2} onChange={e => { setFields(previous => ({ ...previous, [key]: e.target.value })); setSaved(false); }}/></Field>)}<button className={s.secondary} disabled={saving} type="button" onClick={() => void save()}>{saving ? t("Сақталуда…", "Сохранение…") : saved ? t("Сақталды", "Сохранено") : t("Журналға сақтау", "Сохранить в журнал")}</button>{error && <p className={s.error} role="alert">{error}</p>}</section>;
}
