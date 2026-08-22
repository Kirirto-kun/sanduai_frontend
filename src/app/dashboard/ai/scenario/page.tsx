"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "../../../../i18n/LanguageContext";
import { useTokens } from "../../../../hooks/useTokens";
import { useTeacherErrorMessage } from "@/hooks/useTeacherErrorMessage";
import { InsufficientTokensError } from "../../../../lib/api";
import {
  generateScenario,
  Language,
  ScenarioBlockType,
  ScenarioResult,
  ScenarioSegment,
} from "../../../../lib/visuals-ai-api";
import {
  EmptyState,
  ErrorState,
  Field,
  GenerateButton,
  GeneratorLayout,
  LoadingState,
  Option,
  OptionGrid,
  TextArea,
  TextInput,
} from "../../../../components/visuals/GeneratorUI";

const BLOCK_ICON: Record<ScenarioBlockType, string> = {
  intro: "🎤",
  poem: "📜",
  song: "🎵",
  dance: "💃",
  game: "🎲",
  contest: "🏆",
  skit: "🎭",
  speech: "🗣",
  outro: "🎬",
};

const DURATIONS = [20, 30, 45, 60];

const TEXT = {
  ru: {
    title: "Сценарий мероприятия",
    subtitle:
      "Готовый сценарий с программой номеров, таймингом, репликами ведущего и списком реквизита.",
    costLabel: "токенов",
    topic: "Повод или тема",
    topicHint: "Например: Наурыз мейрамы, выпускной в подготовительной группе, Ана күні",
    topicPlaceholder: "Наурыз мейрамы",
    segment: "Где проводится",
    age: "Возраст участников",
    duration: "Длительность, минут",
    langLabel: "Язык сценария",
    notes: "Пожелания (необязательно)",
    notesPlaceholder: "Пусть участвуют родители, нужен конкурс на казахском",
    generate: "Составить сценарий",
    generating: "Составляем...",
    emptyTitle: "Здесь появится ваш сценарий",
    emptyHint: "Укажите повод слева и нажмите кнопку.",
    loadingTitle: "Составляем сценарий",
    steps: ["Продумываем программу", "Расписываем номера", "Считаем тайминг"],
    goal: "Цель",
    equipment: "Оформление и реквизит",
    program: "Программа",
    minutes: "мин",
    total: "Всего",
    participants: "Участники",
    props: "Подготовить",
    copy: "Скопировать сценарий",
    copied: "Скопировано",
    noTokens: "Недостаточно токенов",
    segments: {
      kindergarten: "Детсад",
      library: "Библиотека",
      school: "Школа",
    },
  },
  kk: {
    title: "Сценарий жазу",
    subtitle:
      "Нөмірлер бағдарламасы, тайминг, жүргізушінің сөзі және реквизит тізімі бар дайын сценарий.",
    costLabel: "токен",
    topic: "Себебі немесе тақырыбы",
    topicHint: "Мысалы: Наурыз мейрамы, мектепалды тобының бітіру кеші, Ана күні",
    topicPlaceholder: "Наурыз мейрамы",
    segment: "Қайда өткізіледі",
    age: "Қатысушылар жасы",
    duration: "Ұзақтығы, минут",
    langLabel: "Сценарий тілі",
    notes: "Қосымша тілектер (міндетті емес)",
    notesPlaceholder: "Ата-аналар қатыссын, қазақша сайыс керек",
    generate: "Сценарий жазу",
    generating: "Жазылуда...",
    emptyTitle: "Мұнда сіздің сценарийіңіз пайда болады",
    emptyHint: "Сол жақта себебін көрсетіп, батырманы басыңыз.",
    loadingTitle: "Сценарий құрылуда",
    steps: ["Бағдарламаны ойластырамыз", "Нөмірлерді жазамыз", "Таймингті есептейміз"],
    goal: "Мақсаты",
    equipment: "Көрнекілігі мен реквизиті",
    program: "Бағдарлама",
    minutes: "мин",
    total: "Барлығы",
    participants: "Қатысушылар",
    props: "Дайындау керек",
    copy: "Сценарийді көшіру",
    copied: "Көшірілді",
    noTokens: "Токен жеткіліксіз",
    segments: {
      kindergarten: "Балабақша",
      library: "Кітапхана",
      school: "Мектеп",
    },
  },
} as const;

export default function ScenarioPage() {
  const { language } = useLanguage();
  const toTeacherErrorMessage = useTeacherErrorMessage();
  const t = TEXT[language];
  const { costs, balance, refreshBalance } = useTokens();

  const cost = costs["scenario_generate"] ?? 30;

  const [topic, setTopic] = useState("");
  const [segment, setSegment] = useState<ScenarioSegment>("kindergarten");
  const [age, setAge] = useState("5-6 жас");
  const [duration, setDuration] = useState(30);
  const [lang, setLang] = useState<Language>(language);
  const [notes, setNotes] = useState("");

  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const enoughTokens = balance === null || balance >= cost;

  const segmentOptions: Option<ScenarioSegment>[] = [
    { value: "kindergarten", label: t.segments.kindergarten, icon: "🧸" },
    { value: "library", label: t.segments.library, icon: "📚" },
    { value: "school", label: t.segments.school, icon: "🏫" },
  ];

  const langOptions: Option<Language>[] = [
    { value: "kk", label: "Қазақша" },
    { value: "ru", label: "Русский" },
  ];

  const durationOptions: Option<string>[] = DURATIONS.map((d) => ({
    value: String(d),
    label: String(d),
  }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setError(null);
    setLoading(true);
    setResult(null);
    setCopied(false);

    try {
      const data = await generateScenario({
        topic: topic.trim(),
        segment,
        age,
        durationMinutes: duration,
        language: lang,
        notes: notes.trim() || undefined,
      });
      setResult(data);
      refreshBalance();
    } catch (err) {
      if (err instanceof InsufficientTokensError) {
        setError(`${t.noTokens}: ${err.required} / ${err.available}`);
      } else {
        setError(toTeacherErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyScenario = async () => {
    if (!result) return;
    const text = [
      result.title,
      "",
      `${t.goal}: ${result.goal}`,
      `${t.equipment}: ${result.equipment}`,
      "",
      ...result.blocks.map(
        (b) =>
          `${b.index}. ${b.title} (${b.minutes} ${t.minutes})\n${b.content}` +
          (b.props ? `\n${t.props}: ${b.props}` : "")
      ),
    ].join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GeneratorLayout
      icon="🎭"
      title={t.title}
      subtitle={t.subtitle}
      cost={cost}
      costLabel={t.costLabel}
      form={
        <form onSubmit={onSubmit}>
          <Field label={t.topic} hint={t.topicHint}>
            <TextArea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.topicPlaceholder}
              rows={2}
              maxLength={500}
              disabled={loading}
            />
          </Field>

          <Field label={t.segment}>
            <OptionGrid
              options={segmentOptions}
              value={segment}
              onChange={setSegment}
              disabled={loading}
              columns={3}
            />
          </Field>

          <Field label={t.age}>
            <TextInput
              value={age}
              onChange={(e) => setAge(e.target.value)}
              maxLength={50}
              disabled={loading}
            />
          </Field>

          <Field label={t.duration}>
            <OptionGrid
              options={durationOptions}
              value={String(duration)}
              onChange={(v) => setDuration(Number(v))}
              disabled={loading}
              columns={4}
            />
          </Field>

          <Field label={t.langLabel}>
            <OptionGrid
              options={langOptions}
              value={lang}
              onChange={setLang}
              disabled={loading}
            />
          </Field>

          <Field label={t.notes}>
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              rows={2}
              maxLength={500}
              disabled={loading}
            />
          </Field>

          <GenerateButton
            loading={loading}
            disabled={!topic.trim() || !enoughTokens}
            label={t.generate}
            loadingLabel={t.generating}
          />

          {!enoughTokens && (
            <p className="mt-2 text-center text-xs text-red-600">
              {t.noTokens}: {cost} / {balance}
            </p>
          )}
        </form>
      }
      result={
        <div className="space-y-4">
          {error && <ErrorState message={error} />}
          {loading && <LoadingState title={t.loadingTitle} steps={[...t.steps]} />}
          {!loading && !result && !error && (
            <EmptyState icon="🎭" title={t.emptyTitle} hint={t.emptyHint} />
          )}

          {result && !loading && (
            <>
              <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-900">{result.title}</h2>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {t.total}: {result.total_minutes} {t.minutes}
                  </span>
                </div>

                <dl className="mt-4 space-y-2.5 text-sm">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t.goal}
                    </dt>
                    <dd className="text-slate-700">{result.goal}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t.equipment}
                    </dt>
                    <dd className="text-slate-700">{result.equipment}</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={copyScenario}
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {copied ? `✓ ${t.copied}` : `📋 ${t.copy}`}
                </button>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t.program}
              </p>

              <ol className="space-y-3">
                {result.blocks.map((block) => (
                  <li
                    key={block.index}
                    className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                        {BLOCK_ICON[block.block_type] ?? "•"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {block.index}. {block.title}
                          </h3>
                          <span className="shrink-0 text-xs text-slate-400">
                            {block.minutes} {t.minutes}
                          </span>
                        </div>

                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                          {block.content}
                        </p>

                        {(block.participants || block.props) && (
                          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            {block.participants && (
                              <span>
                                <span className="font-semibold">{t.participants}:</span>{" "}
                                {block.participants}
                              </span>
                            )}
                            {block.props && (
                              <span>
                                <span className="font-semibold">{t.props}:</span>{" "}
                                {block.props}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs leading-relaxed text-amber-900">
                  ⚠️ {result.disclaimer}
                </p>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
