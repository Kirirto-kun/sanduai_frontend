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
  ComicResult,
  ComicStyle,
  Language,
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
  PhotoDropzone,
  TextArea,
} from "../../../../components/visuals/GeneratorUI";

const PANEL_OPTIONS = [2, 4, 6, 8];

const TEXT = {
  ru: {
    title: "Комиксы",
    subtitle:
      "Опишите историю — ИИ напишет сценарий и нарисует готовую страницу с репликами. Можно приложить фото: героя, здание школы, место.",
    costLabel: "токенов",
    description: "О чём комикс",
    descriptionHint:
      "Пишите свободно: кто герои, что происходит, чему научит история.",
    descriptionPlaceholder:
      "Айсұлу и Болат идут в школу и учатся правильно переходить дорогу по светофору",
    panels: "Сколько кадров",
    langLabel: "Язык реплик",
    style: "Стиль рисовки",
    photo: "Фото (необязательно)",
    photoPrompt: "Перетащите фото или нажмите",
    photoHint: "Герой или место станет похож на фото. До 3 фото",
    photoRemove: "Убрать",
    generate: "Создать комикс",
    generating: "Рисуем...",
    emptyTitle: "Здесь появится ваш комикс",
    emptyHint:
      "Опишите историю слева. Вся страница рисуется одной картинкой, это занимает около минуты.",
    loadingTitle: "Создаём комикс",
    steps: [
      "Пишем сценарий по кадрам",
      "Придумываем внешность героев",
      "Рисуем страницу целиком",
    ],
    download: "Скачать",
    open: "Открыть",
    downloading: "Скачиваем...",
    script: "Сценарий",
    panel: "Кадр",
    noTokens: "Недостаточно токенов",
    styles: {
      cartoon: "Мультяшный",
      manga: "Манга",
      watercolor: "Акварель",
      retro: "Ретро",
    },
  },
  kk: {
    title: "Комикс жасау",
    subtitle:
      "Оқиғаны сипаттаңыз — ЖИ сценарий жазып, репликалармен дайын бетті салады. Фото қосуға болады: кейіпкер, мектеп ғимараты, орын.",
    costLabel: "токен",
    description: "Комикс не туралы",
    descriptionHint:
      "Еркін жазыңыз: кейіпкерлер кім, не болады, оқиға неге үйретеді.",
    descriptionPlaceholder:
      "Айсұлу мен Болат мектепке барады және бағдаршам бойынша жолдан дұрыс өтуді үйренеді",
    panels: "Кадр саны",
    langLabel: "Реплика тілі",
    style: "Сурет стилі",
    photo: "Фото (міндетті емес)",
    photoPrompt: "Фотоны сүйреп әкеліңіз немесе басыңыз",
    photoHint: "Кейіпкер немесе орын фотоға ұқсайды. 3 фотоға дейін",
    photoRemove: "Алып тастау",
    generate: "Комикс жасау",
    generating: "Салынуда...",
    emptyTitle: "Мұнда сіздің комиксіңіз пайда болады",
    emptyHint:
      "Сол жақта оқиғаны сипаттаңыз. Бүкіл бет бір суретпен салынады, бір минуттай алады.",
    loadingTitle: "Комикс жасалуда",
    steps: [
      "Кадрлар бойынша сценарий жазамыз",
      "Кейіпкерлердің бейнесін ойлаймыз",
      "Бетті түгел саламыз",
    ],
    download: "Жүктеу",
    open: "Ашу",
    downloading: "Жүктелуде...",
    script: "Сценарий",
    panel: "Кадр",
    noTokens: "Токен жеткіліксіз",
    styles: {
      cartoon: "Мультфильм",
      manga: "Манга",
      watercolor: "Акварель",
      retro: "Ретро",
    },
  },
} as const;

const KIND = "visual.comic";
const MODULE_KINDS = [KIND] as const;
const SOURCE_PATH = "/dashboard/ai/comics";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("PHOTO_READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

function ComicsContent() {
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

  const cost = costs["comic_generate"] ?? 50;

  const [description, setDescription] = useState("");
  const [panelCount, setPanelCount] = useState(4);
  const [lang, setLang] = useState<Language>(language);
  const [style, setStyle] = useState<ComicStyle>("cartoon");
  const [photos, setPhotos] = useState<File[]>([]);

  const [result, setResult] = useState<ComicResult | null>(null);
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
      setResult(value.result as unknown as ComicResult);
      setError(null);
      refreshBalance();
      return;
    }
    setError(
      value.status === "cancelled"
        ? language === "kk" ? "Жасау тоқтатылды. Монеталар қайтарылды." : "Создание остановлено. Монеты возвращены."
        : language === "kk" ? "Комиксті жасау мүмкін болмады. Монеталар қайтарылды." : "Не удалось создать комикс. Монеты возвращены.",
    );
    refreshBalance();
  }, [job.data, language, refreshBalance]);

  useEffect(() => {
    if (job.error) setError(visualGenerationErrorMessage(job.error, language));
  }, [job.error, language]);

  const enoughTokens = balance === null || balance >= cost;

  const styleOptions: Option<ComicStyle>[] = [
    { value: "cartoon", label: t.styles.cartoon, icon: "🎨" },
    { value: "manga", label: t.styles.manga, icon: "🇯🇵" },
    { value: "watercolor", label: t.styles.watercolor, icon: "🖌" },
    { value: "retro", label: t.styles.retro, icon: "📰" },
  ];

  const langOptions: Option<Language>[] = [
    { value: "kk", label: "Қазақша" },
    { value: "ru", label: "Русский" },
  ];

  const panelOptions: Option<string>[] = PANEL_OPTIONS.map((n) => ({
    value: String(n),
    label: String(n),
  }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setError(null);
    setSubmitting(true);
    setResult(null);

    try {
      const photosBase64 = await Promise.all(photos.map(fileToDataUrl));
      const created = await enqueueGenerationJob(
        KIND,
        {
          description: description.trim(),
          panel_count: panelCount,
          language: lang,
          style,
          photos_base64: photosBase64,
        },
        { title: description.trim() },
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
        icon="💥"
        title={t.title}
        subtitle={t.subtitle}
        cost={cost}
        costLabel={t.costLabel}
        form={
          <form onSubmit={onSubmit}>
          <Field label={t.description} hint={t.descriptionHint}>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows={5}
              maxLength={2000}
              disabled={loading}
            />
          </Field>

          <Field label={t.photo}>
            <PhotoDropzone
              files={photos}
              onChange={setPhotos}
              disabled={loading}
              labels={{
                prompt: t.photoPrompt,
                hint: t.photoHint,
                remove: t.photoRemove,
              }}
            />
          </Field>

          <Field label={t.panels}>
            <OptionGrid
              options={panelOptions}
              value={String(panelCount)}
              onChange={(v) => setPanelCount(Number(v))}
              disabled={loading}
              columns={4}
            />
          </Field>

          <Field label={t.style}>
            <OptionGrid
              options={styleOptions}
              value={style}
              onChange={setStyle}
              disabled={loading}
              columns={2}
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

          <GenerateButton
            loading={loading}
            disabled={!description.trim() || !enoughTokens}
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
            <EmptyState icon="💥" title={t.emptyTitle} hint={t.emptyHint} />
          )}
          {result && !loading && (
            <ImageCard
              imageUrl={result.image_url}
              filename={`comic-${Date.now()}.png`}
              title={result.title}
              labels={{
                download: t.download,
                open: t.open,
                downloading: t.downloading,
              }}
              caption={
                result.panels.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t.script}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {result.panels.map((panel) => (
                        <li key={panel.index} className="text-sm text-slate-600">
                          <span className="font-semibold text-slate-800">
                            {t.panel} {panel.index}.
                          </span>{" "}
                          {panel.dialogue
                            .map((d) => `${d.speaker}: ${d.text}`)
                            .join(" · ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              }
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

export default function ComicsPage() {
  return (
    <Suspense fallback={<div className="min-h-96 animate-pulse rounded-3xl bg-white/70" />}>
      <ComicsContent />
    </Suspense>
  );
}
