"use client";
import Link from "next/link";
import { CONTENT_LANGUAGE_OPTIONS } from "@/lib/content-languages";
import { MEETING_FORMATS, deliveryLabel, meetingFormatLabel } from "./model";
import type { InterfaceLanguage, MeetingInput } from "./types";
import { Field, Icon, Section } from "./ui";
import { focusMeetingProblem, meetingListProblems } from "./validation";
import s from "./parent-meetings.module.css";

type Props = { input: MeetingInput; onChange: (next: MeetingInput) => void; onSubmit: () => void;
  language: InterfaceLanguage; busy: boolean; locked?: boolean; saved: boolean; error: string | null; cost: number | null; balance: number | null };

export default function MeetingForm({ input, onChange, onSubmit, language, busy, locked = false, saved, error, cost, balance }: Props) {
  const t = (ru: string, kk: string) => language === "kk" ? kk : ru;
  const update = <K extends keyof MeetingInput>(key: K, value: MeetingInput[K]) => onChange({ ...input, [key]: value });
  const school = input.organization === "school";
  const insufficient = cost !== null && balance !== null && balance < cost;
  const problems = error ? meetingListProblems(input, language) : [];
  const problemFor = (id: string) => problems.find(x => x.targetId === id)?.message;
  const examples = school ? [
    t("Как слышать ребёнка и договариваться", "Баланы тыңдау және өзара келісу"),
    t("Гаджеты: правила без конфликтов", "Гаджеттер: жанжалсыз ережелер"),
    t("Семья и школа — одна команда", "Отбасы мен мектеп — бір команда"),
  ] : [
    t("Адаптация к детскому саду с поддержкой", "Балабақшаға қолдаумен бейімделу"),
    t("Самостоятельность начинается дома", "Дербестік отбасынан басталады"),
    t("Играем, общаемся, развиваемся вместе", "Бірге ойнаймыз, сөйлесеміз, дамимыз"),
  ];
  return <form className={s.columns} onSubmit={event => { event.preventDefault(); if (!busy && !locked) onSubmit(); }}>
    <fieldset disabled={busy || locked} className={s.form}>
      <Section number="01" title={t("О чём поговорим с родителями?", "Ата-аналармен не талқылаймыз?")} hint={t("Четыре основных параметра — и можно готовить встречу.", "Төрт негізгі параметр — кездесуді дайындауға жеткілікті.")}>
        <div className={s.stack}>
          <div className={s.field}><label id="meeting-organization-label">{t("Образовательная организация *", "Білім беру ұйымы *")}</label><div className={s.organizationChoices} role="group" aria-labelledby="meeting-organization-label">{(["school", "kindergarten"] as const).map(value => <button type="button" key={value} aria-pressed={input.organization === value} onClick={() => update("organization", value)}><Icon name={value === "school" ? "school" : "team"} /><span><strong>{value === "school" ? t("Школа", "Мектеп") : t("Детский сад", "Балабақша")}</strong><small>{value === "school" ? t("Родители школьников", "Оқушылардың ата-аналары") : t("Родители дошкольников", "Мектепке дейінгі балалар")}</small></span></button>)}</div></div>
          <Field id="meeting-topic" label={t("Тема собрания *", "Жиналыс тақырыбы *")} hint={t("Укажите конкретный вопрос. Сценарий и все материалы будут связаны с ним.", "Нақты мәселені жазыңыз. Сценарий мен барлық материалдар соған негізделеді.")}>
            <textarea className={s.input} id="meeting-topic" value={input.topic} onChange={e => update("topic", e.target.value)} required minLength={2} maxLength={500} aria-describedby="meeting-topic-hint" placeholder={t("Например: как поддержать ребёнка без давления и сравнений", "Мысалы: баланы қысымсыз және салыстырусыз қалай қолдауға болады")} />
            <div className={s.presets} aria-label={t("Идеи для темы", "Тақырыпқа идеялар")}>{examples.map(text => <button className={s.preset} key={text} type="button" onClick={() => update("topic", text)}>{text}</button>)}</div>
          </Field>
          <div className={s.grid}>
            <Field id="meeting-class" label={school ? t("Класс *", "Сынып *") : t("Группа и возраст детей *", "Топ пен балалардың жасы *")}>
              <input className={s.input} id="meeting-class" value={input.class_group} onChange={e => update("class_group", e.target.value)} required maxLength={200} placeholder={school ? t("Например: 3 «А»", "Мысалы: 3 «А»") : t("Старшая группа, 5–6 лет", "Ересек топ, 5–6 жас")} />
            </Field>
            <Field id="meeting-duration" label={t("Продолжительность, минут *", "Ұзақтығы, минут *")} hint={t("Все этапы точно уложатся в это время.", "Барлық кезең осы уақытқа дәл сәйкес келеді.")}>
              <input className={s.input} id="meeting-duration" type="number" min={15} max={180} step={1} required value={Number.isNaN(input.duration_minutes) ? "" : input.duration_minutes} onChange={e => update("duration_minutes", e.target.valueAsNumber)} aria-describedby="meeting-duration-hint" />
              <div className={s.numberRow}>{[30, 45, 60, 90].map(n => <button type="button" key={n} aria-pressed={input.duration_minutes === n} onClick={() => update("duration_minutes", n)}>{n}</button>)}</div>
            </Field>
          </div>
        </div>
      </Section>

      <Section number="02" title={t("Как пройдёт встреча", "Кездесу қалай өтеді")} hint={t("Начальные условия: 20 родителей, офлайн. Проверьте и измените под себя.", "Бастапқы шарттар: 20 ата-ана, офлайн. Тексеріп, өзіңізге сай өзгертіңіз.")}>
        <div className={s.stack}>
          <div className={s.grid}>
            <Field id="meeting-format" label={t("Формат собрания", "Жиналыс форматы")} hint={t("При автоматическом выборе подход будет подобран под тему и цель.", "Автоматты таңдауда тәсіл тақырып пен мақсатқа сай таңдалады.")}><select id="meeting-format" className={s.input} value={input.meeting_format} onChange={e => update("meeting_format", e.target.value as MeetingInput["meeting_format"])} aria-describedby="meeting-format-hint">{MEETING_FORMATS.map(x => <option key={x.value} value={x.value}>{x[language]}</option>)}</select></Field>
            <Field id="meeting-language" label={t("Язык готового пакета", "Дайын жинақ тілі")}><select className={s.input} id="meeting-language" value={input.language} onChange={e => update("language", e.target.value as MeetingInput["language"])}>{CONTENT_LANGUAGE_OPTIONS.map(x => <option value={x.value} key={x.value}>{x.label}</option>)}</select></Field>
          </div>
          <div className={s.grid}>
            <Field id="meeting-participants" label={t("Количество родителей", "Ата-аналар саны")}><input className={s.input} id="meeting-participants" type="number" min={1} max={300} step={1} required value={Number.isNaN(input.participant_count) ? "" : input.participant_count} onChange={e => update("participant_count", e.target.valueAsNumber)} /></Field>
            <Field id="meeting-delivery" label={t("Условия проведения", "Өткізу тәсілі")}><select className={s.input} id="meeting-delivery" value={input.delivery_format} onChange={e => update("delivery_format", e.target.value as MeetingInput["delivery_format"])}>{["offline", "online", "hybrid"].map(value => <option key={value} value={value}>{deliveryLabel(value, language)}</option>)}</select></Field>
          </div>
        </div>
        <details className={s.details}><summary><Icon name="target" />{t("Цель, вопросы и особенности", "Мақсат, мәселелер және ерекшеліктер")}</summary><div className={s.stack}>
          <Field id="meeting-goal" label={t("Что должно измениться после собрания?", "Жиналыстан кейін не өзгеруі керек?")}><textarea className={s.input} id="meeting-goal" value={input.goal} maxLength={1500} onChange={e => update("goal", e.target.value)} placeholder={t("Например: договориться о семейных правилах использования телефона", "Мысалы: телефон қолданудың отбасылық ережелерін келісу")} /></Field>
          <Field id="meeting-period" label={t("Период учебного года", "Оқу жылының кезеңі")}><input className={s.input} id="meeting-period" value={input.school_period} maxLength={250} onChange={e => update("school_period", e.target.value)} placeholder={t("Начало года, конец четверти, выпуск…", "Жыл басы, тоқсан соңы, бітіру…")} /></Field>
          <Field id="meeting-issues" error={problemFor("meeting-issues")} label={t("Вопросы для обсуждения", "Талқыланатын мәселелер")} hint={t("До 12 вопросов, разделяйте запятой или переносом строки.", "12 мәселеге дейін, үтірмен немесе жаңа жолмен бөліңіз.")}><textarea className={s.input} id="meeting-issues" value={input.issues.join(",")} maxLength={6000} onChange={e => update("issues", e.target.value.split(","))} aria-invalid={Boolean(problemFor("meeting-issues")) || undefined} aria-describedby={`meeting-issues-hint${problemFor("meeting-issues") ? " meeting-issues-error" : ""}`} /></Field>
          <div className={s.grid}>
            <Field id="meeting-specialists" error={problemFor("meeting-specialists")} label={t("Приглашённые специалисты", "Қатысатын мамандар")} hint={t("До 10, через запятую.", "10 маманға дейін, үтір арқылы.")}><input className={s.input} id="meeting-specialists" value={input.specialists.join(",")} maxLength={4000} onChange={e => update("specialists", e.target.value.split(","))} aria-invalid={Boolean(problemFor("meeting-specialists")) || undefined} aria-describedby={`meeting-specialists-hint${problemFor("meeting-specialists") ? " meeting-specialists-error" : ""}`} placeholder={t("Психолог, социальный педагог…", "Психолог, әлеуметтік педагог…")} /></Field>
            <Field id="meeting-resources" error={problemFor("meeting-resources")} label={t("Доступные материалы", "Қолжетімді материалдар")} hint={t("До 20, через запятую.", "20 материалға дейін, үтір арқылы.")}><input className={s.input} id="meeting-resources" value={input.resources.join(",")} maxLength={5000} onChange={e => update("resources", e.target.value.split(","))} aria-invalid={Boolean(problemFor("meeting-resources")) || undefined} aria-describedby={`meeting-resources-hint${problemFor("meeting-resources") ? " meeting-resources-error" : ""}`} placeholder={t("Бумага, маркеры, проектор…", "Қағаз, маркерлер, проектор…")} /></Field>
          </div>
          <Field id="meeting-requests" label={t("Особый формат и пожелания", "Ерекше формат пен тілектер")} hint={t("Не указывайте имена детей и личные семейные сведения.", "Балалардың аты-жөні мен жеке отбасылық мәліметтерді жазбаңыз.")}><textarea className={s.input} id="meeting-requests" value={input.special_requests} maxLength={2500} onChange={e => update("special_requests", e.target.value)} aria-describedby="meeting-requests-hint" placeholder={t("Доступность, особенности группы, организационные факты…", "Қолжетімділік, топ ерекшеліктері, ұйымдастыру деректері…")} /></Field>
        </div></details>
        <details className={s.details}><summary><Icon name="file" />{t("Данные для приглашения и протокола", "Шақыру мен хаттама мәліметтері")}</summary><div className={s.stack}>
          <p className={s.hint}>{t("Необязательно. Пустые поля останутся местами для заполнения — без выдуманных дат и решений.", "Міндетті емес. Бос өрістер толтыруға қалдырылады — күндер мен шешімдер ойдан шығарылмайды.")}</p>
          <Field id="meeting-institution" label={t("Название организации", "Ұйым атауы")}><input className={s.input} id="meeting-institution" value={input.institution_name} maxLength={250} onChange={e => update("institution_name", e.target.value)} /></Field>
          <div className={s.grid}>
            <Field id="meeting-date" label={t("Дата", "Күні")}><input className={s.input} type="date" id="meeting-date" value={input.meeting_date} onChange={e => update("meeting_date", e.target.value)} /></Field>
            <Field id="meeting-time" label={t("Время", "Уақыты")}><input className={s.input} type="time" id="meeting-time" value={input.meeting_time} onChange={e => update("meeting_time", e.target.value)} /></Field>
          </div>
          <Field id="meeting-venue" label={t("Место или ссылка на встречу", "Өтетін орны немесе кездесу сілтемесі")}><input className={s.input} id="meeting-venue" value={input.venue} maxLength={250} onChange={e => update("venue", e.target.value)} /></Field>
        </div></details>
      </Section>

      <Section number="03" title={t("Последние штрихи", "Соңғы қадамдар")}>
        <label className={s.checkbox}><input type="checkbox" checked={input.include_digital_tools} onChange={e => update("include_digital_tools", e.target.checked)} /><span><strong>{t("Предложить подходящие цифровые инструменты", "Орынды цифрлық құралдар ұсыну")}</strong><small>{t("Идеи и промпты для презентации, наглядности и других инструментов. У каждого — альтернатива без интернета.", "Презентация, көрнекілік және басқа құралдарға идеялар мен промпттар. Әрқайсысына интернетсіз балама беріледі.")}</small></span></label>
        <div className={s.consent}><label className={s.checkbox}><input type="checkbox" required checked={input.defaults_accepted} onChange={e => update("defaults_accepted", e.target.checked)} /><span>{t("Параметры проверены, начальные условия принимаю", "Параметрлер тексерілді, бастапқы шарттарды қабылдаймын")}<small>{input.duration_minutes || "—"} {t("мин", "мин")} · {input.participant_count || "—"} {t("родителей", "ата-ана")} · {deliveryLabel(input.delivery_format, language)} · {meetingFormatLabel(input.meeting_format, language)}<br />{t("Если цель не задана: партнёрство родителей и педагога.", "Мақсат берілмесе: ата-ана мен педагог серіктестігі.")}</small></span></label></div>
      </Section>
      {error && <div className={s.error} id="meeting-form-error" role="alert" tabIndex={-1}><p>{error}</p>{problems.length > 0 && <ul>{problems.map(x => <li key={x.targetId}><a href={`#${x.targetId}`} onClick={event => { event.preventDefault(); focusMeetingProblem(x.targetId); }}>{x.message}</a></li>)}</ul>}</div>}
    </fieldset>

    <aside className={s.aside}><section className={s.summary} aria-label={t("Ваш пакет собрания", "Жиналыс жинағыңыз")}><div className={s.summaryHead}><p className={s.miniLabel}>PARENT MEETING PRO</p><h2>{t("Всё для встречи, которая объединяет", "Бірлікке бастайтын кездесуге бәрі дайын")}</h2></div><div className={s.summaryBody}>
      <div className={s.summaryRow}><span>{t("Для кого", "Кімге")}</span><strong>{school ? t("Школа", "Мектеп") : t("Детский сад", "Балабақша")}{input.class_group ? ` · ${input.class_group}` : ""}</strong></div>
      <div className={s.summaryRow}><span>{t("Длительность", "Ұзақтығы")}</span><strong>{input.duration_minutes || "—"} {t("минут", "минут")}</strong></div>
      <div className={s.summaryRow}><span>{t("Участники", "Қатысушылар")}</span><strong>{input.participant_count || "—"} {t("родителей", "ата-ана")}</strong></div>
      <div className={s.included}><p>{t("В готовом пакете", "Дайын жинақта")}</p><ul>{[
        t("Полный сценарий и слова ведущего", "Толық сценарий мен жүргізуші сөзі"),
        t("Тренинг, задания и игра", "Тренинг, тапсырмалар мен ойын"),
        t("Приглашение и 8–12 слайдов", "Шақыру және 8–12 слайд жоспары"),
        t("Карточки, анкета и рабочие листы", "Карточкалар, сауалнама мен парақтар"),
        t("Рефлексия и рекомендации", "Рефлексия мен ұсыныстар"),
        t("Шаблон протокола для заполнения", "Толтыруға арналған хаттама үлгісі"),
      ].map(text => <li key={text}><Icon name="check" />{text}</li>)}</ul></div>
      {insufficient && <p className={s.hint}>{t("Недостаточно токенов.", "Токендер жеткіліксіз.")} <Link href="/dashboard/profile">{t("Профиль и баланс", "Профиль және баланс")}</Link></p>}
      <button className={s.primary} type="submit" disabled={busy || locked || insufficient || cost === null || !input.defaults_accepted}><Icon name="spark" />{busy ? t("Отправляем…", "Жіберілуде…") : t("Подготовить собрание", "Жиналысты дайындау")}</button>
      <div className={s.cost}><span>{cost === null ? t("Уточняем стоимость…", "Құны анықталуда…") : `${cost} ${t("токенов", "токен")}`}</span><span>{t("Баланс", "Баланс")}: {balance ?? "—"}</span></div>
      <p className={s.draft} role="status">{saved ? t("Черновик сохранён на этом устройстве", "Жоба осы құрылғыда сақталды") : t("Изменения сохраняются автоматически", "Өзгерістер автоматты түрде сақталады")}</p>
    </div></section><div className={s.asideNote}><strong><Icon name="shield" />{t("С уважением к каждой семье", "Әр отбасына құрметпен")}</strong><p>{t("Участие добровольное, обсуждения — без сравнений детей и личных семейных историй. Для коротких встреч и небольших групп структура адаптируется.", "Қатысу ерікті, талқылау балаларды салыстырусыз және жеке отбасылық оқиғаларсыз өтеді. Қысқа кездесулер мен шағын топтарға құрылым бейімделеді.")}</p></div></aside>
  </form>;
}
