"use client";
import Link from "next/link";
import { AUDIENCES } from "./model";
import type { CoachingInput } from "./types";
import { Field, Icon, Section } from "./ui";
import s from "./coaching.module.css";

type Props = { input: CoachingInput; onChange: (value: CoachingInput) => void; onSubmit: () => void; language: "ru" | "kk"; cost: number | null; balance: number | null; busy: boolean; saved: boolean; error: string | null };
export default function CoachingForm({ input, onChange, onSubmit, language, cost, balance, busy, saved, error }: Props) {
  const t = (ru: string, kk: string) => language === "kk" ? kk : ru;
  const update = <K extends keyof CoachingInput>(key: K, value: CoachingInput[K]) => onChange({ ...input, [key]: value });
  const insufficient = cost !== null && balance !== null && balance < cost;
  const formatName = (format: string) => format === "hybrid" ? t("Смешанный", "Аралас") : format === "online" ? "Онлайн" : "Офлайн";
  const topicExamples = [
    { ru: "Обратная связь, которая помогает учиться", kk: "Оқуға жетелейтін кері байланыс" },
    { ru: "ИИ как помощник педагога", kk: "ЖИ — педагогтің көмекшісі" },
    { ru: "Каждый ученик вовлечён в урок", kk: "Әр оқушы сабаққа белсенді қатысады" },
  ];
  return <form className={s.columns} onSubmit={event => { event.preventDefault(); onSubmit(); }}>
    <fieldset className={s.form} disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <Section number="01" title={t("С чего начнём?", "Неден бастаймыз?")} hint={t("Задайте тему — вокруг неё выстроится вся встреча.", "Тақырыпты жазыңыз — бүкіл кездесу соған негізделеді.")}>
        <div className={s.stack}>
          <Field id="coaching-topic" label={t("Тема коучинга *", "Коучинг тақырыбы *")} hint={t("Конкретная задача поможет подготовить полезную практику.", "Нақты мәселе пайдалы тәжірибе дайындауға көмектеседі.")}>
            <textarea id="coaching-topic" className={s.input} value={input.topic} onChange={event => update("topic", event.target.value)} maxLength={500} minLength={2} required aria-describedby="coaching-topic-hint" placeholder={t("Например: как превратить оценивание в поддержку ученика", "Мысалы: бағалауды оқушыны қолдауға қалай айналдыруға болады")} />
            <div className={s.presets} aria-label={t("Примеры тем", "Тақырып мысалдары")}>{topicExamples.map(x => <button type="button" key={x.ru} className={s.preset} onClick={() => update("topic", x[language])}>{x[language]}</button>)}</div>
          </Field>
          <div className={s.grid}>
            <Field id="coaching-audience" label={t("Для кого проводим? *", "Кімге өткіземіз? *")}>
              <input id="coaching-audience" className={s.input} list="coaching-audiences" value={input.audience} onChange={event => update("audience", event.target.value)} minLength={2} maxLength={250} required />
              <datalist id="coaching-audiences">{AUDIENCES.map(x => <option key={x.ru} value={x[language]} />)}</datalist>
            </Field>
            <Field id="coaching-language" label={t("Язык материала", "Материал тілі")}>
              <select id="coaching-language" className={s.input} value={input.language} onChange={event => update("language", event.target.value as CoachingInput["language"])}><option value="kk">Қазақша</option><option value="ru">Русский</option></select>
            </Field>
          </div>
        </div>
      </Section>
      <Section number="02" title={t("Параметры встречи", "Кездесу параметрлері")} hint={t("Начальные условия уже заполнены. Измените их под свою команду.", "Бастапқы шарттар толтырылған. Ұжымыңызға сай өзгертіңіз.")}>
        <div className={s.stack}>
          <div className={s.grid}>
            <Field id="coaching-duration" label={t("Продолжительность, минут *", "Ұзақтығы, минут *")} hint={t("Все девять этапов уложатся точно в это время.", "Тоғыз кезеңнің уақыты осы ұзақтыққа дәл сәйкес келеді.")}>
              <input id="coaching-duration" type="number" className={s.input} min={15} max={240} step={1} required value={Number.isNaN(input.duration_minutes) ? "" : input.duration_minutes} onChange={event => update("duration_minutes", event.target.valueAsNumber)} aria-describedby="coaching-duration-hint" />
              <div className={s.numberRow}>{[30, 45, 60, 90].map(n => <button type="button" key={n} aria-pressed={input.duration_minutes === n} onClick={() => update("duration_minutes", n)}>{n}</button>)}</div>
            </Field>
            <Field id="coaching-format" label={t("Формат проведения", "Өткізу форматы")}>
              <select id="coaching-format" className={s.input} value={input.format} onChange={event => update("format", event.target.value as CoachingInput["format"])}>{(["offline", "online", "hybrid"] as const).map(value => <option key={value} value={value}>{formatName(value)}</option>)}</select>
            </Field>
          </div>
          <div className={s.grid}>
            <Field id="coaching-participants" label={t("Количество участников", "Қатысушылар саны")}>
              <input id="coaching-participants" type="number" className={s.input} min={2} max={1000} step={1} required value={Number.isNaN(input.participant_count) ? "" : input.participant_count} onChange={event => onChange({ ...input, participant_count: event.target.valueAsNumber, group_count: Math.min(input.group_count, event.target.valueAsNumber || 1) })} />
            </Field>
            <Field id="coaching-groups" label={t("Количество групп", "Топ саны")} hint={t("Задания и карточки будут рассчитаны на эти группы.", "Тапсырмалар мен карточкалар осы топтарға есептеледі.")}>
              <input id="coaching-groups" type="number" className={s.input} min={1} max={Math.min(50, input.participant_count || 50)} step={1} required value={Number.isNaN(input.group_count) ? "" : input.group_count} onChange={event => update("group_count", event.target.valueAsNumber)} aria-describedby="coaching-groups-hint" />
            </Field>
          </div>
        </div>
        <details className={s.details}><summary><Icon name="target" />{t("Добавить цель и детали", "Мақсат пен мәлімет қосу")}</summary><div className={s.stack}>
          <Field id="coaching-goal" label={t("Какой результат хотите получить?", "Қандай нәтижеге қол жеткізгіңіз келеді?")}><textarea id="coaching-goal" className={s.input} value={input.goal} maxLength={1500} onChange={event => update("goal", event.target.value)} placeholder={t("Например: каждый педагог подготовит приём обратной связи для своего урока", "Мысалы: әр педагог өз сабағына кері байланыс тәсілін дайындайды")} /></Field>
          <Field id="coaching-experience" label={t("Опыт участников", "Қатысушылар тәжірибесі")}><input id="coaching-experience" className={s.input} value={input.experience} maxLength={500} onChange={event => update("experience", event.target.value)} placeholder={t("Начинающие, опытные или смешанная группа", "Жас мамандар, тәжірибелі педагогтер немесе аралас топ")} /></Field>
          <Field id="coaching-resources" label={t("Доступные ресурсы", "Қолжетімді ресурстар")} hint={t("Перечислите через запятую. Можно провести коучинг без дорогих инструментов.", "Үтір арқылы жазыңыз. Коучингті қымбат құралдарсыз өткізуге болады.")}><textarea id="coaching-resources" className={s.input} value={input.resources.join(",")} onChange={event => update("resources", event.target.value.split(","))} maxLength={5000} aria-describedby="coaching-resources-hint" placeholder={t("Бумага, маркеры, проектор…", "Қағаз, маркерлер, проектор…")} /></Field>
          <Field id="coaching-methods" label={t("Предпочитаемые методы и технологии", "Қалаған әдістер мен технологиялар")}><input id="coaching-methods" className={s.input} value={input.methods.join(",")} maxLength={4000} onChange={event => update("methods", event.target.value.split(","))} placeholder={t("Кейс, ролевая игра, исследование урока…", "Кейс, рөлдік ойын, сабақты зерттеу…")} /></Field>
          <Field id="coaching-notes" label={t("Что ещё учесть?", "Тағы нені ескеру керек?")}><textarea id="coaching-notes" className={s.input} value={input.notes} maxLength={2500} onChange={event => update("notes", event.target.value)} placeholder={t("Особенности команды, доступность, пожелания к заданиям…", "Ұжым ерекшеліктері, қолжетімділік, тапсырмаларға тілектер…")} /></Field>
        </div></details>
      </Section>
      <Section number="03" title={t("Подход к практике", "Тәжірибе тәсілі")} hint={t("Практические задания, работа в парах и группах включены в каждый сценарий.", "Практикалық тапсырмалар, жұптық және топтық жұмыс әр сценарийде бар.")}>
        <label className={s.checkbox}><input type="checkbox" checked={input.include_ai} onChange={event => update("include_ai", event.target.checked)} /><span><strong>{t("Добавить уместные инструменты ИИ", "Орынды ЖИ құралдарын қосу")}</strong><small>{t("Готовые промпты, критическая проверка и альтернатива без интернета. ИИ включается только там, где помогает теме.", "Дайын промпттар, сыни тексеру және интернетсіз балама. ЖИ тақырыпқа пайдалы болғанда ғана қосылады.")}</small></span></label>
        <div className={s.consent}><label className={s.checkbox}><input type="checkbox" required checked={input.defaults_accepted} onChange={event => update("defaults_accepted", event.target.checked)} /><span>{t("Параметры проверены — подготовить коучинг на этих условиях", "Параметрлер тексерілді — осы шарттармен коучинг дайындау")}<small>{input.duration_minutes || "—"} {t("мин", "мин")} · {input.participant_count || "—"} {t("участников", "қатысушы")} · {input.group_count || "—"} {t("группы", "топ")} · {formatName(input.format)}</small></span></label></div>
      </Section>
      {error && <div className={s.error} role="alert">{error}</div>}
    </fieldset>
    <aside className={s.aside}>
      <section className={s.summary} aria-label={t("Ваш коучинг", "Сіздің коучингіңіз")}><div className={s.summaryHead}><p className={s.miniLabel}>SANDUAI COACHING PRO</p><h2>{t("От идеи — к готовому коучингу", "Идеядан дайын коучингке дейін")}</h2></div><div className={s.summaryBody}>
        <div className={s.summaryRow}><span>{t("Продолжительность", "Ұзақтығы")}</span><strong>{input.duration_minutes || "—"} {t("минут", "минут")}</strong></div>
        <div className={s.summaryRow}><span>{t("Команда", "Ұжым")}</span><strong>{input.participant_count || "—"} {t("участников", "қатысушы")}</strong></div>
        <div className={s.summaryRow}><span>{t("Группы", "Топтар")}</span><strong>{input.group_count || "—"}</strong></div>
        <div className={s.summaryRow}><span>{t("Формат", "Формат")}</span><strong>{formatName(input.format)}</strong></div>
        <div className={s.included}><p>{t("В вашем комплекте", "Сіздің жинағыңызда")}</p><ul>{[
          t("9 этапов с точным таймингом", "Нақты уақытпен 9 кезең"), t("Готовые слова ведущего", "Жүргізушінің дайын сөзі"), t("3 связанных практических задания", "Өзара байланысты 3 тапсырма"), t("Карточки и тексты слайдов", "Карточкалар мен слайд мәтіндері"), t("Рефлексия и оценка результата", "Рефлексия және нәтижені бағалау"),
        ].map(item => <li key={item}><Icon name="check" />{item}</li>)}</ul></div>
        {insufficient && <p className={s.hint}>{t("Недостаточно токенов.", "Токендер жеткіліксіз.")} <Link href="/dashboard/profile">{t("Профиль и баланс", "Профиль және баланс")}</Link></p>}
        <button type="submit" className={s.primary} disabled={busy || insufficient || cost === null || !input.defaults_accepted}><Icon name="spark" />{busy ? t("Отправляем…", "Жіберілуде…") : t("Создать коучинг", "Коучинг жасау")}</button>
        <div className={s.cost}><span>{cost === null ? t("Уточняем стоимость…", "Құны анықталуда…") : `${cost} ${t("токенов", "токен")}`}</span><span>{t("Баланс", "Баланс")}: {balance ?? "—"}</span></div>
        <p role="status" className={s.draft}>{saved ? t("Черновик сохранён на этом устройстве", "Жоба осы құрылғыда сақталды") : t("Изменения сохраняются автоматически", "Өзгерістер автоматты түрде сақталады")}</p>
      </div></section>
      <div className={s.ratioCard}><strong>{t("Больше действий, больше пользы", "Көп әрекет — көп пайда")}</strong><div className={s.ratioBar} aria-hidden="true"><span /></div><div className={s.ratioLegend}><span>70% {t("участники", "қатысушылар")}</span><span>30% {t("коуч", "коуч")}</span></div><p>{t("Ориентир для планирования: участники исследуют, пробуют и создают собственный педагогический продукт.", "Жоспарлау бағдары: қатысушылар зерттейді, тәжірибе жасайды және өз педагогикалық өнімін әзірлейді.")}</p></div>
    </aside>
  </form>;
}
