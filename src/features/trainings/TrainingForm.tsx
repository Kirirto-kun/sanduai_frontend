"use client";
import type { FormEvent } from "react";
import Link from "next/link";
import { CONTENT_LANGUAGE_OPTIONS } from "@/lib/content-languages";
import { AUDIENCES, EVENTS, MODES, audienceDuration, selectOutput } from "./model";
import type { TrainingInput } from "./types";
import { Field, Icon, Section } from "./ui";
import s from "./trainings.module.css";

type Props = { input: TrainingInput; onChange: (input: TrainingInput) => void; onSubmit: () => void; language: "ru" | "kk"; cost: number | null; balance: number | null; busy: boolean; saved: boolean; error: string | null };
export default function TrainingForm({ input, onChange, onSubmit, language, cost, balance, busy, saved, error }: Props) {
  const t = (ru: string, kk: string) => language === "kk" ? kk : ru;
  function change<K extends keyof TrainingInput>(key: K, value: TrainingInput[K]) { onChange({ ...input, [key]: value }); }
  const mode = MODES.find(x => x.id === input.output_mode)!;
  const audienceId = AUDIENCES.find(x => x.kk === input.audience || x.ru === input.audience)?.id ?? "other";
  const insufficient = balance !== null && cost !== null && balance < cost;
  const maxDuration = input.output_mode === "express" ? 15 : 240;
  const presets = [
    { ru: "Команда, в которой слышат", kk: "Бірін-бірі тыңдайтын ұжым", audience: "teachers", type: "teambuilding" as const },
    { ru: "Ресурс педагога: забота о себе", kk: "Педагогтің ресурсы: өзіне қамқорлық", audience: "teachers", type: "psychological_training" as const },
    { ru: "Дружба начинается с уважения", kk: "Достық сыйластықтан басталады", audience: "primary_students", type: "student_training" as const },
  ];
  const inclusions = input.output_mode === "ideas" ? [t("5–7 самостоятельных концепций", "5–7 дербес концепция"), t("Цель, механика и результат каждой", "Әрқайсысының мақсаты, механикасы және нәтижесі")]
    : input.output_mode === "games" ? [t("5–10 упражнений на одну тему", "Бір тақырыпқа сай 5–10 жаттығу"), t("Полные инструкции и готовые задания", "Толық нұсқаулықтар мен дайын тапсырмалар")]
    : input.output_mode === "handouts" ? [t("Карточки, готовые к печати", "Басып шығаруға дайын карточкалар"), t("Конкретные задания для участников", "Қатысушыларға арналған нақты тапсырмалар")]
    : input.output_mode === "presentation_plan" ? [t("Содержание и визуал каждого слайда", "Әр слайдтың мазмұны мен визуалы"), t("Речь ведущего и действия участников", "Жүргізушінің сөзі мен қатысушылар әрекеті")]
    : [t("Поминутный план встречи", "Минут сайынғы кездесу жоспары"), t("Слова ведущего и инструкции", "Жүргізушінің сөзі мен нұсқаулықтар"), t("Практика и готовые задания", "Практика мен дайын тапсырмалар"), ...(input.output_mode === "full_package" ? [t("Раздаточные материалы и план слайдов", "Үлестірмелер мен слайд жоспары")] : []), t("Рефлексия и оценка результата", "Рефлексия мен нәтижені бағалау")];
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSubmit(); }
  return <form onSubmit={submit} className={s.columns}>
    <div className={s.form}>
      <Section number="01" title={t("С чего начнём?", "Неден бастаймыз?")} hint={t("Выберите тип встречи и расскажите о теме.", "Кездесу түрін таңдап, тақырыбын жазыңыз.")}>
        <div className={s.stack}>
          <div role="group" aria-label={t("Тип мероприятия", "Іс-шара түрі")} className={s.choices}>{EVENTS.map(item => <button type="button" key={item.id} className={s.choice} aria-pressed={input.event_type === item.id} onClick={() => change("event_type", item.id)}><Icon name={item.icon} /><span className={s.choiceText}>{item[language]}</span>{input.event_type === item.id && <Icon name="check" className="h-4 w-4" />}</button>)}</div>
          <div><Field id="training-topic" label={t("Тема встречи", "Кездесу тақырыбы")} hint={t("Можно начать с примера и изменить его под свою задачу.", "Мысалдан бастап, оны өз міндетіңізге бейімдеуге болады.")}><textarea id="training-topic" className={s.input} value={input.topic} required minLength={2} maxLength={500} aria-describedby="training-topic-hint" placeholder={t("Например: как создать культуру поддержки в педагогическом коллективе", "Мысалы: педагогикалық ұжымда қолдау мәдениетін қалыптастыру")} onChange={e => change("topic", e.target.value)} /></Field>
            <div className={s.presets}>{presets.map(p => <button key={p.type} type="button" className={s.preset} onClick={() => { const audience = AUDIENCES.find(a => a.id === p.audience)!; onChange({ ...input, topic: p[language], event_type: p.type, audience: audience.kk, duration_minutes: input.output_mode === "express" ? 10 : audienceDuration(p.audience) }); }}><Icon name="plus" className="h-3 w-3" />{p[language]}</button>)}</div>
          </div>
          <Field id="training-goal" label={t("Что хотите изменить?", "Нені өзгерткіңіз келеді?")} hint={t("Необязательно — поможем сформулировать цель по теме.", "Міндетті емес — тақырып бойынша мақсатты анықтаймыз.")}><input id="training-goal" className={s.input} value={input.goal} maxLength={1500} onChange={e => change("goal", e.target.value)} placeholder={t("Например: научиться давать бережную обратную связь", "Мысалы: қолдау көрсететін кері байланыс беруді үйрену")} /></Field>
        </div>
      </Section>
      <Section number="02" title={t("Для кого эта встреча", "Бұл кездесу кімге арналған")} hint={t("Содержание и упражнения будут адаптированы под группу.", "Мазмұн мен жаттығулар топқа бейімделеді.")}>
        <div className={s.stack}>
          <Field id="training-audience" label={t("Аудитория", "Аудитория")}><select id="training-audience" className={s.input} value={audienceId} onChange={e => { const id = e.target.value; const audience = AUDIENCES.find(x => x.id === id)!; onChange({ ...input, audience: id === "other" ? "" : audience.kk, duration_minutes: input.output_mode === "express" ? input.duration_minutes : audienceDuration(id) }); }}>{AUDIENCES.map(a => <option key={a.id} value={a.id}>{a[language]}</option>)}</select></Field>
          {audienceId === "other" && <Field id="training-custom-audience" label={t("Опишите вашу аудиторию", "Аудиторияңызды сипаттаңыз")}><input id="training-custom-audience" className={s.input} value={input.audience} maxLength={250} minLength={2} required onChange={e => change("audience", e.target.value)} placeholder={t("Например: заведующие школьными библиотеками", "Мысалы: мектеп кітапханашылары")} /></Field>}
          <div className={s.grid}>
            <Field id="training-count" label={t("Участников", "Қатысушылар саны")}><input id="training-count" type="number" className={s.input} min={2} max={1000} required value={Number.isNaN(input.participant_count) ? "" : input.participant_count} onChange={e => change("participant_count", e.target.valueAsNumber)} /></Field>
            <Field id="training-age" label={t("Возраст или класс · необязательно", "Жасы немесе сыныбы · міндетті емес")}><input id="training-age" className={s.input} value={input.age_group} maxLength={100} onChange={e => change("age_group", e.target.value)} placeholder={t("Например: 3 класс, 8–9 лет", "Мысалы: 3-сынып, 8–9 жас")} /></Field>
            <div><Field id="training-duration" label={t("Длительность, минут", "Ұзақтығы, минут")}><input id="training-duration" type="number" className={s.input} required min={5} max={maxDuration} value={Number.isNaN(input.duration_minutes) ? "" : input.duration_minutes} onChange={e => change("duration_minutes", e.target.valueAsNumber)} /></Field><div className={s.numberRow}>{(input.output_mode === "express" ? [5, 10, 15] : [25, 35, 45, 60, 90]).map(n => <button key={n} type="button" aria-pressed={input.duration_minutes === n} onClick={() => change("duration_minutes", n)}>{n}</button>)}</div></div>
            <Field id="training-format" label={t("Формат проведения", "Өткізу форматы")}><select id="training-format" className={s.input} value={input.format} onChange={e => change("format", e.target.value as TrainingInput["format"])}><option value="offline">{t("Офлайн", "Офлайн")}</option><option value="online">{t("Онлайн", "Онлайн")}</option><option value="hybrid">{t("Смешанный", "Аралас")}</option></select></Field>
          </div>
          <details className={s.details}><summary>{t("Условия и особенности группы", "Топтың жағдайы мен ерекшеліктері")}</summary><div className={s.stack}>
            <div className={s.grid}><Field id="training-experience" label={t("Опыт участников", "Қатысушылардың тәжірибесі")}><input id="training-experience" className={s.input} maxLength={500} value={input.experience} onChange={e => change("experience", e.target.value)} placeholder={t("Например: молодые педагоги, до 3 лет", "Мысалы: 3 жылға дейінгі жас мамандар")} /></Field><Field id="training-venue" label={t("Место проведения", "Өткізу орны")}><input id="training-venue" className={s.input} maxLength={300} value={input.venue} onChange={e => change("venue", e.target.value)} placeholder={t("Кабинет, актовый зал, Zoom…", "Кабинет, акт залы, Zoom…")} /></Field></div>
            <Field id="training-materials" label={t("Доступные материалы", "Қолжетімді материалдар")} hint={t("Перечислите через запятую. Если поле пустое, предложим доступный набор.", "Үтір арқылы жазыңыз. Бос қалдырсаңыз, қолжетімді жинақ ұсынамыз.")}><input id="training-materials" className={s.input} maxLength={2000} value={input.materials.join(",")} onChange={e => change("materials", e.target.value ? e.target.value.split(",") : [])} placeholder={t("Бумага А4, маркеры, стикеры", "А4 қағаз, маркерлер, стикерлер")} /></Field>
            <Field id="training-digital" label={t("Цифровые инструменты", "Цифрлық құралдар")}><input id="training-digital" className={s.input} maxLength={2000} value={input.digital_tools.join(",")} onChange={e => change("digital_tools", e.target.value ? e.target.value.split(",") : [])} placeholder={t("Проектор, телефоны, онлайн-доска…", "Проектор, телефондар, онлайн тақта…")} /></Field>
            <Field id="training-accessibility" label={t("Условия доступного участия", "Қолжетімді қатысу жағдайлары")} hint={t("Укажите необходимые условия без имён, диагнозов и личных данных.", "Аты-жөнін, диагнозын және жеке деректерін қоспай, қажетті жағдайды жазыңыз.")}><textarea id="training-accessibility" className={s.input} maxLength={1500} value={input.accessibility_notes} onChange={e => change("accessibility_notes", e.target.value)} placeholder={t("Например: все задания можно выполнить сидя", "Мысалы: барлық тапсырманы отырып орындауға болады")} /></Field>
          </div></details>
        </div>
      </Section>
      <Section number="03" title={t("Что подготовим для вас", "Сізге не дайындаймыз")} hint={t("Выберите объём материала — от новой идеи до готовой встречи.", "Материал көлемін таңдаңыз — жаңа идеядан дайын кездесуге дейін.")}>
        <div role="group" aria-label={t("Режим результата", "Нәтиже режимі")} className={`${s.choices} ${s.modes}`}>{MODES.map(item => <button key={item.id} type="button" className={s.choice} aria-pressed={input.output_mode === item.id} onClick={() => onChange(selectOutput(input, item.id))}><Icon name={item.icon} /><span className={s.choiceText}><strong>{item[language]}</strong><small>{language === "kk" ? item.kkHint : item.ruHint}</small></span><span className={s.selectedDot} aria-hidden="true" /></button>)}</div>
        <div className={`${s.grid} mt-6`}><Field id="training-language" label={t("Язык материала", "Материал тілі")}><select id="training-language" className={s.input} value={input.language} onChange={e => change("language", e.target.value as TrainingInput["language"])}>{CONTENT_LANGUAGE_OPTIONS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select></Field><Field id="training-creativity" label={t("Творческий подход", "Шығармашылық тәсіл")}><select id="training-creativity" className={s.input} value={input.creativity} onChange={e => change("creativity", e.target.value as TrainingInput["creativity"])}><option value="balanced">{t("Баланс практики и креатива", "Практика мен креатив теңгерімі")}</option><option value="bold">{t("Больше необычных решений", "Ерекше шешімдер көбірек")}</option><option value="restrained">{t("Сдержанный и деловой", "Ұстамды және іскерлік")}</option></select></Field></div>
        <details className={s.details}><summary>{t("Результат и дополнительные пожелания", "Нәтиже және қосымша тілектер")}</summary><div className={s.stack}>
          <Field id="training-result" label={t("Что участники унесут с собой?", "Қатысушылар өзімен не алып кетеді?")}><input id="training-result" className={s.input} maxLength={1500} value={input.expected_result} onChange={e => change("expected_result", e.target.value)} placeholder={t("Например: командное соглашение из 5 правил", "Мысалы: 5 ережеден тұратын командалық келісім")} /></Field>
          <Field id="training-notes" label={t("Пожелания ведущего", "Жүргізушінің тілектері")}><textarea id="training-notes" className={s.input} maxLength={2500} value={input.notes} onChange={e => change("notes", e.target.value)} placeholder={t("Что учесть при подготовке встречи?", "Кездесуді дайындауда нені ескеру керек?")} /></Field>
          <label className={s.checkbox}><input type="checkbox" checked={input.include_ai} onChange={e => change("include_ai", e.target.checked)} /><span>{t("Добавить задания с ИИ", "ЖИ тапсырмаларын қосу")}<small>{t("Готовые промпты и проверка ответов. Без личных данных участников.", "Дайын промпттар мен жауаптарды тексеру. Қатысушылардың жеке деректерінсіз.")}</small></span></label>
        </div></details>
      </Section>
    </div>
    <aside className={s.aside}>
      <div className={s.summary}><div className={s.summaryHead}><p className={s.miniLabel}>SANDUAI · WORKSHOP STUDIO</p><h2>{t("Ваша следующая встреча", "Сіздің келесі кездесуіңіз")}</h2></div><div className={s.summaryBody}>
        <div className={s.summaryRow}><span>{t("Результат", "Нәтиже")}</span><strong>{mode[language]}</strong></div>
        <div className={s.summaryRow}><span>{t("Время", "Уақыт")}</span><strong>{input.duration_minutes || "—"} {t("минут", "минут")}</strong></div>
        <div className={s.summaryRow}><span>{t("Участники", "Қатысушылар")}</span><strong>{input.participant_count || "—"} {t("человек", "адам")}</strong></div>
        <div className={s.summaryRow}><span>{t("Язык", "Тіл")}</span><strong>{CONTENT_LANGUAGE_OPTIONS.find(l => l.value === input.language)?.label}</strong></div>
        <div className={s.included}><p>{t("В материале будет", "Материал құрамында")}</p><ul>{inclusions.map(x => <li key={x}><Icon name="check" />{x}</li>)}</ul></div>
        {error && <div role="alert" className={`${s.error} mt-4`}>{error}</div>}
        {insufficient && <p className={`${s.error} mt-4`}>{t("Недостаточно токенов. ", "Токен жеткіліксіз. ")}<Link href="/dashboard/profile">{t("Пополнить баланс", "Балансты толтыру")}</Link></p>}
        <button type="submit" disabled={busy || insufficient} className={s.primary}><Icon name="spark" />{busy ? t("Отправляем…", "Жіберілуде…") : t("Создать материал", "Материал жасау")}<Icon name="arrow" /></button>
        <div className={s.cost}><span>{cost === null ? t("Стоимость уточняется", "Құны анықталуда") : `${cost} ${t("токенов", "токен")}`}</span><span>{t("Баланс", "Баланс")}: {balance ?? "—"}</span></div>
        <p className={s.draft} role="status">{saved ? t("Черновик сохранён на этом устройстве", "Нобай осы құрылғыда сақталды") : t("Достаточно указать тему встречи", "Кездесу тақырыбын жазсаңыз жеткілікті")}</p>
      </div></div>
      <div className={s.safetyCard}><Icon name="shield" /><div><strong>{t("Бережно к каждому участнику", "Әр қатысушыға қамқорлықпен")}</strong><p>{t("Добровольное участие, право наблюдать и доступные альтернативы заложены в каждый сценарий.", "Ерікті қатысу, бақылаушы болу құқығы және қолжетімді баламалар әр сценарийде ескеріледі.")}</p></div></div>
    </aside>
  </form>;
}
