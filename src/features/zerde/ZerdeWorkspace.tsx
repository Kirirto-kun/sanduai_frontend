"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { currentSessionUserId } from "@/hooks/useTokens";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { zerdeApi } from "./api";
import { blankRequest, DOCUMENT_KINDS, eligibility, isDraft, MODES, parseData, SECTION_FALLBACK, wordCount } from "./model";
import { Artwork, Field, Icon } from "./ui";
import ZerdeResult, { DataChart } from "./ZerdeResult";
import type { Assessment, Catalog, DocumentKind, Draft, SavedProject, UploadedDocument, ZerdeRequest } from "./types";
import s from "./zerde.module.css";

const GROUPS = [["Барлығы", "Все"], ["Бастау", "Начало"], ["Зерттеу", "Исследование"], ["Тексеру", "Проверка"], ["Қорғау", "Защита"]];
const METHODS = [["observation", "Бақылау", "Наблюдение"], ["measurement", "Өлшеу", "Измерение"], ["comparison", "Салыстыру", "Сравнение"], ["survey", "Сауалнама", "Опрос"], ["experiment", "Эксперимент", "Эксперимент"], ["modeling", "Модельдеу", "Моделирование"], ["creative_analysis", "Шығармашылық талдау", "Творческий анализ"]];

export default function ZerdeWorkspace() {
  const { user } = useAuth();
  return user ? <Session key={user.userId} userId={user.userId} /> : null;
}
function Session({ userId }: { userId: string }) {
  const { language } = useLanguage(); const t = (kk: string, ru: string) => language === "kk" ? kk : ru;
  const [request, setRequest] = useState<ZerdeRequest>(() => blankRequest(language));
  const [step, setStep] = useState(0); const [group, setGroup] = useState(0); const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]); const [dataText, setDataText] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null); const [result, setResult] = useState<Assessment | null>(null);
  const [resultRequest, setResultRequest] = useState<ZerdeRequest | null>(null);
  const [hydrated, setHydrated] = useState(false); const [localSaved, setLocalSaved] = useState(false); const [cloudSaved, setCloudSaved] = useState(false);
  const [busy, setBusy] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false); const [projects, setProjects] = useState<SavedProject[]>([]); const [historyLoading, setHistoryLoading] = useState(false);
  const [uploadKind, setUploadKind] = useState<DocumentKind>("project"); const [uploadError, setUploadError] = useState<string | null>(null);
  const alive = useRef(true); const lock = useRef(false); const resultHeading = useRef<HTMLDivElement>(null); const fileInput = useRef<HTMLInputElement>(null);
  const draftKey = `sanduai:zerde:draft:v1:${userId}`;
  const eligible = eligibility(request.grades, language); const mode = MODES.find(m => m.id === request.mode)!;
  const data = parseData(dataText); const sections = catalog?.sections?.length ? catalog.sections : SECTION_FALLBACK;
  const ownSession = () => alive.current && currentSessionUserId() === userId;
  const body = (): ZerdeRequest => ({ ...request, language, data: data.data, sources: request.sources.filter(x => x.trim()), document_ids: [...new Set([...request.document_ids, ...documents.map(d => d.id)])] });
  function update(patch: Partial<ZerdeRequest>) { setRequest(previous => ({ ...previous, ...patch })); setCloudSaved(false); setLocalSaved(false); setError(null); }
  function go(next: number) { setError(null); setStep(next); window.setTimeout(() => document.getElementById("zerde-step-title")?.focus(), 0); }

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    void zerdeApi.catalog(controller.signal).then(value => { if (alive.current) setCatalog(value); }).catch(() => { /* The validated local mode labels remain available while the catalog reconnects. */ });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try { const value: unknown = JSON.parse(localStorage.getItem(draftKey) ?? "null"); if (isDraft(value)) { setRequest(value.request); setDataText(value.dataText); setDocuments(value.documents); setProjectId(value.projectId); setLocalSaved(true); } } catch { /* Draft storage is optional. */ }
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, [draftKey]);
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      if (currentSessionUserId() !== userId) return;
      const draft: Draft = { request, dataText, documents, projectId };
      try { localStorage.setItem(draftKey, JSON.stringify(draft)); setLocalSaved(true); } catch { setLocalSaved(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [request, dataText, documents, projectId, draftKey, hydrated, userId]);

  async function save() {
    if (lock.current) return; lock.current = true; setBusy("save"); setError(null);
    try { const project = await zerdeApi.save(body(), projectId); if (!ownSession()) return; setProjectId(project.id); setCloudSaved(true); }
    catch (reason) { if (ownSession()) setError(teacherFacingErrorMessage(reason, language)); }
    finally { lock.current = false; if (ownSession()) setBusy(null); }
  }
  async function assess() {
    if (lock.current) return;
    if (!eligible.eligible) { setError(eligible.message); go(0); setError(eligible.message); return; }
    if (request.mode === "visualization" && data.invalidLines.length) { setError(t(`Деректердің ${data.invalidLines.join(", ")} жолын тексеріңіз: белгі; сан.`, `Проверьте строки ${data.invalidLines.join(", ")}: метка; число.`)); document.getElementById("zerde-data")?.focus(); return; }
    lock.current = true; setBusy("assess"); setError(null);
    try {
      const snapshot = body(); const saved = await zerdeApi.save(snapshot, projectId); if (!ownSession()) return;
      setProjectId(saved.id); setCloudSaved(true);
      const checked = await zerdeApi.assessProject(saved.id); if (!ownSession()) return;
      if (!checked.result) throw new Error("Missing assessment");
      setResult(checked.result); setResultRequest(snapshot); setStep(3);
      window.setTimeout(() => resultHeading.current?.focus(), 0);
    } catch (reason) { if (ownSession()) setError(teacherFacingErrorMessage(reason, language)); }
    finally { lock.current = false; if (ownSession()) setBusy(null); }
  }
  async function loadHistory() {
    if (historyOpen) { setHistoryOpen(false); return; }
    setHistoryOpen(true); setHistoryLoading(true); setError(null);
    try { const response = await zerdeApi.projects(); if (ownSession()) setProjects(response.items); }
    catch (reason) { if (ownSession()) setError(teacherFacingErrorMessage(reason, language)); }
    finally { if (ownSession()) setHistoryLoading(false); }
  }
  async function openProject(id: string) {
    if (lock.current) return; lock.current = true; setBusy("open"); setError(null);
    try {
      const project = await zerdeApi.open(id); if (!ownSession()) return;
      const recovered = await Promise.allSettled(project.request.document_ids.map(id => zerdeApi.document(id))); if (!ownSession()) return;
      setRequest(project.request); setDataText(project.request.data.map(p => `${p.label}; ${p.value}`).join("\n")); setProjectId(project.id); setDocuments(recovered.flatMap(item => item.status === "fulfilled" ? [item.value] : []));
      setResult(project.result); setResultRequest(project.result ? project.request : null); setCloudSaved(true); setHistoryOpen(false); setStep(project.result ? 3 : 0);
    } catch (reason) { if (ownSession()) setError(teacherFacingErrorMessage(reason, language)); }
    finally { lock.current = false; if (ownSession()) setBusy(null); }
  }
  async function upload(file: File | undefined) {
    if (!file || lock.current) return;
    if (file.size > 10 * 1024 * 1024) { setUploadError(t("Әр файл 10 МБ-тан аспауы тиіс.", "Каждый файл должен быть не больше 10 МБ.")); return; }
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) { setUploadError(t("PDF, DOCX немесе TXT файлын таңдаңыз.", "Выберите файл PDF, DOCX или TXT.")); return; }
    lock.current = true; setBusy("upload"); setUploadError(null);
    try { const doc = await zerdeApi.upload(file, uploadKind); if (!ownSession()) return; setDocuments(previous => [...previous, doc]); setCloudSaved(false); }
    catch (reason) { if (ownSession()) setUploadError(teacherFacingErrorMessage(reason, language)); }
    finally { lock.current = false; if (ownSession()) { setBusy(null); if (fileInput.current) fileInput.current.value = ""; } }
  }
  const stepLabels = [t("Жоба паспорты", "Паспорт проекта"), t("Көмек түрі", "Вид помощи"), t("Өз материалдарым", "Мои материалы"), t("Нәтиже", "Результат")];
  const requiredDocs = DOCUMENT_KINDS.filter(([id]) => id !== "official_rules" && (id !== "contribution" || request.grades.length === 2));
  const providedCount = requiredDocs.filter(([kind]) => documents.some(d => d.kind === kind)).length;
  return <div className={s.workspace} aria-busy={busy === "assess"}>
    <header className={s.hero}><div className={s.heroCopy}><p className={s.eyebrow}>SANDUAI RESEARCH STUDIO · 2026–2027</p><h1>{t("Әр жаңалық", "Каждое открытие")}<br/>{t("өз сұрағыңнан басталады.", "начинается с твоего вопроса.")}</h1><p className={s.intro}>{t("«Зерде» жобасына арналған әдістемелік кеңістік. Идеяны нақтылаңыз, өз зерттеуіңізді жүргізіңіз және нәтижені сеніммен таныстырыңыз.", "Методическое пространство для проекта «Зерде». Уточните идею, проведите своё исследование и уверенно представьте результат.")}</p><div className={s.heroMeta}><span><Icon name="people" />{t("2–8-сынып", "2–8 классы")}</span><span><Icon name="layers" />{t("14 көмек түрі", "14 видов помощи")}</span><span><Icon name="shield" />{t("Авторлық еңбек сақталады", "Авторство сохраняется")}</span></div></div><div className={s.heroVisual}><div className={s.brand}>Зерде<span>PRO</span></div><Artwork/><span className={s.artCaption}>{t("Қызығушылықтан — жаңалыққа", "От любопытства — к открытию")}</span></div></header>
    <div className={s.toolbar}><div className={s.saveStatus} role="status"><span className={localSaved || cloudSaved ? s.savedDot : s.unsavedDot}/>{cloudSaved ? t("Жоба аккаунтта сақталды", "Проект сохранён в аккаунте") : localSaved ? t("Нобай осы браузерде сақталды", "Черновик сохранён в этом браузере") : t("Жоба нобайы", "Черновик проекта")}</div><div className={s.toolbarActions}><button type="button" className={s.secondary} disabled={!!busy} onClick={() => void loadHistory()} aria-expanded={historyOpen} aria-controls="zerde-projects"><Icon name="clock"/>{t("Менің жобаларым", "Мои проекты")}</button><button type="button" className={s.secondary} disabled={!!busy || !hydrated} onClick={() => void save()}><Icon name="file"/>{busy === "save" ? t("Сақталуда…", "Сохранение…") : t("Аккаунтқа сақтау", "Сохранить в аккаунте")}</button></div></div>
    {historyOpen && <section className={s.history} id="zerde-projects"><h2>{t("Менің жобаларым", "Мои проекты")}</h2>{historyLoading ? <p role="status">{t("Жүктелуде…", "Загрузка…")}</p> : projects.length ? <div className={s.historyGrid}>{projects.map(project => <button className={s.historyItem} key={project.id} disabled={!!busy} type="button" onClick={() => void openProject(project.id)}><Icon name="book"/><strong>{project.title}</strong><small>{new Date(project.updated_at).toLocaleDateString(language === "kk" ? "kk-KZ" : "ru-RU")} · {project.result ? t("Тексеріс бар", "Есть проверка") : t("Нобай", "Черновик")}</small></button>)}</div> : <p className={s.hint}>{t("Сақталған жобалар осында көрсетіледі.", "Здесь появятся сохранённые проекты.")}</p>}</section>}
    <nav className={s.steps} aria-label={t("Жоба қадамдары", "Шаги проекта")}>{stepLabels.map((label, i) => <button key={label} type="button" className={step === i ? s.activeStep : ""} aria-current={step === i ? "step" : undefined} disabled={!!busy || (i === 3 && !result)} onClick={() => go(i)}><span>{i + 1 < step + 1 ? <Icon name="check"/> : String(i + 1).padStart(2, "0")}</span><strong>{label}</strong></button>)}</nav>
    {error && <div className={s.error} role="alert">{error}</div>}
    {busy === "assess" ? <section className={s.loading} role="status" aria-live="polite"><div className={s.loader}/><h2>{t("Жобаңыздың келесі қадамын анықтаудамыз", "Определяем следующий шаг проекта")}</h2><p>{t("Қатысуды, материалдарды және таңдалған көмек түрін тексерудеміз.", "Проверяем участие, материалы и выбранный вид помощи.")}</p></section> : step === 3 && result && resultRequest ? <div ref={resultHeading} tabIndex={-1}><ZerdeResult key={`${projectId}-${result.mode}-${result.title}`} result={result} request={resultRequest} language={language} onEdit={() => go(2)}/></div> : <div className={s.columns}><div className={s.main}>
      {step === 0 && <section className={s.panel}><div className={s.panelHeading}><span className={s.sectionNumber}>01</span><div><p className={s.eyebrow}>{t("Алдымен танысайық", "Начнём со знакомства")}</p><h2 id="zerde-step-title" tabIndex={-1}>{stepLabels[0]}</h2><p>{t("Жеке деректерді енгізудің қажеті жоқ. Тек зерттеу туралы мәліметтер жеткілікті.", "Личные данные вводить не нужно. Достаточно информации об исследовании.")}</p></div></div>
        <Field id="zerde-title" label={t("Жобаның жұмыс тақырыбы", "Рабочая тема проекта")} hint={t("Тақырыпты кейін өзгертуге болады.", "Тему можно изменить позже.")}><input id="zerde-title" maxLength={300} value={request.title} onChange={e => update({ title: e.target.value })} placeholder={t("Нені зерттегіңіз келеді?", "Что вы хотите исследовать?")} /></Field>
        <fieldset className={s.fieldset}><legend>{t("Жоба авторлары", "Авторы проекта")}</legend><div className={s.segmented}>{[1, 2].map(count => <button key={count} type="button" aria-pressed={request.grades.length === count} className={request.grades.length === count ? s.selected : ""} onClick={() => update({ grades: count === 1 ? [request.grades[0]] : [request.grades[0], request.grades[0]] })}><Icon name={count === 1 ? "edit" : "people"}/>{count === 1 ? t("Жеке жоба", "Индивидуальный") : t("Екі автор", "Два автора")}</button>)}</div></fieldset>
        <div className={s.formGrid}>{request.grades.map((grade, index) => <Field key={index} id={`zerde-grade-${index}`} label={request.grades.length === 1 ? t("Оқушының сыныбы", "Класс ученика") : t(`${index + 1}-автордың сыныбы`, `Класс ${index + 1}-го автора`)}><select id={`zerde-grade-${index}`} value={grade} onChange={e => update({ grades: request.grades.map((g, i) => i === index ? Number(e.target.value) : g) })}>{Array.from({ length: 11 }, (_, i) => i + 1).map(g => <option key={g} value={g}>{g}{t("-сынып", " класс")}</option>)}</select></Field>)}</div>
        <div className={`${s.eligibility} ${!eligible.eligible ? s.eligibilityError : ""}`} role="status"><Icon name={eligible.eligible ? "check" : "shield"}/><div><strong>{eligible.message}</strong>{eligible.eligible && <p>{t(`Аннотация: ${eligible.junior ? 150 : 200} сөзге дейін · Негізгі мәтін: ${eligible.junior ? 15 : 30} бетке дейін ұсынылады`, `Аннотация: до ${eligible.junior ? 150 : 200} слов · Рекомендуемый основной текст: до ${eligible.junior ? 15 : 30} страниц`)}</p>}{request.grades.length === 2 && eligible.eligible && <p>{t(`Бағалау ${eligible.effective}-сынып деңгейімен жүргізіледі.`, `Оценивание по уровню ${eligible.effective}-го класса.`)}</p>}</div></div>
        <div className={s.formGrid}><Field id="zerde-type" label={t("Жоба түрі", "Тип проекта")}><select id="zerde-type" value={request.project_type} onChange={e => update({ project_type: e.target.value as ZerdeRequest["project_type"] })}>{[["research", "Зерттеу жобасы", "Исследовательский"], ["engineering", "Инженерлік жоба", "Инженерный"], ["digital", "Цифрлық жоба", "Цифровой"], ["social", "Әлеуметтік-гуманитарлық", "Социально-гуманитарный"], ["creative", "Шығармашылық-зерттеу", "Творческо-исследовательский"]].map(([id, kk, ru]) => <option key={id} value={id}>{t(kk, ru)}</option>)}</select></Field><Field id="zerde-stage" label={t("Конкурс кезеңі", "Этап конкурса")}><select id="zerde-stage" value={request.stage} onChange={e => update({ stage: Number(e.target.value) })}>{[["Мектептік", "Школьный"], ["Аудандық / қалалық", "Районный / городской"], ["Облыстық", "Областной"], ["Республикалық", "Республиканский"]].map(([kk, ru], i) => <option key={i} value={i + 1}>{["I", "II", "III", "IV"][i]} · {t(kk, ru)}</option>)}</select></Field></div>
        <Field id="zerde-section" label={t("Негізгі секция", "Основная секция")} hint={t("Пәнаралық жобада да бір негізгі секция таңдалады.", "Для междисциплинарного проекта выбирается одна основная секция.")}><select id="zerde-section" value={request.section} onChange={e => update({ section: e.target.value })}>{sections.map(section => <option key={section.id} value={section.id}>{language === "kk" ? section.title_kk : section.title_ru}</option>)}</select></Field>
        <div className={s.formFooter}><span className={s.hint}>{t("1 / 3 · Деректерді кез келген уақытта өзгертуге болады", "1 / 3 · Данные можно изменить в любой момент")}</span><button className={s.primary} type="button" disabled={!eligible.eligible} onClick={() => go(1)}>{t("Көмек түрін таңдау", "Выбрать вид помощи")}<Icon name="arrow"/></button></div>
      </section>}
      {step === 1 && <section className={s.panel}><div className={s.panelHeading}><span className={s.sectionNumber}>02</span><div><p className={s.eyebrow}>{t("Қазір қай кезеңдесіз?", "На каком вы этапе?")}</p><h2 id="zerde-step-title" tabIndex={-1}>{t("Өзіңізге қажет көмекті таңдаңыз", "Выберите помощь для своего шага")}</h2><p>{t("Зерттеудің кез келген кезеңінен бастауға болады.", "Можно начать с любого этапа исследования.")}</p></div></div><div className={s.filters} role="group" aria-label={t("Көмек түрлерінің сүзгісі", "Фильтр видов помощи")}>{GROUPS.map(([kk, ru], i) => <button type="button" key={i} className={group === i ? s.selectedFilter : ""} aria-pressed={group === i} onClick={() => setGroup(i)}>{t(kk, ru)}</button>)}</div>
        <div className={s.modeGrid}>{MODES.filter(m => group === 0 || m.group === group - 1).map(m => <button type="button" key={m.id} className={`${s.modeCard} ${request.mode === m.id ? s.selectedMode : ""}`} aria-pressed={request.mode === m.id} onClick={() => update({ mode: m.id })}><span className={s.modeIcon}><Icon name={m.icon}/></span><span className={s.modeText}><strong>{t(m.kk, m.ru)}</strong><small>{t(m.hintKk, m.hintRu)}</small></span><span className={s.radio} aria-hidden="true">{request.mode === m.id && <span/>}</span></button>)}</div><div className={s.formFooter}><button className={s.textButton} type="button" onClick={() => go(0)}>{t("Артқа", "Назад")}</button><button className={s.primary} type="button" onClick={() => go(2)}>{t("Материалдарға өту", "Перейти к материалам")}<Icon name="arrow"/></button></div>
      </section>}
      {step === 2 && <section className={s.panel}><div className={s.panelHeading}><span className={s.sectionNumber}>03</span><div><p className={s.eyebrow}>{t("Өз зерттеуіңіз — өз дауысыңыз", "Ваше исследование — ваш голос")}</p><h2 id="zerde-step-title" tabIndex={-1}>{t(mode.kk, mode.ru)}</h2><p>{t("Бар материалды енгізіңіз. Жетпейтін деректер ойдан толтырылмайды: жүйе келесі әрекеттерді ұсынады.", "Добавьте имеющиеся материалы. Недостающие данные не заполняются выдуманными: система предложит следующие действия.")}</p></div></div>
        {["idea", "methods", "plan", "audit"].includes(request.mode) && <><Field id="zerde-question" label={t("Оқушының өз зерттеу сұрағы", "Собственный исследовательский вопрос ученика")} hint={t("Соңғы тұжырымды оқушы мен жетекші таңдайды.", "Окончательную формулировку выбирают ученик и руководитель.")}><textarea id="zerde-question" rows={2} maxLength={2000} value={request.research_question} onChange={e => update({ research_question: e.target.value })} placeholder={t("Мен нені білгім немесе тексергім келеді?", "Что я хочу узнать или проверить?")}/></Field><Field id="zerde-goal" label={t("Өзіңіз тұжырымдаған мақсат", "Цель, сформулированная вами")}><input id="zerde-goal" maxLength={2000} value={request.goal} onChange={e => update({ goal: e.target.value })}/></Field></>}
        {request.mode === "visualization" ? <><Field id="zerde-data" label={t("Өзіңіз жинаған сандық деректер", "Собранные вами числовые данные")} hint={t("Әр жол: белгі; сан. Үтірлі санға да рұқсат етіледі. Мысал форматы: 1-күн; 12,5", "Каждая строка: метка; число. Дробная часть может быть с запятой. Пример формата: День 1; 12,5")}><textarea id="zerde-data" rows={7} maxLength={20000} value={dataText} onChange={e => { setDataText(e.target.value); setCloudSaved(false); setError(null); }} aria-invalid={data.invalidLines.length > 0} placeholder={t("Белгі; сан", "Метка; число")}/></Field>{data.invalidLines.length > 0 && <p className={s.error} role="alert">{t(`Тексеріңіз: ${data.invalidLines.join(", ")} жол.`, `Проверьте строки: ${data.invalidLines.join(", ")}.`)}</p>}<DataChart data={data.data} language={language}/></> : <Field id="zerde-authored" label={request.mode === "idea" ? t("Бастапқы идеяңыз бен қызығушылығыңыз", "Ваша первоначальная идея и интересы") : t("Өзіңіз жазған мәтін немесе нақты материалдар", "Ваш авторский текст или фактические материалы")} hint={t("Аты-жөнді, мектеп атауын және басқа дербес деректерді алып тастаңыз.", "Удалите имена, название школы и другие личные данные.")}><textarea id="zerde-authored" rows={8} maxLength={60000} value={request.authored_text} onChange={e => update({ authored_text: e.target.value })} placeholder={t("Өз ойыңызды, нақты әрекеттеріңізді немесе тексеруге арналған мәтінді жазыңыз…", "Напишите свои мысли, реальные действия или текст для проверки…")}/><div className={s.wordCounter}>{wordCount(request.authored_text)} {t("сөз", "слов")}</div></Field>}
        {["methods", "plan", "audit", "ethics"].includes(request.mode) && <fieldset className={s.fieldset}><legend>{t("Қолданылатын әдістер", "Используемые методы")}</legend><div className={s.methodChoices}>{METHODS.map(([id, kk, ru]) => <label key={id}><input type="checkbox" checked={request.methods.includes(id)} onChange={e => update({ methods: e.target.checked ? [...request.methods, id] : request.methods.filter(m => m !== id) })}/>{t(kk, ru)}</label>)}</div></fieldset>}
        <details className={s.details}><summary><Icon name="book"/>{t("Дереккөздер және тіркеу коды", "Источники и регистрационный код")}</summary><div><Field id="zerde-sources" label={t("Пайдаланылған дереккөздер", "Использованные источники")} hint={t("Әр жолға бір дереккөз. Кемінде үш сенімді дереккөз керек; бар болуы мен мазмұнын өзіңіз тексеріңіз.", "Один источник на строку. Нужно не менее трёх надёжных источников; проверьте их существование и содержание.")}><textarea id="zerde-sources" rows={4} value={request.sources.join("\n")} maxLength={15000} onChange={e => update({ sources: e.target.value.split("\n") })}/></Field><Field id="zerde-code" label={t("Ресми берілген тіркеу коды", "Официально присвоенный регистрационный код")} hint={t("Код әлі берілмесе, бос қалдырыңыз. Кодты «Дарын» қызметкері толтырады.", "Если код ещё не присвоен, оставьте поле пустым. Его заполняет сотрудник «Дарын».")}><input id="zerde-code" value={request.registration_code} maxLength={100} onChange={e => update({ registration_code: e.target.value })}/></Field></div></details>
        <section className={s.uploadSection}><div className={s.uploadHeading}><Icon name="upload"/><div><h3>{t("Құжаттарды қосу", "Добавить документы")}</h3><p>{t("PDF, DOCX, TXT · әрқайсысы 10 МБ-қа дейін", "PDF, DOCX, TXT · до 10 МБ каждый")}</p></div><span>{providedCount}/{requiredDocs.length}</span></div><div className={s.uploadControls}><label className={s.srOnly} htmlFor="zerde-file-kind">{t("Құжат түрі", "Тип документа")}</label><select id="zerde-file-kind" value={uploadKind} onChange={e => setUploadKind(e.target.value as DocumentKind)}>{DOCUMENT_KINDS.map(([id, kk, ru]) => <option key={id} value={id}>{t(kk, ru)}</option>)}</select><input ref={fileInput} id="zerde-file" type="file" accept=".pdf,.docx,.txt" className={s.srOnly} disabled={!!busy} onChange={e => void upload(e.target.files?.[0])}/><button type="button" className={s.secondary} disabled={!!busy} onClick={() => fileInput.current?.click()}><Icon name="plus"/>{busy === "upload" ? t("Жүктелуде…", "Загрузка…") : t("Файл таңдау", "Выбрать файл")}</button></div>{uploadError && <p className={s.error} role="alert">{uploadError}</p>}
          {documents.map(doc => <article className={s.document} key={doc.id}><Icon name="file"/><div><strong>{doc.name}</strong><small>{DOCUMENT_KINDS.find(([kind]) => kind === doc.kind)?.[language === "kk" ? 1 : 2]} · {(doc.size_bytes / 1024).toFixed(0)} KB{doc.pages != null && ` · ${doc.pages} ${t("бет", "стр.")}`}</small><span className={`${s.status} ${doc.inspection_status === "readable" ? s.good : s.pending}`}>{doc.inspection_status === "readable" ? t("Мәтін оқылды · толық сәйкестік расталмаған", "Текст прочитан · полное соответствие не подтверждено") : doc.inspection_status === "partial" ? t("Ішінара оқылды · қолмен тексеру керек", "Прочитан частично · нужна ручная проверка") : t("Мәтін оқылмады · тексеру мүмкін емес", "Текст не прочитан · проверка невозможна")}</span></div><button type="button" disabled={!!busy} className={s.iconButton} aria-label={t(`${doc.name} файлын тізімнен алып тастау`, `Убрать ${doc.name} из списка`)} onClick={() => { setDocuments(previous => previous.filter(d => d.id !== doc.id)); update({ document_ids: request.document_ids.filter(id => id !== doc.id) }); }}><Icon name="close"/></button></article>)}
          {request.mode === "package" && <div className={s.packageList}>{requiredDocs.map(([kind, kk, ru]) => <div key={kind}><Icon name={documents.some(d => d.kind === kind) ? "file" : "plus"}/><span>{t(kk, ru)}</span><small>{documents.some(d => d.kind === kind) ? t("Ұсынылған", "Предоставлен") : t("Ұсынылмаған", "Не предоставлен")}</small></div>)}</div>}
          <p className={s.hint}>{t("Файлдың болуы — оның ресми бекітілгені емес. Қазыларға әр құжат жеке, дараланбаған PDF ретінде беріледі.", "Наличие файла не означает официального подтверждения. Для жюри каждый документ подаётся отдельным обезличенным PDF.")}</p>
        </section><div className={s.formFooter}><button className={s.textButton} type="button" disabled={!!busy} onClick={() => go(1)}>{t("Көмек түрін өзгерту", "Изменить вид помощи")}</button><button className={s.primary} type="button" disabled={!!busy || !eligible.eligible || !hydrated} onClick={() => void assess()}><Icon name="check"/>{t("Бағыт-бағдар алу", "Получить рекомендации")}</button></div>
      </section>}
    </div><aside className={s.sidebar}><section className={s.projectSummary}><span className={s.summaryIcon}><Icon name="flask"/></span><p className={s.eyebrow}>{t("Сіздің зерттеуіңіз", "Ваше исследование")}</p><h3>{request.title.trim() || t("Бәрі бір сұрақтан басталады", "Всё начинается с одного вопроса")}</h3><dl><div><dt>{t("Жас санаты", "Возрастная группа")}</dt><dd>{eligible.eligible ? t(eligible.junior ? "Бастауыш буын" : "Орта буын", eligible.junior ? "Младшая группа" : "Средняя группа") : t("Тексеру қажет", "Нужна проверка")}</dd></div><div><dt>{t("Авторлар", "Авторы")}</dt><dd>{request.grades.length === 2 ? t("Екі оқушы", "Два ученика") : t("Бір оқушы", "Один ученик")}</dd></div><div><dt>{t("Қазір таңдалған", "Сейчас выбрано")}</dt><dd>{t(mode.kk, mode.ru)}</dd></div></dl></section><section className={s.principleBox}><Icon name="shield"/><h3>{t("Зерттеуші — өзіңіз", "Исследователь — вы")}</h3><p>{t("SanduAI әдісті түсіндіреді, бос үлгі ұсынады және кемшілікті көрсетеді. Нақты деректер, авторлық шешімдер мен қорытынды сізден.", "SanduAI объясняет метод, предлагает пустые шаблоны и показывает пробелы. Реальные данные, авторские решения и выводы — ваши.")}</p></section><details className={s.sourceDetails}><summary><Icon name="book"/>{t("Ереже және талаптар", "Правила и требования")}</summary><p>{t("«Дарын» · 09.09.2026 №153 · 2026–2027 оқу жылы", "«Дарын» · 09.09.2026 №153 · 2026–2027 учебный год")}</p><a href={language === "kk" ? "https://daryn.kz/pol514/Zerdekz.pdf" : "https://daryn.kz/pol514/Zerderu.pdf"} target="_blank" rel="noopener noreferrer">{t("Ресми ережені ашу (PDF)", "Открыть официальные правила (PDF)")}<Icon name="link"/></a><p>{t("Нақты мерзімдер мен қосымша ұйымдастыру талаптарын ресми ақпараттық хаттан нақтылаңыз.", "Сроки и дополнительные организационные требования уточняйте в официальном информационном письме.")}</p></details></aside></div>}
    <footer className={s.footer}><span>Зерде PRO · SanduAI</span><p>{t("Оқушы зерттейді — SanduAI бағыт береді!", "Ученик исследует — SanduAI направляет!")}</p></footer>
  </div>;
}
