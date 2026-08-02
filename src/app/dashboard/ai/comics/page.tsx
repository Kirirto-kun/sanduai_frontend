"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "../../../../i18n/LanguageContext";
import { useTokens } from "../../../../hooks/useTokens";
import { InsufficientTokensError } from "../../../../lib/api";
import {
  ComicResult,
  ComicStyle,
  generateComic,
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

export default function ComicsPage() {
  const { language } = useLanguage();
  const t = TEXT[language];
  const { costs, balance, refreshBalance } = useTokens();

  const cost = costs["comic_generate"] ?? 50;

  const [description, setDescription] = useState("");
  const [panelCount, setPanelCount] = useState(4);
  const [lang, setLang] = useState<Language>(language);
  const [style, setStyle] = useState<ComicStyle>("cartoon");
  const [photos, setPhotos] = useState<File[]>([]);

  const [result, setResult] = useState<ComicResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    setResult(null);

    try {
      const data = await generateComic({
        description: description.trim(),
        panelCount,
        language: lang,
        style,
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
          {loading && <LoadingState title={t.loadingTitle} steps={[...t.steps]} />}
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
  );
}
