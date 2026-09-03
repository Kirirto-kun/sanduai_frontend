"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { ModuleGenerationHistory } from "../../../../components/generations/ModuleGenerationHistory";
import { useLanguage } from "../../../../i18n/LanguageContext";
import { useTokens } from "../../../../hooks/useTokens";
import {
  enqueueGenerationJob,
  getGenerationJob,
  InsufficientTokensError,
} from "../../../../lib/api";
import {
  generationJobIdFromSearchParam,
  isActiveGenerationJob,
} from "../../../../lib/generation-history";
import { visualGenerationErrorMessage } from "../../../../lib/visuals-ai-errors";
import {
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

const KIND = "visual.infographic";
const MODULE_KINDS = [KIND] as const;
const SOURCE_PATH = "/dashboard/ai/infographics";

function InfographicsContent() {
  const { language } = useLanguage();
  const t = TEXT[language];
  const { costs, balance, refreshBalance } = useTokens();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const requestedJobId = generationJobIdFromSearchParam(searchParams.get("job"));
  const [sessionJobId, setSessionJobId] = useState<string | null>(null);
  const currentJobId = requestedJobId ?? sessionJobId;
  const settledJobId = useRef<string | null>(null);

  const cost = costs["infographic_generate"] ?? 50;

  const [topic, setTopic] = useState("");
  const [lang, setLang] = useState<Language>(language);
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  const [result, setResult] = useState<InfographicResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const job = useQuery({
    queryKey: ["generation-job", currentJobId],
    queryFn: () => getGenerationJob(currentJobId as string),
    enabled: Boolean(currentJobId),
    retry: 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data && isActiveGenerationJob(query.state.data) ? 2_000 : false,
  });
  const loading = submitting || Boolean(
    currentJobId && (job.isPending || (job.data && isActiveGenerationJob(job.data))),
  );

  useEffect(() => {
    setResult(null);
    setError(null);
    settledJobId.current = null;
  }, [currentJobId]);

  useEffect(() => {
    const value = job.data;
    if (!value || isActiveGenerationJob(value) || settledJobId.current === value.id) return;
    settledJobId.current = value.id;
    if (value.kind !== KIND) {
      setError(language === "kk" ? "Бұл материал басқа бөлімде жасалған." : "Этот материал создан в другом разделе.");
      return;
    }
    if ((value.status === "completed" || value.status === "billing_error") && value.result) {
      setResult(value.result as unknown as InfographicResult);
      setError(null);
      refreshBalance();
      return;
    }
    setError(
      value.status === "cancelled"
        ? language === "kk" ? "Жасау тоқтатылды. Монеталар қайтарылды." : "Создание остановлено. Монеты возвращены."
        : language === "kk" ? "Инфографиканы жасау мүмкін болмады. Монеталар қайтарылды." : "Не удалось создать инфографику. Монеты возвращены.",
    );
    refreshBalance();
  }, [job.data, language, refreshBalance]);

  useEffect(() => {
    if (job.error) setError(visualGenerationErrorMessage(job.error, language));
  }, [job.error, language]);

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
    setSubmitting(true);
    setResult(null);

    try {
      const created = await enqueueGenerationJob(
        KIND,
        { topic: topic.trim(), language: lang, orientation },
        { title: topic.trim() },
      );
      setSessionJobId(created.id);
      queryClient.setQueryData(["generation-job", created.id], created);
      router.replace(`${SOURCE_PATH}?job=${encodeURIComponent(created.id)}`, { scroll: false });
    } catch (err) {
      if (err instanceof InsufficientTokensError) {
        setError(`${t.noTokens}: ${err.required} / ${err.available}`);
      } else {
        setError(visualGenerationErrorMessage(err, language));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
          {loading && <LoadingState title={t.loadingTitle} steps={[...t.steps]} serverAccepted={!submitting && job.data?.id === currentJobId} />}
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
      <div className="mx-auto max-w-7xl">
        <ModuleGenerationHistory kinds={MODULE_KINDS} />
      </div>
    </>
  );
}

export default function InfographicsPage() {
  return (
    <Suspense fallback={<div className="min-h-96 animate-pulse rounded-3xl bg-white/70" />}>
      <InfographicsContent />
    </Suspense>
  );
}
