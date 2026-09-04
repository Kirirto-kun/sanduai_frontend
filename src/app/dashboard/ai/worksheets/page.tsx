"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ModuleGenerationHistory } from "@/components/generations/ModuleGenerationHistory";
import {
  EmptyState,
  ErrorState,
  Field,
  GenerateButton,
  GeneratorLayout,
  LoadingState,
  OptionGrid,
  TextArea,
  TextInput,
  type Option,
} from "@/components/visuals/GeneratorUI";
import { useAuth } from "@/contexts/AuthContext";
import { getLibrarySubjects } from "@/features/content-library/api";
import type { ContentSubject } from "@/features/content-library/types";
import { BookPageDropzone } from "@/features/worksheets/BookPageDropzone";
import {
  WORKSHEET_HISTORY_KINDS,
  WORKSHEET_IMAGE_KIND,
  buildWorksheetStyleDescription,
  isWorksheetImageResult,
  safeWorksheetFileName,
  validateWorksheetImageForm,
} from "@/features/worksheets/worksheet-image";
import { useTokens } from "@/hooks/useTokens";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  InsufficientTokensError,
  downloadImage,
  enqueueGenerationJob,
  getGenerationJob,
  type GenerationJob,
  type WorksheetImageGeneratePayload,
  type WorksheetImageLanguage,
  type WorksheetImageResult,
  type WorksheetStylePreset,
  type WorksheetTaskType,
} from "@/lib/api";
import { downloadGenerationMaterial, saveBlob } from "@/lib/generation-download";
import {
  generationJobIdFromSearchParam,
  isActiveGenerationJob,
} from "@/lib/generation-history";
import { visualGenerationErrorMessage } from "@/lib/visuals-ai-errors";


const CUSTOM_SUBJECT = "__other__";
const SOURCE_PATH = "/dashboard/ai/worksheets";
const GRADES = Array.from({ length: 11 }, (_, index) => index + 1);
const ALL_TASK_TYPES: WorksheetTaskType[] = [
  "multiple_choice",
  "fill_in_blank",
  "matching",
  "open_question",
];

const COPY = {
  ru: {
    title: "Красочный рабочий лист",
    subtitle: "Добавьте тему или страницы учебника — ИИ подготовит готовый лист с заданиями и иллюстрациями.",
    costLabel: "монет за лист",
    subject: "Предмет",
    chooseSubject: "Выберите предмет",
    otherSubject: "Другой предмет",
    customSubject: "Название предмета",
    customSubjectPlaceholder: "Например: Робототехника",
    subjectsUnavailable: "Список предметов сейчас недоступен. Введите предмет вручную.",
    grade: "Класс",
    gradeSuffix: "класс",
    language: "Язык рабочего листа",
    topic: "Тема (необязательно)",
    topicPlaceholder: "Например: Дроби и их сравнение",
    content: "Что должно быть в заданиях",
    contentHint: "Можно написать своими словами или добавить страницы учебника ниже.",
    contentPlaceholder: "Например: 6 коротких заданий от простого к сложному",
    sourcePages: "Страницы учебника (необязательно)",
    sourcePrompt: "Добавить фото страниц",
    sourceHint: "До 3 JPG, PNG или WebP · не более 12 МБ каждое",
    sourceRemove: "Удалить страницу",
    sourcePage: "Страница",
    sourceErrors: {
      too_many: "Можно добавить не больше трёх страниц.",
      unsupported_type: "Подойдут только изображения JPG, PNG или WebP.",
      too_large: "Каждое изображение должно быть не больше 12 МБ.",
    },
    style: "Оформление",
    styles: {
      bright: "Яркое",
      calm: "Спокойное",
      print: "Для ч/б печати",
    },
    styleNotes: "Пожелания к оформлению (необязательно)",
    styleNotesPlaceholder: "Например: тема космоса, больше места для ответов",
    tasks: "Какие задания добавить?",
    tasksHint: "Мы уже выбрали разные типы. Откройте, если хотите изменить.",
    taskCount: (count: number) => `Выбрано: ${count}`,
    taskLabels: {
      multiple_choice: "Выбрать правильный ответ",
      fill_in_blank: "Заполнить пропуски",
      matching: "Соединить пары",
      open_question: "Ответить своими словами",
    },
    generate: "Создать рабочий лист",
    generating: "Создаём…",
    noTokens: "Недостаточно монет",
    formErrors: {
      subject_required: "Выберите или введите предмет.",
      learning_source_required: "Напишите тему, содержание или добавьте страницу учебника.",
      task_type_required: "Выберите хотя бы один тип задания.",
      auth: "Войдите в аккаунт, чтобы создать рабочий лист.",
    },
    loadingTitle: "Рабочий лист создаётся",
    loadingSteps: ["Продумываем задания", "Оформляем лист", "Проверяем результат"],
    emptyTitle: "Здесь появится готовый рабочий лист",
    emptyHint: "Заполните только нужные поля слева. Обычно создание занимает около минуты.",
    downloadJpg: "Скачать JPG",
    downloading: "Подготавливаем JPG…",
    open: "Открыть",
    answers: "Ответы для учителя",
    answersHint: "Ответы не напечатаны на листе для ученика.",
    downloadAnswers: "Скачать ответы",
    downloadFailed: "Не удалось скачать файл. Попробуйте ещё раз.",
    legacyTitle: "Рабочий лист старого формата",
    legacyHint: "Этот материал сохранён в редактируемом формате Word.",
    legacyDownload: "Скачать DOCX",
    retry: "Попробовать снова",
    cancelled: "Создание остановлено. Монеты возвращены.",
    failed: "Не удалось создать рабочий лист. Монеты возвращены.",
    wrongMaterial: "Этот материал создан в другом разделе.",
    invalidResult: "Рабочий лист создан, но изображение пока недоступно. Откройте его позже в «Моих материалах».",
  },
  kk: {
    title: "Көркем жұмыс парағы",
    subtitle: "Тақырыпты немесе оқулық беттерін қосыңыз — ЖИ тапсырмалары мен суреттері бар дайын парақ жасайды.",
    costLabel: "бір параққа монета",
    subject: "Пән",
    chooseSubject: "Пәнді таңдаңыз",
    otherSubject: "Басқа пән",
    customSubject: "Пән атауы",
    customSubjectPlaceholder: "Мысалы: Робототехника",
    subjectsUnavailable: "Пәндер тізімі қазір ашылмады. Пәнді қолмен жазыңыз.",
    grade: "Сынып",
    gradeSuffix: "сынып",
    language: "Жұмыс парағының тілі",
    topic: "Тақырып (міндетті емес)",
    topicPlaceholder: "Мысалы: Бөлшектерді салыстыру",
    content: "Тапсырмаларда не болсын?",
    contentHint: "Өз сөзіңізбен жазыңыз немесе төменде оқулық беттерін қосыңыз.",
    contentPlaceholder: "Мысалы: жеңілден күрделіге қарай 6 қысқа тапсырма",
    sourcePages: "Оқулық беттері (міндетті емес)",
    sourcePrompt: "Беттердің фотосын қосу",
    sourceHint: "3 JPG, PNG немесе WebP дейін · әрқайсысы 12 МБ-тан аспасын",
    sourceRemove: "Бетті алып тастау",
    sourcePage: "Бет",
    sourceErrors: {
      too_many: "Үш беттен артық қосуға болмайды.",
      unsupported_type: "Тек JPG, PNG немесе WebP суреттерін қосуға болады.",
      too_large: "Әр сурет 12 МБ-тан аспауы керек.",
    },
    style: "Безендіру",
    styles: {
      bright: "Жарқын",
      calm: "Жұмсақ",
      print: "Ақ-қара баспаға",
    },
    styleNotes: "Безендіруге тілек (міндетті емес)",
    styleNotesPlaceholder: "Мысалы: ғарыш тақырыбы, жауапқа көбірек орын",
    tasks: "Қандай тапсырмалар қосылсын?",
    tasksHint: "Әртүрлі тапсырмалар таңдалып тұр. Өзгерту үшін ашыңыз.",
    taskCount: (count: number) => `Таңдалды: ${count}`,
    taskLabels: {
      multiple_choice: "Дұрыс жауапты таңдау",
      fill_in_blank: "Бос орынды толтыру",
      matching: "Жұптарды сәйкестендіру",
      open_question: "Өз сөзімен жауап беру",
    },
    generate: "Жұмыс парағын жасау",
    generating: "Жасалып жатыр…",
    noTokens: "Монета жеткіліксіз",
    formErrors: {
      subject_required: "Пәнді таңдаңыз немесе жазыңыз.",
      learning_source_required: "Тақырыпты, мазмұнды жазыңыз немесе оқулық бетін қосыңыз.",
      task_type_required: "Кемінде бір тапсырма түрін таңдаңыз.",
      auth: "Жұмыс парағын жасау үшін аккаунтқа кіріңіз.",
    },
    loadingTitle: "Жұмыс парағы жасалып жатыр",
    loadingSteps: ["Тапсырмаларды ойластырамыз", "Парақты безендіреміз", "Нәтижені тексереміз"],
    emptyTitle: "Дайын жұмыс парағы осы жерде пайда болады",
    emptyHint: "Сол жақтағы қажетті өрістерді ғана толтырыңыз. Әдетте бір минуттай уақыт алады.",
    downloadJpg: "JPG жүктеу",
    downloading: "JPG дайындалып жатыр…",
    open: "Ашу",
    answers: "Мұғалімге арналған жауаптар",
    answersHint: "Жауаптар оқушыға арналған парақта көрсетілмейді.",
    downloadAnswers: "Жауаптарды жүктеу",
    downloadFailed: "Файлды жүктеу мүмкін болмады. Қайталап көріңіз.",
    legacyTitle: "Ескі форматтағы жұмыс парағы",
    legacyHint: "Бұл материал Word форматында сақталған.",
    legacyDownload: "DOCX жүктеу",
    retry: "Қайта көру",
    cancelled: "Жасау тоқтатылды. Монеталар қайтарылды.",
    failed: "Жұмыс парағын жасау мүмкін болмады. Монеталар қайтарылды.",
    wrongMaterial: "Бұл материал басқа бөлімде жасалған.",
    invalidResult: "Жұмыс парағы жасалды, бірақ сурет әзірге ашылмай тұр. Оны кейін «Менің материалдарым» бөлімінен ашыңыз.",
  },
} as const;


function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("SOURCE_PAGE_READ_FAILED"));
    reader.readAsDataURL(file);
  });
}


function localizedSubjectName(subject: ContentSubject, language: "ru" | "kk"): string {
  return language === "kk" ? subject.name_kk?.trim() || subject.name : subject.name;
}


async function convertToJpeg(blob: Blob): Promise<Blob> {
  const sourceUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
      element.src = sourceUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("CANVAS_UNAVAILABLE");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error("JPG_ENCODE_FAILED")),
        "image/jpeg",
        0.94,
      );
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}


function WorksheetResultCard({
  result,
  language,
}: {
  result: WorksheetImageResult;
  language: "ru" | "kk";
}) {
  const t = COPY[language];
  const [imageLoaded, setImageLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const downloadJpeg = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const source = await downloadImage(result.image_url);
      const jpeg = await convertToJpeg(source);
      saveBlob(jpeg, `${safeWorksheetFileName(result.title)}.jpg`);
    } catch {
      setDownloadError(t.downloadFailed);
    } finally {
      setDownloading(false);
    }
  };

  const downloadAnswers = () => {
    const lines = result.answer_key.map((answer, index) => `${index + 1}. ${answer}`);
    saveBlob(
      new Blob(["\ufeff", result.title, "\n\n", lines.join("\n")], { type: "text/plain;charset=utf-8" }),
      `${safeWorksheetFileName(result.title)}-answers.txt`,
    );
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-sm">
      <header className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">{result.title}</h2>
      </header>

      <div className="bg-slate-100/70 p-3 sm:p-5">
        {!imageLoaded ? (
          <div className="mx-auto flex min-h-[520px] max-w-3xl items-center justify-center rounded-2xl bg-white">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-400 border-r-transparent" />
          </div>
        ) : null}
        {/* The image lives on the authenticated API/CDN and has a dynamic URL. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={result.image_url}
          alt={result.title}
          onLoad={() => setImageLoaded(true)}
          className={`mx-auto max-h-[82vh] w-auto max-w-full rounded-xl bg-white shadow-lg ${imageLoaded ? "" : "hidden"}`}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={() => void downloadJpeg()}
          disabled={downloading}
          className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
        >
          {downloading ? t.downloading : `↓ ${t.downloadJpg}`}
        </button>
        <a
          href={result.image_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          ↗ {t.open}
        </a>
      </div>

      {downloadError ? (
        <p className="mx-4 mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {downloadError}
        </p>
      ) : null}

      <details className="border-t border-slate-100 p-4">
        <summary className="cursor-pointer text-sm font-bold text-slate-800">{t.answers}</summary>
        <p className="mt-2 text-xs text-slate-500">{t.answersHint}</p>
        {result.answer_key.length > 0 ? (
          <>
            <ol className="mt-3 space-y-2 rounded-2xl bg-amber-50 p-4 text-sm text-slate-800">
              {result.answer_key.map((answer, index) => (
                <li key={`${index}-${answer}`} className="flex gap-2">
                  <span className="font-bold text-amber-700">{index + 1}.</span>
                  <span>{answer}</span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={downloadAnswers}
              className="mt-3 min-h-10 rounded-xl border border-amber-300 bg-white px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-50"
            >
              ↓ {t.downloadAnswers}
            </button>
          </>
        ) : null}
      </details>
    </article>
  );
}


function LegacyWorksheetCard({ job, language }: { job: GenerationJob; language: "ru" | "kk" }) {
  const t = COPY[language];
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadGenerationMaterial(job, language);
    } catch {
      setError(t.downloadFailed);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm">
      <span className="text-4xl" aria-hidden="true">📝</span>
      <h2 className="mt-3 text-xl font-bold text-slate-950">{job.title || t.legacyTitle}</h2>
      <p className="mt-2 text-sm text-slate-600">{t.legacyHint}</p>
      <button
        type="button"
        onClick={() => void download()}
        disabled={downloading}
        className="mt-5 min-h-11 rounded-xl bg-sky-700 px-5 text-sm font-bold text-white transition hover:bg-sky-800 disabled:cursor-wait disabled:opacity-60"
      >
        {downloading ? t.downloading : `↓ ${t.legacyDownload}`}
      </button>
      {error ? <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p> : null}
    </article>
  );
}


function WorksheetsContent() {
  const { isAuthenticated } = useAuth();
  const { language: interfaceLanguage } = useLanguage();
  const t = COPY[interfaceLanguage];
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { costs, balance, refreshBalance } = useTokens();

  const requestedJobId = generationJobIdFromSearchParam(searchParams.get("job"));
  const [sessionJobId, setSessionJobId] = useState<string | null>(null);
  const currentJobId = requestedJobId ?? sessionJobId;
  const settledJobId = useRef<string | null>(null);

  const [subjectId, setSubjectId] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [grade, setGrade] = useState(5);
  const [worksheetLanguage, setWorksheetLanguage] = useState<WorksheetImageLanguage>(interfaceLanguage);
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [sourcePages, setSourcePages] = useState<File[]>([]);
  const [stylePreset, setStylePreset] = useState<WorksheetStylePreset>("bright");
  const [styleNotes, setStyleNotes] = useState("");
  const [taskTypes, setTaskTypes] = useState<WorksheetTaskType[]>(ALL_TASK_TYPES);

  const [result, setResult] = useState<WorksheetImageResult | null>(null);
  const [legacyJob, setLegacyJob] = useState<GenerationJob | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subjects = useQuery({
    queryKey: ["library-subjects", "worksheet"],
    queryFn: ({ signal }) => getLibrarySubjects(signal),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
    retry: 2,
    refetchOnReconnect: true,
  });

  const job = useQuery({
    queryKey: ["generation-job", currentJobId],
    queryFn: () => getGenerationJob(currentJobId as string),
    enabled: Boolean(currentJobId),
    retry: 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => query.state.data && isActiveGenerationJob(query.state.data) ? 2_000 : false,
  });

  const selectedSubject = useMemo(
    () => subjects.data?.find((subjectOption) => subjectOption.id === subjectId) ?? null,
    [subjectId, subjects.data],
  );
  const useCustomSubject = subjectId === CUSTOM_SUBJECT || subjects.isError;
  const subject = useCustomSubject
    ? customSubject.trim()
    : selectedSubject ? localizedSubjectName(selectedSubject, interfaceLanguage) : "";

  const cost = costs.worksheet_generate ?? 10;
  const enoughTokens = balance === null || balance >= cost;
  const loading = submitting || Boolean(
    currentJobId && (job.isPending || (job.data && isActiveGenerationJob(job.data))),
  );

  useEffect(() => {
    setResult(null);
    setLegacyJob(null);
    setJobError(null);
    settledJobId.current = null;
  }, [currentJobId]);

  useEffect(() => {
    const value = job.data;
    if (!value || isActiveGenerationJob(value) || settledJobId.current === value.id) return;
    settledJobId.current = value.id;

    if (!WORKSHEET_HISTORY_KINDS.includes(value.kind as typeof WORKSHEET_HISTORY_KINDS[number])) {
      setJobError(t.wrongMaterial);
      return;
    }
    if ((value.status === "completed" || value.status === "billing_error") && value.result) {
      if (value.kind === WORKSHEET_IMAGE_KIND) {
        if (isWorksheetImageResult(value.result)) {
          setResult(value.result);
          setLegacyJob(null);
          setJobError(null);
        } else {
          setJobError(t.invalidResult);
        }
      } else {
        setLegacyJob(value);
        setResult(null);
        setJobError(null);
      }
      void refreshBalance();
      return;
    }
    setJobError(value.status === "cancelled" ? t.cancelled : t.failed);
    void refreshBalance();
  }, [job.data, refreshBalance, t.cancelled, t.failed, t.invalidResult, t.wrongMaterial]);

  useEffect(() => {
    if (job.error) setJobError(visualGenerationErrorMessage(job.error, interfaceLanguage));
  }, [interfaceLanguage, job.error]);

  const languageOptions: Option<WorksheetImageLanguage>[] = [
    { value: "kk", label: "Қазақша" },
    { value: "ru", label: "Русский" },
    { value: "en", label: "English" },
  ];
  const styleOptions: Option<WorksheetStylePreset>[] = [
    { value: "bright", label: t.styles.bright, icon: "🌈" },
    { value: "calm", label: t.styles.calm, icon: "🌿" },
    { value: "print", label: t.styles.print, icon: "🖨" },
  ];

  const toggleTaskType = (taskType: WorksheetTaskType) => {
    setFormError(null);
    setTaskTypes((current) => current.includes(taskType)
      ? current.filter((entry) => entry !== taskType)
      : [...current, taskType]);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setJobError(null);

    if (!isAuthenticated) {
      setFormError(t.formErrors.auth);
      return;
    }
    const issue = validateWorksheetImageForm({ subject, topic, content, sourcePageCount: sourcePages.length, taskTypes });
    if (issue) {
      setFormError(t.formErrors[issue]);
      return;
    }
    if (!enoughTokens) {
      setFormError(`${t.noTokens}: ${cost} / ${balance ?? 0}`);
      return;
    }

    setSubmitting(true);
    setResult(null);
    setLegacyJob(null);
    try {
      const sourcePagesBase64 = await Promise.all(sourcePages.map(fileToDataUrl));
      const payload: WorksheetImageGeneratePayload = {
        subject,
        grade,
        language: worksheetLanguage,
        topic: topic.trim(),
        content: content.trim(),
        task_types: taskTypes,
        style_description: buildWorksheetStyleDescription(stylePreset, styleNotes),
        source_pages_base64: sourcePagesBase64,
      };
      const title = topic.trim() || `${subject}, ${grade} ${t.gradeSuffix}`;
      const created = await enqueueGenerationJob(
        WORKSHEET_IMAGE_KIND,
        payload as unknown as Record<string, unknown>,
        { title },
      );
      setSessionJobId(created.id);
      queryClient.setQueryData(["generation-job", created.id], created);
      router.replace(`${SOURCE_PATH}?job=${encodeURIComponent(created.id)}`, { scroll: false });
    } catch (error) {
      setJobError(error instanceof InsufficientTokensError
        ? `${t.noTokens}: ${error.required} / ${error.available}`
        : visualGenerationErrorMessage(error, interfaceLanguage));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <GeneratorLayout
        icon="🎨"
        title={t.title}
        subtitle={t.subtitle}
        cost={cost}
        costLabel={t.costLabel}
        form={
          <form onSubmit={(event) => void submit(event)} noValidate>
            <Field label={t.subject}>
              <select
                value={subjectId}
                onChange={(event) => {
                  setSubjectId(event.target.value);
                  setFormError(null);
                }}
                disabled={loading}
                aria-label={t.subject}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/20 disabled:bg-slate-50"
              >
                <option value="">{t.chooseSubject}</option>
                {(subjects.data ?? []).map((option) => (
                  <option key={option.id} value={option.id}>{localizedSubjectName(option, interfaceLanguage)}</option>
                ))}
                <option value={CUSTOM_SUBJECT}>{t.otherSubject}</option>
              </select>
              {subjects.isError ? <p className="mt-2 text-xs text-amber-700">{t.subjectsUnavailable}</p> : null}
            </Field>

            {useCustomSubject ? (
              <Field label={t.customSubject}>
                <TextInput
                  value={customSubject}
                  onChange={(event) => {
                    setCustomSubject(event.target.value);
                    setFormError(null);
                  }}
                  placeholder={t.customSubjectPlaceholder}
                  maxLength={120}
                  disabled={loading}
                  aria-label={t.customSubject}
                />
              </Field>
            ) : null}

            <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-3">
              <Field label={t.grade}>
                <select
                  value={grade}
                  onChange={(event) => setGrade(Number(event.target.value))}
                  disabled={loading}
                  aria-label={t.grade}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/20 disabled:bg-slate-50"
                >
                  {GRADES.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </Field>
              <Field label={t.language}>
                <OptionGrid options={languageOptions} value={worksheetLanguage} onChange={setWorksheetLanguage} disabled={loading} columns={3} />
              </Field>
            </div>

            <Field label={t.topic}>
              <TextInput
                value={topic}
                onChange={(event) => {
                  setTopic(event.target.value);
                  setFormError(null);
                }}
                placeholder={t.topicPlaceholder}
                maxLength={500}
                disabled={loading}
                aria-label={t.topic}
              />
            </Field>

            <Field label={t.content} hint={t.contentHint}>
              <TextArea
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  setFormError(null);
                }}
                placeholder={t.contentPlaceholder}
                rows={3}
                maxLength={4000}
                disabled={loading}
                aria-label={t.content}
              />
            </Field>

            <Field label={t.sourcePages}>
              <BookPageDropzone
                files={sourcePages}
                onChange={(files) => {
                  setSourcePages(files);
                  setFormError(null);
                }}
                disabled={loading}
                labels={{ prompt: t.sourcePrompt, hint: t.sourceHint, remove: t.sourceRemove, page: t.sourcePage, errors: t.sourceErrors }}
              />
            </Field>

            <Field label={t.style}>
              <OptionGrid options={styleOptions} value={stylePreset} onChange={setStylePreset} disabled={loading} columns={3} />
            </Field>

            <Field label={t.styleNotes}>
              <TextArea
                value={styleNotes}
                onChange={(event) => setStyleNotes(event.target.value)}
                placeholder={t.styleNotesPlaceholder}
                rows={2}
                maxLength={500}
                disabled={loading}
                aria-label={t.styleNotes}
              />
            </Field>

            <details className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
              <summary className="cursor-pointer list-none text-sm font-bold text-slate-700">
                <span className="flex items-center justify-between gap-3">
                  <span>{t.tasks}</span>
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] text-slate-500 shadow-sm">{t.taskCount(taskTypes.length)}</span>
                </span>
                <span className="mt-1 block text-[11px] font-normal text-slate-500">{t.tasksHint}</span>
              </summary>
              <div className="mt-3 grid gap-2" role="group" aria-label={t.tasks}>
                {ALL_TASK_TYPES.map((taskType) => (
                  <label key={taskType} className="flex cursor-pointer items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={taskTypes.includes(taskType)}
                      onChange={() => toggleTaskType(taskType)}
                      disabled={loading}
                      className="mt-0.5 h-4 w-4 accent-[color:var(--primary)]"
                    />
                    <span>{t.taskLabels[taskType]}</span>
                  </label>
                ))}
              </div>
            </details>

            {formError ? (
              <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700" role="alert">{formError}</p>
            ) : null}

            <GenerateButton loading={loading} disabled={!enoughTokens} label={`${t.generate} · ${cost} 🪙`} loadingLabel={t.generating} />
            {!enoughTokens ? (
              <p className="mt-2 text-center text-xs font-medium text-rose-700">{t.noTokens}: {cost} / {balance ?? 0}</p>
            ) : null}
          </form>
        }
        result={
          <div className="space-y-4">
            {jobError ? (
              <div className="space-y-3">
                <ErrorState message={jobError} />
                {currentJobId ? (
                  <button
                    type="button"
                    onClick={() => void job.refetch()}
                    disabled={job.isFetching}
                    className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    {t.retry}
                  </button>
                ) : null}
              </div>
            ) : null}
            {loading ? (
              <LoadingState title={t.loadingTitle} steps={[...t.loadingSteps]} serverAccepted={!submitting && job.data?.id === currentJobId} />
            ) : null}
            {!loading && !result && !legacyJob && !jobError ? (
              <EmptyState icon="📝" title={t.emptyTitle} hint={t.emptyHint} />
            ) : null}
            {result && !loading ? <WorksheetResultCard result={result} language={interfaceLanguage} /> : null}
            {legacyJob && !loading ? <LegacyWorksheetCard job={legacyJob} language={interfaceLanguage} /> : null}
          </div>
        }
      />

      <div className="mx-auto max-w-7xl">
        <ModuleGenerationHistory kinds={WORKSHEET_HISTORY_KINDS} />
      </div>
    </>
  );
}


export default function WorksheetsPage() {
  return (
    <Suspense fallback={<div className="min-h-96 animate-pulse rounded-3xl bg-white/70" />}>
      <WorksheetsContent />
    </Suspense>
  );
}
