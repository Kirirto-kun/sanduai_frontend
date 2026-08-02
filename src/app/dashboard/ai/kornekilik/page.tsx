"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "../../../../i18n/LanguageContext";
import { useTokens } from "../../../../hooks/useTokens";
import { InsufficientTokensError } from "../../../../lib/api";
import {
  generateKornekilik,
  KornekilikResult,
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
  PhotoDropzone,
  TextArea,
} from "../../../../components/visuals/GeneratorUI";

const TEXT = {
  ru: {
    title: "Наглядные пособия",
    subtitle:
      "Плакаты, правила, карточки и таблицы для печати. Напишите тему — оформление ИИ придумает сам.",
    costLabel: "токенов",
    topic: "Что нужно на плакате",
    topicHint:
      "Пишите свободно: «Правила поведения в кабинете химии» или «Алфавит с картинками для 1 класса».",
    topicPlaceholder: "Сыныптағы қауіпсіздік ережелері",
    langLabel: "Язык надписей",
    orientation: "Ориентация",
    notes: "Пожелания (необязательно)",
    notesPlaceholder: "Добавь казахский орнамент, спокойные цвета",
    photo: "Фото для образца (необязательно)",
    photoPrompt: "Перетащите фото или нажмите",
    photoHint: "До 3 фото, каждое меньше 8 МБ",
    photoRemove: "Убрать",
    generate: "Создать наглядность",
    generating: "Создаём...",
    emptyTitle: "Здесь появится ваш плакат",
    emptyHint: "Опишите тему слева и нажмите кнопку. Занимает около минуты.",
    loadingTitle: "Готовим наглядность",
    steps: ["Продумываем содержание", "Подбираем иллюстрации", "Рисуем плакат"],
    download: "Скачать",
    open: "Открыть",
    downloading: "Скачиваем...",
    noTokens: "Недостаточно токенов",
    orientations: { portrait: "Книжная", landscape: "Альбомная", square: "Квадрат" },
  },
  kk: {
    title: "Көрнекілік жасау",
    subtitle:
      "Басып шығаруға арналған плакаттар, ережелер, карточкалар мен кестелер. Тақырыпты жазыңыз — безендіруді ЖИ өзі ойлап табады.",
    costLabel: "токен",
    topic: "Плакатта не болу керек",
    topicHint:
      "Еркін жазыңыз: «Химия кабинетіндегі мінез-құлық ережелері» немесе «1-сыныпқа суретті әліппе».",
    topicPlaceholder: "Сыныптағы қауіпсіздік ережелері",
    langLabel: "Жазулар тілі",
    orientation: "Бағыты",
    notes: "Қосымша тілектер (міндетті емес)",
    notesPlaceholder: "Қазақ оюын қос, түстері жұмсақ болсын",
    photo: "Үлгі фото (міндетті емес)",
    photoPrompt: "Фотоны сүйреп әкеліңіз немесе басыңыз",
    photoHint: "3 фотоға дейін, әрқайсысы 8 МБ-тан аз",
    photoRemove: "Алып тастау",
    generate: "Көрнекілік жасау",
    generating: "Жасалуда...",
    emptyTitle: "Мұнда сіздің плакатыңыз пайда болады",
    emptyHint: "Сол жақта тақырыпты жазып, батырманы басыңыз. Бір минуттай алады.",
    loadingTitle: "Көрнекілік дайындалуда",
    steps: ["Мазмұнын ойластырамыз", "Суреттерін таңдаймыз", "Плакатты саламыз"],
    download: "Жүктеу",
    open: "Ашу",
    downloading: "Жүктелуде...",
    noTokens: "Токен жеткіліксіз",
    orientations: { portrait: "Кітаптық", landscape: "Альбомдық", square: "Шаршы" },
  },
} as const;

export default function KornekilikPage() {
  const { language } = useLanguage();
  const t = TEXT[language];
  const { costs, balance, refreshBalance } = useTokens();

  const cost = costs["kornekilik_generate"] ?? 50;

  const [topic, setTopic] = useState("");
  const [lang, setLang] = useState<Language>(language);
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const [result, setResult] = useState<KornekilikResult | null>(null);
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
      const data = await generateKornekilik({
        topic: topic.trim(),
        language: lang,
        orientation,
        notes: notes.trim() || undefined,
        photos,
      });
      setResult(data);
      refreshBalance();
    } catch (err) {
      if (err instanceof InsufficientTokensError) {
        setError(`${t.noTokens}: ${err.required} / ${err.available}`);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GeneratorLayout
      icon="🖼"
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
              rows={4}
              maxLength={1000}
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
            <EmptyState icon="🖼" title={t.emptyTitle} hint={t.emptyHint} />
          )}
          {result && !loading && (
            <ImageCard
              imageUrl={result.image_url}
              filename={`kornekilik-${Date.now()}.png`}
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
