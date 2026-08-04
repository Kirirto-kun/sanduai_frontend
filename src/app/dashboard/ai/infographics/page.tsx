"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "../../../../i18n/LanguageContext";
import { useTokens } from "../../../../hooks/useTokens";
import { InsufficientTokensError } from "../../../../lib/api";
import { visualGenerationErrorMessage } from "../../../../lib/visuals-ai-errors";
import {
  generateInfographic,
  InfographicResult,
  Language,
  Orientation,
} from "../../../../lib/visuals-ai-api";
import {
  EmptyState,
  ErrorState,
  Field,
  GenerateButton,
  GeneratorLayout,
  ImageCard,
  LoadingState,
  Option,
  OptionGrid,
  TextArea,
} from "../../../../components/visuals/GeneratorUI";

const TEXT = {
  ru: {
    title: "Инфографика",
    subtitle:
      "Напишите тему — или сразу вставьте готовые данные. Как подать материал, ИИ решит сам под смысл темы.",
    costLabel: "токенов",
    topic: "Тема или данные",
    topicHint:
      "Можно просто тему: «Круговорот воды». А можно вставить свои цифры и факты — они попадут на инфографику как есть.",
    topicPlaceholder:
      "Судың табиғаттағы айналымы\n\nнемесе:\n\nМұнай бағасы: 2022 — 92 $, 2023 — 82 $, 2024 — 85 $, 2025 — 90 $",
    langLabel: "Язык надписей",
    orientation: "Ориентация",
    generate: "Создать инфографику",
    generating: "Создаём...",
    emptyTitle: "Здесь появится ваша инфографика",
    emptyHint: "Опишите тему слева и нажмите кнопку. Занимает около минуты.",
    loadingTitle: "Придумываем инфографику",
    steps: ["Подбираем подачу под тему", "Формулируем подписи", "Рисуем"],
    download: "Скачать",
    open: "Открыть",
    downloading: "Скачиваем...",
    noTokens: "Недостаточно токенов",
    orientations: { portrait: "Книжная", landscape: "Альбомная", square: "Квадрат" },
  },
  kk: {
    title: "Инфографика жасау",
    subtitle:
      "Тақырыпты жазыңыз — немесе дайын деректерді қойыңыз. Материалды қалай беруді ЖИ тақырыптың мәніне қарай өзі шешеді.",
    costLabel: "токен",
    topic: "Тақырып немесе деректер",
    topicHint:
      "Жай тақырып жазсаңыз да болады: «Судың айналымы». Немесе өз сандарыңызды қойыңыз — олар инфографикаға сол күйі түседі.",
    topicPlaceholder:
      "Судың табиғаттағы айналымы\n\nнемесе:\n\nМұнай бағасы: 2022 — 92 $, 2023 — 82 $, 2024 — 85 $, 2025 — 90 $",
    langLabel: "Жазулар тілі",
    orientation: "Бағыты",
    generate: "Инфографика жасау",
    generating: "Жасалуда...",
    emptyTitle: "Мұнда сіздің инфографикаңыз пайда болады",
    emptyHint: "Сол жақта тақырыпты жазып, батырманы басыңыз. Бір минуттай алады.",
    loadingTitle: "Инфографика ойластырылуда",
    steps: ["Тақырыпқа сай пішім таңдаймыз", "Жазуларды құрастырамыз", "Саламыз"],
    download: "Жүктеу",
    open: "Ашу",
    downloading: "Жүктелуде...",
    noTokens: "Токен жеткіліксіз",
    orientations: { portrait: "Кітаптық", landscape: "Альбомдық", square: "Шаршы" },
  },
} as const;

export default function InfographicsPage() {
  const { language } = useLanguage();
  const t = TEXT[language];
  const { costs, balance, refreshBalance } = useTokens();

  const cost = costs["infographic_generate"] ?? 50;

  const [topic, setTopic] = useState("");
  const [lang, setLang] = useState<Language>(language);
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  const [result, setResult] = useState<InfographicResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const orientationOptions: Option<Orientation>[] = [
    { value: "portrait", label: t.orientations.portrait },
    { value: "landscape", label: t.orientations.landscape },
    { value: "square", label: t.orientations.square },
  ];

  const langOptions: Option<Language>[] = [
    { value: "kk", label: "Қазақша" },
    { value: "ru", label: "Русский" },
  ];

  const enoughTokens = balance === null || balance >= cost;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await generateInfographic({
        topic: topic.trim(),
        language: lang,
        orientation,
      });
      setResult(data);
      refreshBalance();
    } catch (err) {
      if (err instanceof InsufficientTokensError) {
        setError(`${t.noTokens}: ${err.required} / ${err.available}`);
      } else {
        setError(visualGenerationErrorMessage(err, language));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GeneratorLayout
      icon="📊"
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
              rows={7}
              maxLength={4000}
              disabled={loading}
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

          <Field label={t.orientation}>
            <OptionGrid
              options={orientationOptions}
              value={orientation}
              onChange={setOrientation}
              disabled={loading}
              columns={3}
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
            <EmptyState icon="📊" title={t.emptyTitle} hint={t.emptyHint} />
          )}
          {result && !loading && (
            <ImageCard
              imageUrl={result.image_url}
              filename={`infographic-${Date.now()}.png`}
              title={result.title}
              labels={{
                download: t.download,
                open: t.open,
                downloading: t.downloading,
              }}
            />
          )}
        </div>
      }
    />
  );
}
